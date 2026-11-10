import { api } from './axios';

// Admin Certificates API. The axios response interceptor already unwraps
// `response.data`, so these resolve directly to the JSON body.
export const certificatesApi = {
  // GET /api/v1/certificates -> { items, total, skip, limit }
  list: async (params = {}) => api.get('/certificates', { params }),

  // GET /api/v1/certificates/{certificateId} -> certificate detail
  get: async (certificateId) => api.get(`/certificates/${certificateId}`),

  // DELETE /api/v1/certificates/{certificateId} -> removes record + stored PDF
  remove: async (certificateId) => api.delete(`/certificates/${certificateId}`),

  // Signature blocks printed on certificates (mentor + director).
  // GET -> { saved: {...}, effective: {...}, updatedAt }
  getSignatories: async () => api.get('/certificate-settings'),

  // PUT { instructorName, instructorTitle, directorName, directorTitle }
  saveSignatories: async (values) => api.put('/certificate-settings', values),

  // Sample certificate PDF using the saved signatories -> Blob
  previewPdf: async () => api.get('/certificate-settings/preview', { responseType: 'blob' }),
};
