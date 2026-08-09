/**
 * controllers/payments.controller.js — Phase 12 refactor: delegates to billing.service.js.
 *
 * The old direct Appointment → Payment link is replaced by Bill → Payment.
 * verifyPayment now receives billId instead of appointmentId.
 */

import * as billingService from '../services/billing.service.js';

/**
 * POST /api/payments/verify
 * Patient verifies their payment after Razorpay checkout completes.
 */
export const verifyPayment = async (req, res) => {
  const { billId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

  const result = await billingService.verifyAndCompletePayment({
    billId,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  });

  res.json({ success: true, data: result });
};

/**
 * Razorpay webhook — signature-verified safety net.
 * Handles cases where the client never called /verify (e.g. browser closed mid-flow).
 * Phase 12: now looks up Bill via Payment.billId instead of Appointment via Payment.appointmentId.
 */
export const razorpayWebhook = async (req, res) => {
  // Acknowledge immediately; process asynchronously
  res.json({ success: true });

  try {
    const event = req.body;
    if (event.event === 'payment.captured') {
      const { order_id, id: paymentId } = event.payload?.payment?.entity || {};
      if (order_id && paymentId) {
        const { default: prisma } = await import('../prisma/client.js');
        // Find the Payment (and its Bill) by razorpayOrderId
        const payment = await prisma.payment.findUnique({
          where: { razorpayOrderId: order_id },
          include: { bill: true },
        });

        if (payment && payment.status === 'CREATED' && payment.bill) {
          // Use 'webhook-verified' signature — verifyAndCompletePayment checks for this sentinel
          await billingService.verifyAndCompletePayment({
            billId: payment.bill.id,
            razorpayOrderId: order_id,
            razorpayPaymentId: paymentId,
            razorpaySignature: 'webhook-verified',
          });
        }
      }
    }
  } catch (err) {
    console.error('[Webhook] Error processing Razorpay webhook:', err);
  }
};
