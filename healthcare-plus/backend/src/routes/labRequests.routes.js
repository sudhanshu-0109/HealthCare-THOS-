import { Router } from 'express';
import { authenticate as requireAuth } from '../middleware/authenticate.js';
import { checkRole as requireRole } from '../middleware/checkRole.js';
import * as controller from '../controllers/labRequests.controller.js';

const router = Router();

router.use(requireAuth);

router.post('/', requireRole('DOCTOR'), controller.createLabRequest);
router.get('/my', requireRole('PATIENT'), controller.getMyLabRequests);
router.get('/:id', controller.getLabRequest); // internal gating handles role check

export default router;
