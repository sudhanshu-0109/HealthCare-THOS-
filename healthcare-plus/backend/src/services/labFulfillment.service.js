/**
 * services/labFulfillment.service.js — Lab request fulfillment (Phase 10 schema, Phase 12 service).
 *
 * Flow:
 *   Doctor writes LabRequest (via consultations.service.js) → LabRequest(PENDING)
 *   Lab staff → confirmLabRequest → CONFIRMED + Bill created (payment pending)
 *   Patient pays → billing.service#onBillPaid → SAMPLE_COLLECTED
 *   Lab staff → uploadReport → LabReport created + Notification sent to patient
 */

import prisma from '../prisma/client.js';
import { ApiError } from '../utils/ApiError.js';
import { createBillAndInitiatePayment } from './billing.service.js';
import { notify } from './notifications.service.js';
import { emitQueueUpdateById } from './queue.service.js';

/**
 * Lab staff confirms the test panel and pricing.
 * Advances LabRequest PENDING → CONFIRMED and initiates billing.
 *
 * @param {string} labRequestId
 * @param {string} staffUserId
 * @param {{ finalItems: Array<{ labRequestItemId, description, unitPrice }> }} params
 * @param {string} hospitalId — lab staff's hospital, for cross-hospital isolation
 */
export const confirmLabRequest = async (labRequestId, staffUserId, { finalItems }, hospitalId) => {
  const labRequest = await prisma.labRequest.findUnique({
    where: { id: labRequestId },
    include: { items: true },
  });

  if (!labRequest) throw ApiError.notFound('Lab request not found.');
  if (labRequest.hospitalId !== hospitalId) throw ApiError.forbidden('Lab request does not belong to your hospital.');
  if (labRequest.status !== 'PENDING') {
    throw ApiError.badRequest(`Cannot confirm lab request in status: ${labRequest.status}`);
  }

  if (!finalItems || finalItems.length === 0) {
    throw ApiError.badRequest('At least one lab item is required.');
  }

  const totalAmount = finalItems.reduce((sum, item) => sum + Number(item.unitPrice), 0);

  await prisma.labRequest.update({
    where: { id: labRequestId },
    data: { status: 'CONFIRMED' },
  });

  // Initiate billing
  const billingResult = await createBillAndInitiatePayment({
    patientId: labRequest.patientId,
    hospitalId: labRequest.hospitalId,
    sourceType: 'LAB_REQUEST',
    sourceId: labRequestId,
    items: finalItems.map((item) => ({
      description: item.description,
      quantity: 1,
      unitPrice: Number(item.unitPrice),
    })),
  });

  return { labRequestId, totalAmount, ...billingResult };
};

/**
 * onBillPaid — called by billing.service.js after payment success.
 * Advances LabRequest from CONFIRMED → SAMPLE_COLLECTED.
 */
export const onBillPaid = async (labRequestId) => {
  const labRequest = await prisma.labRequest.findUnique({ where: { id: labRequestId } });
  if (!labRequest) {
    console.warn(`[LabFulfillment] onBillPaid: labRequest ${labRequestId} not found`);
    return;
  }
  if (labRequest.status !== 'CONFIRMED') return; // idempotent

  await prisma.labRequest.update({
    where: { id: labRequestId },
    data: { status: 'SAMPLE_COLLECTED' },
  });
};

/**
 * Lab staff advances a lab request through its post-payment stages.
 * The only staff-driven transition is SAMPLE_COLLECTED → PROCESSING; earlier
 * transitions are gated by confirm (PENDING → CONFIRMED) and payment
 * (CONFIRMED → SAMPLE_COLLECTED via onBillPaid), and PROCESSING → COMPLETED
 * happens through uploadReport. This replaces the old frontend hack that abused
 * uploadReport to fake status changes.
 *
 * @param {string} labRequestId
 * @param {string} status — target status (must be a valid next state)
 * @param {string} staffUserId
 * @param {string} hospitalId — lab staff's hospital, for cross-hospital isolation
 */
export const advanceLabStatus = async (labRequestId, status, staffUserId, hospitalId) => {
  const validTransitions = {
    SAMPLE_COLLECTED: 'PROCESSING',
  };

  const labRequest = await prisma.labRequest.findUnique({ where: { id: labRequestId } });
  if (!labRequest) throw ApiError.notFound('Lab request not found.');
  if (labRequest.hospitalId !== hospitalId) throw ApiError.forbidden('Lab request does not belong to your hospital.');

  const allowedNext = validTransitions[labRequest.status];
  if (!allowedNext || allowedNext !== status) {
    throw ApiError.badRequest(`Cannot transition lab request from ${labRequest.status} to ${status}.`);
  }

  return prisma.labRequest.update({
    where: { id: labRequestId },
    data: { status },
  });
};

/**
 * Upload lab report and notify patient.
 *
 * @param {string} labRequestId
 * @param {{ reportFileUrl: string, resultSummary?: string, labRequestItemId?: string }} params
 * @param {string} staffUserId
 * @param {string} hospitalId — lab staff's hospital, for cross-hospital isolation
 */
