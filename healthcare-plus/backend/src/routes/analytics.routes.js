/**
 * routes/analytics.routes.js — Phase 14: Hospital analytics routes.
 */
import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { checkRole } from '../middleware/checkRole.js';
import { scopeToHospital } from '../middleware/scopeToHospital.js';
import * as ctrl from '../controllers/analytics.controller.js';

const router = Router();

router.use(authenticate, checkRole('HOSPITAL_ADMIN'), scopeToHospital);

router.get('/dashboard', ctrl.getDashboardSummary);
router.get('/appointments', ctrl.getAppointmentTrends);
router.get('/departments', ctrl.getDepartmentUsage);
router.get('/doctors', ctrl.getDoctorActivity);
router.get('/queue-load', ctrl.getQueueLoadStats);
router.get('/emergency', ctrl.getEmergencyStats);

export default router;
