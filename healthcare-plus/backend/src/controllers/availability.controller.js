/**
 * controllers/availability.controller.js — Doctor availability endpoints.
 */

import * as availabilityService from '../services/availability.service.js';
import { getSlotsWithStatus } from '../services/slotGenerator.service.js';

export const getSlots = async (req, res) => {
  const { doctorId } = req.params;
  const { date } = req.query;
  if (!date) return res.status(400).json({ success: false, message: 'date query param required (YYYY-MM-DD)' });

  const allSlots = await getSlotsWithStatus(doctorId, date);
  // `slots` (available-only strings) retained for backward compatibility;
  // `allSlots` carries every slot with a booked flag for strike-through UI.
  const slots = allSlots.filter((s) => !s.booked).map((s) => s.time);
  res.json({ success: true, data: { doctorId, date, slots, allSlots } });
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
