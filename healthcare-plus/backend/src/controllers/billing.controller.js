/**
 * controllers/billing.controller.js — Initiate & verify payments via the unified billing path.
 */

import * as billingService from '../services/billing.service.js';
import { isMockMode } from '../services/razorpay.service.js';
import { env } from '../config/env.js';

/**
 * GET /api/billing/config
 * Public (authenticated) Razorpay checkout config. Only the *publishable* key id
 * is exposed — never the secret. `isMock` lets the client skip the real gateway
 * when no credentials are configured.
 */
export const getConfig = async (req, res) => {
  res.json({
    success: true,
    data: {
      keyId: env.RAZORPAY_KEY_ID || null,
      isMock: isMockMode,
    },
  });
};

/**
 * POST /api/billing/pay
 * Initiate a payment: creates Bill + Razorpay order.
 * sourceType determines which service handles the callback on success.
 */
export const initiatePayment = async (req, res) => {
  const { sourceType, sourceId, hospitalId, items } = req.body;
  const patientId = req.user.id;

  const result = await billingService.createBillAndInitiatePayment({
    patientId,
    hospitalId,
    sourceType,
    sourceId,
    items,
  });

  res.json({ success: true, data: result });
};

/**
 * POST /api/billing/verify
 * Verify payment signature and mark Bill as PAID.
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
