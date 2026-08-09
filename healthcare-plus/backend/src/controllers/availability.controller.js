/**
 * controllers/availability.controller.js — Doctor availability endpoints.
 */

import * as availabilityService from '../services/availability.service.js';
import { getAvailableSlots } from '../services/slotGenerator.service.js';

export const getSlots = async (req, res) => {
  const { doctorId } = req.params;
  const { date } = req.query;
  if (!date) return res.status(400).json({ success: false, message: 'date query param required (YYYY-MM-DD)' });

  const slots = await getAvailableSlots(doctorId, date);
  res.json({ success: true, data: { doctorId, date, slots } });
};

export const getDoctorAvailability = async (req, res) => {
  const { doctorId } = req.params;
  const data = await availabilityService.getDoctorAvailability(doctorId);
  res.json({ success: true, data });
};

export const createAvailability = async (req, res) => {
  const data = await availabilityService.createAvailability(req.body, req.hospitalId);
  res.status(201).json({ success: true, data });
};

export const updateAvailability = async (req, res) => {
  const data = await availabilityService.updateAvailability(req.params.id, req.body, req.hospitalId);
  res.json({ success: true, data });
};

export const deleteAvailability = async (req, res) => {
  await availabilityService.deleteAvailability(req.params.id, req.hospitalId);
  res.json({ success: true, message: 'Availability removed.' });
};
