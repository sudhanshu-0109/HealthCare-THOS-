/**
 * services/consultations.service.js — Consultation lifecycle (Phase 8).
 * startConsultation wraps queue.service#startConsultation atomically.
 * completeConsultation wraps queue.service#completeConsultation + timeline event.
 */

import prisma from '../prisma/client.js';
import { ApiError } from '../utils/ApiError.js';
import * as queueService from './queue.service.js';
import { addTimelineEvent, checkDoctorConsent, getOrCreatePassport } from './passport.service.js';
import { notifyConsultationCompleted } from './notifications.service.js';

const CONSULTATION_SELECT = {
  id: true,
  appointmentId: true,
  queueTokenId: true,
  doctorId: true,
  patientId: true,
  hospitalId: true,
  symptoms: true,
  diagnosis: true,
  notes: true,
  treatmentPlan: true,
  status: true,
  startedAt: true,
  completedAt: true,
  doctor: { select: { id: true, specialization: true, user: { select: { fullName: true } } } },
  patient: {
    select: {
      id: true,
      fullName: true,
      email: true,
      patientProfile: { select: { dateOfBirth: true, gender: true, bloodGroup: true, phone: true } },
    },
  },
};

/**
 * Start a consultation — wraps queue startConsultation + Consultation create in a $transaction.
 * Returns: { consultation, passportSummary } OR { consultation, passportAccessDenied: true }
 */
export const startConsultation = async ({ appointmentId, queueTokenId, doctorId }) => {
  // Verify the queue token belongs to this doctor
  const token = await prisma.queueToken.findUnique({
    where: { id: queueTokenId },
    include: { appointment: { include: { patient: true } } },
  });
  if (!token) throw ApiError.notFound('Queue token not found.');
  if (token.doctorId !== doctorId) throw ApiError.forbidden('This queue token does not belong to you.');
  if (token.status !== 'CALLED') throw ApiError.badRequest(`Cannot start consultation: queue token status is ${token.status}`);

  const patientId = token.appointment.patientId;

  // Atomically: update QueueToken to IN_PROGRESS + create Consultation
  const consultation = await prisma.$transaction(async (tx) => {
    await tx.queueToken.update({
      where: { id: queueTokenId },
      data: { status: 'IN_PROGRESS', consultationStartAt: new Date() },
    });

    let consult = await tx.consultation.findUnique({
      where: { appointmentId },
      select: CONSULTATION_SELECT
    });

    if (consult) {
      consult = await tx.consultation.update({
        where: { id: consult.id },
        data: { status: 'IN_PROGRESS', startedAt: new Date(), completedAt: null },
        select: CONSULTATION_SELECT
      });
    } else {
      consult = await tx.consultation.create({
        data: {
          appointmentId,
          queueTokenId,
          doctorId,
          patientId,
          hospitalId: token.hospitalId,
          status: 'IN_PROGRESS',
        },
        select: CONSULTATION_SELECT,
      });
    }
    return consult;
  });

  // Emit queue update outside transaction
  try {
    await queueService.emitQueueUpdateById(doctorId, token.queueDate);
  } catch (_) {}

  // Check passport consent and fetch passport summary if available
  const hasConsent = await checkDoctorConsent(patientId, doctorId);
  if (!hasConsent) {
    return { consultation, passportAccessDenied: true };
  }

  const passport = await prisma.healthcarePassport.findUnique({
    where: { patientId },
    select: { allergies: true, medicalConditions: true, currentMedications: true, notes: true },
  });

  return { consultation, passportSummary: passport };
};

/**
 * Update consultation fields (autosave-safe PATCH).
 */
export const updateConsultation = async (consultationId, { symptoms, diagnosis, notes, treatmentPlan }, doctorId) => {
  const consultation = await prisma.consultation.findUnique({ where: { id: consultationId } });
  if (!consultation) throw ApiError.notFound('Consultation not found.');
  if (consultation.doctorId !== doctorId) throw ApiError.forbidden('Not your consultation.');
  if (consultation.status === 'COMPLETED') throw ApiError.badRequest('Cannot edit a completed consultation.');

  return prisma.consultation.update({
    where: { id: consultationId },
    data: {
      ...(symptoms !== undefined && { symptoms }),
      ...(diagnosis !== undefined && { diagnosis }),
      ...(notes !== undefined && { notes }),
      ...(treatmentPlan !== undefined && { treatmentPlan }),
    },
    select: CONSULTATION_SELECT,
  });
};

