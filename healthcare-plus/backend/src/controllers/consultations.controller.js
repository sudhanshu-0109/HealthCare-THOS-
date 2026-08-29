import { asyncHandler as catchAsync } from '../utils/asyncHandler.js';
import * as consultationsService from '../services/consultations.service.js';
import prisma from '../prisma/client.js';

const getDoctorId = async (userId) => {
  const doctor = await prisma.doctor.findUnique({ where: { userId }, select: { id: true } });
  if (!doctor) throw { status: 403, message: 'No doctor profile found for this user.' };
  return doctor.id;
};

export const startConsultation = catchAsync(async (req, res) => {
  const doctorId = await getDoctorId(req.user.id);
  const result = await consultationsService.startConsultation({
    appointmentId: req.body.appointmentId,
    queueTokenId: req.body.queueTokenId,
    doctorId
  });
  res.status(201).json({ success: true, data: result });
});

export const updateConsultation = catchAsync(async (req, res) => {
  const doctorId = await getDoctorId(req.user.id);
  const consultation = await consultationsService.updateConsultation(
    req.params.id,
    req.body,
    doctorId
  );
  res.json({ success: true, data: consultation });
});

export const completeConsultation = catchAsync(async (req, res) => {
  const doctorId = await getDoctorId(req.user.id);
  const consultation = await consultationsService.completeConsultation(
    req.params.id,
    doctorId
  );
  res.json({ success: true, data: consultation });
});

export const getRecentConsultations = catchAsync(async (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
  const doctorId = await getDoctorId(req.user.id);
  // Assumes req.user has been populated with hospitalId by middleware if they are a doctor
  const consultations = await consultationsService.getRecentConsultations(
    doctorId,
    req.user.hospitalId,
    limit
  );
  res.json({ success: true, data: consultations });
});

export const getConsultationHistory = catchAsync(async (req, res) => {
  const doctorId = await getDoctorId(req.user.id);
  const consultations = await consultationsService.getConsultationHistory(
    req.params.patientId,
    { doctorId, hospitalId: req.user.hospitalId }
  );
  res.json({ success: true, data: consultations });
});

export const getConsultationByAppointment = catchAsync(async (req, res) => {
  const doctorId = await getDoctorId(req.user.id);
  const result = await consultationsService.getConsultationByAppointment(req.params.appointmentId, doctorId);
  res.json({ success: true, data: result });
});

