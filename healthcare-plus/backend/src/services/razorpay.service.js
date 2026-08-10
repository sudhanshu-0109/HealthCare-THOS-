/**
 * services/razorpay.service.js — Razorpay integration.
 * If RAZORPAY_KEY_ID is absent, runs in mock mode and logs a warning.
 * Add credentials to .env to switch to live mode automatically.
 */

import crypto from 'crypto';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

export const isMockMode = !env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET;

if (isMockMode) {
  console.warn('[Razorpay] Running in MOCK MODE. Set RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET in .env for live payments.');
}

let Razorpay;
let razorpayInstance;

if (!isMockMode) {
  try {
    const { default: RazorpayClass } = await import('razorpay');
    Razorpay = RazorpayClass;
    razorpayInstance = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET,
    });
  } catch (err) {
    console.warn('[Razorpay] razorpay package not installed. Falling back to mock mode.');
  }
}

/**
 * Create a Razorpay order.
 * @param {{ amount: number, currency?: string, receipt: string }} params
 * @returns {{ orderId: string, amount: number, currency: string, isMock: boolean }}
 */
export const createOrder = async ({ amount, currency = 'INR', receipt }) => {
  if (isMockMode || !razorpayInstance) {
    // Mock: generate a fake order ID
    const mockOrderId = `mock_order_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    return { orderId: mockOrderId, amount, currency, isMock: true };
  }

  const order = await razorpayInstance.orders.create({
    amount: Math.round(amount * 100), // Razorpay accepts paise
    currency,
    receipt,
  });

  return { orderId: order.id, amount, currency, isMock: false };
};

/**
 * Verify Razorpay payment signature (HMAC-SHA256).
 * In mock mode, always returns true so full flow can be tested without credentials.
 * @param {{ orderId: string, paymentId: string, signature: string }} params
 * @returns {boolean}
 */
export const verifyPaymentSignature = ({ orderId, paymentId, signature }) => {
  if (isMockMode) {
    console.warn('[Razorpay] Mock mode: skipping signature verification.');
    return true;
  }

  if (!orderId || !paymentId || !signature) {
    throw ApiError.badRequest('Missing required payment verification fields.');
  }

  const expectedSignature = crypto
    .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return expectedSignature === signature;
};
