/**
 * frontend/src/services/billing.service.js — Unified billing API service.
 */
import api from './api';

export const initiatePay = (data) => api.post('/billing/pay', data);
export const verifyPay = (data) => api.post('/billing/verify', data);
export const getMyBills = (params) => api.get('/bills/my', { params });
export const getBillById = (id) => api.get(`/bills/${id}`);
export const getBillReceipt = (id) => api.get(`/bills/${id}/receipt`);
export const getRevenue = (params) => api.get('/bills/hospital/revenue', { params });
