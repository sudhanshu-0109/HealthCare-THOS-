/**
 * services/payments.service.js — Payment verification API calls.
 */

import api from './api';

export const verifyPayment = (data) =>
  api.post('/payments/verify', data);
