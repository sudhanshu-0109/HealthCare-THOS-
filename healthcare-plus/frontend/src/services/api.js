/**
 * services/api.js — Axios instance with interceptors.
 */

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// ── Request interceptor — attach JWT ───────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hc_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor — unwrap envelope & normalize errors ──────────────
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const normalizedError = {
      status: error.response?.status || 0,
      message:
        error.response?.data?.message ||
        error.message ||
        'An unexpected error occurred',
      errors: error.response?.data?.errors || null,
    };

    // Public auth routes that should NOT redirect on 401
    const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email', '/'];
    const isPublicPage = publicRoutes.some((route) => window.location.pathname.startsWith(route));

    if (normalizedError.status === 401 && !isPublicPage) {
      localStorage.removeItem('hc_token');
      localStorage.removeItem('hc_user');
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
    }

    return Promise.reject(normalizedError);
  }
);

export default api;
