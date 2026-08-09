/**
 * layouts/PatientLayout.jsx — Layout for PATIENT protected pages.
 */

import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar';
import { useAuth } from '../hooks/useAuth';

const PatientLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar
        role="PATIENT"
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              id="patient-sidebar-toggle"
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
              aria-label="Open sidebar"
            >
              ☰
            </button>
            <span className="font-semibold text-gray-800 text-sm">
              healthcare<span className="text-green-500">+</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-gray-700 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200">
              <span>👤</span>
              <span>{user?.fullName || 'Patient'}</span>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-lg border border-red-200 transition-colors"
            >
              <span>🚪</span>
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default PatientLayout;
