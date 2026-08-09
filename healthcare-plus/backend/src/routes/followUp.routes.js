import { Router } from 'express';
import { authenticate as requireAuth } from '../middleware/authenticate.js';
import { checkRole as requireRole } from '../middleware/checkRole.js';
import * as controller from '../controllers/followUp.controller.js';

const router = Router();

router.use(requireAuth);

router.post('/', requireRole('DOCTOR'), controller.recommendFollowUp);
router.post('/:id/book', requireRole('PATIENT'), controller.bookFollowUp);
router.post('/:id/dismiss', requireRole('PATIENT'), controller.dismissFollowUp);
router.get('/my', requireRole('PATIENT'), controller.getMyFollowUps);

export default router;
