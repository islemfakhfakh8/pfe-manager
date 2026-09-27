import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : '/api');
const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pfe_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && !err.config.url.includes('/auth/')) {
      localStorage.removeItem('pfe_token');
      localStorage.removeItem('pfe_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const errMsg = (e, fallback = 'Une erreur est survenue') =>
  e?.response?.data?.error || e?.message || fallback;

export default api;
