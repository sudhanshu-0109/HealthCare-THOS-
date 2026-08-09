/**
 * routes/passport.routes.js — Healthcare Passport routes (Phase 7).
 */

import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { checkRole } from '../middleware/checkRole.js';
import * as ctrl from '../controllers/passport.controller.js';

const router = Router();

router.use(authenticate);

// Patient routes
router.get('/', checkRole('PATIENT'), ctrl.getMyPassport);
router.put('/', checkRole('PATIENT'), ctrl.updateMyPassport);
router.get('/timeline', checkRole('PATIENT'), ctrl.getMyTimeline);
router.post('/consent', checkRole('PATIENT'), ctrl.grantConsent);
router.delete('/consent/:id', checkRole('PATIENT'), ctrl.revokeConsent);

// Doctor-facing: consent-enforced
router.get('/:patientId', checkRole('DOCTOR'), ctrl.getDoctorViewPassport);

export default router;
