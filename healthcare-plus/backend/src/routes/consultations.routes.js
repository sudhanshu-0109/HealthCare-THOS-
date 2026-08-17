import { Router } from 'express';
import { authenticate as requireAuth } from '../middleware/authenticate.js';
import { checkRole as requireRole } from '../middleware/checkRole.js';
import * as controller from '../controllers/consultations.controller.js';

const router = Router();

router.use(requireAuth);

// Doctor-only routes
router.post('/start', requireRole('DOCTOR'), controller.startConsultation);
router.get('/recent', requireRole('DOCTOR'), controller.getRecentConsultations);
router.get('/history/:patientId', requireRole('DOCTOR'), controller.getConsultationHistory);
// Phase 16: look up consultation by appointmentId (online clinical notes)
router.get('/by-appointment/:appointmentId', requireRole('DOCTOR'), controller.getConsultationByAppointment);

router.patch('/:id', requireRole('DOCTOR'), controller.updateConsultation);
router.post('/:id/complete', requireRole('DOCTOR'), controller.completeConsultation);

export default router;
