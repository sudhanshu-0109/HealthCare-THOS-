/**
 * components/layout/DashboardShell.jsx — Shared dashboard layout.
 * Enhanced UI from new frontend design.
 * Mock role-switcher removed — navigation is backend-authenticated only.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import NotificationBell from '../notifications/NotificationBell.jsx';

export default function DashboardShell({
  navItems,
  activeItem,
  setActiveItem,
  roleLabel,
  roleColor,
  children,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const roleInitials = (user?.fullName || 'User')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar (desktop) */}
      <aside className="hidden lg:flex flex-col w-60 bg-white border-r border-slate-100 fixed inset-y-0 left-0 z-30">
        {/* Logo */}
        <div className="h-16 flex items-center gap-2 px-5 border-b border-slate-100 flex-shrink-0">
          <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-xs">
            <Heart className="w-4 h-4 text-white fill-white/20" />
          </div>
          <span className="font-bold text-slate-900 text-base tracking-tight">
            healthcare<span className="text-teal-600 font-extrabold">+</span>
          </span>
        </div>

        {/* Role badge */}
        <div className="px-4 py-3 border-b border-slate-100">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold shadow-2xs ${roleColor}`}>
            <div className="w-1.5 h-1.5 rounded-full bg-current opacity-80 animate-pulse" />
            {roleLabel}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveItem(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-teal-50 text-teal-800 border-r-2 border-teal-600 shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {Icon && <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />}
                {item.label}
                {item.badge && (
                  <span className="ml-auto bg-rose-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 flex items-center justify-center flex-shrink-0">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User + logout */}
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-xs font-extrabold flex-shrink-0 shadow-2xs">
              {roleInitials}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 truncate">{user?.fullName || 'User'}</div>
              <div className="text-[11px] text-slate-400 truncate font-medium">{user?.email || ''}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all text-xs font-bold"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="relative flex flex-col w-72 bg-white shadow-xl h-full">
            <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <Heart className="w-4 h-4 text-white fill-white/20" />
                </div>
                <span className="font-bold text-slate-900">healthcare<span className="text-teal-600">+</span></span>
              </div>
              <button onClick={() => setSidebarOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="px-4 py-3 border-b border-slate-100">
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${roleColor}`}>
                <div className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                {roleLabel}
              </div>
            </div>
            <nav className="flex-1 overflow-y-auto py-4 px-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => { setActiveItem(item.id); setSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-sm transition-all ${
                      activeItem === item.id
                        ? 'bg-teal-50 text-teal-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {Icon && <Icon className={`w-4 h-4 flex-shrink-0 ${activeItem === item.id ? 'text-teal-600' : 'text-slate-400'}`} />}
                    {item.label}
                    {item.badge && (
                      <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
            <div className="p-4 border-t border-slate-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {roleInitials}
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-900">{user?.fullName || 'User'}</div>
                  <div className="text-xs text-slate-400">{user?.email || ''}</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all text-sm font-semibold"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col lg:ml-60">
        {/* Top header */}
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20">
          <button className="lg:hidden p-2 rounded-lg hover:bg-slate-100" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5 text-slate-600" />
          </button>
          <div className="hidden lg:block">
            <h2 className="font-semibold text-slate-900">
              {navItems.find((n) => n.id === activeItem)?.label || 'Dashboard'}
            </h2>
          </div>
          <div className="lg:hidden flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <Heart className="w-3.5 h-3.5 text-white fill-white/20" />
            </div>
            <span className="font-bold text-slate-900 text-sm">healthcare<span className="text-teal-600">+</span></span>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-2xs">
              {roleInitials}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          {children}
        </main>

        {/* Bottom nav (mobile) */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-100 flex z-20">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveItem(item.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-2 transition-colors relative ${
                  activeItem === item.id ? 'text-teal-600' : 'text-slate-400'
                }`}
              >
                {Icon && <Icon className="w-5 h-5" />}
                <span className="text-xs">{item.shortLabel || item.label.split(' ')[0]}</span>
                {item.badge && (
                  <span className="absolute top-1.5 right-1/4 bg-rose-500 text-white text-xs rounded-full w-3.5 h-3.5 flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
