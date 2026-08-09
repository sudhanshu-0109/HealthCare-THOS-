/**
 * controllers/notifications.controller.js — Notification CRUD endpoints (Phase 15).
 *
 * GET  /api/notifications           — get my notifications (paginated)
 * PATCH /api/notifications/:id/read — mark a single notification as read
 * PATCH /api/notifications/read-all — mark all notifications as read
 * GET  /api/notifications/unread-count — lightweight poll endpoint
 */

import { asyncHandler } from '../utils/asyncHandler.js';
import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../services/notifications.service.js';

/**
 * GET /api/notifications
 * Query: page, limit, unreadOnly
 */
export const getNotifications = asyncHandler(async (req, res) => {
  const { page = '1', limit = '20', unreadOnly = 'false' } = req.query;
  const result = await getMyNotifications(req.user.id, {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    unreadOnly: unreadOnly === 'true',
  });
  res.json({ success: true, data: result });
});

/**
 * PATCH /api/notifications/:id/read
 */
export const markRead = asyncHandler(async (req, res) => {
  const notification = await markNotificationRead(req.params.id, req.user.id);
  res.json({ success: true, data: notification });
});

/**
 * PATCH /api/notifications/read-all
 */
export const markAllRead = asyncHandler(async (req, res) => {
  const result = await markAllNotificationsRead(req.user.id);
  res.json({ success: true, data: { message: `Marked ${result.count} notifications as read.` } });
});

/**
 * GET /api/notifications/unread-count
 * Lightweight endpoint for polling badge count.
 */
export const getUnreadCount = asyncHandler(async (req, res) => {
  const { unreadCount } = await getMyNotifications(req.user.id, { page: 1, limit: 1 });
  res.json({ success: true, data: { unreadCount } });
});
