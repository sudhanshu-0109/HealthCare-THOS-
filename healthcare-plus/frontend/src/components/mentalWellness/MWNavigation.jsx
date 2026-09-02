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

import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const NAV_ITEMS = [
  { path: '/health-hub/mental-wellness',           label: 'Wellness Home', icon: 'home',       activeIcon: 'home'       },
  { path: '/health-hub/mental-wellness/companion',  label: 'AI Companion',  icon: 'smart_toy',  activeIcon: 'smart_toy'  },
  { path: '/health-hub/mental-wellness/journey',    label: 'My Journey',    icon: 'auto_graph', activeIcon: 'auto_graph' },
];

export default function MWNavigation() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { user }   = useAuthStore();
  const firstName  = user?.fullName?.split(' ')[0] || 'You';
  const initial    = (user?.fullName || 'P').charAt(0).toUpperCase();

  const currentPath = location.pathname;

  return (
    <>
      {/* ── Desktop sticky top nav ──────────────────────────────────────── */}
      <header className="hidden md:flex sticky top-0 z-50 h-16 items-center bg-[rgba(245,251,249,0.92)] backdrop-blur-xl border-b border-[rgba(188,201,200,0.4)] px-8 lg:px-16 gap-4">

        {/* Left: back to Health Hub + logo */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => navigate('/health-hub')}
            className="flex items-center gap-1.5 text-[#6c7a78] hover:text-[#006a67] transition-colors text-xs font-medium mr-1"
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
                className={`relative px-5 py-2 rounded-full text-sm font-medium font-display transition-all duration-200 flex items-center gap-2 ${
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

        {/* Right: avatar */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div
            className="w-9 h-9 rounded-full bg-[#006a67]/10 flex items-center justify-center cursor-pointer hover:bg-[#006a67]/15 transition-colors"
            title={firstName}
          >
            <span className="text-sm font-bold text-[#006a67] font-display">{initial}</span>
          </div>
        </div>
      </header>

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
      </nav>
    </>
  );
}
