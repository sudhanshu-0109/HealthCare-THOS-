/**
 * services/labRequests.service.js — Laboratory request creation (Phase 8).
 */

import prisma from '../prisma/client.js';
import { ApiError } from '../utils/ApiError.js';
import { addTimelineEvent } from './passport.service.js';

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
 * Get a lab request by ID.
 * Patient: own requests only.
 * Doctor: own requests only (for Phase 8).
 */
export const getLabRequest = async (labRequestId, requesterId, requesterRole) => {
  const labRequest = await prisma.labRequest.findUnique({
    where: { id: labRequestId },
    select: LAB_REQUEST_SELECT,
  });
  if (!labRequest) throw ApiError.notFound('Lab request not found.');

  if (requesterRole === 'PATIENT' && labRequest.patientId !== requesterId) {
    throw ApiError.forbidden('Not your lab request.');
  }
  if (requesterRole === 'DOCTOR' && labRequest.doctorId !== requesterId) {
    throw ApiError.forbidden('Not your lab request.');
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
