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

/**
 * Lab staff confirms the test panel and pricing.
 * Advances LabRequest PENDING → CONFIRMED and initiates billing.
 *
 * @param {string} labRequestId
 * @param {string} staffUserId
 * @param {{ finalItems: Array<{ labRequestItemId, description, unitPrice }> }} params
 */
export const confirmLabRequest = async (labRequestId, staffUserId, { finalItems }) => {
  const labRequest = await prisma.labRequest.findUnique({
    where: { id: labRequestId },
    include: { items: true },
  });

  if (!labRequest) throw ApiError.notFound('Lab request not found.');
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
 * Upload lab report and notify patient.
 *
 * @param {string} labRequestId
 * @param {{ reportFileUrl: string, resultSummary?: string, labRequestItemId?: string }} params
 * @param {string} staffUserId
 */
export const uploadReport = async (labRequestId, { reportFileUrl, resultSummary, labRequestItemId }, staffUserId) => {
  const labRequest = await prisma.labRequest.findUnique({ where: { id: labRequestId } });
  if (!labRequest) throw ApiError.notFound('Lab request not found.');

  const allowedStatuses = ['SAMPLE_COLLECTED', 'PROCESSING', 'CONFIRMED'];
  if (!allowedStatuses.includes(labRequest.status)) {
    throw ApiError.badRequest(`Cannot upload report for a lab request in status: ${labRequest.status}`);
  }

  const report = await prisma.$transaction(async (tx) => {
    const r = await tx.labReport.create({
      data: {
        labRequestId,
        labRequestItemId: labRequestItemId || null,
        resultSummary: resultSummary || null,
        reportFileUrl,
        uploadedByUserId: staffUserId,
      },
    });

    // Advance status to COMPLETED when report uploaded
    await tx.labRequest.update({
      where: { id: labRequestId },
      data: { status: 'COMPLETED' },
    });

    return r;
  });

  // Notify patient
  await notify(labRequest.patientId, {
    type: 'LAB_REPORT_READY',
    title: 'Lab Report Ready',
    message: 'Your lab test results are now available. Please check your Lab Reports section.',
    relatedId: labRequestId,
  });

  return report;
};

/**
 * Get lab results for a patient, including reports.
 */
export const getMyLabResults = async (patientId) => {
  return prisma.labRequest.findMany({
    where: { patientId },
    include: {
      items: { include: { labTest: true } },
      reports: true,
    },
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * Get hospital lab requests (lab staff view).
 */
export const getHospitalLabRequests = async (hospitalId, { status } = {}) => {
  return prisma.labRequest.findMany({
    where: { hospitalId, ...(status && { status }) },
    include: {
      items: { include: { labTest: true } },
      reports: true,
    },
    orderBy: { createdAt: 'desc' },
  });
};
