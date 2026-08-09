import api from './api';

export const startConsultation = (appointmentId, queueTokenId) =>
  api.post('/consultations/start', { appointmentId, queueTokenId });

export const updateConsultation = (id, data) =>
  api.patch(`/consultations/${id}`, data);

export const completeConsultation = (id) =>
  api.post(`/consultations/${id}/complete`);

export const getRecentConsultations = (limit = 20) =>
  api.get('/consultations/recent', { params: { limit } });

export const getConsultationHistory = (patientId) =>
  api.get(`/consultations/history/${patientId}`);
