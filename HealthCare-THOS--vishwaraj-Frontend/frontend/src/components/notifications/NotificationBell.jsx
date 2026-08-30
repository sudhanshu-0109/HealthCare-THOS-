/**
 * components/notifications/NotificationBell.jsx — Notification bell icon with badge and panel (Phase 15).
 *
 * Usage:
 *   <NotificationBell />
 *
 * Self-contained: manages the panel open/close state internally.
 * Relies on useNotifications for data.
 */

import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications.js';
import NotificationPanel from './NotificationPanel.jsx';

export default function NotificationBell() {
  const [panelOpen, setPanelOpen] = useState(false);
  const bellRef = useRef(null);
  const panelRef = useRef(null);
  const { notifications, unreadCount, loading, markRead, markAllRead } = useNotifications();

  // Close panel on outside click
  useEffect(() => {
    if (!panelOpen) return;
    const handleClickOutside = (e) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        bellRef.current && !bellRef.current.contains(e.target)
      ) {
        setPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [panelOpen]);

  return (
    <div className="relative" id="notification-bell-container">
      <button
        ref={bellRef}
        id="notification-bell-btn"
        onClick={() => setPanelOpen((open) => !open)}
        className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        aria-haspopup="true"
        aria-expanded={panelOpen}
      >
        <Bell className="w-5 h-5 text-slate-500" />
        {unreadCount > 0 && (
          <span
            className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none"
            aria-hidden="true"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {panelOpen && (
        <div ref={panelRef}>
          <NotificationPanel
            notifications={notifications}
            unreadCount={unreadCount}
            loading={loading}
            onMarkRead={markRead}
            onMarkAllRead={markAllRead}
            onClose={() => setPanelOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
