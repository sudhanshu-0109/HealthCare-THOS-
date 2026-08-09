/**
 * routes/adminQueue.routes.js — Phase 14: Hospital admin queue oversight routes.
 */
import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { checkRole } from '../middleware/checkRole.js';
import { scopeToHospital } from '../middleware/scopeToHospital.js';
import * as queueService from '../services/queue.service.js';

const router = Router();

router.use(authenticate, checkRole('HOSPITAL_ADMIN'), scopeToHospital);

// Force skip a patient in queue (with audit logging)
router.post('/:id/force-skip', async (req, res) => {
  const { reason } = req.body;
  const result = await queueService.adminForceSkip(req.params.id, req.user.id, req.hospitalId, reason);
  res.json({ success: true, data: result });
});

// Overview of all doctor queues in hospital for a specific date
router.get('/overview', async (req, res) => {
  const { date } = req.query;
  const result = await queueService.adminGetHospitalQueues(req.hospitalId, date);
  res.json({ success: true, data: result });
});

export default router;
