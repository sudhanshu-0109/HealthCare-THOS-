import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as emergencyService from '../services/emergency.service.js';

export const createEmergencySchema = z.object({
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
  hospitalId: z.string().uuid().optional(),
});

export const updateEmergencySchema = z.object({
  status: z.enum(['REQUESTED', 'SEARCHING', 'DRIVER_ASSIGNED', 'EN_ROUTE', 'PICKED_UP', 'ARRIVED', 'CANCELLED', 'NO_DRIVER_FALLBACK']),
});

export const createEmergencyRequest = asyncHandler(async (req, res) => {
  const request = await emergencyService.createEmergencyRequest(req.user.id, req.body);
  res.status(201).json({ success: true, data: request });
});

export const getEmergencyRequests = asyncHandler(async (req, res) => {
  const requests = await emergencyService.getEmergencyRequests(req.hospitalId);
  res.status(200).json({ success: true, data: requests });
});

export const getActiveEmergency = asyncHandler(async (req, res) => {
  const request = await emergencyService.getActiveEmergency(req.user.id);
  res.status(200).json({ success: true, data: request });
});

export const getMyEmergencies = asyncHandler(async (req, res) => {
  const requests = await emergencyService.getMyEmergencies(req.user.id);
  res.status(200).json({ success: true, data: requests });
});

export const updateEmergencyStatus = asyncHandler(async (req, res) => {
  const request = await emergencyService.updateEmergencyStatus(req.params.id, req.body.status);
  res.status(200).json({ success: true, data: request });
});
