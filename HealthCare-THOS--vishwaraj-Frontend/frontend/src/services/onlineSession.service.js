/**
 * services/onlineSession.service.js — Frontend API calls for online session lifecycle (Phase 16).
 */

import api from './api';

/** Get session details (patient or doctor). */
export const getSession = (appointmentId) =>
  api.get(`/online-sessions/${appointmentId}`);

/** Patient or doctor joins the waiting room. */
export const joinSession = (appointmentId) =>
  api.post(`/online-sessions/${appointmentId}/join`);

/** Doctor starts the call. */
export const startSession = (appointmentId) =>
  api.post(`/online-sessions/${appointmentId}/start`);

/** Doctor ends the call. */
export const endSession = (appointmentId, reason = null) =>
  api.post(`/online-sessions/${appointmentId}/end`, { reason });

/** Doctor dashboard stats for online appointments. */
export const getDoctorOnlineStats = () =>
  api.get('/online-sessions/doctor/stats');
