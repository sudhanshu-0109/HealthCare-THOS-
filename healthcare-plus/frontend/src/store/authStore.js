/**
 * store/authStore.js — Zustand store for state management.
 * Configured with sessionStorage so closing the browser/tab ends the session
 * and prevents unwanted automatic logins across sessions.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,

      setAuth: ({ user, accessToken }) => {
        if (accessToken) {
          sessionStorage.setItem('hc_token', accessToken);
        }
        if (user) {
          sessionStorage.setItem('hc_user', JSON.stringify(user));
        }
        // Purge legacy permanent localStorage auth if present
        try {
          localStorage.removeItem('hc_token');
          localStorage.removeItem('hc_user');
          localStorage.removeItem('healthcare-plus-auth');
        } catch {}

        set({ user, token: accessToken, isLoading: false });
      },

      clearAuth: () => {
        try {
          sessionStorage.removeItem('hc_token');
          sessionStorage.removeItem('hc_user');
          localStorage.removeItem('hc_token');
          localStorage.removeItem('hc_user');
          localStorage.removeItem('healthcare-plus-auth');
        } catch {}
        set({ user: null, token: null, isLoading: false });
      },

      // Alias for clearAuth — both patterns used across the codebase
      logout: () => {
        try {
          sessionStorage.removeItem('hc_token');
          sessionStorage.removeItem('hc_user');
          localStorage.removeItem('hc_token');
          localStorage.removeItem('hc_user');
          localStorage.removeItem('healthcare-plus-auth');
        } catch {}
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
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);

export default useAuthStore;
