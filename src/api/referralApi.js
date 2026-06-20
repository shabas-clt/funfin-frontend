import { api } from './axios';

// Admin Referral API. The axios response interceptor already unwraps
// `response.data`, so these resolve directly to the JSON body.
//
// Mirrors the admin contract in ADMIN.md (§1–§9), all under
// `/admin/referral` on the admin API host.
export const referralApi = {
  // §1/§2 — program configuration (commission %, caps, payout minimum)
  getConfig: async () => api.get('/admin/referral/config'),
  updateConfig: async (payload) => api.put('/admin/referral/config', payload),

  // §3 — aggregate analytics
  getAnalytics: async () => api.get('/admin/referral/analytics'),

  // §4 — paginated referral relationship records
  getRecords: async (params = {}) => api.get('/admin/referral/records', { params }),

  // §5 — payout review queue (pending requests carry a fresh fraud assessment)
  getPayouts: async (params = {}) => api.get('/admin/referral/payouts', { params }),

  // §6 — single payout with the fraud assessment recomputed fresh
  getPayout: async (payoutId) => api.get(`/admin/referral/payouts/${payoutId}`),

  // §7 — record the admin's bank-verification decision on the payee's account
  verifyBank: async (payoutId, payload) =>
    api.post(`/admin/referral/payouts/${payoutId}/verify-bank`, payload),

  // §8 — force a fresh fraud reassessment
  reassess: async (payoutId) => api.post(`/admin/referral/payouts/${payoutId}/reassess`),

  // §9 — release the funds (requires a verified bank account)
  approve: async (payoutId) => api.post(`/admin/referral/payouts/${payoutId}/approve`),

  // §9 — return the locked funds to the user; `reason` is required (1–500 chars)
  reject: async (payoutId, payload) =>
    api.post(`/admin/referral/payouts/${payoutId}/reject`, payload),
};
