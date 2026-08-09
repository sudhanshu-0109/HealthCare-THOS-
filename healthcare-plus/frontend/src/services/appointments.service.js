/**
 * services/appointments.service.js — Appointment booking API calls.
 */

import api from './api';

export const initiateBooking = (data) =>
  api.post('/appointments', data);

export const getMyAppointments = (params) =>
  api.get('/appointments/my', { params });

export const getAppointmentById = (id) =>
  api.get(`/appointments/${id}`);

export const cancelAppointment = (id, reason) =>
  api.patch(`/appointments/${id}/cancel`, { reason });
