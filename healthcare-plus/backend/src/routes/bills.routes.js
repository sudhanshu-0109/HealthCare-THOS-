/**
 * routes/bills.routes.js — Phase 12: Bill history, receipts, hospital revenue.
 */
import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { checkRole } from '../middleware/checkRole.js';
import { scopeToHospital } from '../middleware/scopeToHospital.js';
import * as ctrl from '../controllers/bills.controller.js';

const router = Router();

// Patient billing history
router.get('/my', authenticate, checkRole('PATIENT'), ctrl.getMyBills);

// Hospital revenue (admin only)
router.get('/hospital/revenue', authenticate, checkRole('HOSPITAL_ADMIN'), scopeToHospital, ctrl.getHospitalRevenue);

// Single bill (patient sees own, admin sees hospital's)
router.get('/:id/receipt', authenticate, checkRole('PATIENT'), ctrl.getBillReceipt);
router.get('/:id', authenticate, ctrl.getBill);

export default router;
