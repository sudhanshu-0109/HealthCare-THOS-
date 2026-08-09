/**
 * routes/notifications.routes.js — Notification routes (Phase 15).
 * All routes require authentication (any role).
 */

import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import {
  getNotifications,
  markRead,
  markAllRead,
  getUnreadCount,
} from '../controllers/notifications.controller.js';

const router = Router();

router.use(authenticate);

// GET /api/notifications/unread-count — must come before /:id/read
router.get('/unread-count', getUnreadCount);

// GET /api/notifications
router.get('/', getNotifications);

// PATCH /api/notifications/read-all
router.patch('/read-all', markAllRead);

// PATCH /api/notifications/:id/read
router.patch('/:id/read', markRead);

export default router;
