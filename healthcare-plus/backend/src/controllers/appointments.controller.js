/**
 * controllers/appointments.controller.js — Appointment booking endpoints.
 */

import * as appointmentsService from '../services/appointments.service.js';
import prisma from '../prisma/client.js';

export const initiateBooking = async (req, res) => {
  const { doctorId, scheduledDate, scheduledTime, consultationType } = req.body;
  const data = await appointmentsService.initiateBooking({
    patientId: req.user.id,
    doctorId,
    scheduledDate,
    scheduledTime,
    consultationType,
  });
  res.status(201).json({ success: true, data });
};

export const getMyAppointments = async (req, res) => {
  const { status, consultationType, page, limit } = req.query;
  const data = await appointmentsService.getMyAppointments(req.user.id, {
    status,
    consultationType,
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 10,
  });
  res.json({ success: true, data });
};

export const getAppointmentById = async (req, res) => {
  const data = await appointmentsService.getAppointmentById(
    req.params.id,
    req.user.id,
    req.user.role,
    req.user.hospitalId,
  );
  res.json({ success: true, data });
};

export const cancelAppointment = async (req, res) => {
  const data = await appointmentsService.cancelAppointment({
    appointmentId: req.params.id,
    patientId: req.user.id,
    reason: req.body.reason,
  });
  res.json({ success: true, data });
};

/**
 * GET /appointments — HOSPITAL_ADMIN lists all appointments in their hospital.
 */
export const getHospitalAppointments = async (req, res) => {
  const { status, page = 1, limit = 20, date } = req.query;
  const hospitalId = req.hospitalId; // set by scopeToHospital middleware

  const where = {
    hospitalId,
    ...(status && { status }),
    ...(date && { scheduledDate: new Date(date) }),
  };

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      orderBy: [{ scheduledDate: 'desc' }, { scheduledTime: 'asc' }],
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
      select: {
        id: true,
        scheduledDate: true,
        scheduledTime: true,
        status: true,
        fee: true,
        patient: { select: { id: true, fullName: true } },
        doctor: {
          select: {
            id: true,
            specialization: true,
            user: { select: { fullName: true } },
            department: { select: { name: true } },
          },
        },
        queueToken: { select: { tokenNumber: true, status: true } },
      },
    }),
    prisma.appointment.count({ where }),
  ]);

  res.json({ success: true, data: { appointments, total, page: parseInt(page), limit: parseInt(limit) } });
};

/**
 * GET /appointments/doctor/mine — Doctor's own appointments (doctor-scoped).
 * Phase 16: Used by the doctor dashboard to list today's ONLINE appointments.
 */
export const getDoctorAppointments = async (req, res) => {
  const { consultationType, status, date, limit } = req.query;
  const data = await appointmentsService.getDoctorAppointments(req.user.id, {
    consultationType,
    status,
    date,
    limit: parseInt(limit) || 20,
  });
  res.json({ success: true, data });
};
