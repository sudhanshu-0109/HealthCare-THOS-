import { asyncHandler as catchAsync } from '../utils/asyncHandler.js';
import * as prescriptionsService from '../services/prescriptions.service.js';
import prisma from '../prisma/client.js';

const getDoctorId = async (userId) => {
  const doctor = await prisma.doctor.findUnique({ where: { userId }, select: { id: true } });
  if (!doctor) throw { status: 403, message: 'No doctor profile found for this user.' };
  return doctor.id;
};

export const createPrescription = catchAsync(async (req, res) => {
  const doctorId = await getDoctorId(req.user.id);
  const prescription = await prescriptionsService.createPrescription(
    req.body.consultationId,
    {
      generalInstructions: req.body.generalInstructions,
      items: req.body.items
    },
    doctorId
  );
  res.status(201).json({ success: true, data: prescription });
});

export const getPrescription = catchAsync(async (req, res) => {
  const prescription = await prescriptionsService.getPrescription(
    req.params.id,
    req.user.id,
    req.user.role,
    req.user.hospitalId
  );
  res.json({ success: true, data: prescription });
});

export const getMyPrescriptions = catchAsync(async (req, res) => {
  const prescriptions = await prescriptionsService.getMyPrescriptions(req.user.id);
  res.json({ success: true, data: { prescriptions } });
});
