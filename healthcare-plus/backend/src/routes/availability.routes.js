/**
 * routes/availability.routes.js — Doctor availability & slot routes.
 */

import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { checkRole } from '../middleware/checkRole.js';
import { scopeToHospital } from '../middleware/scopeToHospital.js';
import * as ctrl from '../controllers/availability.controller.js';

const router = Router();

// Public: anyone can check available slots
router.get('/:doctorId/slots', ctrl.getSlots);
router.get('/:doctorId', ctrl.getDoctorAvailability);

// Admin-only mutations
router.post('/', authenticate, checkRole('HOSPITAL_ADMIN', 'SUPER_ADMIN'), scopeToHospital, ctrl.createAvailability);
router.put('/:id', authenticate, checkRole('HOSPITAL_ADMIN', 'SUPER_ADMIN'), scopeToHospital, ctrl.updateAvailability);
router.delete('/:id', authenticate, checkRole('HOSPITAL_ADMIN', 'SUPER_ADMIN'), scopeToHospital, ctrl.deleteAvailability);

export default router;
