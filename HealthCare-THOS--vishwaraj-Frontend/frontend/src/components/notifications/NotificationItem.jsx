/**
 * components/notifications/NotificationItem.jsx — Single notification row (Phase 15).
 */

/** Simple relative time formatter — no date-fns dependency needed */
const timeAgoStr = (dateStr) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const TYPE_META = {
  APPOINTMENT_CONFIRMED:     { emoji: '✅', color: 'bg-emerald-50 border-emerald-100', dot: 'bg-emerald-500' },
  APPOINTMENT_CANCELLED:     { emoji: '❌', color: 'bg-red-50 border-red-100',         dot: 'bg-red-500' },
  QUEUE_YOUR_TURN:           { emoji: '🔔', color: 'bg-cyan-50 border-cyan-100',       dot: 'bg-cyan-500' },
  QUEUE_YOUR_TURN_APPROACHING: { emoji: '⏰', color: 'bg-amber-50 border-amber-100',   dot: 'bg-amber-500' },
  CONSULTATION_COMPLETED:    { emoji: '🩺', color: 'bg-blue-50 border-blue-100',       dot: 'bg-blue-500' },
  PHARMACY_ORDER_UPDATE:     { emoji: '💊', color: 'bg-purple-50 border-purple-100',   dot: 'bg-purple-500' },
  PAYMENT_RESULT:            { emoji: '💳', color: 'bg-teal-50 border-teal-100',       dot: 'bg-teal-500' },
  BILL_GENERATED:            { emoji: '🧾', color: 'bg-orange-50 border-orange-100',   dot: 'bg-orange-500' },
  LAB_REPORT_READY:          { emoji: '🔬', color: 'bg-indigo-50 border-indigo-100',   dot: 'bg-indigo-500' },
  PASSPORT_ACCESS_CHANGED:   { emoji: '🔐', color: 'bg-rose-50 border-rose-100',       dot: 'bg-rose-500' },
  DEFAULT:                   { emoji: '📋', color: 'bg-slate-50 border-slate-100',     dot: 'bg-slate-400' },
};

export default function NotificationItem({ notification, onMarkRead }) {
  const meta = TYPE_META[notification.type] || TYPE_META.DEFAULT;
  const timeAgo = timeAgoStr(notification.createdAt);

  const handleClick = () => {
    if (!notification.isRead) onMarkRead(notification.id);
  };

  return (
    <li
      id={`notification-item-${notification.id}`}
      role="listitem"
      onClick={handleClick}
      className={`flex items-start gap-3 px-4 py-3 border-b border-slate-50 cursor-pointer transition-colors hover:bg-slate-50 ${
        !notification.isRead ? 'bg-white' : 'bg-slate-50/30'
      }`}
    >
      {/* Type emoji */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-xl border flex items-center justify-center text-base ${meta.color}`}>
        {meta.emoji}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm leading-tight ${!notification.isRead ? 'font-semibold text-slate-900' : 'font-medium text-slate-600'}`}>
            {notification.title}
          </p>
          {!notification.isRead && (
            <span className={`flex-shrink-0 w-2 h-2 rounded-full mt-1 ${meta.dot}`} aria-label="Unread" />
          )}
        </div>
        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
          {notification.message}
        </p>
        <p className="text-xs text-slate-400 mt-1">{timeAgo}</p>
      </div>
    </li>
  );
}
