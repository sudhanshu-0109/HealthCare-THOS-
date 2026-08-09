import api from './api';

export const recommendFollowUp = (consultationId, { recommendedDate, reason }) =>
  api.post('/follow-ups', { consultationId, recommendedDate, reason });

export const bookFollowUp = (id, { scheduledTime }) =>
  api.post(`/follow-ups/${id}/book`, { scheduledTime });

export const dismissFollowUp = (id) =>
  api.post(`/follow-ups/${id}/dismiss`);

export const getMyFollowUps = () =>
  api.get('/follow-ups/my');
