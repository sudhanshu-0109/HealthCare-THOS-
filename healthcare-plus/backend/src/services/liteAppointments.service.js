/**
 * services/liteAppointments.service.js — Lite appointment booking (Phase 11 + Phase 12 billing).
 * Lite appointments use fractional queue tokens (e.g. 15.5) to slot between regular tokens.
 */

import prisma from '../prisma/client.js';
import { ApiError } from '../utils/ApiError.js';
import { toMidnightUTC } from './slotGenerator.service.js';
import { createBillAndInitiatePayment } from './billing.service.js';

/**
 * Book a lite appointment for a doctor who accepts them.
 * Creates Appointment(LITE, PENDING_PAYMENT) + Bill via billing service.
 */
export const bookLiteAppointment = async ({ patientId, doctorId, date }) => {
  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId, isActive: true },
    include: { hospital: true, user: true },
  });
  if (!doctor) throw ApiError.notFound('Doctor not found or not active.');
  if (!doctor.acceptsLiteAppointments) {
    throw ApiError.badRequest('This doctor does not accept lite appointments.');
  }
  if (!doctor.liteConsultationFee) {
    throw ApiError.badRequest('Doctor has not set a lite consultation fee.');
  }

  const dateObj = toMidnightUTC(date);

  const appointment = await prisma.appointment.create({
    data: {
      patientId,
      doctorId,
      hospitalId: doctor.hospitalId,
      departmentId: doctor.departmentId,
      scheduledDate: dateObj,
      scheduledTime: null, // Lite appointments have no fixed time slot
      fee: doctor.liteConsultationFee,
      status: 'PENDING_PAYMENT',
      appointmentType: 'LITE',
    },
  });

  const billingResult = await createBillAndInitiatePayment({
    patientId,
    hospitalId: doctor.hospitalId,
    sourceType: 'APPOINTMENT',
    sourceId: appointment.id,
    items: [
      {
        description: `Lite Consultation — Dr. ${doctor.user?.fullName || 'Doctor'} (${doctor.specialization})`,
        quantity: 1,
        unitPrice: Number(doctor.liteConsultationFee),
      },
    ],
  });

  return {
    appointmentId: appointment.id,
    appointmentType: 'LITE',
    ...billingResult,
    doctor: {
      name: doctor.user?.fullName,
      specialization: doctor.specialization,
      hospital: doctor.hospital?.name,
    },
    date,
  };
};

/**
 * onBillPaid — called by billing.service.js after payment success.
 * Inserts a fractional QueueToken to slot the lite patient after the last regular patient today.
 *
 * @param {string} appointmentId
 */
export const onBillPaid = async (appointmentId) => {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
  });

  if (!appointment) {
    console.warn(`[LiteAppointments] onBillPaid: appointment ${appointmentId} not found`);
    return;
  }

  if (appointment.status === 'CONFIRMED') return; // idempotent

  const queueDate = appointment.scheduledDate;

  // Find the last token (integer or fractional) for this doctor today
  const lastToken = await prisma.queueToken.findFirst({
    where: { doctorId: appointment.doctorId, queueDate },
    orderBy: { tokenNumber: 'desc' },
  });

  // Lite tokens are fractional: if lastToken is 5, new lite token is 5.5
  // If lastToken is already fractional (5.5), new one is 6.0 (next integer slot)
  const baseNumber = lastToken ? lastToken.tokenNumber : 0;
  const isLastFractional = baseNumber % 1 !== 0;
  const nextTokenNumber = isLastFractional ? Math.ceil(baseNumber) : baseNumber + 0.5;

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
};
