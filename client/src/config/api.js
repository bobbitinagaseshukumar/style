import axios from 'axios';

const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    const url = import.meta.env.VITE_API_URL.replace(/\/$/, '');
    return url.endsWith('/api/v1') ? url : `${url}/api/v1`;
  }
  // Production fallback to live Render backend
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return 'https://style-q21b.onrender.com/api/v1';
  }
  return '/api/v1';
};

const api = axios.create({
  baseURL: getBaseURL(),
});

api.interceptors.request.use(
  (config) => {
    const adminToken = localStorage.getItem('adminToken');
    const token = localStorage.getItem('token');
    const isAdminPath = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');

    // On Admin panel routes (/admin/*), use adminToken (fallback to token)
    // On Customer storefront routes, use token (fallback to adminToken only if token absent)
    const authHeader = isAdminPath ? (adminToken || token) : (token || adminToken);
    if (authHeader) {
      config.headers.Authorization = `Bearer ${authHeader}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isAdminPath = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
      if (isAdminPath) {
        localStorage.removeItem('adminToken');
      } else {
        localStorage.removeItem('token');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
