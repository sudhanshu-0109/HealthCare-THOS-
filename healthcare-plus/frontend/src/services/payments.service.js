/**
 * services/payments.service.js — Payment verification API calls.
 */

import api from './api';

export const verifyPayment = (data) =>
  api.post('/payments/verify', data);

// Razorpay checkout config (publishable key id + mock flag) for the client widget.
export const getPaymentConfig = () =>
  api.get('/billing/config');
