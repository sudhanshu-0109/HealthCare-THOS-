/**
 * services/prescriptions.service.js — Prescription creation and retrieval (Phase 8).
 */

import prisma from '../prisma/client.js';
import { ApiError } from '../utils/ApiError.js';
import { addTimelineEvent } from './passport.service.js';

const PRESCRIPTION_SELECT = {
  id: true,
  consultationId: true,
  doctorId: true,
  patientId: true,
  hospitalId: true,
  generalInstructions: true,
  createdAt: true,
  items: {
    select: {
      id: true,
      medicineName: true,
      dosage: true,
      frequency: true,
      durationDays: true,
      instructions: true,
    },
  },
};

/**
 * Create a prescription for a consultation.
 * A consultation can only have one prescription — enforced by @unique on consultationId.
 */
export const createPrescription = async (consultationId, { generalInstructions, items = [] }, doctorId) => {
  const consultation = await prisma.consultation.findUnique({
    where: { id: consultationId },
    include: { doctor: { include: { user: true } } },
  });
  if (!consultation) throw ApiError.notFound('Consultation not found.');
  if (consultation.doctorId !== doctorId) throw ApiError.forbidden('Not your consultation.');

  if (!items || items.length === 0) {
    throw ApiError.badRequest('At least one prescription item is required.');
  }

  const existing = await prisma.prescription.findUnique({ where: { consultationId } });
  if (existing) throw ApiError.conflict('A prescription already exists for this consultation.');

  const prescription = await prisma.$transaction(async (tx) => {
    return tx.prescription.create({
      data: {
        consultationId,
        doctorId,
        patientId: consultation.patientId,
        hospitalId: consultation.hospitalId,
        generalInstructions: generalInstructions || null,
        items: {
          create: items.map((item) => ({
            medicineName: item.medicineName,
            dosage: item.dosage,
            frequency: item.frequency,
            durationDays: item.durationDays,
            instructions: item.instructions || null,
          })),
        },
      },
      select: PRESCRIPTION_SELECT,
    });
  });

  // Timeline event — best-effort
  try {
    const doctorName = consultation.doctor?.user?.fullName || 'Doctor';
    await addTimelineEvent(consultation.patientId, {
      eventType: 'PRESCRIPTION',
      sourceId: prescription.id,
      title: `Prescription from Dr. ${doctorName}`,
      description: `${items.length} medication(s) prescribed`,
      eventDate: new Date(),
    });
  } catch (err) {
    console.warn('[PrescriptionsService] Failed to write PRESCRIPTION timeline event:', err.message);
  }

  return prescription;
};

/**
 * Get a prescription by ID.
 * Patient: own prescriptions only.
 * Doctor: own prescriptions + (via consent) others.
 */
export const getPrescription = async (prescriptionId, requesterId, requesterRole) => {
  const prescription = await prisma.prescription.findUnique({
    where: { id: prescriptionId },
    select: PRESCRIPTION_SELECT,
  });
  if (!prescription) throw ApiError.notFound('Prescription not found.');

  if (requesterRole === 'PATIENT' && prescription.patientId !== requesterId) {
    throw ApiError.forbidden('Not your prescription.');
  }
  if (requesterRole === 'DOCTOR' && prescription.doctorId !== requesterId) {
    // Could check consent here — for Phase 8 scope: own prescriptions only
    throw ApiError.forbidden('Not your prescription.');
  }

  return prescription;
};

/**
 * Get all prescriptions for a patient.
 */
export const getMyPrescriptions = async (patientId) => {
  return prisma.prescription.findMany({
    where: { patientId },
    select: PRESCRIPTION_SELECT,
    orderBy: { createdAt: 'desc' },
  });
};
