/**
 * routes/pharmacyOrders.routes.js — Phase 12: Pharmacy order fulfillment.
 */
import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { checkRole } from '../middleware/checkRole.js';
import { scopeToHospital } from '../middleware/scopeToHospital.js';
import * as ctrl from '../controllers/bills.controller.js';

const router = Router();

// Patient creates order from prescription
router.post('/', authenticate, checkRole('PATIENT'), ctrl.createPharmacyOrder);
// Patient views own orders
router.get('/my', authenticate, checkRole('PATIENT'), ctrl.getMyOrders);

// Pharmacist views hospital orders
router.get('/hospital', authenticate, checkRole('PHARMACIST'), scopeToHospital, ctrl.getHospitalOrders);
// Pharmacist confirms pricing and initiates billing
router.post('/:id/confirm', authenticate, checkRole('PHARMACIST'), scopeToHospital, ctrl.confirmPharmacyOrder);
// Pharmacist advances status
router.patch('/:id/status', authenticate, checkRole('PHARMACIST'), scopeToHospital, ctrl.advancePharmacyOrderStatus);

export default router;
