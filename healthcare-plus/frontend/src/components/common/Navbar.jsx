/**
 * components/common/Navbar.jsx — Public/Patient navigation header with user profile & logout.
 */

import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROLE_HOME_ROUTES } from '../../utils/constants';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const dashboardRoute = user ? (ROLE_HOME_ROUTES[user.role] || '/dashboard') : '/dashboard';

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link
            to="/"
            id="navbar-logo"
            className="flex items-center gap-2 text-blue-600 font-bold text-xl no-underline hover:text-blue-700"
          >
            <span className="text-2xl">🏥</span>
            <span>healthcare<span className="text-green-500">+</span></span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `text-sm font-medium transition-colors no-underline ${isActive ? 'text-blue-600 font-semibold' : 'text-gray-600 hover:text-gray-900'}`
              }
            >
              Home
            </NavLink>

            {isAuthenticated && (
              <NavLink
                to={dashboardRoute}
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors no-underline ${isActive ? 'text-blue-600 font-semibold' : 'text-gray-600 hover:text-gray-900'}`
                }
              >
                Dashboard
              </NavLink>
            )}
          </nav>

          {/* Auth State Actions */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                {/* User Profile Badge */}
                <div className="hidden sm:flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200">
                  <span className="text-xs">👤</span>
                  <span className="text-xs font-semibold text-gray-800">{user?.fullName || 'User'}</span>
                  <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded-md uppercase">
                    {user?.role}
                  </span>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  id="navbar-logout-btn"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium rounded-lg border border-red-200 transition-colors focus:outline-none"
                  title="Sign out of healthcare+"
                >
                  <span>🚪</span>
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  id="navbar-login"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 no-underline transition-colors px-3 py-2"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  id="navbar-get-started"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg no-underline transition-colors shadow-sm"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};

export default Navbar;
