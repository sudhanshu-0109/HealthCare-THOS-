/**
 * frontend/src/services/pharmacyOrders.service.js — Pharmacist order fulfillment API calls.
 */
import api from './api';

export const getHospitalOrders = (params) =>
  api.get('/pharmacy-orders/hospital', { params });

export const confirmPharmacyOrder = (id, items) =>
  api.post(`/pharmacy-orders/${id}/confirm`, { items });

export const advancePharmacyOrderStatus = (id, status) =>
  api.patch(`/pharmacy-orders/${id}/status`, { status });
