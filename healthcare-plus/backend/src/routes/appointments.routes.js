/**
 * routes/appointments.routes.js — Appointment booking routes.
 */

import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { checkRole } from '../middleware/checkRole.js';
import * as ctrl from '../controllers/appointments.controller.js';

const router = Router();

// All appointment routes require authentication
router.use(authenticate);

// Patient routes
router.post('/', checkRole('PATIENT'), ctrl.initiateBooking);
router.get('/my', checkRole('PATIENT'), ctrl.getMyAppointments);
router.get('/:id', ctrl.getAppointmentById); // own-check done in service
router.patch('/:id/cancel', checkRole('PATIENT'), ctrl.cancelAppointment);

export default router;
