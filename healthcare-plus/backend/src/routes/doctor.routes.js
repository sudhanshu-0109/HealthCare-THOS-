import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';
import { checkRole } from '../middleware/checkRole.js';
import { scopeToHospital } from '../middleware/scopeToHospital.js';
import * as doctorController from '../controllers/doctor.controller.js';

const router = Router();

router.use(authenticate);

// List doctors — automatically scopes to hospital for hospital staff/admins
router.get(
  '/',
  (req, res, next) => {
    if (['HOSPITAL_ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PHARMACIST', 'LAB_STAFF', 'AMBULANCE_DRIVER'].includes(req.user?.role)) {
      return scopeToHospital(req, res, next);
    }
    next();
  },
  doctorController.getDoctors
);

router.use(scopeToHospital);

router.get('/me', doctorController.getDoctorMe);

router.post(
  '/invite',
  checkRole('HOSPITAL_ADMIN'),
  validate(doctorController.inviteDoctorSchema),
  doctorController.inviteDoctor
);

export default router;
