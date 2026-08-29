/**
 * routes/appointments.routes.js — Appointment booking routes.
 */

import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { checkRole } from '../middleware/checkRole.js';
import { scopeToHospital } from '../middleware/scopeToHospital.js';
import * as ctrl from '../controllers/appointments.controller.js';

const router = Router();

// All appointment routes require authentication
router.use(authenticate);

// Patient routes
router.post('/', checkRole('PATIENT'), ctrl.initiateBooking);
router.get('/my', checkRole('PATIENT'), ctrl.getMyAppointments);

// Doctor routes (Phase 16: doctor-scoped appointment list for online panel)
router.get('/doctor/mine', checkRole('DOCTOR'), ctrl.getDoctorAppointments);

router.get('/:id', ctrl.getAppointmentById); // own-check done in service
router.patch('/:id/cancel', checkRole('PATIENT'), ctrl.cancelAppointment);

// Hospital Admin routes
router.get('/', checkRole('HOSPITAL_ADMIN', 'SUPER_ADMIN'), scopeToHospital, ctrl.getHospitalAppointments);

export default router;

