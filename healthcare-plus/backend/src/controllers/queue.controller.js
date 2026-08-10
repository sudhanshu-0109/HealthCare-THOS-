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
  const role = req.user.role;
  let doctorId;

  if (role === 'DOCTOR') {
    // A doctor may only view their OWN queue — the URL param is ignored to
    // prevent reading another doctor's queue (patient PHI).
    doctorId = await getDoctorId(req.user.id);
  } else if (role === 'HOSPITAL_ADMIN') {
    doctorId = req.params.doctorId;
    if (!doctorId) {
      return res.status(400).json({ success: false, message: 'doctorId is required.' });
    }
    // Ensure the target doctor belongs to the admin's hospital.
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { hospitalId: true },
    });
    if (!doctor || doctor.hospitalId !== req.user.hospitalId) {
      return res.status(403).json({ success: false, message: 'Doctor does not belong to your hospital.' });
    }
  } else if (role === 'SUPER_ADMIN') {
    doctorId = req.params.doctorId;
    if (!doctorId) {
      return res.status(400).json({ success: false, message: 'doctorId is required.' });
    }
  } else {
    return res.status(403).json({ success: false, message: 'You are not permitted to view this queue.' });
  }

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
