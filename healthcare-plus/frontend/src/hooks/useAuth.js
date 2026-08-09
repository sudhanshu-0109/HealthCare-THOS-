/**
 * hooks/useAuth.js — Auth hook providing state and authentication helper functions.
 */

import useAuthStore from '../store/authStore';
import * as authService from '../services/auth.service';

export const useAuth = () => {
  const { user, token, setAuth, clearAuth, updateUser } = useAuthStore();

  const isAuthenticated = Boolean(token && user);

  /**
   * Perform logout operation: notifies backend and clears client state.
   */
  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.warn('[Logout] Backend notification failed:', err);
    } finally {
      clearAuth();
    }
  };

  /**
   * Check if the current user has one of the specified roles.
   * @param {string|string[]} roles
   * @returns {boolean}
   */
  const hasRole = (roles) => {
    if (!user) return false;
    const allowed = Array.isArray(roles) ? roles : [roles];
    return allowed.includes(user.role);
  };

  return {
    user,
    token,
    isAuthenticated,
    hasRole,
    logout: handleLogout,
    setAuth,
    clearAuth,
    updateUser,
  };
};
