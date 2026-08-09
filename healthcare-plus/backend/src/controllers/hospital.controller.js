import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as hospitalService from '../services/hospital.service.js';
import * as hospitalSearchService from '../services/hospitalSearch.service.js';

export const createHospitalSchema = z.object({
  name: z.string().min(1, 'Hospital name is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  latitude: z.number(),
  longitude: z.number(),
  contactPhone: z.string().min(1, 'Contact phone is required'),
  contactEmail: z.string().email(),
  adminName: z.string().optional(),
  adminEmail: z.string().email().optional(),
  workingHoursOpen: z.string().optional(),
  workingHoursClose: z.string().optional(),
  specialities: z.array(z.string()).optional(),
});

export const getHospitals = asyncHandler(async (req, res) => {
  const hospitals = await hospitalService.getHospitals();
  res.status(200).json({ success: true, data: hospitals });
});

export const searchHospitals = asyncHandler(async (req, res) => {
  const { lat, lng, radius } = req.query;
  if (!lat || !lng) {
    return res.status(400).json({ success: false, message: 'Latitude and longitude are required' });
  }
  const hospitals = await hospitalSearchService.searchHospitals(
    parseFloat(lat), 
    parseFloat(lng), 
    radius ? parseFloat(radius) : 50
  );
  res.status(200).json({ success: true, data: hospitals });
});

export const getHospitalById = asyncHandler(async (req, res) => {
  const hospital = await hospitalService.getHospitalById(req.params.id);
  res.status(200).json({ success: true, data: hospital });
});

export const createHospital = asyncHandler(async (req, res) => {
  const hospital = await hospitalService.createHospitalWithAdmin(req.body, req.user.id);
  res.status(201).json({ success: true, data: hospital });
});

export const updateHospital = asyncHandler(async (req, res) => {
  const hospital = await hospitalService.updateHospital(req.params.id, req.body);
  res.status(200).json({ success: true, data: hospital });
});
