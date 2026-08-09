/**
 * controllers/appointments.controller.js — Appointment booking endpoints.
 */

import * as appointmentsService from '../services/appointments.service.js';

export const initiateBooking = async (req, res) => {
  const { doctorId, scheduledDate, scheduledTime } = req.body;
  const data = await appointmentsService.initiateBooking({
    patientId: req.user.id,
    doctorId,
    scheduledDate,
    scheduledTime,
  });
  res.status(201).json({ success: true, data });
};

export const getMyAppointments = async (req, res) => {
  const { status, page, limit } = req.query;
  const data = await appointmentsService.getMyAppointments(req.user.id, {
    status,
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 10,
  });
  res.json({ success: true, data });
};

export const getAppointmentById = async (req, res) => {
  const data = await appointmentsService.getAppointmentById(
    req.params.id,
    req.user.id,
    req.user.role,
  );
  res.json({ success: true, data });
};

export const cancelAppointment = async (req, res) => {
  const data = await appointmentsService.cancelAppointment({
    appointmentId: req.params.id,
    patientId: req.user.id,
    reason: req.body.reason,
  });
  res.json({ success: true, data });
};
