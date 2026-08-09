import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';
import { checkRole } from '../middleware/checkRole.js';
import { scopeToHospital } from '../middleware/scopeToHospital.js';
import * as departmentController from '../controllers/department.controller.js';

const router = Router();

router.use(authenticate);

// Get departments — automatically scopes to hospital for hospital staff/admins
router.get(
  '/',
  (req, res, next) => {
    if (['HOSPITAL_ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PHARMACIST', 'LAB_STAFF', 'AMBULANCE_DRIVER'].includes(req.user?.role)) {
      return scopeToHospital(req, res, next);
    }
    next();
  },
  departmentController.getDepartments
);

router.use(scopeToHospital);

router.post(
  '/',
  checkRole('HOSPITAL_ADMIN'),
  validate(departmentController.createDepartmentSchema),
  departmentController.createDepartment
);

export default router;
