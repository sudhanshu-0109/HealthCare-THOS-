/**
 * store/authStore.js — Zustand store for state management.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,

      setAuth: ({ user, accessToken }) => {
        if (accessToken) {
          localStorage.setItem('hc_token', accessToken);
        }
        if (user) {
          localStorage.setItem('hc_user', JSON.stringify(user));
        }
        set({ user, token: accessToken, isLoading: false });
      },

      clearAuth: () => {
        localStorage.removeItem('hc_token');
        localStorage.removeItem('hc_user');
        set({ user: null, token: null, isLoading: false });
      },

      // Alias for clearAuth — both patterns used across the codebase
      logout: () => {
        localStorage.removeItem('hc_token');
        localStorage.removeItem('hc_user');
        set({ user: null, token: null, isLoading: false });
      },

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'healthcare-plus-auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);

export default useAuthStore;
