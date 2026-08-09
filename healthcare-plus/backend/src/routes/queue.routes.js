/**
 * routes/queue.routes.js — Queue management routes (Phase 6).
 */

import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { checkRole } from '../middleware/checkRole.js';
import * as ctrl from '../controllers/queue.controller.js';

const router = Router();

router.use(authenticate);

// Doctor reads their own queue (or admin reads by doctorId param)
router.get('/doctor/:doctorId', checkRole('DOCTOR', 'HOSPITAL_ADMIN', 'SUPER_ADMIN'), ctrl.getDoctorQueue);

// Patient's live queue position for a specific appointment
router.get('/my-position/:appointmentId', checkRole('PATIENT'), ctrl.getPatientQueuePosition);

// Doctor queue control actions — doctorId always from req.user, never from body
router.post('/call-next', checkRole('DOCTOR'), ctrl.callNext);
router.post('/:id/start', checkRole('DOCTOR'), ctrl.startConsultation);
router.post('/:id/complete', checkRole('DOCTOR'), ctrl.completeConsultation);
router.post('/:id/skip', checkRole('DOCTOR'), ctrl.skipPatient);
router.post('/:id/requeue', checkRole('DOCTOR'), ctrl.requeueSkipped);

export default router;
