/**
 * services/notifications.service.js — Notification creation and real-time delivery (Phase 15).
 *
 * Two-layer delivery:
 *   1. DB persistence — always: prisma.notification.create()
 *   2. Socket.IO real-time push — to user:{userId} room via notify()
 *   3. Email — only for 4 high-value event types (see PHASE 15 DECISION: Email Subset below)
 *
 * PHASE 15 DECISION — Email subset:
 *   Email is sent ONLY for:
 *     - APPOINTMENT_CONFIRMED
 *     - PAYMENT_RESULT  (especially failures — patient must know even if offline)
 *     - LAB_REPORT_READY
 *     - PASSPORT_ACCESS_CHANGED  (security-relevant)
 *   All other notification types are in-app + Socket.IO only.
 *   Rationale: email every event = noisy; email zero events = invisible to offline users.
 *   See docs/phase15/decisions.md for the full rationale.
 */

import prisma from '../prisma/client.js';
import { getIO } from '../sockets/index.js';

const EMAIL_TYPES = new Set([
  'APPOINTMENT_CONFIRMED',
  'PAYMENT_RESULT',
  'LAB_REPORT_READY',
  'PASSPORT_ACCESS_CHANGED',
]);

/**
 * Core notify — persists + emits + conditionally emails.
 * Never throws — always fire-and-forget safe.
 *
 * @param {string} userId
 * @param {{ type: string, title: string, message: string, relatedId?: string }} params
 */
export const notify = async (userId, { type, title, message, relatedId = null }) => {
  let notification = null;
  try {
    notification = await prisma.notification.create({
      data: { userId, type, title, message, relatedId },
    });
  } catch (err) {
    console.warn('[Notifications] Failed to persist notification:', err.message);
    return null;
  }

  // Real-time push to user's personal room (after DB commit)
  try {
    const io = getIO();
    if (io) {
      io.to(`user:${userId}`).emit('notification:new', notification);
    }
  } catch (pushErr) {
    console.warn('[Notifications] Socket push failed:', pushErr.message);
  }

  // Conditional email delivery (4 high-value types only)
  if (EMAIL_TYPES.has(type)) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, fullName: true },
      });
      if (user) {
        const { sendGenericNotificationEmail } = await import('./email.service.js');
        if (typeof sendGenericNotificationEmail === 'function') {
          await sendGenericNotificationEmail(user, { title, message, type });
        }
      }
    } catch (emailErr) {
      console.warn('[Notifications] Email delivery failed:', emailErr.message);
    }
  }

  return notification;
};

/**
 * Notify all users of specific roles within a hospital.
 * Used by Phase 13's hospital-notification-on-pickup step.
 */
