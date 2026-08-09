/**
 * routes/auditLog.routes.js — Phase 14: Audit log endpoints.
 */
import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { checkRole } from '../middleware/checkRole.js';
import { scopeToHospital } from '../middleware/scopeToHospital.js';
import * as ctrl from '../controllers/auditLog.controller.js';

const router = Router();

router.use(authenticate, checkRole('HOSPITAL_ADMIN'), scopeToHospital);

router.get('/', ctrl.getAuditLog);

export default router;
