/**
 * hooks/useNotifications.js — Notification state with Socket.IO integration (Phase 15).
 *
 * Features:
 *   - Fetches initial notifications on mount
 *   - Listens for real-time notification:new events
 *   - Exposes markRead, markAllRead, refresh helpers
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../services/notifications.service.js';
import { getSocket } from '../services/socket.js';
import useAuthStore from '../store/authStore.js';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const listenerAttachedRef = useRef(false);

  const user = useAuthStore((s) => s.user);

  const fetchNotifications = useCallback(async (page = 1, limit = 20) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getNotifications({ page, limit });
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount ?? 0);
      setTotal(data.total ?? 0);
    } catch (err) {
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    if (user?.id) fetchNotifications();
  }, [user?.id, fetchNotifications]);

  // Real-time listener
  useEffect(() => {
    if (!user?.id || listenerAttachedRef.current) return;

    const socket = getSocket();
    if (!socket) return;

    const handler = (newNotif) => {
      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    socket.on('notification:new', handler);
    listenerAttachedRef.current = true;

    return () => {
      socket.off('notification:new', handler);
      listenerAttachedRef.current = false;
    };
  }, [user?.id]);

  const markRead = useCallback(async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.warn('[useNotifications] Failed to mark read:', err.message);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.warn('[useNotifications] Failed to mark all read:', err.message);
    }
  }, []);

  return {
    notifications,
    unreadCount,
    total,
    loading,
    error,
    markRead,
    markAllRead,
    refresh: fetchNotifications,
  };
};
