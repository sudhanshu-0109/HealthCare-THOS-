/**
 * controllers/queue.controller.js — Queue management endpoints (Phase 6).
 * doctorId is always derived from req.user — never from request body — 
 * preventing one doctor from controlling another's queue.
 */

import * as queueService from '../services/queue.service.js';
import prisma from '../prisma/client.js';

/**
 * Helper: get the Doctor profile ID for the authenticated doctor user.
 */
const getDoctorId = async (userId) => {
  const doctor = await prisma.doctor.findUnique({ where: { userId }, select: { id: true } });
  if (!doctor) throw { status: 403, message: 'No doctor profile found for this user.' };
  return doctor.id;
};

export const getDoctorQueue = async (req, res) => {
  const doctorId = req.params.doctorId || await getDoctorId(req.user.id);
  const { date } = req.query;
  const queue = await queueService.getDoctorQueue(doctorId, date);
  res.json({ success: true, data: queue });
};

export const getPatientQueuePosition = async (req, res) => {
  const data = await queueService.getPatientQueuePosition(req.params.appointmentId, req.user.id);
  res.json({ success: true, data });
};

export const callNext = async (req, res) => {
  const doctorId = await getDoctorId(req.user.id);
  const data = await queueService.callNext(doctorId);
  res.json({ success: true, data });
};

export const startConsultation = async (req, res) => {
  const doctorId = await getDoctorId(req.user.id);
  const data = await queueService.startConsultation(req.params.id, doctorId);
  res.json({ success: true, data });
};

export const completeConsultation = async (req, res) => {
  const doctorId = await getDoctorId(req.user.id);
  const data = await queueService.completeConsultation(req.params.id, doctorId);
  res.json({ success: true, data });
};

export const skipPatient = async (req, res) => {
  const doctorId = await getDoctorId(req.user.id);
  const data = await queueService.skipPatient(req.params.id, doctorId);
  res.json({ success: true, data });
};

export const requeueSkipped = async (req, res) => {
  const doctorId = await getDoctorId(req.user.id);
  const data = await queueService.requeueSkipped(req.params.id, doctorId);
  res.json({ success: true, data });
};
