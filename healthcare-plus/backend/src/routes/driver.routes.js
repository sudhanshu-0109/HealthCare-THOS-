/**
 * routes/driver.routes.js — Phase 13: Ambulance driver actions.
 */
import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { checkRole } from '../middleware/checkRole.js';
import * as ctrl from '../controllers/emergencyDispatch.controller.js';

const router = Router();

router.use(authenticate, checkRole('AMBULANCE_DRIVER'));

router.get('/me', ctrl.getDriverState);
router.post('/go-online', ctrl.goOnline);
router.post('/go-offline', ctrl.goOffline);
router.post('/location', ctrl.updateLocation);
router.post('/requests/:id/accept', ctrl.acceptRequest);
router.post('/requests/:id/reject', ctrl.rejectRequest);
router.post('/requests/:id/en-route', ctrl.markEnRoute);
router.post('/requests/:id/reached', ctrl.markReachedPatient);  // Backup manual trigger
router.post('/requests/:id/picked-up', ctrl.markPickedUp);
router.post('/requests/:id/arrived', ctrl.markArrived);

export default router;
