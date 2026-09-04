/**
 * components/mentalWellness/MWNavigation.jsx
 *
 * Mental Wellness module navigation shell.
 * Desktop: sticky top bar (shows Healthcare+ brand + 3 MW section links).
 * Mobile: fixed bottom nav (Material Design 3 pill-style active indicator).
 *
 * Converted from Mentalwellness-frontend/src/components/Navigation.tsx.
 * TypeScript interfaces/types removed. Navigation uses React Router v7
 * (useNavigate + useLocation) instead of prop-drilling onNavigate.
 * Back-to-Health-Hub link added on desktop.
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const NAV_ITEMS = [
  { path: '/health-hub/mental-wellness',           label: 'Wellness Home', icon: 'home',       activeIcon: 'home'       },
  { path: '/health-hub/mental-wellness/companion',  label: 'AI Companion',  icon: 'smart_toy',  activeIcon: 'smart_toy'  },
  { path: '/health-hub/mental-wellness/journey',    label: 'My Journey',    icon: 'auto_graph', activeIcon: 'auto_graph' },
];

export default function MWNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const desktopMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const avatarBtnRef = useRef(null);
  const mobileAvatarBtnRef = useRef(null);

  const firstName = user?.fullName?.split(' ')[0] || 'Arjun';
  const initial = (user?.fullName || 'A').charAt(0).toUpperCase();

  const currentPath = location.pathname;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setShowProfileMenu(false);
    try {
      await logout();
    } catch (err) {
      console.warn('[MWNavigation] Logout error:', err);
    } finally {
      setIsLoggingOut(false);
      navigate('/login', { replace: true });
    }
  };

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    if (!showProfileMenu) return;
    const handleClickOutside = (e) => {
      const isInsideDesktop = desktopMenuRef.current?.contains(e.target);
      const isInsideMobile = mobileMenuRef.current?.contains(e.target);
      const isInsideDesktopAvatar = avatarBtnRef.current?.contains(e.target);
      const isInsideMobileAvatar = mobileAvatarBtnRef.current?.contains(e.target);

      if (!isInsideDesktop && !isInsideMobile && !isInsideDesktopAvatar && !isInsideMobileAvatar) {
        setShowProfileMenu(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setShowProfileMenu(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showProfileMenu]);

  return (
    <>
      {/* ── Desktop sticky top nav ──────────────────────────────────────── */}
      <header className="hidden md:flex sticky top-0 z-50 h-16 items-center bg-[rgba(245,251,249,0.92)] backdrop-blur-xl border-b border-[rgba(188,201,200,0.4)] px-8 lg:px-16 gap-4">

        {/* Left: back to Health Hub + logo */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => navigate('/health-hub')}
            className="flex items-center gap-1.5 text-[#6c7a78] hover:text-[#006a67] transition-colors text-xs font-medium mr-1 cursor-pointer"
            title="Back to Health Hub"
          >
            <span className="material-symbols-outlined msym-sm">arrow_back</span>
            <span className="hidden lg:inline">Health Hub</span>
          </button>

          <div className="w-px h-5 bg-[rgba(188,201,200,0.5)]" />

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-[#006a67] flex items-center justify-center">
              <span className="material-symbols-outlined msym-sm text-white filled">favorite</span>
            </div>
            <span className="font-display font-bold text-[#171d1c] tracking-tight text-sm">
              Healthcare+{' '}
              <span className="text-[#006a67] font-medium">Wellness</span>
            </span>
          </div>
        </div>

        {/* Centre nav links */}
        <nav className="flex items-center gap-1 mx-auto">
          {NAV_ITEMS.map((item) => {
            const active = currentPath === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`relative px-5 py-2 rounded-full text-sm font-medium font-display transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                  active
                    ? 'text-[#006a67]'
                    : 'text-[#3c4948] hover:text-[#171d1c] hover:bg-[#e9efee]'
                }`}
              >
                <span className={`material-symbols-outlined msym-sm ${active ? 'filled' : ''}`}>
                  {item.icon}
                </span>
                {item.label}
                {active && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-[#006a67] rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right: avatar + Sign Out dropdown */}
        <div className="relative flex items-center gap-2 flex-shrink-0">
          <button
            ref={avatarBtnRef}
            onClick={() => setShowProfileMenu(prev => !prev)}
            className={`w-9 h-9 rounded-full bg-[#006a67]/10 flex items-center justify-center cursor-pointer transition-all outline-none ${
              showProfileMenu
                ? 'ring-2 ring-[#006a67] shadow-sm bg-[#006a67]/20 scale-105'
                : 'hover:bg-[#006a67]/15 hover:scale-105'
            }`}
            title={`Account: ${user?.fullName || firstName}`}
            aria-haspopup="true"
            aria-expanded={showProfileMenu}
          >
            <span className="text-sm font-bold text-[#006a67] font-display">{initial}</span>
          </button>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div
              ref={desktopMenuRef}
              onMouseDown={(e) => e.stopPropagation()}
              className="absolute right-0 top-full mt-2.5 w-64 rounded-2xl bg-white/95 backdrop-blur-xl border border-[#dce7e4] shadow-2xl shadow-[#006a67]/15 py-2 z-50 animate-fadeIn divide-y divide-[#edf3f1]"
            >
              {/* User Info Header */}
              <div className="px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#006a67] to-[#5bd9d3] flex items-center justify-center text-white font-bold font-display text-base shadow-xs">
                  {initial}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-[#171d1c] font-display truncate">
                    {user?.fullName || 'Arjun'}
                  </p>
                  <p className="text-[11px] text-[#6c7a78] truncate mt-0.5">
                    {user?.email || 'Patient'}
                  </p>
                </div>
              </div>

              {/* Quick Navigation Links */}
              <div className="p-1.5 space-y-0.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowProfileMenu(false);
                    navigate('/health-hub');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#3c4948] hover:text-[#006a67] hover:bg-[#f0f7f5] rounded-xl transition-colors font-display text-left cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">health_and_safety</span>
                  <span>Health Hub Dashboard</span>
                </button>
              </div>

              {/* Sign Out Action Button */}
              <div className="p-1.5">
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors font-display text-left cursor-pointer"
                >
                  {isLoggingOut ? (
                    <>
                      <span className="material-symbols-outlined text-[18px] animate-spin">
                        progress_activity
                      </span>
                      <span>Signing out...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">logout</span>
                      <span>Sign Out</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ── Mobile Profile Menu Modal / Action Sheet ────────────────────── */}
      {showProfileMenu && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex items-end justify-center p-4"
          onClick={() => setShowProfileMenu(false)}
        >
          <div
            ref={mobileMenuRef}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl bg-white border border-[#dce7e4] shadow-2xl p-4 mb-20 animate-fadeIn"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#edf3f1]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#006a67] to-[#5bd9d3] flex items-center justify-center text-white font-bold font-display text-base">
                  {initial}
                </div>
                <div>
                  <p className="text-sm font-bold text-[#171d1c] font-display">{user?.fullName || 'Arjun'}</p>
                  <p className="text-xs text-[#6c7a78]">{user?.email || 'Patient'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowProfileMenu(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="py-2 space-y-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowProfileMenu(false);
                  navigate('/health-hub');
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium text-[#3c4948] hover:bg-[#f0f7f5] rounded-xl text-left cursor-pointer font-display"
              >
                <span className="material-symbols-outlined text-[20px]">health_and_safety</span>
                <span>Health Hub Dashboard</span>
              </button>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl text-left cursor-pointer font-display"
              >
                {isLoggingOut ? (
                  <>
                    <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                    <span>Signing out...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[20px]">logout</span>
                    <span>Sign Out</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile fixed bottom nav ─────────────────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-50 flex items-center justify-around px-4 pt-3"
        style={{
          paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
          background: 'rgba(239,245,243,0.88)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(188,201,200,0.4)',
          boxShadow: '0 -10px 30px rgba(0,106,103,0.08)',
          borderRadius: '24px 24px 0 0',
        }}
      >
        {/* Back button on mobile */}
        <button
          onClick={() => navigate('/health-hub')}
          className="flex flex-col items-center gap-1 opacity-60 hover:opacity-100 transition-all duration-200"
        >
          <span className="material-symbols-outlined text-[#3c4948]" style={{ fontSize: '22px' }}>
            arrow_back
          </span>
          <span className="text-[10px] text-[#3c4948] font-medium">Hub</span>
        </button>

        {NAV_ITEMS.map((item) => {
          const active = currentPath === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 transition-all duration-200 ${active ? '' : 'opacity-60'}`}
            >
              {active ? (
                <span className="flex items-center gap-1.5 bg-[#006a67]/15 text-[#006a67] rounded-full px-4 py-2 font-display font-semibold text-xs">
                  <span className="material-symbols-outlined msym-sm filled">{item.activeIcon}</span>
                  {item.label.split(' ')[0]}
                </span>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[#3c4948]" style={{ fontSize: '22px' }}>
                    {item.icon}
                  </span>
                  <span className="text-[10px] text-[#3c4948] font-medium">{item.label.split(' ')[0]}</span>
                </>
              )}
            </button>
          );
        })}

        {/* Profile / Account on mobile */}
        <button
          ref={mobileAvatarBtnRef}
          onClick={() => setShowProfileMenu(prev => !prev)}
          className={`flex flex-col items-center gap-1 transition-all duration-200 ${showProfileMenu ? 'text-[#006a67]' : 'opacity-60'}`}
          title="Account / Sign Out"
        >
          <div className="w-6 h-6 rounded-full bg-[#006a67]/15 flex items-center justify-center">
            <span className="text-[10px] font-bold text-[#006a67]">{initial}</span>
          </div>
          <span className="text-[10px] text-[#3c4948] font-medium">Account</span>
        </button>
      </nav>
    </>
  );
}
