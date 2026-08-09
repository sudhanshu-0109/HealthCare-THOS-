import api from './api';

export const createLabRequest = (consultationId, { priority, notes, items }) =>
  api.post('/lab-requests', { consultationId, priority, notes, items });

export const getLabRequest = (id) =>
  api.get(`/lab-requests/${id}`);

export const getMyLabRequests = () =>
  api.get('/lab-requests/my');
