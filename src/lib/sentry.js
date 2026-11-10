import * as Sentry from '@sentry/react';

// Error reporting for the admin panel. Off unless VITE_SENTRY_DSN is set at
// build time, so local runs and CI send nothing. The DSN is a public,
// send-only key; it is safe in the browser bundle.
const DSN = import.meta.env.VITE_SENTRY_DSN || '';
export const sentryEnabled = Boolean(DSN);

// Requests that fail for expected reasons and would only add noise:
// 401 means the session ended and the panel already logs out.
const IGNORED_STATUSES = new Set([401]);

export function initSentry() {
  if (!sentryEnabled) return;
  Sentry.init({
    dsn: DSN,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE,
    release: import.meta.env.VITE_APP_RELEASE || undefined,
    // Errors only; no performance tracing or session replay.
    tracesSampleRate: 0,
    sendDefaultPii: false,
    // Keep nested context (e.g. each uploaded file's name and size) readable.
    normalizeDepth: 6,
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
    ],
    beforeSend(event) {
      // Never send auth tokens or cookies.
      if (event.request?.headers) {
        delete event.request.headers.Authorization;
        delete event.request.headers.authorization;
        delete event.request.headers.Cookie;
        delete event.request.headers.cookie;
      }
      if (event.request?.cookies) delete event.request.cookies;
      return event;
    },
  });
}

/** Tag events with the signed-in admin (id and role only, no email). */
export function setSentryAdmin(admin) {
  if (!sentryEnabled) return;
  Sentry.setUser(admin ? { id: String(admin.id || admin._id || ''), role: admin.role } : null);
}

// "/courses/6731ab…/topics/42" -> "/courses/:id/topics/:id", so the same
// failing endpoint groups into one issue instead of one per record.
const normalizePath = (url = '') =>
  url
    .split('?')[0]
    .replace(/\/[0-9a-f]{24}(?=\/|$)/gi, '/:id')
    .replace(/\/[0-9a-f-]{36}(?=\/|$)/gi, '/:id')
    .replace(/\/\d+(?=\/|$)/g, '/:id');

// Sizes of files in a FormData upload, so a "too large" failure shows what
// was sent.
const uploadSizes = (data) => {
  if (typeof FormData === 'undefined' || !(data instanceof FormData)) return undefined;
  const files = [];
  for (const [field, value] of data.entries()) {
    if (value instanceof Blob) {
      files.push({ field, name: value.name, type: value.type, sizeMb: +(value.size / 1048576).toFixed(1) });
    }
  }
  return files.length ? files : undefined;
};

/**
 * Report a failed API call. Called from the axios error interceptor.
 * Server errors and network failures are "error"; other 4xx are "warning".
 * A request with no response (network error, CORS-blocked, or rejected by
 * nginx before the API, like a 413 on a too-large upload) is reported too,
 * because the API never sees those.
 */
export function reportApiError(error) {
  if (!sentryEnabled) return;
  if (error?.code === 'ERR_CANCELED') return;
  const status = error?.response?.status;
  if (IGNORED_STATUSES.has(status)) return;

  const config = error?.config || {};
  const method = (config.method || 'get').toUpperCase();
  const path = normalizePath(config.url);
  const files = uploadSizes(config.data);
  const label = status ? `HTTP ${status}` : `Network error (${error?.code || 'no response'})`;
  const detail = error?.response?.data?.detail;
  const uploadMb = files ? +files.reduce((sum, f) => sum + f.sizeMb, 0).toFixed(1) : undefined;
  // The browser hides the status of a response that lacks CORS headers, so
  // when nginx rejects a big upload (413) the panel only sees a network
  // error. Flag that case so the issue points at the size limit.
  const hint = !status && uploadMb >= 50 ? 'likely-upload-size-limit' : undefined;

  Sentry.withScope((scope) => {
    scope.setLevel(!status || status >= 500 || status === 413 ? 'error' : 'warning');
    scope.setTag('api.method', method);
    scope.setTag('api.path', path);
    scope.setTag('api.status', status ? String(status) : 'none');
    scope.setTag('api.base', config.baseURL || '');
    if (uploadMb !== undefined) scope.setTag('upload.mb', String(uploadMb));
    if (hint) scope.setTag('api.hint', hint);
    scope.setContext('api', {
      method,
      url: config.url,
      baseURL: config.baseURL,
      status,
      code: error?.code,
      detail: typeof detail === 'string' ? detail : detail ? JSON.stringify(detail).slice(0, 2000) : undefined,
      uploadFiles: files,
    });
    scope.setFingerprint(['api', method, path, status ? String(status) : 'none']);
    const suffix = hint ? ` (${uploadMb} MB upload, likely over the server size limit)` : '';
    Sentry.captureMessage(`${label} ${method} ${path}${suffix}`);
  });
}

export { Sentry };
