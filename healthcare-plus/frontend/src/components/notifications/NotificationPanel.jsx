/**
 * components/notifications/NotificationPanel.jsx — Dropdown notification panel (Phase 15).
 */

import { CheckCheck, X } from 'lucide-react';
import NotificationItem from './NotificationItem.jsx';

export default function NotificationPanel({
  notifications,
  unreadCount,
  loading,
  onMarkRead,
  onMarkAllRead,
  onClose,
}) {
  return (
    <div
      id="notification-panel"
      role="dialog"
      aria-label="Notifications"
      className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden"
      style={{ maxHeight: '480px', display: 'flex', flexDirection: 'column' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-slate-900 text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-red-100 text-red-600 text-xs font-semibold px-1.5 py-0.5 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              id="mark-all-read-btn"
              onClick={onMarkAllRead}
              className="flex items-center gap-1 text-xs text-cyan-600 hover:text-cyan-700 font-medium px-2 py-1 rounded-lg hover:bg-cyan-50 transition-colors"
              title="Mark all as read"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              All read
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Close notifications"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="overflow-y-auto flex-1">
        {loading ? (
          <div className="flex flex-col gap-2 p-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-3 bg-slate-100 rounded-full w-3/4 mb-2" />
                <div className="h-2.5 bg-slate-100 rounded-full w-full" />
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-6">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
              <span className="text-2xl">🔔</span>
            </div>
            <p className="text-slate-500 text-sm font-medium">You're all caught up!</p>
            <p className="text-slate-400 text-xs mt-1">New notifications will appear here.</p>
          </div>
        ) : (
          <ul role="list">
            {notifications.map((notif) => (
              <NotificationItem
                key={notif.id}
                notification={notif}
                onMarkRead={onMarkRead}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
