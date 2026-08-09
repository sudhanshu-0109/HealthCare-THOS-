/**
 * components/auth/ProtectedRoute.jsx — Route guard component.
 *
 * Checks if user is authenticated and has required role(s).
 * Redirects to /login if not authenticated, or /unauthorized if role mismatch.
 */

import { Navigate, useLocation, Outlet } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { user, token } = useAuthStore();
  const location = useLocation();

  const isAuthenticated = Boolean(token && user);

  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
