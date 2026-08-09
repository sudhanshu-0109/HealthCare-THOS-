/**
 * services/appointments.service.js — Appointment booking flow (Phase 5).
 * Phase 12 refactor: Razorpay is no longer called here.
 * Payment initiation goes through billing.service.js#createBillAndInitiatePayment.
 * Payment confirmation goes through billing.service.js#verifyAndCompletePayment → onBillPaid().
 */

import prisma from '../prisma/client.js';
import { ApiError } from '../utils/ApiError.js';
import { getAvailableSlots, toMidnightUTC } from './slotGenerator.service.js';
import { addTimelineEvent } from './passport.service.js';
import { createBillAndInitiatePayment } from './billing.service.js';
import { notifyAppointmentConfirmed, notifyAppointmentCancelled } from './notifications.service.js';

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
  doctor: {
    select: {
      id: true,
      specialization: true,
      consultationFee: true,
      user: { select: { fullName: true } },
      hospital: { select: { id: true, name: true } },
      department: { select: { id: true, name: true } },
    },
  },
  queueToken: { select: { id: true, tokenNumber: true, status: true } },
};

/**
 * Step 1: Initiate booking — validate slot, create Appointment + Bill + Razorpay order.
 * Phase 12: Payment creation is now delegated to billing.service.js.
 */
export const initiateBooking = async ({ patientId, doctorId, scheduledDate, scheduledTime }) => {
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
        description: `Consultation — Dr. ${doctor.user?.fullName || 'Doctor'} (${doctor.specialization})`,
        quantity: 1,
        unitPrice: Number(doctor.consultationFee),
      },
    ],
  });

  return {
    appointmentId: appointment.id,
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
 * Confirms the appointment, creates QueueToken, writes timeline event.
 * This is the extracted logic that used to live in confirmPayment().
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

  const queueDate = appointment.scheduledDate;
  const lastToken = await prisma.queueToken.findFirst({
    where: { doctorId: appointment.doctorId, queueDate },
    orderBy: { tokenNumber: 'desc' },
  });
  const nextTokenNumber = lastToken ? Math.floor(lastToken.tokenNumber) + 1 : 1;

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
        tokenNumber: nextTokenNumber,
        status: 'WAITING',
      },
    });
  });

  // Write APPOINTMENT timeline event (Phase 7 retrofit)
  try {
    await addTimelineEvent(appointment.patientId, {
      eventType: 'APPOINTMENT',
      sourceId: appointmentId,
      title: `Appointment confirmed — Dr. ${appointment.doctor.user?.fullName}, ${appointment.doctor.specialization}`,
      description: `At ${appointment.doctor.hospital?.name} on ${appointment.scheduledDate.toISOString().split('T')[0]} at ${appointment.scheduledTime}`,
      eventDate: appointment.scheduledDate,
    });
  } catch (timelineErr) {
    console.warn('[Appointments] Failed to write timeline event:', timelineErr.message);
  }

  // Phase 15: Notify patient of confirmed appointment
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
    }

    return { message: 'Appointment cancelled successfully.', appointment: cancelled };
  });

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
    }
  });

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
 * Get a single appointment by ID (owner check).
 */
export const getAppointmentById = async (appointmentId, userId, role) => {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: APPOINTMENT_SELECT,
  });

  if (!appointment) throw ApiError.notFound('Appointment not found.');

  if (role === 'PATIENT' && appointment.patientId !== userId) {
    throw ApiError.forbidden('You can only view your own appointments.');
  }

  return appointment;
};
