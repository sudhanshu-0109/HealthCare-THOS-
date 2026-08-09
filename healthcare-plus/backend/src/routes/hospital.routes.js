import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';
import { checkRole } from '../middleware/checkRole.js';
import * as hospitalController from '../controllers/hospital.controller.js';

const router = Router();

router.get('/search', hospitalController.searchHospitals);
router.get('/', hospitalController.getHospitals);
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
  checkRole('SUPER_ADMIN', 'HOSPITAL_ADMIN'),
  hospitalController.updateHospital
);

export default router;
