import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as staffService from '../services/staff.service.js';

export const inviteStaffSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1),
  role: z.enum(['RECEPTIONIST', 'PHARMACIST', 'LAB_STAFF', 'AMBULANCE_DRIVER']),
});

export const getStaff = asyncHandler(async (req, res) => {
  const staff = await staffService.getStaff(req.hospitalId);
  res.status(200).json({ success: true, data: staff });
});

export const inviteStaff = asyncHandler(async (req, res) => {
  const result = await staffService.inviteStaff(req.hospitalId, req.body, req.user.id);
  res.status(201).json({ success: true, message: 'Staff invited successfully', data: result });
});
