/**
 * services/billing.service.js — THE single shared payment path (Phase 12).
 *
 * Every payable resource (Appointment, PharmacyOrder, LabRequest) goes through here.
 * razorpay.service.js is reused unchanged; only its callers changed.
 *
 * Two public functions:
 *   createBillAndInitiatePayment — creates Bill + BillItem[] + Razorpay order + Payment(CREATED)
 *   verifyAndCompletePayment     — verifies signature, marks Bill PAID, calls source callback
 */

import prisma from '../prisma/client.js';
import { ApiError } from '../utils/ApiError.js';
import { createOrder, verifyPaymentSignature } from './razorpay.service.js';
import { notifyPaymentResult, notifyBillGenerated } from './notifications.service.js';

// Lazy-load source callbacks to avoid circular imports
const getSourceCallbacks = async () => {
  const [appts, liteAppts, pharmacy, lab] = await Promise.all([
    import('./appointments.service.js'),
    import('./liteAppointments.service.js'),
    import('./pharmacyOrders.service.js'),
    import('./labFulfillment.service.js'),
  ]);
  return {
    APPOINTMENT: appts.onBillPaid,
    LITE_APPOINTMENT: liteAppts.onBillPaid,
    PHARMACY_ORDER: pharmacy.onBillPaid,
    LAB_REQUEST: lab.onBillPaid,
  };
};

/**
 * Step 1: Create a Bill + BillItem[] + Razorpay order + Payment(CREATED).
 *
 * @param {{
 *   patientId: string,
 *   hospitalId: string,
 *   sourceType: 'APPOINTMENT' | 'PHARMACY_ORDER' | 'LAB_REQUEST',
 *   sourceId: string,
 *   items: Array<{ description: string, quantity?: number, unitPrice: number }>
 * }} params
 * @returns {{ billId, razorpayOrderId, amount, currency, keyId, isMock }}
 */
export const createBillAndInitiatePayment = async ({
  patientId,
  hospitalId,
  sourceType,
  sourceId,
  items,
}) => {
  if (!items || items.length === 0) {
    throw ApiError.badRequest('At least one billing item is required.');
  }

  // Compute totals
  const subtotal = items.reduce((sum, item) => {
    const qty = item.quantity ?? 1;
    return sum + Number(item.unitPrice) * qty;
  }, 0);
  const total = subtotal; // discount and tax are 0 in v1 (documented in phase12/decisions.md)

  // Create Razorpay order BEFORE DB transaction (external call — not in tx)
  const receipt = `bill_${patientId.slice(0, 8)}_${Date.now()}`;
  const { orderId, amount, currency, isMock } = await createOrder({
    amount: total,
    currency: 'INR',
    receipt,
  });

  // Create Bill + BillItems + Payment in one transaction
  const bill = await prisma.$transaction(async (tx) => {
    const b = await tx.bill.create({
      data: {
        patientId,
        hospitalId,
        sourceType,
        sourceId,
        subtotal,
        discount: 0,
        tax: 0,
        total,
        status: 'UNPAID',
        items: {
          create: items.map((item) => ({
            description: item.description,
            quantity: item.quantity ?? 1,
            unitPrice: item.unitPrice,
            subtotal: Number(item.unitPrice) * (item.quantity ?? 1),
          })),
        },
      },
    });

    await tx.payment.create({
      data: {
        billId: b.id,
        amount: total,
        currency: 'INR',
        razorpayOrderId: orderId,
        status: 'CREATED',
      },
    });

    return b;
  });

  return {
    billId: bill.id,
    razorpayOrderId: orderId,
    amount: Number(total),
    currency,
    keyId: process.env.RAZORPAY_KEY_ID || null,
    isMock,
  };
};

// NOTE: Source-specific services (labFulfillment, pharmacyOrders) fire their
// own richer notifications AFTER this function returns. The notifyBillGenerated
// call here acts as a guaranteed baseline for all bill types.

/**
 * Step 2: Verify payment signature and mark Bill PAID.
 * Calls the source-specific onBillPaid callback after success.
 *
 * @param {{
 *   billId: string,
 *   razorpayOrderId: string,
 *   razorpayPaymentId: string,
 *   razorpaySignature: string
 * }} params
 */
export const verifyAndCompletePayment = async ({
  billId,
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}) => {
  const bill = await prisma.bill.findUnique({
    where: { id: billId },
    include: {
      payments: { where: { razorpayOrderId } },
    },
  });

  if (!bill) throw ApiError.notFound('Bill not found.');
  if (bill.status === 'PAID') {
    // Idempotent — already paid (e.g. duplicate webhook)
    return { bill, alreadyPaid: true };
  }
  if (bill.status !== 'UNPAID') {
    throw ApiError.badRequest(`Cannot pay a bill with status: ${bill.status}`);
  }

  const payment = bill.payments[0];
  if (!payment) throw ApiError.badRequest('Payment record not found for this order.');

  // Server-side signature verification
  // 'webhook-verified' is a sentinel set by the Razorpay webhook handler,
  // which has already verified the event signature server-side.
  const isWebhookVerified = razorpaySignature === 'webhook-verified';
  const isValid = isWebhookVerified || verifyPaymentSignature({
    orderId: razorpayOrderId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature,
  });

  if (!isValid) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'FAILED', razorpayPaymentId, razorpaySignature },
    });
    // Phase 15: Notify payment failure
    try {
      await notifyPaymentResult(bill.patientId, { bill, success: false });
    } catch (_) {}
    throw ApiError.badRequest('Payment signature verification failed. Please try again.');
  }

  // Mark payment and bill as successful
  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'SUCCESS', razorpayPaymentId, razorpaySignature },
    }),
    prisma.bill.update({
      where: { id: billId },
      data: { status: 'PAID' },
    }),
  ]);

  // Call source-specific onBillPaid callback
  try {
    const callbacks = await getSourceCallbacks();
    const cb = callbacks[bill.sourceType];
    if (cb) {
      await cb(bill.sourceId, billId);
    }
  } catch (cbErr) {
    // Log but don't fail the payment confirmation
    console.error(`[Billing] onBillPaid callback failed for ${bill.sourceType}:`, cbErr.message);
  }

  const updatedBill = await prisma.bill.findUnique({
    where: { id: billId },
    include: { items: true, payments: true },
  });

  // Phase 15: Notify payment success
  try {
    await notifyPaymentResult(bill.patientId, { bill: updatedBill, success: true });
  } catch (_) {}

  return { bill: updatedBill };
};
