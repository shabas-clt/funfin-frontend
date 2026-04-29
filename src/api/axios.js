import axios from 'axios';
import Cookies from 'js-cookie';

const ADMIN_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002/api/v1';
const CLIENT_BASE_URL = import.meta.env.VITE_CLIENT_API_URL || 'http://localhost:5001/api/v1';
const AUTH_COOKIE_KEY = 'ff_admin_token';
const AUTH_PROFILE_KEY = 'ff_admin_profile';
const AUTH_EXPIRED_EVENT = 'ff-auth-expired';
const AUTH_FORBIDDEN_EVENT = 'ff-auth-forbidden';

// Admin API client (for admin operations)
export const api = axios.create({
  baseURL: ADMIN_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Client API client (for user-facing operations like leaderboards, memes, referrals)
export const clientApi = axios.create({
  baseURL: CLIENT_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Shared request interceptor
const requestInterceptor = (config) => {
  const token = Cookies.get(AUTH_COOKIE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

// Shared response interceptor
const responseInterceptor = (response) => response.data;

const errorInterceptor = (error) => {
  const status = error.response?.status;
  const detail = error.response?.data?.detail || error.response?.data || error.message;

  // On 401, actively clear auth state and notify AuthContext to avoid stale UI state.
  if (status === 401) {
    Cookies.remove(AUTH_COOKIE_KEY);
    sessionStorage.removeItem(AUTH_PROFILE_KEY);
    window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT, { detail }));
  }

  // Mentor endpoints can return 403 when role is no longer mentor in DB.
  // Emit an auth event so the app can reset state and redirect deterministically.
  if (status === 403 && typeof detail === 'string' && (
    detail.includes('Mentor role required') || detail.includes('insufficient role')
  )) {
    window.dispatchEvent(new CustomEvent(AUTH_FORBIDDEN_EVENT, { detail }));
  }

  return Promise.reject(detail);
};

// Apply interceptors to both API clients
api.interceptors.request.use(requestInterceptor);
api.interceptors.response.use(responseInterceptor, errorInterceptor);

clientApi.interceptors.request.use(requestInterceptor);
clientApi.interceptors.response.use(responseInterceptor, errorInterceptor);
