import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';
import * as aiController from '../controllers/ai.controller.js';

const router = Router();

router.use(authenticate);

router.post(
  '/triage',
  validate(aiController.triageSchema),
  aiController.triageSymptoms
);

export default router;