/**
 * Complete a consultation — wraps queue completeConsultation + Consultation.status update + timeline event.
 * Phase 16: queueToken update is skipped for online consultations (queueTokenId is null).
 */
export const completeConsultation = async (consultationId, doctorId) => {
  const consultation = await prisma.consultation.findUnique({
    where: { id: consultationId },
    include: { doctor: { include: { user: true } } },
  });
  if (!consultation) throw ApiError.notFound('Consultation not found.');
  if (consultation.doctorId !== doctorId) throw ApiError.forbidden('Not your consultation.');
  if (consultation.status === 'COMPLETED') throw ApiError.badRequest('Consultation is already completed.');

  // Atomically: mark Consultation COMPLETED + Appointment COMPLETED
  // + QueueToken COMPLETED only if one exists (offline consultations)
  const updated = await prisma.$transaction(async (tx) => {
    const c = await tx.consultation.update({
      where: { id: consultationId },
      data: { status: 'COMPLETED', completedAt: new Date() },
      select: CONSULTATION_SELECT,
    });
    if (consultation.queueTokenId) {
      await tx.queueToken.update({
        where: { id: consultation.queueTokenId },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });
    }
    await tx.appointment.update({
      where: { id: consultation.appointmentId },
      data: { status: 'COMPLETED' },
    });
    return c;
  });

  // Timeline event — best-effort post-transaction
  try {
    const doctorName = consultation.doctor?.user?.fullName || 'Doctor';
    await addTimelineEvent(consultation.patientId, {
      eventType: 'CONSULTATION',
      sourceId: consultationId,
      title: `Consultation with Dr. ${doctorName}`,
      eventDate: new Date(),
    });
  } catch (err) {
    console.warn('[ConsultationService] Failed to write CONSULTATION timeline event:', err.message);
  }

  // Emit queue update (only for offline consultations with a queue token)
  try {
    if (consultation.queueTokenId) {
      const token = await prisma.queueToken.findUnique({ where: { id: consultation.queueTokenId } });
      if (token) await queueService.emitQueueUpdateById(doctorId, token.queueDate);
    }
  } catch (_) {}

  // Phase 15: Notify patient consultation is done
  try {
    await notifyConsultationCompleted(consultation.patientId, updated);
  } catch (notifErr) {
    console.warn('[ConsultationService] Failed to send consultation-completed notification:', notifErr.message);
  }

  return updated;
};

/**
 * Get recent consultations for a doctor at their hospital.
 */
export const getRecentConsultations = async (doctorId, hospitalId, limit = 20) => {
  return prisma.consultation.findMany({
    where: { doctorId, hospitalId, status: 'COMPLETED' },
    select: CONSULTATION_SELECT,
    orderBy: { startedAt: 'desc' },
    take: limit,
  });
};

/**
 * Get consultation history for a patient.
 * - Own hospital consultations with this doctor: always visible.
 * - Other hospitals: gated by active passport consent.
 */
export const getConsultationHistory = async (patientId, { doctorId, hospitalId }) => {
  const hasConsent = await checkDoctorConsent(patientId, doctorId);

  const where = hasConsent
    ? { patientId }
    : { patientId, hospitalId }; // own-hospital only without consent

  return prisma.consultation.findMany({
    where,
    select: {
      ...CONSULTATION_SELECT,
      prescription: { select: { id: true, createdAt: true } },
      labRequests: { select: { id: true, status: true, createdAt: true, items: true, reports: true } },
    },
    orderBy: { startedAt: 'desc' },
    take: 50,
  });
};

/**
 * Get a single consultation by appointment ID with passport summary (Phase 16 - online).
 */
export const getConsultationByAppointment = async (appointmentId, doctorId) => {
  const consultation = await prisma.consultation.findUnique({
    where: { appointmentId },
    select: CONSULTATION_SELECT,
  });
  if (!consultation) throw ApiError.notFound('Consultation not found.');
  if (consultation.doctorId !== doctorId) throw ApiError.forbidden('This consultation does not belong to you.');

  const hasConsent = await checkDoctorConsent(consultation.patientId, doctorId);
  if (!hasConsent) {
    return { consultation, passportAccessDenied: true };
  }

  const passport = await prisma.healthcarePassport.findUnique({
    where: { patientId: consultation.patientId },
    include: {
      allergies: true,
      chronicConditions: true,
      immunizations: true,
    },
  });

  return { consultation, passportSummary: passport };
};

