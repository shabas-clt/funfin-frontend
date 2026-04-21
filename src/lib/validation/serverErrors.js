// Server-error helpers.
//
// axios.js rejects with either:
//   - a string (e.g. "Invalid email or password")
//   - a Pydantic validation array:
//       [{ loc: ["body", "email"], msg: "...", type: "value_error" }, ...]
//   - a plain object (unknown shape)
//
// Forms should surface a single generic server message AND, if we can, map
// per-field errors back to the rhf form so inline errors show up.

/**
 * Normalize an axios-interceptor rejection into a human-readable message.
 * Always returns a non-empty string.
 */
export function serverErrorMessage(err, fallback = 'Something went wrong') {
  if (!err) return fallback;
  if (typeof err === 'string') return err;
  if (Array.isArray(err)) {
    const first = err[0];
    if (first && typeof first === 'object' && first.msg) return first.msg;
  }
  if (typeof err === 'object' && err.msg) return err.msg;
  return fallback;
}

/**
 * If the server returned a Pydantic validation array, project it into a
 * `{ field: message }` map consumable by rhf's `setError`. Returns an
 * empty object if the error isn't a validation array we recognize.
 */
export function serverFieldErrors(err) {
  if (!Array.isArray(err)) return {};
  const out = {};
  for (const e of err) {
    if (!e || typeof e !== 'object') continue;
    const loc = Array.isArray(e.loc) ? e.loc : [];
    // FastAPI puts the field name as the last element after ["body"].
    const field = [...loc].reverse().find((p) => typeof p === 'string' && p !== 'body');
    if (field && e.msg) out[field] = e.msg;
  }
  return out;
}

/**
 * Apply server-side field errors to an rhf form instance. Returns the
 * human-readable fallback message if there were no field errors, or null
 * if we successfully surfaced them inline.
 */
export function applyServerErrors(form, err, fallback = 'Something went wrong') {
  const fieldErrors = serverFieldErrors(err);
  const keys = Object.keys(fieldErrors);
  if (keys.length === 0) {
    return serverErrorMessage(err, fallback);
  }
  for (const key of keys) {
    form.setError(key, { type: 'server', message: fieldErrors[key] });
  }
  return null;
}
