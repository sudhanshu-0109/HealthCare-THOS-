/**
 * routes/labFulfillment.routes.js — Phase 12: Lab request fulfillment and report upload.
 */
import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { checkRole } from '../middleware/checkRole.js';
import { scopeToHospital } from '../middleware/scopeToHospital.js';
import * as ctrl from '../controllers/bills.controller.js';

const router = Router();

// Lab staff views hospital lab requests
router.get('/hospital', authenticate, checkRole('LAB_STAFF'), scopeToHospital, ctrl.getHospitalLabRequests);
// Lab staff confirms tests and initiates billing
router.post('/:id/confirm', authenticate, checkRole('LAB_STAFF'), scopeToHospital, ctrl.confirmLabRequest);
// Lab staff advances a paid request (SAMPLE_COLLECTED → PROCESSING)
router.patch('/:id/status', authenticate, checkRole('LAB_STAFF'), scopeToHospital, ctrl.advanceLabStatus);
// Lab staff uploads report
router.post('/:id/upload-report', authenticate, checkRole('LAB_STAFF'), scopeToHospital, ctrl.uploadLabReport);

// Patient views own lab results
router.get('/patient/results', authenticate, checkRole('PATIENT'), ctrl.getMyLabResults);

// Patient books a follow-up Lite appointment for a completed lab request
router.post('/:id/book-follow-up', authenticate, checkRole('PATIENT'), ctrl.bookLabFollowUp);

export default router;
