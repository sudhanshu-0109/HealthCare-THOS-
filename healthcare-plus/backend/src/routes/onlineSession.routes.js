/**
 * routes/onlineSession.routes.js — Online Consultation session routes (Phase 16).
 *
 * All routes require authentication.
 * /join and /start and /end require DOCTOR or PATIENT role checks inside the service.
 * The stats endpoint is DOCTOR-only.
 */

import { Router } from 'express';
import { authenticate as requireAuth } from '../middleware/authenticate.js';
import { checkRole as requireRole } from '../middleware/checkRole.js';
import * as controller from '../controllers/onlineSession.controller.js';

const router = Router();

router.use(requireAuth);

// Doctor dashboard stats (must be before /:appointmentId to avoid route conflict)
router.get('/doctor/stats', requireRole('DOCTOR'), controller.getDoctorOnlineStats);

// Session lifecycle (patient + doctor)
router.get('/:appointmentId', controller.getSession);
router.post('/:appointmentId/join', controller.joinSession);
router.post('/:appointmentId/start', requireRole('DOCTOR'), controller.startSession);
router.post('/:appointmentId/end', requireRole('DOCTOR'), controller.endSession);

export default router;
