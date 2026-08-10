/**
 * routes/billing.routes.js — Phase 12: Unified billing payment endpoints.
 */
import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { checkRole } from '../middleware/checkRole.js';
import * as ctrl from '../controllers/billing.controller.js';

const router = Router();

// Razorpay checkout config (publishable key id + mock flag). Any authenticated user.
router.get('/config', authenticate, ctrl.getConfig);

// Patient initiates a payment for any payable source (Appointment, PharmacyOrder, LabRequest)
router.post('/pay', authenticate, checkRole('PATIENT'), ctrl.initiatePayment);

// Patient verifies payment after Razorpay checkout
router.post('/verify', authenticate, checkRole('PATIENT'), ctrl.verifyPayment);

export default router;
