/**
 * pages/NotFound.jsx — 404 page for undefined routes.
 */

import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-bold text-gray-200 mb-2">404</div>
        <div className="text-5xl mb-4">🏥</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Page not found</h1>
        <p className="text-gray-500 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          id="not-found-home-link"
          className="inline-flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg no-underline transition-colors"
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
