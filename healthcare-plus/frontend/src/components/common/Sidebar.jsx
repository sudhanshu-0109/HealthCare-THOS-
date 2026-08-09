/**
 * components/common/Sidebar.jsx — Role-based sidebar with logout for dashboard layouts.
 */

import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

// Nav items per role
const NAV_ITEMS = {
  PATIENT: [
    { to: '/dashboard', icon: '🏠', label: 'Dashboard' },
    { to: '/hospitals', icon: '🏥', label: 'Hospitals' },
    { to: '/appointments', icon: '📅', label: 'Appointments' },
    { to: '/passport', icon: '📋', label: 'Health Passport' },
    { to: '/prescriptions', icon: '💊', label: 'Prescriptions' },
    { to: '/pharmacy/orders', icon: '🧴', label: 'Pharmacy' },
    { to: '/lab/requests', icon: '🧪', label: 'Lab Reports' },
    { to: '/billing', icon: '💰', label: 'Billing' },
    { to: '/emergency', icon: '🚨', label: 'Emergency SOS' },
    { to: '/notifications', icon: '🔔', label: 'Notifications' },
    { to: '/profile', icon: '👤', label: 'Profile' },
  ],
  DOCTOR: [
    { to: '/doctor/dashboard', icon: '🏠', label: 'Dashboard' },
    { to: '/doctor/queue', icon: '📋', label: 'Queue' },
    { to: '/doctor/notifications', icon: '🔔', label: 'Notifications' },
    { to: '/doctor/profile', icon: '👤', label: 'Profile' },
  ],
  HOSPITAL_ADMIN: [
    { to: '/admin/dashboard', icon: '🏠', label: 'Dashboard' },
    { to: '/admin/departments', icon: '🏢', label: 'Departments' },
    { to: '/admin/doctors', icon: '👨‍⚕️', label: 'Doctors' },
    { to: '/admin/staff', icon: '👥', label: 'Staff' },
    { to: '/admin/queue', icon: '📋', label: 'Queue' },
    { to: '/admin/pharmacy', icon: '🧴', label: 'Pharmacy' },
    { to: '/admin/laboratory', icon: '🧪', label: 'Laboratory' },
    { to: '/admin/billing', icon: '💰', label: 'Billing' },
    { to: '/admin/emergency', icon: '🚨', label: 'Emergency' },
    { to: '/admin/analytics', icon: '📊', label: 'Analytics' },
    { to: '/admin/notifications', icon: '🔔', label: 'Notifications' },
    { to: '/admin/settings', icon: '⚙️', label: 'Settings' },
  ],
  PHARMACIST: [
    { to: '/pharmacy/dashboard', icon: '🏠', label: 'Dashboard' },
    { to: '/pharmacy/notifications', icon: '🔔', label: 'Notifications' },
  ],
  LAB_STAFF: [
    { to: '/lab/dashboard', icon: '🏠', label: 'Dashboard' },
    { to: '/lab/notifications', icon: '🔔', label: 'Notifications' },
  ],
  AMBULANCE_DRIVER: [
    { to: '/driver/dashboard', icon: '🏠', label: 'Dashboard' },
    { to: '/driver/notifications', icon: '🔔', label: 'Notifications' },
  ],
  RECEPTIONIST: [
    { to: '/receptionist/dashboard', icon: '🏠', label: 'Dashboard' },
    { to: '/receptionist/queue', icon: '📋', label: 'Queue' },
    { to: '/receptionist/appointments', icon: '📅', label: 'Appointments' },
    { to: '/receptionist/billing', icon: '💰', label: 'Billing' },
    { to: '/receptionist/notifications', icon: '🔔', label: 'Notifications' },
  ],
  SUPER_ADMIN: [
    { to: '/superadmin/dashboard', icon: '🏠', label: 'Dashboard' },
    { to: '/superadmin/hospitals', icon: '🏥', label: 'Hospitals' },
    { to: '/superadmin/users', icon: '👥', label: 'Users' },
    { to: '/superadmin/analytics', icon: '📊', label: 'Analytics' },
    { to: '/superadmin/audit-logs', icon: '📜', label: 'Audit Logs' },
  ],
};

const Sidebar = ({ role = 'PATIENT', isOpen = true, onClose }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const activeRole = user?.role || role;
  const items = NAV_ITEMS[activeRole] || NAV_ITEMS.PATIENT;

  const handleLogout = async () => {
    await logout();
    if (onClose) onClose();
    navigate('/', { replace: true });
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        id="sidebar"
        aria-label="Sidebar navigation"
        className={[
          'fixed top-0 left-0 z-40 h-full w-64 bg-white border-r border-gray-200 flex flex-col justify-between',
          'transform transition-transform duration-200 ease-in-out',
          'md:static md:translate-x-0 md:flex-shrink-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        {/* Top Section */}
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo / close row */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 flex-shrink-0">
            <span className="text-blue-600 font-bold text-lg">
              🏥 healthcare<span className="text-green-500">+</span>
            </span>
            <button
              onClick={onClose}
              className="md:hidden p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              aria-label="Close sidebar"
            >
              ✕
            </button>
          </div>

          {/* Nav items */}
          <nav className="flex-1 py-4 overflow-y-auto scrollbar-thin">
            <ul className="space-y-0.5 px-2">
              {items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to.endsWith('dashboard')}
                    onClick={onClose}
                    className={({ isActive }) =>
                      [
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium no-underline transition-colors',
                        isActive
                          ? 'bg-blue-50 text-blue-700 font-semibold'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                      ].join(' ')
                    }
                  >
                    <span className="text-base">{item.icon}</span>
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Bottom Profile & Logout Footer */}
        <div className="p-3 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white border border-gray-200 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-900 truncate">
                  {user?.fullName || 'User'}
                </p>
                <p className="text-[10px] text-gray-500 truncate uppercase font-mono">
                  {activeRole}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-md text-red-500 hover:bg-red-50 hover:text-red-700 transition"
              title="Logout"
            >
              🚪
            </button>
          </div>
        </div>

      </aside>
    </>
  );
};

export default Sidebar;
