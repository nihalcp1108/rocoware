import axios from 'axios';

// Resolve base URL safely without duplicate /api prefixes
const getBaseURL = () => {
  const envUrl = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '').trim();
  if (!envUrl) {
    return '/api';
  }
  const cleanUrl = envUrl.replace(/\/+$/, '');
  if (cleanUrl.startsWith('http') && !cleanUrl.endsWith('/api')) {
    return `${cleanUrl}/api`;
  }
  return cleanUrl;
};

const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true, // Send HTTP-only cookies automatically
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach token as Bearer header if stored locally (dual persistence)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cp_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: normalize error messages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    let message;
    if (error.response) {
      if (error.response.status >= 500) {
        message = 'Something went wrong. Please try again.';
      } else {
        message =
          error.response.data?.message ||
          'Something went wrong. Please try again.';
      }
    } else {
      // Network error, hostname not resolved, or server offline
      message = 'Unable to connect to the server. Please try again.';
    }
    
    // Enrich error with friendly message
    error.friendlyMessage = message;
    return Promise.reject(error);
  }
);

export default api;
