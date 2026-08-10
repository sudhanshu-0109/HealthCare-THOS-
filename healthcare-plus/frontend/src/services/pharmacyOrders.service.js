/**
 * frontend/src/services/pharmacyOrders.service.js — Pharmacist order fulfillment API calls.
 */
import api from './api';

export const createPharmacyOrder = ({ prescriptionId, hospitalId }) =>
  api.post('/pharmacy-orders', { prescriptionId, hospitalId });

export const getMyOrders = () =>
  api.get('/pharmacy-orders/my');

export const getHospitalOrders = (params) =>
  api.get('/pharmacy-orders/hospital', { params });

export const confirmPharmacyOrder = (id, items) =>
  api.post(`/pharmacy-orders/${id}/confirm`, { items });

export const advancePharmacyOrderStatus = (id, status) =>
  api.patch(`/pharmacy-orders/${id}/status`, { status });

// Alias used in pharmacy Dashboard
export const updateOrderStatus = (id, status) =>
  api.patch(`/pharmacy-orders/${id}/status`, { status });

