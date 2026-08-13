import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as doctorService from '../services/doctor.service.js';
import prisma from '../prisma/client.js';

export const inviteDoctorSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1),
  departmentId: z.string().uuid(),
  specialization: z.string().min(1),
  experienceYears: z.coerce.number().min(0),
  consultationFee: z.coerce.number().min(0),
});

export const getDoctors = asyncHandler(async (req, res) => {
  const filters = {};
  if (req.query.hospitalId) filters.hospitalId = req.query.hospitalId;
  if (req.query.departmentId) filters.departmentId = req.query.departmentId;
  
  if (req.hospitalId) filters.hospitalId = req.hospitalId;
  
  if (req.user?.role === 'PATIENT') {
    filters.hospital = { isActive: true };
  }
  
  const doctors = await doctorService.getDoctors(filters);
  res.status(200).json({ success: true, data: doctors });
});

export const getDoctorMe = asyncHandler(async (req, res) => {
  const doctor = await prisma.doctor.findUnique({
    where: { userId: req.user.id },
    include: {
      user: { select: { id: true, fullName: true, email: true, role: true } },
      hospital: true,
      department: true,
    },
  });
  if (!doctor) {
    return res.status(404).json({ success: false, message: 'Doctor profile not found' });
  }
  res.status(200).json({ success: true, data: doctor });
});

export const inviteDoctor = asyncHandler(async (req, res) => {
  const result = await doctorService.inviteDoctor(req.hospitalId, req.body, req.user.id);
  res.status(201).json({ success: true, message: 'Doctor invited successfully', data: result });
});
