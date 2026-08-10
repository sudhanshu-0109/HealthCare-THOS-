/**
 * services/api.js — Axios instance with interceptors.
 *
 * Responsibilities:
 *  - Attach the access token to every request.
 *  - Unwrap the `{ success, data }` envelope so callers receive the payload directly.
 *  - Silent refresh: on a 401, transparently call POST /auth/refresh-token (httpOnly
 *    cookie based), update the stored access token, and retry the original request once.
 *    Concurrent 401s share a single in-flight refresh. If refresh fails, auth is cleared
 *    and the user is redirected to /login.
 */

import axios from 'axios';
import useAuthStore from '../store/authStore';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// A bare client (no interceptors) used ONLY for the refresh call, so refreshing
// never recurses through this interceptor and its response is not auto-unwrapped.
const refreshClient = axios.create({ baseURL, withCredentials: true });

const REFRESH_PATH = '/auth/refresh-token';
const AUTH_BYPASS = ['/auth/refresh-token', '/auth/login', '/auth/register', '/auth/google'];

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

// ── Silent-refresh coordination ────────────────────────────────────────────
let isRefreshing = false;
let refreshWaiters = [];

const notifyWaiters = (token) => {
  refreshWaiters.forEach((cb) => cb(token));
  refreshWaiters = [];
};

const isPublicPage = () => {
  const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email', '/accept-invite', '/unauthorized'];
  const path = window.location.pathname;
  return path === '/' || publicRoutes.some((route) => path.startsWith(route));
};

const redirectToLogin = () => {
  if (!isPublicPage()) {
    window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
  }
};

// ── Response interceptor — unwrap envelope & handle 401s ───────────────────
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status || 0;

    const normalizedError = {
      status,
      message:
        error.response?.data?.message ||
        error.message ||
        'An unexpected error occurred',
      errors: error.response?.data?.errors || null,
    };

    const url = originalRequest?.url || '';
    const isAuthCall = AUTH_BYPASS.some((p) => url.includes(p));

    // Attempt a single silent refresh on 401 for non-auth requests.
    if (status === 401 && originalRequest && !originalRequest._retry && !isAuthCall) {
      if (isRefreshing) {
        // Queue until the in-flight refresh resolves, then retry (or fail).
        return new Promise((resolve, reject) => {
          refreshWaiters.push((newToken) => {
            if (!newToken) return reject(normalizedError);
            originalRequest._retry = true;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;
      try {
        const resp = await refreshClient.post(REFRESH_PATH);
        const newToken = resp.data?.data?.accessToken;
        const newUser = resp.data?.data?.user;
        if (!newToken) throw new Error('No access token in refresh response');

        useAuthStore.getState().setAuth({
          user: newUser || useAuthStore.getState().user,
          accessToken: newToken,
        });

        isRefreshing = false;
        notifyWaiters(newToken);
        return api(originalRequest); // request interceptor re-attaches the new token
      } catch (refreshErr) {
        isRefreshing = false;
        notifyWaiters(null);
        useAuthStore.getState().clearAuth();
        redirectToLogin();
        return Promise.reject(normalizedError);
      }
    }

    // Non-recoverable 401 (auth call itself, or refresh already attempted).
    if (status === 401 && !isAuthCall) {
      useAuthStore.getState().clearAuth();
      redirectToLogin();
    }

    return Promise.reject(normalizedError);
  }
);


export default api;
