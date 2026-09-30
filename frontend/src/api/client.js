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
});

// Request interceptor: attach token and ensure FormData boundary is never overridden
api.interceptors.request.use(
  (config) => {
    // If request data is FormData, remove Content-Type so browser sets proper multipart boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
    }
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
      message =
        error.response.data?.message ||
        (error.response.status >= 500
          ? 'Server error occurred. Please check server logs.'
          : 'Something went wrong. Please try again.');
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
