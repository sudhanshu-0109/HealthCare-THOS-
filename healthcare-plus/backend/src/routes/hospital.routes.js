import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';
import { checkRole } from '../middleware/checkRole.js';
import * as hospitalController from '../controllers/hospital.controller.js';

const router = Router();

router.get('/search', hospitalController.searchHospitals);
router.get('/', hospitalController.getHospitals);

// Authenticated hospital-admin self-service. MUST precede '/:id' so 'me' is not
// swallowed by the id param. Scoped to the caller's own hospital (no IDOR).
router.get('/me', authenticate, hospitalController.getMyHospital);
router.put(
  '/me',
  authenticate,
  checkRole('HOSPITAL_ADMIN'),
  validate(hospitalController.updateMyHospitalSchema),
  hospitalController.updateMyHospital
);

router.get('/:id', hospitalController.getHospitalById);

router.use(authenticate);

router.post(
  '/',
  checkRole('SUPER_ADMIN'),
  validate(hospitalController.createHospitalSchema),
  hospitalController.createHospital
);

router.put(
  '/:id',
  checkRole('SUPER_ADMIN'),
  hospitalController.updateHospital
);

export default router;
