/**
 * routes/index.js — Central route registry.
 * All module routers are imported and mounted here.
 * Mounted at /api in app.js.
 */

import { Router } from 'express';
import healthRouter from './health.routes.js';
import authRouter from './auth.routes.js';
import hospitalRouter from './hospital.routes.js';
import departmentRouter from './department.routes.js';
import doctorRouter from './doctor.routes.js';
import staffRouter from './staff.routes.js';
import userRouter from './user.routes.js';
import emergencyRouter from './emergency.routes.js';
import aiRouter from './ai.routes.js';
import uploadRouter from './upload.routes.js';
// Phase 5
import availabilityRouter from './availability.routes.js';
import appointmentsRouter from './appointments.routes.js';
import paymentsRouter from './payments.routes.js';
// Phase 6
import queueRouter from './queue.routes.js';
// Phase 7
import passportRouter from './passport.routes.js';
import dashboardRouter from './dashboard.routes.js';
// Phase 8
import consultationsRouter from './consultations.routes.js';
import prescriptionsRouter from './prescriptions.routes.js';
import labRequestsRouter from './labRequests.routes.js';
import followUpRouter from './followUp.routes.js';
// Phase 12
import billingRouter from './billing.routes.js';
import billsRouter from './bills.routes.js';
import pharmacyOrdersRouter from './pharmacyOrders.routes.js';
import labFulfillmentRouter from './labFulfillment.routes.js';
// Phase 13
import ambulancesRouter from './ambulances.routes.js';
import driverRouter from './driver.routes.js';
// Phase 14
import analyticsRouter from './analytics.routes.js';
import auditLogRouter from './auditLog.routes.js';
import adminQueueRouter from './adminQueue.routes.js';
// Phase 15
import notificationsRouter from './notifications.routes.js';
import labTestsRouter from './labTests.routes.js';
import medicinesRouter from './medicines.routes.js';
// Phase 16
import onlineSessionRouter from './onlineSession.routes.js';

const router = Router();

// ── Active routes ──────────────────────────────────────────────────────────
router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/hospitals', hospitalRouter);
router.use('/departments', departmentRouter);
router.use('/doctors', doctorRouter);
router.use('/staff', staffRouter);
router.use('/users', userRouter);
router.use('/emergency', emergencyRouter);
router.use('/ai', aiRouter);
router.use('/upload', uploadRouter);
// Phase 5
router.use('/availability', availabilityRouter);
router.use('/appointments', appointmentsRouter);
router.use('/payments', paymentsRouter);
// Phase 6
router.use('/queue', queueRouter);
// Phase 7
router.use('/passport', passportRouter);
router.use('/dashboard', dashboardRouter);
// Phase 8
router.use('/consultations', consultationsRouter);
router.use('/prescriptions', prescriptionsRouter);
router.use('/lab-requests', labRequestsRouter);
router.use('/follow-ups', followUpRouter);
// Phase 12
router.use('/billing', billingRouter);
router.use('/bills', billsRouter);
router.use('/pharmacy-orders', pharmacyOrdersRouter);
router.use('/lab-fulfillment', labFulfillmentRouter);
// Phase 13
router.use('/ambulances', ambulancesRouter);
router.use('/driver', driverRouter);
// Phase 14
router.use('/analytics', analyticsRouter);
router.use('/audit-log', auditLogRouter);
router.use('/admin/queue', adminQueueRouter);
// Phase 15
router.use('/notifications', notificationsRouter);
router.use('/lab-tests', labTestsRouter);
router.use('/medicines', medicinesRouter);
// Phase 16
router.use('/online-sessions', onlineSessionRouter);

export default router;
