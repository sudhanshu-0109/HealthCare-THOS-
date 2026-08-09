import { Router } from 'express';
import { authenticate as requireAuth } from '../middleware/authenticate.js';
import { checkRole as requireRole } from '../middleware/checkRole.js';
import * as controller from '../controllers/prescriptions.controller.js';

const router = Router();

router.use(requireAuth);

router.post('/', requireRole('DOCTOR'), controller.createPrescription);
router.get('/my', requireRole('PATIENT'), controller.getMyPrescriptions);
router.get('/:id', controller.getPrescription); // internal gating handles role check

export default router;
