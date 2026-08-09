/**
 * services/queue.service.js — Queue management API calls.
 */

import api from './api';

export const getDoctorQueue = (doctorId, date) =>
  api.get(`/queue/doctor/${doctorId}`, { params: { date } });

export const getMyQueuePosition = (appointmentId) =>
  api.get(`/queue/my-position/${appointmentId}`);

export const callNext = () =>
  api.post('/queue/call-next');

export const startConsultation = (tokenId) =>
  api.post(`/queue/${tokenId}/start`);

export const completeConsultation = (tokenId) =>
  api.post(`/queue/${tokenId}/complete`);

export const skipPatient = (tokenId) =>
  api.post(`/queue/${tokenId}/skip`);

export const requeueSkipped = (tokenId) =>
  api.post(`/queue/${tokenId}/requeue`);
