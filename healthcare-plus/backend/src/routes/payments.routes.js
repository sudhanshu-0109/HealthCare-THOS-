/**
 * routes/payments.routes.js — Payment verification routes.
 */

import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { checkRole } from '../middleware/checkRole.js';
import * as ctrl from '../controllers/payments.controller.js';

const router = Router();

// Patient-authenticated verification
router.post('/verify', authenticate, checkRole('PATIENT'), ctrl.verifyPayment);

// Public webhook endpoint — Razorpay calls this, not the user
// Razorpay webhook signature is validated inside the controller
router.post('/webhook', ctrl.razorpayWebhook);

export default router;
