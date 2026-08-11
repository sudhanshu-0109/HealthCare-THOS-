/**
 * services/prescriptions.service.js — Prescription creation and retrieval (Phase 8).
 */

import prisma from '../prisma/client.js';
import { ApiError } from '../utils/ApiError.js';
import { addTimelineEvent } from './passport.service.js';
import * as pharmacyOrdersService from './pharmacyOrders.service.js';

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

  // Automatically create a pharmacy order so it shows up in the pharmacist's PENDING tab immediately.
  try {
    await pharmacyOrdersService.createOrderFromPrescription(
      prescription.id, 
      consultation.hospitalId, 
      consultation.patientId
    );
  } catch (err) {
    console.warn('[PrescriptionsService] Failed to auto-create pharmacy order:', err.message);
  }

  return prescription;
};

/**
 * Get a prescription by ID with default-deny authorization.
 * PATIENT: own only. DOCTOR: own only. PHARMACIST/HOSPITAL_ADMIN: same-hospital.
 * SUPER_ADMIN: any. All other roles: denied.
 */
export const getPrescription = async (prescriptionId, requesterId, requesterRole, requesterHospitalId) => {
  const prescription = await prisma.prescription.findUnique({
    where: { id: prescriptionId },
    select: PRESCRIPTION_SELECT,
  });
  if (!prescription) throw ApiError.notFound('Prescription not found.');

  if (requesterRole === 'PATIENT') {
    if (prescription.patientId !== requesterId) throw ApiError.forbidden('Not your prescription.');
  } else if (requesterRole === 'SUPER_ADMIN') {
    // Cross-hospital read allowed.
  } else if (requesterRole === 'DOCTOR') {
    const doctor = await prisma.doctor.findUnique({ where: { userId: requesterId }, select: { id: true } });
    if (!doctor || prescription.doctorId !== doctor.id) throw ApiError.forbidden('Not your prescription.');
  } else if (requesterRole === 'PHARMACIST' || requesterRole === 'HOSPITAL_ADMIN') {
    if (!requesterHospitalId || prescription.hospitalId !== requesterHospitalId) {
      throw ApiError.forbidden('Prescription does not belong to your hospital.');
    }
  } else {
    throw ApiError.forbidden('You are not permitted to view this prescription.');
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
