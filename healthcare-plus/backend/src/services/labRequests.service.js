/**
 * services/labRequests.service.js — Laboratory request creation (Phase 8).
 */

import prisma from '../prisma/client.js';
import { ApiError } from '../utils/ApiError.js';
import { addTimelineEvent } from './passport.service.js';
import { createBillAndInitiatePayment } from './billing.service.js';

const LAB_REQUEST_SELECT = {
  id: true,
  consultationId: true,
  doctorId: true,
  patientId: true,
  hospitalId: true,
  priority: true,
  notes: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  items: {
    select: {
      id: true,
      testName: true,
      estimatedPrice: true,
    },
  },
  reports: true,
};

/**
 * Create a lab request for a consultation.
 */
export const createLabRequest = async (consultationId, { priority, notes, items = [] }, doctorId) => {
  const consultation = await prisma.consultation.findUnique({
    where: { id: consultationId },
    include: { doctor: { include: { user: true } } },
  });
  if (!consultation) throw ApiError.notFound('Consultation not found.');
  if (consultation.doctorId !== doctorId) throw ApiError.forbidden('Not your consultation.');

  if (!items || items.length === 0) {
    throw ApiError.badRequest('At least one lab test must be requested.');
  }

  const labRequest = await prisma.$transaction(async (tx) => {
    return tx.labRequest.create({
      data: {
        consultationId,
        doctorId,
        patientId: consultation.patientId,
        hospitalId: consultation.hospitalId,
        priority: priority || 'ROUTINE',
        notes: notes || null,
        status: 'PENDING',
        items: {
          create: items.map((item) => ({
            testName: item.testName,
            estimatedPrice: item.estimatedPrice || null,
          })),
        },
      },
      select: LAB_REQUEST_SELECT,
    });
  });

  // Timeline event
  try {
    const doctorName = consultation.doctor?.user?.fullName || 'Doctor';
    await addTimelineEvent(consultation.patientId, {
      eventType: 'LAB_REQUEST', // Ensure this exists in TimelineEventType
      sourceId: labRequest.id,
      title: `Lab Request from Dr. ${doctorName}`,
      description: `${items.length} test(s) ordered`,
      eventDate: new Date(),
    });
  } catch (err) {
    console.warn('[LabRequestsService] Failed to write LAB_REQUEST timeline event:', err.message);
  }

  return labRequest;
};

/**
 * Get a lab request by ID with default-deny authorization.
 * PATIENT: own only. DOCTOR: own only. LAB_STAFF/HOSPITAL_ADMIN: same-hospital.
 * SUPER_ADMIN: any. All other roles: denied.
 */
export const getLabRequest = async (labRequestId, requesterId, requesterRole, requesterHospitalId) => {
  const labRequest = await prisma.labRequest.findUnique({
    where: { id: labRequestId },
    select: LAB_REQUEST_SELECT,
  });
  if (!labRequest) throw ApiError.notFound('Lab request not found.');

  if (requesterRole === 'PATIENT') {
    if (labRequest.patientId !== requesterId) throw ApiError.forbidden('Not your lab request.');
  } else if (requesterRole === 'SUPER_ADMIN') {
    // Cross-hospital read allowed.
  } else if (requesterRole === 'DOCTOR') {
    const doctor = await prisma.doctor.findUnique({ where: { userId: requesterId }, select: { id: true } });
    if (!doctor || labRequest.doctorId !== doctor.id) throw ApiError.forbidden('Not your lab request.');
  } else if (requesterRole === 'LAB_STAFF' || requesterRole === 'HOSPITAL_ADMIN') {
    if (!requesterHospitalId || labRequest.hospitalId !== requesterHospitalId) {
      throw ApiError.forbidden('Lab request does not belong to your hospital.');
    }
  } else {
    throw ApiError.forbidden('You are not permitted to view this lab request.');
  }

  return labRequest;
};

/**
 * Get all lab requests for a patient.
 */
export const getMyLabRequests = async (patientId) => {
  return prisma.labRequest.findMany({
    where: { patientId },
    select: LAB_REQUEST_SELECT,
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * Patient accepts a lab request and initiates payment (must happen before sample collection).
 */
export const acceptLabRequestByPatient = async (labRequestId, patientId) => {
  const labRequest = await prisma.labRequest.findUnique({
    where: { id: labRequestId },
    include: { items: true },
  });

  if (!labRequest) throw ApiError.notFound('Lab request not found.');
  if (labRequest.patientId !== patientId) throw ApiError.forbidden('Not your lab request.');
  if (labRequest.status !== 'PENDING') {
    throw ApiError.badRequest(`Cannot accept lab request in status: ${labRequest.status}`);
  }

  const missingPrices = labRequest.items.filter((item) => item.estimatedPrice == null);
  if (missingPrices.length > 0) {
    throw ApiError.badRequest('Test prices are not available yet. Please contact the hospital.');
  }

  await prisma.labRequest.update({
    where: { id: labRequestId },
    data: { status: 'CONFIRMED' },
  });

  const billingResult = await createBillAndInitiatePayment({
    patientId,
    hospitalId: labRequest.hospitalId,
    sourceType: 'LAB_REQUEST',
    sourceId: labRequestId,
    items: labRequest.items.map((item) => ({
      description: item.testName,
      quantity: 1,
      unitPrice: Number(item.estimatedPrice),
    })),
  });

  return { labRequestId, ...billingResult };
};
