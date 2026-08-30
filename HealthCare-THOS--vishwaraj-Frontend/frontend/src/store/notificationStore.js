/**
 * store/notificationStore.js — Shared notification state (Zustand).
 *
 * Single source of truth for notifications + unread count so the header bell,
 * the in-dashboard Notifications tab, and the sidebar badge all stay in sync.
 * Marking read/all-read anywhere updates the live unread count everywhere.
 *
 * Data still comes from the real backend (services/notifications.service.js);
 * real-time additions arrive via the `notification:new` socket event.
 */

import { create } from 'zustand';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../services/notifications.service.js';

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  total: 0,
  loading: false,
  error: null,

  // Fetch a page of notifications and the authoritative unread count.
  fetchNotifications: async ({ page = 1, limit = 20 } = {}) => {
    set({ loading: true, error: null });
    try {
      const res = await getNotifications({ page, limit });
      // Interceptor unwraps to the `{ success, data }` envelope; payload at res.data.
      const data = res?.data || {};
      set({
        notifications: data.notifications || [],
        unreadCount: data.unreadCount ?? 0,
        total: data.total ?? 0,
        loading: false,
      });
    } catch (err) {
      set({ error: err.message || 'Failed to load notifications', loading: false });
    }
  },

  // Real-time push from the `notification:new` socket event.
  pushNotification: (notif) =>
    set((s) => ({
      notifications: [notif, ...s.notifications],
      unreadCount: s.unreadCount + 1,
      total: s.total + 1,
    })),

  markRead: async (id) => {
    const wasUnread = get().notifications.some((n) => n.id === id && !n.isRead);
    // Optimistic update — reflected immediately in every subscriber.
    set((s) => ({
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      unreadCount: wasUnread ? Math.max(0, s.unreadCount - 1) : s.unreadCount,
    }));
    try {
      await markNotificationRead(id);
    } catch (err) {
      console.warn('[notificationStore] Failed to mark read:', err.message);
    }
  },

  markAllRead: async () => {
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
    try {
      await markAllNotificationsRead();
    } catch (err) {
      console.warn('[notificationStore] Failed to mark all read:', err.message);
    }
  },

  reset: () => set({ notifications: [], unreadCount: 0, total: 0, loading: false, error: null }),
}));

export default useNotificationStore;
