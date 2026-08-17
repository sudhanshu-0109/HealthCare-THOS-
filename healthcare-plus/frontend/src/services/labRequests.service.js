import api from './api';

/**
 * Create a lab request from a doctor during/after consultation.
 * Backend expects: { consultationId, priority, notes, items: [{ testName, estimatedPrice }] }
 */
export const createLabRequest = (consultationId, { priority = 'ROUTINE', notes = '', items = [] }) =>
  api.post('/lab-requests', { consultationId, priority, notes, items });

export const getLabRequest = (id) =>
  api.get(`/lab-requests/${id}`);

export const getMyLabRequests = () =>
  api.get('/lab-requests/my');

export const acceptLabRequest = (id) =>
  api.post(`/lab-requests/${id}/accept`);

export const bookLabFollowUp = (id) =>
  api.post(`/lab-fulfillment/${id}/book-follow-up`);

