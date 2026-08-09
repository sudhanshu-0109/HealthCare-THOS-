import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';
import { checkRole } from '../middleware/checkRole.js';
import { scopeToHospital } from '../middleware/scopeToHospital.js';
import * as staffController from '../controllers/staff.controller.js';

const router = Router();

router.use(authenticate, scopeToHospital, checkRole('HOSPITAL_ADMIN'));

router.get('/', staffController.getStaff);

router.post(
  '/invite',
  validate(staffController.inviteStaffSchema),
  staffController.inviteStaff
);

export default router;