export const notifyHospitalRoles = async (hospitalId, roles, { type, title, message, relatedId = null }) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        role: { in: roles },
        OR: [
          { hospitalAdmin: { hospitalId } },
          { receptionist: { hospitalId } },
          { pharmacist: { hospitalId } },
          { labStaff: { hospitalId } },
          { ambulanceDriver: { hospitalId } },
        ],
      },
      select: { id: true },
    });

    if (users.length === 0) return [];

    const created = await prisma.notification.createMany({
      data: users.map((u) => ({
        userId: u.id,
        type,
        title,
        message,
        relatedId,
      })),
      skipDuplicates: true,
    });

    // Push to each user's personal room
    try {
      const io = getIO();
      if (io) {
        for (const u of users) {
          const notif = { userId: u.id, type, title, message, relatedId };
          io.to(`user:${u.id}`).emit('notification:new', notif);
        }
      }
    } catch (_) {}

    return created;
  } catch (err) {
    console.warn('[Notifications] Failed to notify hospital roles:', err.message);
    return null;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// TYPED HELPERS — one per event type (Phase 15 §A.3)
// Each helper is a thin wrapper around notify() with a canonical shape.
// Call sites use these instead of raw notify() for consistency and auditability.
// ─────────────────────────────────────────────────────────────────────────────

export const notifyAppointmentConfirmed = async (patientId, appointment) => {
  const doctorName = appointment?.doctor?.user?.fullName || 'your doctor';
  const hospitalName = appointment?.doctor?.hospital?.name || 'the hospital';
  const dateStr = appointment?.scheduledDate
    ? new Date(appointment.scheduledDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';

  return notify(patientId, {
    type: 'APPOINTMENT_CONFIRMED',
    title: 'Appointment Confirmed ✓',
    message: `Your appointment with Dr. ${doctorName} at ${hospitalName}${dateStr ? ` on ${dateStr}` : ''} at ${appointment?.scheduledTime || ''} has been confirmed.`,
    relatedId: appointment?.id || null,
  });
};

export const notifyAppointmentCancelled = async (patientId, appointment) => {
  return notify(patientId, {
    type: 'APPOINTMENT_CANCELLED',
    title: 'Appointment Cancelled',
    message: `Your appointment${appointment?.cancelReason ? ` has been cancelled: ${appointment.cancelReason}` : ' has been cancelled.'}`,
    relatedId: appointment?.id || null,
  });
};

export const notifyQueueYourTurnApproaching = async (patientId, token) => {
  return notify(patientId, {
    type: 'QUEUE_YOUR_TURN_APPROACHING',
    title: 'Almost Your Turn!',
    message: `You are 2 patients away from being called. Please make your way to the waiting area now.`,
    relatedId: token?.id || null,
  });
};

export const notifyQueueYourTurn = async (patientId, token) => {
  return notify(patientId, {
    type: 'QUEUE_YOUR_TURN',
    title: "It's Your Turn!",
    message: `Token #${token?.tokenNumber || ''} — please proceed to the doctor's consultation room now.`,
    relatedId: token?.id || null,
  });
};

export const notifyConsultationCompleted = async (patientId, consultation) => {
  const doctorName = consultation?.doctor?.user?.fullName || 'your doctor';
  return notify(patientId, {
    type: 'CONSULTATION_COMPLETED',
    title: 'Consultation Complete',
    message: `Your consultation with Dr. ${doctorName} is complete. Check your prescriptions and follow-up instructions.`,
    relatedId: consultation?.id || null,
  });
};

export const notifyPharmacyStatusChanged = async (patientId, order) => {
  const statusMessages = {
    CONFIRMED: 'Your pharmacy order has been confirmed by the pharmacist. Payment is required to begin preparation.',
    PREPARING: 'Payment received! Your medicines are now being prepared by the pharmacist.',
    PACKED: 'Your medicines are packed and will be ready for collection shortly.',
    READY: '✅ Your medicines are ready for pickup at the pharmacy counter. Please collect at your earliest convenience.',
    COMPLETED: 'Your pharmacy order is complete. Thank you! Stay healthy 💊',
    CANCELLED: 'Your pharmacy order has been cancelled. Please contact the pharmacy for assistance.',
  };
  return notify(patientId, {
    type: 'PHARMACY_ORDER_UPDATE',
    title: `Pharmacy Order — ${order?.status || 'Updated'}`,
    message: statusMessages[order?.status] || `Your pharmacy order status has been updated to ${order?.status}.`,
    relatedId: order?.id || null,
  });
};

export const notifyPaymentResult = async (patientId, { bill, success }) => {
  return notify(patientId, {
    type: 'PAYMENT_RESULT',
    title: success ? 'Payment Successful ✓' : 'Payment Failed ✗',
    message: success
      ? `Payment of ₹${Number(bill?.total || 0).toFixed(2)} confirmed. Your receipt is available in Billing & Payments.`
      : `Your payment of ₹${Number(bill?.total || 0).toFixed(2)} could not be processed. Please try again.`,
    relatedId: bill?.id || null,
  });
};

export const notifyBillGenerated = async (patientId, bill) => {
  return notify(patientId, {
    type: 'BILL_GENERATED',
    title: 'New Bill Generated',
    message: `A bill of ₹${Number(bill?.total || 0).toFixed(2)} has been generated. Complete payment to proceed.`,
    relatedId: bill?.id || null,
  });
};

export const notifyPassportAccessChanged = async (patientId, doctorOrHospitalName, granted) => {
  return notify(patientId, {
    type: 'PASSPORT_ACCESS_CHANGED',
    title: granted ? 'Health Passport Access Granted' : 'Health Passport Access Revoked',
    message: granted
      ? `You have granted ${doctorOrHospitalName} access to your Health Passport.`
      : `Access to your Health Passport has been revoked for ${doctorOrHospitalName}.`,
    relatedId: null,
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 17: Lab + Pharmacy Granular Notification Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Notify patient when a doctor orders lab tests during consultation.
 * Triggered immediately after LabRequest creation in labRequests.service.js.
 */
export const notifyLabRequestCreated = async (patientId, { labRequest, doctorName }) => {
  const testNames = labRequest?.items?.map(i => i.testName).join(', ') || 'lab tests';
  const count = labRequest?.items?.length || 0;
  return notify(patientId, {
    type: 'LAB_REQUEST_CREATED',
    title: '🔬 Lab Tests Ordered',
    message: `Dr. ${doctorName} has ordered ${count} lab test${count !== 1 ? 's' : ''}: ${testNames}. Please visit the hospital lab / billing section to proceed.`,
    relatedId: labRequest?.id || null,
  });
};

/**
 * Notify patient when lab staff confirms the test panel and creates a bill.
 * Triggered after confirmLabRequest in labFulfillment.service.js.
 */
export const notifyLabBillGenerated = async (patientId, { labRequest, totalAmount }) => {
  return notify(patientId, {
    type: 'LAB_BILL_GENERATED',
    title: '💳 Lab Test Bill Ready',
    message: `Your lab test${(labRequest?.items?.length || 0) !== 1 ? 's have' : ' has'} been confirmed by the lab. A bill of ₹${Number(totalAmount || 0).toFixed(2)} is ready. Please complete payment in Billing & Payments to proceed.`,
    relatedId: labRequest?.id || null,
  });
};

/**
 * Notify patient to submit their sample after payment is confirmed.
 * Triggered after onBillPaid in labFulfillment.service.js.
 */
export const notifyLabSampleRequested = async (patientId, labRequest) => {
  const testNames = labRequest?.items?.map(i => i.testName).join(', ') || 'lab tests';
  return notify(patientId, {
    type: 'LAB_SAMPLE_REQUESTED',
    title: '🧪 Please Submit Your Sample',
    message: `Payment confirmed! Please visit the hospital laboratory now to submit your sample for: ${testNames}.`,
    relatedId: labRequest?.id || null,
  });
};

/**
 * Notify patient that their lab sample is being processed.
 * Triggered when lab staff advances status to PROCESSING in labFulfillment.service.js.
 */
export const notifyLabProcessing = async (patientId, labRequest) => {
  const testNames = labRequest?.items?.map(i => i.testName).join(', ') || 'lab tests';
  return notify(patientId, {
    type: 'LAB_PROCESSING',
    title: '⚗️ Sample Being Processed',
    message: `Your sample for ${testNames} is now being processed in the laboratory. Results will be uploaded shortly.`,
    relatedId: labRequest?.id || null,
  });
};

/**
 * Notify patient when the doctor creates a prescription during consultation.
 * Triggered after createPrescription in prescriptions.service.js.
 */
export const notifyPrescriptionCreated = async (patientId, { prescription, doctorName }) => {
  const count = prescription?.items?.length || 0;
  return notify(patientId, {
    type: 'PRESCRIPTION_CREATED',
    title: '💊 Prescription Ready',
    message: `Dr. ${doctorName} has prescribed ${count} medication${count !== 1 ? 's' : ''} for you. Check your Prescriptions tab and visit the pharmacy to order your medicines.`,
    relatedId: prescription?.id || null,
  });
};

/**
 * Notify patient when pharmacist confirms the order and creates a billing request.
 * Triggered after pharmacistMatchAndConfirm in pharmacyOrders.service.js.
 */
export const notifyPharmacyBillGenerated = async (patientId, { order, totalAmount }) => {
  return notify(patientId, {
    type: 'PHARMACY_BILL_GENERATED',
    title: '💳 Pharmacy Bill Ready',
    message: `Your pharmacy order has been confirmed. A bill of ₹${Number(totalAmount || 0).toFixed(2)} is ready. Please complete payment in Billing & Payments to begin preparation of your medicines.`,
    relatedId: order?.id || null,
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// RETRIEVAL HELPERS — used by controllers
// ─────────────────────────────────────────────────────────────────────────────

export const getMyNotifications = async (userId, { page = 1, limit = 20, unreadOnly = false } = {}) => {
  const where = { userId, ...(unreadOnly && { isRead: false }) };
  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);
  return { notifications, total, page, limit, unreadCount };
};

export const markNotificationRead = async (notificationId, userId) => {
  const notif = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!notif) throw new Error('Notification not found.');
  if (notif.userId !== userId) throw new Error('Forbidden: not your notification.');
  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
};

export const markAllNotificationsRead = async (userId) => {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 16: Online Consultation Notification Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Notify patient that their online consultation appointment is confirmed.
 * Uses ONLINE_CONSULTATION_CONFIRMED type — included in email subset.
 */
export const notifyOnlineConsultationConfirmed = async (patientId, appointment) => {
  const date = appointment.scheduledDate instanceof Date
    ? appointment.scheduledDate.toISOString().split('T')[0]
    : appointment.scheduledDate;
  return notify(patientId, {
    type: 'ONLINE_CONSULTATION_CONFIRMED',
    title: 'Online Consultation Confirmed',
    message: `Your online consultation is confirmed for ${date} at ${appointment.scheduledTime}.`,
    relatedId: appointment.id,
  });
};

/**
 * Notify that a session is about to start (can be called from a scheduler or REST trigger).
 */
export const notifyOnlineSessionStarting = async (patientId, appointment) => {
  return notify(patientId, {
    type: 'ONLINE_SESSION_STARTING',
    title: 'Your Consultation is Starting',
    message: 'Your doctor is ready. Please join the video consultation now.',
    relatedId: appointment.id,
  });
};

/**
 * Notify patient that the doctor has started the video session.
 */
export const notifyOnlineSessionStarted = async (patientId, appointment) => {
  return notify(patientId, {
    type: 'ONLINE_SESSION_STARTED',
    title: 'Video Consultation Started',
    message: 'Your video consultation has started. Join now.',
    relatedId: appointment.id,
  });
};

/**
 * Notify patient that the online consultation is complete.
 */
export const notifyOnlineSessionCompleted = async (patientId, consultationId) => {
  return notify(patientId, {
    type: 'ONLINE_SESSION_COMPLETED',
    title: 'Consultation Completed',
    message: 'Your online consultation is complete. Your prescription will be available shortly.',
    relatedId: consultationId,
  });
};
