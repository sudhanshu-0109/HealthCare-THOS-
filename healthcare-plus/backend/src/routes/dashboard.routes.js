/**
 * routes/dashboard.routes.js — Patient dashboard summary (Phase 7).
 */

import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { checkRole } from '../middleware/checkRole.js';
import { getSummary } from '../controllers/dashboard.controller.js';

const router = Router();

router.get('/summary', authenticate, checkRole('PATIENT'), getSummary);

export default router;
