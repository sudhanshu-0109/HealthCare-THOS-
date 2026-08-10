/**
 * hooks/useNotifications.js — Thin hook over the shared notification store.
 *
 * Backed by store/notificationStore.js so every consumer (header bell, the
 * Notifications tab, the sidebar badge) reads and mutates the SAME live state.
 * This hook owns the one-time initial fetch and the `notification:new` socket
 * subscription; the subscription is ref-counted so exactly one listener is
 * attached regardless of how many components use the hook.
 */

import { useEffect } from 'react';
import useNotificationStore from '../store/notificationStore.js';
import { getSocket } from '../services/socket.js';
import useAuthStore from '../store/authStore.js';

// Module-level guards shared across every hook consumer.
let subscriberCount = 0;
let socketHandler = null;

export const useNotifications = () => {
  const store = useNotificationStore();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user?.id) {
      useNotificationStore.getState().reset();
      return undefined;
    }

    // Fetch fresh data whenever a consumer mounts (idempotent GET).
    useNotificationStore.getState().fetchNotifications();

    // Attach the real-time listener once, on the first active consumer.
    subscriberCount += 1;
    if (subscriberCount === 1) {
      const socket = getSocket();
      if (socket) {
        socketHandler = (notif) => useNotificationStore.getState().pushNotification(notif);
        socket.on('notification:new', socketHandler);
      }
    }

    return () => {
      subscriberCount = Math.max(0, subscriberCount - 1);
      if (subscriberCount === 0 && socketHandler) {
        const socket = getSocket();
        if (socket) socket.off('notification:new', socketHandler);
        socketHandler = null;
      }
    };
  }, [user?.id]);

  return {
    notifications: store.notifications,
    unreadCount: store.unreadCount,
    total: store.total,
    loading: store.loading,
    error: store.error,
    markRead: store.markRead,
    markAllRead: store.markAllRead,
    refresh: store.fetchNotifications,
  };
};
