/**
 * components/common/DevRoleSwitcher.jsx — Floating Dev Role Switcher Bar.
 * Allows frontend developers to instantly switch between all 8 role dashboards
 * without requiring any backend authentication or backend database.
 */

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Users, Activity, Building2, FlaskConical, Pill, Truck, Shield,
  ChevronUp, ChevronDown, Sparkles, UserCheck
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { MOCK_USERS } from '../../utils/mockData';
import { ROLE_HOME_ROUTES } from '../../utils/constants';

const ROLES_LIST = [
  { id: 'PATIENT', label: 'Patient', icon: Users, route: '/patient/dashboard', color: 'from-blue-500 to-indigo-600' },
  { id: 'DOCTOR', label: 'Doctor', icon: Activity, route: '/doctor/dashboard', color: 'from-teal-500 to-emerald-600' },
  { id: 'HOSPITAL_ADMIN', label: 'Hospital Admin', icon: Building2, route: '/admin/dashboard', color: 'from-purple-500 to-violet-600' },
  { id: 'LAB_STAFF', label: 'Lab Tech', icon: FlaskConical, route: '/lab/dashboard', color: 'from-amber-500 to-orange-600' },
  { id: 'PHARMACIST', label: 'Pharmacist', icon: Pill, route: '/pharmacy/dashboard', color: 'from-rose-500 to-pink-600' },
  { id: 'AMBULANCE_DRIVER', label: 'Ambulance Driver', icon: Truck, route: '/driver/dashboard', color: 'from-red-500 to-rose-600' },
  { id: 'RECEPTIONIST', label: 'Receptionist', icon: UserCheck, route: '/receptionist/dashboard', color: 'from-cyan-500 to-blue-600' },
  { id: 'SUPER_ADMIN', label: 'Super Admin', icon: Shield, route: '/superadmin/dashboard', color: 'from-slate-700 to-slate-900' },
];

export default function DevRoleSwitcher() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setAuth } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [activeNotification, setActiveNotification] = useState(null);

  const handleRoleSwitch = (roleId) => {
    const mockUser = MOCK_USERS[roleId] || MOCK_USERS.PATIENT;
    const token = 'standalone-frontend-mock-token-' + roleId;

    // Set auth state locally
    setAuth({ user: mockUser, accessToken: token });

    // Target route
    const roleItem = ROLES_LIST.find((r) => r.id === roleId);
    const targetRoute = roleItem?.route || ROLE_HOME_ROUTES[roleId] || '/dashboard';

    // Show quick feedback notification
    setActiveNotification(`Switched to ${roleId} dashboard`);
    setTimeout(() => setActiveNotification(null), 2500);

    // Navigate to dashboard
    navigate(targetRoute, { replace: true });
  };

  const currentRole = user?.role || 'NOT_LOGGED_IN';

  return (
    <aside aria-label="Frontend UI Dev Role Switcher" className="fixed bottom-3 right-3 z-50 transition-all duration-300 font-sans">
      {/* Toast Notification */}
      {activeNotification && (
        <div className="absolute -top-12 right-0 bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 animate-bounce">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          {activeNotification}
        </div>
      )}

      {/* Main Switcher Box */}
      <div className="bg-slate-900/95 backdrop-blur-md text-white border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden max-w-full">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-3 py-2 bg-slate-800/80 border-b border-slate-700/50">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <span className="text-xs font-bold tracking-wide uppercase text-cyan-400">Frontend UI Preview</span>
            {user && (
              <span className="text-[11px] bg-slate-700 text-slate-200 px-2 py-0.5 rounded-md font-mono">
                {user.role}
              </span>
            )}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50 transition-colors"
            title={collapsed ? 'Expand Role Switcher' : 'Collapse Role Switcher'}
          >
            {collapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Role Buttons List */}
        {!collapsed && (
          <div className="p-2.5 max-h-[80vh] overflow-y-auto">
            <p className="text-[11px] text-slate-400 mb-2 px-1">
              Select any role to access its dashboard without backend:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {ROLES_LIST.map((r) => {
                const isActive = currentRole === r.id;
                const Icon = r.icon;
                return (
                  <button
                    key={r.id}
                    onClick={() => handleRoleSwitch(r.id)}
                    className={`flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-medium transition-all text-left border ${
                      isActive
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-sm font-semibold'
                        : 'bg-slate-800/50 border-slate-700/60 text-slate-300 hover:bg-slate-700/60 hover:text-white'
                    }`}
                  >
                    <div className={`p-1 rounded-lg bg-gradient-to-r ${r.color} text-white flex-shrink-0`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="truncate">{r.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
