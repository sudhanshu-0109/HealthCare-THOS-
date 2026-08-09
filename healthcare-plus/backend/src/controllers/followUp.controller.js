import { asyncHandler as catchAsync } from '../utils/asyncHandler.js';
import * as followUpService from '../services/followUp.service.js';
import prisma from '../prisma/client.js';

const getDoctorId = async (userId) => {
  const doctor = await prisma.doctor.findUnique({ where: { userId }, select: { id: true } });
  if (!doctor) throw { status: 403, message: 'No doctor profile found for this user.' };
  return doctor.id;
};

export const recommendFollowUp = catchAsync(async (req, res) => {
  const doctorId = await getDoctorId(req.user.id);
  const recommendation = await followUpService.recommendFollowUp(
    req.body.consultationId,
    {
      recommendedDate: req.body.recommendedDate,
      reason: req.body.reason
    },
    doctorId
  );
  res.status(201).json(recommendation);
});

export const bookFollowUp = catchAsync(async (req, res) => {
  const booking = await followUpService.bookFollowUp(
    req.params.id,
    { scheduledTime: req.body.scheduledTime },
    req.user.id // patientId
  );
  res.json(booking);
});

export const dismissFollowUp = catchAsync(async (req, res) => {
  const followUp = await followUpService.dismissFollowUp(
    req.params.id,
    req.user.id // patientId
  );
  res.json({ followUp });
});

export const getMyFollowUps = catchAsync(async (req, res) => {
  const followUps = await followUpService.getMyFollowUps(req.user.id);
  res.json({ followUps });
});
