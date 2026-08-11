/**
 * frontend/src/services/labTests.service.js — Lab test catalog API calls.
 */
import api from './api';

export const getLabTests = (hospitalId) =>
  api.get('/lab-tests', { params: hospitalId ? { hospitalId } : {} });

export const createLabTest = (data) =>
  api.post('/lab-tests', data);

export const toggleLabTest = (id) =>
  api.patch(`/lab-tests/${id}/toggle`);

export const updateLabTestPrice = (id, price) =>
  api.put(`/lab-tests/${id}/price`, { price });
