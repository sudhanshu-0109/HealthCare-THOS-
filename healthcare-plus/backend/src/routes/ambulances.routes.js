/**
 * routes/ambulances.routes.js — Phase 13: Ambulance fleet management (hospital admin).
 */
import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { checkRole } from '../middleware/checkRole.js';
import { scopeToHospital } from '../middleware/scopeToHospital.js';
import * as ctrl from '../controllers/ambulances.controller.js';

const router = Router();

router.use(authenticate, checkRole('HOSPITAL_ADMIN'), scopeToHospital);

router.post('/', ctrl.registerAmbulance);
router.get('/', ctrl.getHospitalAmbulances);
router.patch('/:id/status', ctrl.setStatus);

export default router;
