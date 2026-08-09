import api from './api';

export const createPrescription = (consultationId, { generalInstructions, items }) =>
  api.post('/prescriptions', { consultationId, generalInstructions, items });

export const getPrescription = (id) =>
  api.get(`/prescriptions/${id}`);

export const getMyPrescriptions = () =>
  api.get('/prescriptions/my');
