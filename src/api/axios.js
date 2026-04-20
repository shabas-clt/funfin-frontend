import axios from 'axios';

// Map to the local FastAPI admin server. In production, use VITE_API_URL.
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Since auth isn't fully integrated yet, optionally mock a token interceptor
// if the backend requires authentication for courses/admins endpoints.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to format errors seamlessly
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error.response?.data || error.message);
  }
);
