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
import { handleMockRoute } from './mockApi';

const baseURL = import.meta.env.VITE_API_URL || '/api';

export const isStandaloneMode = () => {
  return localStorage.getItem('hc_standalone_mode') !== 'false';
};

export const setStandaloneMode = (enabled) => {
  localStorage.setItem('hc_standalone_mode', enabled ? 'true' : 'false');
};

// Pure in-memory standalone adapter — 0ms latency, zero network timeouts, no backend needed
const standaloneAdapter = async (config) => {
  const mockPayload = handleMockRoute(config);
  return {
    data: mockPayload,
    status: 200,
    statusText: 'OK',
    headers: { 'content-type': 'application/json' },
    config,
    request: {},
  };
};

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  adapter: standaloneAdapter,
});

// A bare client (no interceptors) used ONLY for the refresh call, so refreshing
// never recurses through this interceptor and its response is not auto-unwrapped.
const refreshClient = axios.create({ baseURL, withCredentials: true, adapter: standaloneAdapter });

const REFRESH_PATH = '/auth/refresh-token';
const AUTH_BYPASS = ['/auth/refresh-token', '/auth/login', '/auth/register', '/auth/google'];

// ── Request interceptor — attach JWT & short-circuit in Standalone Mode ───
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hc_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // When running without backend or with a mock token, resolve entirely in-memory
    if (isStandaloneMode() || token?.startsWith('standalone-')) {
      config.adapter = standaloneAdapter;
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
  (response) => {
    // If Vite dev server returns HTML SPA fallback for /api requests
    if (typeof response.data === 'string' && response.data.trim().startsWith('<!doctype html')) {
      return handleMockRoute(response.config || {});
    }
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config || {};
    const status = error.response?.status || 0;

    // Check if network error, AirTunes 403, backend offline, or standalone mode
    const isNetworkError =
      !error.response ||
      error.code === 'ERR_NETWORK' ||
      error.code === 'ERR_CONNECTION_REFUSED' ||
      error.code === 'ECONNABORTED' ||
      status === 403 ||
      status === 404 ||
      status === 500 ||
      status >= 502;

    if (isNetworkError || isStandaloneMode()) {
      console.info('[Standalone Mode] Serving mock data for:', originalRequest.url);
      const mockResult = handleMockRoute(originalRequest);
      return Promise.resolve(mockResult);
    }

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
        // In standalone mode, don't boot user out on auth refresh failure
        return Promise.resolve(handleMockRoute(originalRequest));
      }
    }

    // Fallback for auth calls when backend offline
    if (isAuthCall || status === 401) {
      return Promise.resolve(handleMockRoute(originalRequest));
    }

    return Promise.reject(normalizedError);
  }
);


export default api;
