import { api } from './axios';

// Admin Certificates API. The axios response interceptor already unwraps
// `response.data`, so these resolve directly to the JSON body.
export const certificatesApi = {
  // GET /api/v1/certificates -> { items, total, skip, limit }
  list: async (params = {}) => api.get('/certificates', { params }),

  // GET /api/v1/certificates/{certificateId} -> certificate detail
  get: async (certificateId) => api.get(`/certificates/${certificateId}`),
};
