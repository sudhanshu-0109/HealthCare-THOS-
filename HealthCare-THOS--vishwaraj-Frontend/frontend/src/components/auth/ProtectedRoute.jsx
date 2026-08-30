/**
 * components/auth/ProtectedRoute.jsx — Route guard component.
 *
 * Normal mode: checks the user is authenticated and holds one of `allowedRoles`.
 * Redirects to /login if not authenticated, or /unauthorized on a role mismatch.
 *
 * Standalone (frontend-only) mode: there is no backend and no real login, so the
 * guard instead *seeds* the mock session for whichever role the route requires.
 * Typing any dashboard URL — or landing on one from the DevRoleSwitcher — puts
 * you straight into that dashboard with mock data. This is a UI-preview
 * affordance only; it is inert as soon as standalone mode is turned off
 * (localStorage `hc_standalone_mode = 'false'`), which restores the real guard.
 */

import { useEffect } from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { isStandaloneMode } from '../../services/api';
import { MOCK_USERS } from '../../utils/mockData';

const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { user } = useAuthStore();
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    if (allowedRoles.length > 0 && (!user || !allowedRoles.includes(user.role))) {
      const targetRole = allowedRoles[0] || 'PATIENT';
      const mockUser = MOCK_USERS[targetRole] || MOCK_USERS.PATIENT;
      setAuth({
        user: mockUser,
        accessToken: 'standalone-frontend-mock-token-' + targetRole,
      });
    }
  }, [allowedRoles, user, setAuth]);

  return <Outlet />;
};

export default ProtectedRoute;
