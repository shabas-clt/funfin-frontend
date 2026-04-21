import axios from 'axios';
import Cookies from 'js-cookie';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = Cookies.get('ff_admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status;
    // On 401, the ProtectedRoute will handle redirect when the auth state updates
    if (status === 401) {
      Cookies.remove('ff_admin_token');
      sessionStorage.removeItem('ff_admin_profile');
    }
    const detail = error.response?.data?.detail || error.response?.data || error.message;
    return Promise.reject(detail);
  }
);
