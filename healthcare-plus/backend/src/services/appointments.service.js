/**
 * services/appointments.service.js — Appointment booking flow (Phase 5).
 * Phase 12 refactor: Razorpay is no longer called here.
 * Payment initiation goes through billing.service.js#createBillAndInitiatePayment.
 * Payment confirmation goes through billing.service.js#verifyAndCompletePayment → onBillPaid().
 * Phase 16: Support ONLINE consultationType — online appointments skip QueueToken and create OnlineSession.
 */

import prisma from '../prisma/client.js';
import { ApiError } from '../utils/ApiError.js';
import { getAvailableSlots, toMidnightUTC } from './slotGenerator.service.js';
import { addTimelineEvent } from './passport.service.js';
import { createBillAndInitiatePayment } from './billing.service.js';
import { notifyAppointmentConfirmed, notifyAppointmentCancelled } from './notifications.service.js';
import { recalculateQueueTokens, emitQueueUpdateById } from './queue.service.js';

const APPOINTMENT_SELECT = {
  id: true,
  patientId: true,
  doctorId: true,
  hospitalId: true,
  departmentId: true,
  scheduledDate: true,
  scheduledTime: true,
  fee: true,
  status: true,
  cancelReason: true,
  createdAt: true,
  appointmentType: true,
  consultationType: true,
  doctor: {
    select: {
      id: true,
      specialization: true,
      consultationFee: true,
      liteSlotMinutes: true,
      user: { select: { fullName: true } },
      hospital: { select: { id: true, name: true } },
      department: { select: { id: true, name: true } },
    },
  },
  queueToken: { select: { id: true, tokenNumber: true, status: true } },
  onlineSession: {
    select: {
      id: true,
      roomId: true,
      status: true,
      scheduledStart: true,
      scheduledEnd: true,
      patientJoinedAt: true,
      doctorJoinedAt: true,
      startedAt: true,
      endedAt: true,
    },
  },
};

/**
 * Step 1: Initiate booking — validate slot, create Appointment + Bill + Razorpay order.
 * Phase 12: Payment creation is now delegated to billing.service.js.
 * Phase 16: Accepts consultationType (OFFLINE | ONLINE). Defaults to OFFLINE if not provided.
 */
export const initiateBooking = async ({ patientId, doctorId, scheduledDate, scheduledTime, consultationType = 'OFFLINE' }) => {
  // Validate consultation type
  const validTypes = ['OFFLINE', 'ONLINE'];
  if (!validTypes.includes(consultationType)) {
    throw ApiError.badRequest(`Invalid consultation type. Allowed: ${validTypes.join(', ')}.`);
  }

  const dateObj = toMidnightUTC(scheduledDate);

  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId, isActive: true },
    include: { hospital: true },
  });
  if (!doctor) throw ApiError.notFound('Doctor not found or not active.');

  // Re-validate slot is still available
  const availableSlots = await getAvailableSlots(doctorId, scheduledDate);
  if (!availableSlots.includes(scheduledTime)) {
    throw ApiError.conflict('This slot is no longer available. Please choose another time.');
  }

  // Create appointment (PENDING_PAYMENT) first
  let appointment;
  try {
    appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId,
        hospitalId: doctor.hospitalId,
        departmentId: doctor.departmentId,
        scheduledDate: dateObj,
        scheduledTime,
        fee: doctor.consultationFee,
        status: 'PENDING_PAYMENT',
        appointmentType: 'REGULAR',
        consultationType,
      },
    });
  } catch (err) {
    if (err.code === 'P2002') {
      throw ApiError.conflict('This slot was just booked by someone else. Please choose another time.');
    }
    throw err;
  }

  // Delegate payment initiation to billing service
  const billingResult = await createBillAndInitiatePayment({
    patientId,
    hospitalId: doctor.hospitalId,
    sourceType: 'APPOINTMENT',
    sourceId: appointment.id,
    items: [
      {
        description: `${
          consultationType === 'ONLINE' ? 'Online Consultation' : 'Consultation'
        } — Dr. ${doctor.user?.fullName || 'Doctor'} (${doctor.specialization})`,
        quantity: 1,
        unitPrice: Number(doctor.consultationFee),
      },
    ],
  });

  return {
    appointmentId: appointment.id,
    consultationType,
    ...billingResult,
    doctor: {
      name: doctor.user?.fullName,
      specialization: doctor.specialization,
      hospital: doctor.hospital?.name,
    },
    scheduledDate,
    scheduledTime,
    slotHeldUntil: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  };
};

/**
 * onBillPaid — called by billing.service.js#verifyAndCompletePayment after payment success.
 * Phase 16 extension: branches by consultationType.
 *   OFFLINE — creates QueueToken + emits queue update (original behavior).
 *   ONLINE  — creates OnlineSession + notifies patient.
 *
 * @param {string} appointmentId
 */
