/**
 * frontend/src/services/medicines.service.js — Medicine catalog API calls.
 */
import api from './api';

export const getMedicines = (hospitalId) =>
  api.get('/medicines', { params: hospitalId ? { hospitalId } : {} });

export const createMedicine = (data) =>
  api.post('/medicines', data);

export const toggleMedicine = (id) =>
  api.patch(`/medicines/${id}/toggle`);
