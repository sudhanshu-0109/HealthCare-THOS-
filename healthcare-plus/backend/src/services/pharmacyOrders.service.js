/**
 * services/pharmacyOrders.service.js — Pharmacy order fulfillment (Phase 9 schema, Phase 12 service).
 *
 * Flow:
 *   Patient (via prescription) → createOrderFromPrescription → PharmacyOrder(PENDING)
 *   Pharmacist → pharmacistMatchAndConfirm → CONFIRMED + Bill created (payment pending)
 *   Patient pays → billing.service#onBillPaid → PREPARING
 *   Pharmacist → advanceStatus → PACKED → READY → COMPLETED
 */

import prisma from '../prisma/client.js';
import { ApiError } from '../utils/ApiError.js';
import { createBillAndInitiatePayment } from './billing.service.js';
import { notifyPharmacyStatusChanged, notifyPharmacyBillGenerated } from './notifications.service.js';

/**
 * Create a pharmacy order from a prescription (triggered after prescription is written).
 */
export const createOrderFromPrescription = async (prescriptionId, hospitalId, patientId) => {
  // Verify prescription exists and belongs to this hospital/patient
  const prescription = await prisma.prescription.findUnique({
    where: { id: prescriptionId },
    include: { items: true, pharmacyOrder: true },
  });

  if (!prescription) throw ApiError.notFound('Prescription not found.');
  if (prescription.hospitalId !== hospitalId) throw ApiError.forbidden('Prescription does not belong to your hospital.');
  if (prescription.patientId !== patientId) throw ApiError.forbidden('Not your prescription.');
  if (prescription.pharmacyOrder) throw ApiError.conflict('A pharmacy order already exists for this prescription.');

  const order = await prisma.pharmacyOrder.create({
    data: {
      prescriptionId,
      patientId,
      hospitalId,
      status: 'PENDING',
      totalAmount: 0,
      items: {
        create: prescription.items.map((item) => ({
          prescriptionItemId: item.id,
          quantity: 1,
        })),
      },
    },
    include: { items: true },
  });

  return order;
};

/**
 * Pharmacist matches prescription items to medicines, computes total, initiates billing.
 * @param {string} orderId
 * @param {string} pharmacistUserId
 * @param {Array<{ prescriptionItemId, medicineId, quantity, unitPrice }>} items
 * @param {string} hospitalId — pharmacist's hospital, for cross-hospital isolation
 */
export const pharmacistMatchAndConfirm = async (orderId, pharmacistUserId, items, hospitalId) => {
  const order = await prisma.pharmacyOrder.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) throw ApiError.notFound('Pharmacy order not found.');
  if (order.hospitalId !== hospitalId) throw ApiError.forbidden('Order does not belong to your hospital.');
  if (order.status !== 'PENDING') {
    throw ApiError.badRequest(`Cannot confirm order in status: ${order.status}`);
  }

  // Compute total
  const totalAmount = items.reduce((sum, item) => sum + Number(item.unitPrice) * (item.quantity || 1), 0);

  // Update order items with medicine matches and pricing
  await prisma.$transaction(async (tx) => {
    for (const item of items) {
      await tx.pharmacyOrderItem.update({
        where: { prescriptionItemId: item.prescriptionItemId },
        data: {
          medicineId: item.medicineId || null,
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice,
          subtotal: Number(item.unitPrice) * (item.quantity || 1),
        },
      });
    }

    await tx.pharmacyOrder.update({
      where: { id: orderId },
      data: { status: 'CONFIRMED', totalAmount },
    });
  });

  // Initiate billing (creates Bill + Payment + Razorpay order)
  const billingResult = await createBillAndInitiatePayment({
    patientId: order.patientId,
    hospitalId: order.hospitalId,
    sourceType: 'PHARMACY_ORDER',
    sourceId: orderId,
    items: items.map((item) => ({
      description: item.medicineName || `Medicine (Qty: ${item.quantity || 1})`,
      quantity: item.quantity || 1,
      unitPrice: Number(item.unitPrice),
    })),
  });

  // Notify patient: bill is ready for payment
  try {
    await notifyPharmacyBillGenerated(order.patientId, { order: { ...order, id: orderId }, totalAmount });
  } catch (notifErr) {
    console.warn('[PharmacyOrders] Failed to send pharmacy-bill-generated notification:', notifErr.message);
  }

  return { orderId, totalAmount, ...billingResult };
};

/**
 * onBillPaid — called by billing.service.js after payment success.
 * Advances PharmacyOrder from CONFIRMED → PREPARING.
 */
export const onBillPaid = async (orderId) => {
  const order = await prisma.pharmacyOrder.findUnique({ where: { id: orderId } });
  if (!order) {
    console.warn(`[PharmacyOrders] onBillPaid: order ${orderId} not found`);
    return;
  }
  if (order.status !== 'CONFIRMED') return; // idempotent

  const updated = await prisma.pharmacyOrder.update({
    where: { id: orderId },
    data: { status: 'PREPARING' },
  });

  // Phase 15: Notify patient their order is being prepared
  try {
    await notifyPharmacyStatusChanged(order.patientId, updated);
  } catch (notifErr) {
    console.warn('[PharmacyOrders] Failed to send status notification:', notifErr.message);
  }
};

/**
 * Advance order status (pharmacist-driven: PREPARING → PACKED → READY → COMPLETED).
 */
export const advanceStatus = async (orderId, status, pharmacistUserId, hospitalId) => {
  const validTransitions = {
    PREPARING: 'COMPLETED',
  };

  const order = await prisma.pharmacyOrder.findUnique({ where: { id: orderId } });
  if (!order) throw ApiError.notFound('Pharmacy order not found.');
  if (order.hospitalId !== hospitalId) throw ApiError.forbidden('Order does not belong to your hospital.');

  const allowedNext = validTransitions[order.status];
  if (!allowedNext || allowedNext !== status) {
    throw ApiError.badRequest(`Cannot transition from ${order.status} to ${status}.`);
  }

  const updated = await prisma.pharmacyOrder.update({
    where: { id: orderId },
    data: { status },
  });

  // Phase 15: Notify patient of status change
  try {
    await notifyPharmacyStatusChanged(updated.patientId, updated);
  } catch (notifErr) {
    console.warn('[PharmacyOrders] Failed to send status notification:', notifErr.message);
  }

  return updated;
};

/**
 * Get a patient's pharmacy orders.
 */
export const getMyOrders = async (patientId) => {
  return prisma.pharmacyOrder.findMany({
    where: { patientId },
    include: { items: { include: { medicine: true } } },
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * Get all pharmacy orders for a hospital (pharmacist view).
 */
export const getHospitalOrders = async (hospitalId, { status } = {}) => {
  return prisma.pharmacyOrder.findMany({
    where: { hospitalId, ...(status && { status }) },
    include: {
      items: { include: { medicine: true, prescriptionItem: true } },
      prescription: { select: { patientId: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};
