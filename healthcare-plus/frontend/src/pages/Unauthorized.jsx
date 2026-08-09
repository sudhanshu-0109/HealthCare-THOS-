/**
 * pages/Unauthorized.jsx — 403 Forbidden Access Restricted Page.
 */

import { Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { ROLE_HOME_ROUTES } from '../utils/constants';

const Unauthorized = () => {
  const user = useAuthStore((state) => state.user);
  const dashboardRoute = user ? ROLE_HOME_ROUTES[user.role] || '/dashboard' : '/login';

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-gray-50">
      <div className="w-full max-w-md text-center bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="text-6xl mb-4">🚫</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h1>
        <p className="text-gray-500 text-sm mb-6">
          Your account ({user?.role || 'Guest'}) does not have permission to view this page.
        </p>
        <Link
          to={dashboardRoute}
          className="inline-flex items-center justify-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg no-underline transition"
        >
          Go to My Dashboard →
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;
