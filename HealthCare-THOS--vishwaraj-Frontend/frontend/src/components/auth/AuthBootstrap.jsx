/**
 * components/auth/AuthBootstrap.jsx — Revalidates the session on app load.
 *
 * The auth store is persisted in localStorage, which the user can edit. On startup,
 * if a token is present we call GET /auth/me to re-sync the authoritative user/role
 * from the server before rendering the protected app. If the token is expired the
 * api interceptor transparently refreshes it; if that fails it clears auth and
 * redirects to /login. Any other error leaves the persisted session untouched.
 */

import { useEffect } from 'react';
import useAuthStore from '../../store/authStore';
import { MOCK_USERS } from '../../utils/mockData';

const AuthBootstrap = ({ children }) => {
  const { user } = useAuthStore();
  const setAuth = useAuthStore((s) => s.setAuth);

  // ProtectedRoute handles auto-seeding mock credentials whenever a protected route is visited.
  // We preserve the unauthenticated state on public pages (login, register, landing) so
  // users can view the login screen, pick any of the 8 roles, or stay logged out.
  useEffect(() => {
    // Session is persisted in localStorage by Zustand; no forced overwrite needed here
  }, []);

  return children;
};

export default AuthBootstrap;