export const onBillPaid = async (appointmentId) => {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { doctor: { include: { user: true, hospital: true } } },
  });

  if (!appointment) {
    console.warn(`[Appointments] onBillPaid: appointment ${appointmentId} not found`);
    return;
  }

  if (appointment.status === 'CONFIRMED') {
    // Already confirmed (idempotent)
    return;
  }

  // ── OFFLINE: existing queue-token flow ─────────────────────────────────────
  if (appointment.consultationType !== 'ONLINE') {
    const queueDate = appointment.scheduledDate;

    await prisma.$transaction(async (tx) => {
      await tx.appointment.update({
        where: { id: appointmentId },
        data: { status: 'CONFIRMED' },
      });

      await tx.queueToken.create({
        data: {
          appointmentId,
          doctorId: appointment.doctorId,
          hospitalId: appointment.hospitalId,
          queueDate,
          tokenNumber: 999, // Will be immediately recalculated
          status: 'WAITING',
        },
      });

      await recalculateQueueTokens(appointment.doctorId, queueDate, tx);
    });

    // Real-time update for doctor and queue monitor
    try {
      await emitQueueUpdateById(appointment.doctorId, queueDate);
    } catch (err) {
      console.warn('[Appointments] Failed to emit queue update:', err.message);
    }
  } else {
    // ── ONLINE: create session, no queue token ────────────────────────────────
    // Build scheduledStart from the appointment's date + time string
    const [hours, minutes] = appointment.scheduledTime.split(':').map(Number);
    const scheduledStart = new Date(appointment.scheduledDate);
    scheduledStart.setUTCHours(hours, minutes, 0, 0);

    // Use doctor's slot duration (fall back to 15 mins)
    const slotMinutes = appointment.doctor?.liteSlotMinutes ?? 15;
    const scheduledEnd = new Date(scheduledStart.getTime() + slotMinutes * 60 * 1000);

    await prisma.$transaction(async (tx) => {
      await tx.appointment.update({
        where: { id: appointmentId },
        data: { status: 'CONFIRMED' },
      });

      await tx.onlineSession.create({
        data: {
          appointmentId,
          status: 'SCHEDULED',
          scheduledStart,
          scheduledEnd,
        },
      });
    });

    // Notify doctor about new online appointment
    try {
      const { notifyOnlineAppointmentConfirmed } = await import('./notifications.service.js');
      if (typeof notifyOnlineAppointmentConfirmed === 'function') {
        await notifyOnlineAppointmentConfirmed(appointment.patientId, appointment.doctorId, appointment);
      }
    } catch (notifErr) {
      console.warn('[Appointments] Failed to send online appointment notification:', notifErr.message);
    }
  }

  // Write APPOINTMENT timeline event (all types)
  try {
    const modeTag = appointment.consultationType === 'ONLINE' ? '(Online)' : '';
    await addTimelineEvent(appointment.patientId, {
      eventType: 'APPOINTMENT',
      sourceId: appointmentId,
      title: `Appointment confirmed ${modeTag} — Dr. ${appointment.doctor.user?.fullName}, ${appointment.doctor.specialization}`,
      description: `At ${appointment.doctor.hospital?.name} on ${appointment.scheduledDate.toISOString().split('T')[0]} at ${appointment.scheduledTime}`,
      eventDate: appointment.scheduledDate,
    });
  } catch (timelineErr) {
    console.warn('[Appointments] Failed to write timeline event:', timelineErr.message);
  }

  // Notify patient of confirmed appointment
  try {
    await notifyAppointmentConfirmed(appointment.patientId, appointment);
  } catch (notifErr) {
    console.warn('[Appointments] Failed to send appointment-confirmed notification:', notifErr.message);
  }
};

/**
 * Cancel an appointment (patient-only, own appointments).
 */
