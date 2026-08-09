/**
 * services/passport.service.js — Healthcare Passport API calls.
 */

import api from './api';

export const getMyPassport = () =>
  api.get('/passport');

export const updateMyPassport = (data) =>
  api.put('/passport', data);

export const getMyTimeline = (params) =>
  api.get('/passport/timeline', { params });

export const grantConsent = (data) =>
  api.post('/passport/consent', data);

export const revokeConsent = (consentId) =>
  api.delete(`/passport/consent/${consentId}`);

export const getDashboardSummary = () =>
  api.get('/dashboard/summary');
