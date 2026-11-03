import { api } from './axios';

// Admin Payments API (backend: app/api/admin/payments.py). The axios
// interceptor unwraps `response.data`, so these resolve to the JSON body.
//
// `kind` is one of: funcoin | course | pro_signal.
export const paymentsApi = {
  overview: async (days = 30) => api.get('/admin/payments/overview', { params: { days } }),

  // Filters: search, userId, kind, channel, status, fromDate, toDate, skip, limit
  purchases: async (params = {}) => api.get('/admin/payments/purchases', { params }),

  searchUsers: async (search) => api.get('/admin/payments/users', { params: { search } }),
  user: async (userId) => api.get(`/admin/payments/users/${userId}`),
  courses: async () => api.get('/admin/payments/courses'),

  // Every action needs a reason; it is stored in the audit log.
  refund: async (kind, id, reason) =>
    api.post(`/admin/payments/purchases/${kind}/${id}/refund`, { reason }),
  revoke: async (kind, id, reason) =>
    api.post(`/admin/payments/purchases/${kind}/${id}/revoke`, { reason }),
  restore: async (kind, id, reason) =>
    api.post(`/admin/payments/purchases/${kind}/${id}/restore`, { reason }),

  // { userId, kind: course|pro_signal|coins, courseId?, days?, coins?, reason }
  grant: async (payload) => api.post('/admin/payments/grants', payload),

  issues: async (params = {}) => api.get('/admin/payments/issues', { params }),
  recoverIssue: async (id, reason) =>
    api.post(`/admin/payments/issues/${id}/recover`, { reason }),
  dismissIssue: async (id, reason) =>
    api.post(`/admin/payments/issues/${id}/dismiss`, { reason }),

  audit: async (params = {}) => api.get('/admin/payments/audit', { params }),

  // App Store / Google Play product ids and whether the apps offer each one.
  storeProducts: async () => api.get('/admin/payments/store-products'),
  setCourseStore: async (courseId, flags) =>
    api.patch(`/admin/payments/store-products/courses/${courseId}`, flags),
  setProStore: async (flags) => api.patch('/admin/payments/store-products/pro-signal', flags),
  // Coin packs keep their flag on the pack (FunCoin admin API).
  setCoinPackStore: async (packId, flags) => api.patch(`/funcoin/packs/${packId}`, flags),
};

// FastAPI errors arrive as a string `detail`, or a list for validation errors.
export function errorText(err, fallback = 'Something went wrong') {
  if (typeof err === 'string') return err;
  if (Array.isArray(err)) return err.map((e) => e?.msg).filter(Boolean).join(', ') || fallback;
  if (err && typeof err.detail === 'string') return err.detail;
  return fallback;
}