export const uploadReport = async (labRequestId, { reportFileUrl, resultSummary, labRequestItemId }, staffUserId, hospitalId) => {
  const labRequest = await prisma.labRequest.findUnique({
    where: { id: labRequestId },
    include: {
      items: true,
      reports: true,
      consultation: {
        include: { queueToken: true, appointment: true },
      },
    },
  });
  if (!labRequest) throw ApiError.notFound('Lab request not found.');
  if (labRequest.hospitalId !== hospitalId) throw ApiError.forbidden('Lab request does not belong to your hospital.');

  const allowedStatuses = ['SAMPLE_COLLECTED', 'PROCESSING', 'CONFIRMED'];
  if (!allowedStatuses.includes(labRequest.status)) {
    throw ApiError.badRequest(`Cannot upload report for a lab request in status: ${labRequest.status}`);
  }

  const { report, newQueueToken, isAllComplete } = await prisma.$transaction(async (tx) => {
    const r = await tx.labReport.create({
      data: {
        labRequestId,
        labRequestItemId: labRequestItemId || null,
        resultSummary: resultSummary || null,
        reportFileUrl,
        uploadedByUserId: staffUserId,
      },
    });

    const coveredIds = new Set(labRequest.reports.map(r => r.labRequestItemId).filter(Boolean));
    if (labRequestItemId) coveredIds.add(labRequestItemId);
    const isAllComplete = coveredIds.size >= labRequest.items.length;

    let newQueueToken = null;

    if (isAllComplete) {
      // Advance status to COMPLETED when all reports uploaded
      await tx.labRequest.update({
        where: { id: labRequestId },
        data: { status: 'COMPLETED' },
      });

      // Automated Lab Report Follow-up Token Flow (e.g. 10.5)
      if (labRequest.consultation?.queueToken && labRequest.consultation?.appointment) {
        const originalToken = labRequest.consultation.queueToken;
        const originalAppt = labRequest.consultation.appointment;
        const followUpTokenNumber = Math.floor(originalToken.tokenNumber) + 0.5;

        // Check if this sub-token already exists for today to avoid duplicates
        const existingToken = await tx.queueToken.findFirst({
          where: {
            doctorId: originalToken.doctorId,
            queueDate: originalToken.queueDate,
            tokenNumber: followUpTokenNumber,
          },
        });

        if (!existingToken) {
          // Create a LITE appointment (free, no strict scheduling constraints)
          const liteAppt = await tx.appointment.create({
            data: {
              patientId: originalAppt.patientId,
              doctorId: originalAppt.doctorId,
              hospitalId: originalAppt.hospitalId,
              departmentId: originalAppt.departmentId,
              scheduledDate: originalAppt.scheduledDate,
              scheduledTime: originalAppt.scheduledTime, // Group it near original time
              fee: 0,
              status: 'CONFIRMED',
              appointmentType: 'LITE',
            },
          });

          // Create the fractional queue token
          newQueueToken = await tx.queueToken.create({
            data: {
              appointmentId: liteAppt.id,
              doctorId: originalToken.doctorId,
              hospitalId: originalToken.hospitalId,
              queueDate: originalToken.queueDate,
              tokenNumber: followUpTokenNumber,
              status: 'WAITING',
            },
          });
        }
      }
    }

    return { report: r, newQueueToken, isAllComplete };
  });

  // Notify patient
  const itemName = labRequest.items.find(i => i.id === labRequestItemId)?.testName || 'Lab';
  await notify(labRequest.patientId, {
    type: 'LAB_REPORT_READY',
    title: `${itemName} Report Ready`,
    message: isAllComplete 
      ? `All your lab test results are now available. You have been placed back in the queue to review them with your doctor.`
      : `Your ${itemName} result is now available.`,
    relatedId: labRequestId,
  });

  if (newQueueToken) {
    try {
      await emitQueueUpdateById(newQueueToken.doctorId, newQueueToken.queueDate);
    } catch (err) {
      console.warn('[LabFulfillment] Failed to emit queue update for follow-up token:', err.message);
    }
  }

  return report;
};

/**
 * Get lab results for a patient, including reports.
 */
export const getMyLabResults = async (patientId) => {
  const requests = await prisma.labRequest.findMany({
    where: { patientId },
    include: {
      items: true,
      reports: true,
      consultation: {
        include: {
          doctor: { include: { user: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return requests.map((req) => ({
    ...req,
    doctor: req.consultation?.doctor,
  }));
};

/**
 * Get hospital lab requests (lab staff view).
 */
export const getHospitalLabRequests = async (hospitalId, { status } = {}) => {
  const requests = await prisma.labRequest.findMany({
    where: { hospitalId, ...(status && { status }) },
    include: {
      items: true,
      reports: true,
      consultation: {
        include: {
          patient: true,
          doctor: { include: { user: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return requests.map((req) => ({
    ...req,
    patient: req.consultation?.patient,
    doctor: req.consultation?.doctor,
  }));
};
