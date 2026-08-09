import { asyncHandler as catchAsync } from '../utils/asyncHandler.js';
import * as labRequestsService from '../services/labRequests.service.js';
import prisma from '../prisma/client.js';

const getDoctorId = async (userId) => {
  const doctor = await prisma.doctor.findUnique({ where: { userId }, select: { id: true } });
  if (!doctor) throw { status: 403, message: 'No doctor profile found for this user.' };
  return doctor.id;
};

export const createLabRequest = catchAsync(async (req, res) => {
  const doctorId = await getDoctorId(req.user.id);
  const labRequest = await labRequestsService.createLabRequest(
    req.body.consultationId,
    {
      priority: req.body.priority,
      notes: req.body.notes,
      items: req.body.items
    },
    doctorId
  );
  res.status(201).json(labRequest);
});

export const getLabRequest = catchAsync(async (req, res) => {
  const labRequest = await labRequestsService.getLabRequest(
    req.params.id,
    req.user.id,
    req.user.role
  );
  res.json(labRequest);
});

export const getMyLabRequests = catchAsync(async (req, res) => {
  const labRequests = await labRequestsService.getMyLabRequests(req.user.id);
  res.json({ labRequests });
});
