import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';
import { checkRole } from '../middleware/checkRole.js';
import { scopeToHospital } from '../middleware/scopeToHospital.js';
import * as emergencyController from '../controllers/emergency.controller.js';
import { getRequestStatus } from '../controllers/emergencyDispatch.controller.js';

const router = Router();

router.use(authenticate);

// Patient creates SOS
router.post(
  '/',
  checkRole('PATIENT'),
  validate(emergencyController.createEmergencySchema),
  emergencyController.createEmergencyRequest
);

// Patient gets their active emergency
router.get(
  '/active',
  checkRole('PATIENT'),
  emergencyController.getActiveEmergency
);

// Patient gets their past emergencies
router.get(
  '/history',
  checkRole('PATIENT'),
  emergencyController.getMyEmergencies
);

// Phase 13: Patient polls status (also triggers lazy fallback check)
router.get(
  '/:id/status',
  checkRole('PATIENT'),
  getRequestStatus
);

// Hospital Staff views and updates requests
router.get(
  '/',
  scopeToHospital,
  checkRole('HOSPITAL_ADMIN', 'RECEPTIONIST', 'AMBULANCE_DRIVER', 'SUPER_ADMIN'),
  emergencyController.getEmergencyRequests
);

router.put(
  '/:id/status',
  scopeToHospital,
  checkRole('HOSPITAL_ADMIN', 'RECEPTIONIST', 'AMBULANCE_DRIVER', 'SUPER_ADMIN'),
  validate(emergencyController.updateEmergencySchema),
  emergencyController.updateEmergencyStatus
);

export default router;