export const cancelAppointment = async ({ appointmentId, patientId, reason }) => {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { queueToken: true },
  });

  if (!appointment) throw ApiError.notFound('Appointment not found.');
  if (appointment.patientId !== patientId) throw ApiError.forbidden('Not your appointment.');

  const allowedStatuses = ['PENDING_PAYMENT', 'CONFIRMED'];
  if (!allowedStatuses.includes(appointment.status)) {
    throw ApiError.badRequest(`Cannot cancel an appointment with status: ${appointment.status}`);
  }

  const now = new Date();
  const appointmentDateTime = new Date(appointment.scheduledDate);
  const [h, m] = appointment.scheduledTime.split(':').map(Number);
  appointmentDateTime.setUTCHours(h, m, 0, 0);
  if (appointmentDateTime < now) {
    throw ApiError.badRequest('Cannot cancel a past appointment.');
  }

  const result = await prisma.$transaction(async (tx) => {
    const cancelled = await tx.appointment.update({
      where: { id: appointmentId },
      data: { status: 'CANCELLED', cancelReason: reason || 'Cancelled by patient' },
    });

    if (appointment.queueToken && ['WAITING', 'CALLED'].includes(appointment.queueToken.status)) {
      await tx.queueToken.update({
        where: { id: appointment.queueToken.id },
        data: { status: 'CANCELLED' },
      });
      await recalculateQueueTokens(appointment.doctorId, appointment.scheduledDate, tx);
    }

    return { message: 'Appointment cancelled successfully.', appointment: cancelled };
  });

  if (appointment.queueToken && ['WAITING', 'CALLED'].includes(appointment.queueToken.status)) {
    try {
      await emitQueueUpdateById(appointment.doctorId, appointment.scheduledDate);
    } catch (err) {
      console.warn('[Appointments] Failed to emit queue update:', err.message);
    }
  }

  // Phase 15: Notify patient of cancellation
  try {
    await notifyAppointmentCancelled(patientId, { ...appointment, cancelReason: reason || 'Cancelled by patient' });
  } catch (notifErr) {
    console.warn('[Appointments] Failed to send appointment-cancelled notification:', notifErr.message);
  }

  return { message: result.message };
};

/**
 * Admin cancel — writes audit log. Called by admin endpoints.
 */
export const adminCancelAppointment = async ({ appointmentId, adminUserId, hospitalId, reason }) => {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { queueToken: true },
  });

  if (!appointment) throw ApiError.notFound('Appointment not found.');
  if (appointment.hospitalId !== hospitalId) throw ApiError.forbidden('Appointment does not belong to your hospital.');

  const allowedStatuses = ['PENDING_PAYMENT', 'CONFIRMED'];
  if (!allowedStatuses.includes(appointment.status)) {
    throw ApiError.badRequest(`Cannot cancel an appointment with status: ${appointment.status}`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.appointment.update({
      where: { id: appointmentId },
      data: { status: 'CANCELLED', cancelReason: reason || 'Cancelled by admin' },
    });

    if (appointment.queueToken && ['WAITING', 'CALLED'].includes(appointment.queueToken.status)) {
      await tx.queueToken.update({
        where: { id: appointment.queueToken.id },
        data: { status: 'CANCELLED' },
      });
      await recalculateQueueTokens(appointment.doctorId, appointment.scheduledDate, tx);
    }
  });

  if (appointment.queueToken && ['WAITING', 'CALLED'].includes(appointment.queueToken.status)) {
    try {
      await emitQueueUpdateById(appointment.doctorId, appointment.scheduledDate);
    } catch (err) {
      console.warn('[Appointments] Failed to emit queue update:', err.message);
    }
  }

  // Phase 14: Audit log (fire-and-forget, not in tx)
  try {
    const { recordAction } = await import('./auditLog.service.js');
    await recordAction(hospitalId, adminUserId, 'APPOINTMENT_CANCELLED_BY_ADMIN', 'Appointment', appointmentId, { reason });
  } catch (auditErr) {
    console.warn('[Appointments] Failed to write audit log:', auditErr.message);
  }

  return { message: 'Appointment cancelled by admin.' };
};

/**
 * Get a patient's appointments.
 */
export const getMyAppointments = async (patientId, { status, page = 1, limit = 10 } = {}) => {
  const where = {
    patientId,
    ...(status && { status }),
  };

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      select: APPOINTMENT_SELECT,
      orderBy: [{ scheduledDate: 'desc' }, { scheduledTime: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.appointment.count({ where }),
  ]);

  return { appointments, total, page, limit };
};

/**
 * Get a single appointment by ID with default-deny authorization.
 * PATIENT: own only. DOCTOR: own only. HOSPITAL_ADMIN/RECEPTIONIST: same-hospital.
 * SUPER_ADMIN: any. All other roles: denied.
 */
export const getAppointmentById = async (appointmentId, userId, role, requesterHospitalId) => {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: APPOINTMENT_SELECT,
  });

  if (!appointment) throw ApiError.notFound('Appointment not found.');

  if (role === 'PATIENT') {
    if (appointment.patientId !== userId) {
      throw ApiError.forbidden('You can only view your own appointments.');
    }
  } else if (role === 'SUPER_ADMIN') {
    // Cross-hospital read allowed.
  } else if (role === 'DOCTOR') {
    const doctor = await prisma.doctor.findUnique({ where: { userId }, select: { id: true } });
    if (!doctor || appointment.doctorId !== doctor.id) {
      throw ApiError.forbidden('You can only view your own appointments.');
    }
  } else if (role === 'HOSPITAL_ADMIN' || role === 'RECEPTIONIST') {
    if (!requesterHospitalId || appointment.hospitalId !== requesterHospitalId) {
      throw ApiError.forbidden('Appointment does not belong to your hospital.');
    }
  } else {
    throw ApiError.forbidden('You are not permitted to view this appointment.');
  }

  return appointment;
};
