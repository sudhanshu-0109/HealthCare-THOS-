/**
 * services/availability.service.js — Doctor availability & slots API calls.
 */

import api from './api';

export const getSlots = (doctorId, date) =>
  api.get(`/availability/${doctorId}/slots`, { params: { date } });

export const getDoctorAvailability = (doctorId) =>
  api.get(`/availability/${doctorId}`);

export const createAvailability = (data) =>
  api.post('/availability', data);

export const updateAvailability = (id, data) =>
  api.put(`/availability/${id}`, data);

export const deleteAvailability = (id) =>
  api.delete(`/availability/${id}`);
