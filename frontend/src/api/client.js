import axios from 'axios';

// Resolve base URL safely without duplicate /api prefixes
export const getBaseURL = () => {
  const rawEnv = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '').trim();

  // If empty, root slash, or /api, default safely to relative '/api'
  if (!rawEnv || rawEnv === '/' || rawEnv === '/api' || rawEnv === 'api') {
    return '/api';
  }

  // Strip trailing slashes
  const cleanUrl = rawEnv.replace(/\/+$/, '');

  if (!cleanUrl) {
    return '/api';
  }

  // Ensure /api suffix without duplication
  if (cleanUrl.endsWith('/api')) {
    return cleanUrl;
  }

  return `${cleanUrl}/api`;
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
      if (error.response.status === 405) {
        message = 'HTTP 405: Method Not Allowed. The server or endpoint does not accept this request method. Check API configuration.';
      } else {
        message =
          error.response.data?.message ||
          (error.response.status >= 500
            ? 'Server error occurred. Please check server logs.'
            : 'Something went wrong. Please try again.');
      }
    } else {
      // Network error, hostname not resolved, or server offline
      message = 'Unable to connect to the server. Please verify your internet connection and backend status.';
    }
    
    // Enrich error with friendly message
    error.friendlyMessage = message;
    return Promise.reject(error);
  }
);

export default api;
