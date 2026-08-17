/**
 * services/onlineSession.service.js — Online Consultation session lifecycle (Phase 16).
 *
 * Responsibilities:
 *  - getSession:   return session + appointment details (patient & doctor access gated separately)
 *  - joinSession:  patient or doctor signals readiness; updates status accordingly
 *  - startSession: doctor starts the call (moves status to IN_PROGRESS)
 *  - endSession:   doctor ends the call; triggers completeConsultation
 *  - getDoctorOnlineStats: dashboard stats for doctor online appointments
 */

import prisma from '../prisma/client.js';
import { ApiError } from '../utils/ApiError.js';
import { getIO } from '../sockets/index.js';
import { emitSessionStarted, emitSessionEnded } from '../sockets/consultationHandlers.js';

const SESSION_SELECT = {
  id: true,
  appointmentId: true,
  roomId: true,
  status: true,
  scheduledStart: true,
  scheduledEnd: true,
  startedAt: true,
  endedAt: true,
  patientJoinedAt: true,
  doctorJoinedAt: true,
  endedReason: true,
  createdAt: true,
  updatedAt: true,
  appointment: {
    select: {
      id: true,
      patientId: true,
      doctorId: true,
      hospitalId: true,
      scheduledDate: true,
      scheduledTime: true,
      status: true,
      consultationType: true,
      patient: { select: { id: true, fullName: true, email: true } },
      doctor: {
        select: {
          id: true,
          specialization: true,
          user: { select: { id: true, fullName: true, email: true } },
        },
      },
    },
  },
  consultation: {
    select: {
      id: true,
      status: true,
      symptoms: true,
      diagnosis: true,
      notes: true,
      treatmentPlan: true,
      startedAt: true,
      completedAt: true,
    },
  },
};

const assertParticipant = async (appointmentId, callerId) => {
  const session = await prisma.onlineSession.findUnique({
    where: { appointmentId },
    select: SESSION_SELECT,
  });
  if (!session) throw ApiError.notFound('Online session not found for this appointment.');

  const appt = session.appointment;
  if (appt.patientId === callerId) return { session, role: 'PATIENT' };
  if (appt.doctor.user.id === callerId) return { session, role: 'DOCTOR' };

  throw ApiError.forbidden('You are not a participant in this session.');
};

export const getSession = async (appointmentId, callerId) => {
  const { session } = await assertParticipant(appointmentId, callerId);
  return session;
};

export const joinSession = async (appointmentId, callerId) => {
  const { session, role } = await assertParticipant(appointmentId, callerId);

  if (session.appointment.status !== 'CONFIRMED') {
    throw ApiError.badRequest('Appointment is not confirmed. Cannot join session.');
  }

  const TERMINAL = ['COMPLETED', 'CANCELLED', 'EXPIRED'];
  if (TERMINAL.includes(session.status)) {
    throw ApiError.badRequest(`Session has already ended (status: ${session.status}).`);
  }

  const now = new Date();
  const updateData = {};

  if (role === 'PATIENT' && !session.patientJoinedAt) {
    updateData.patientJoinedAt = now;
  } else if (role === 'DOCTOR' && !session.doctorJoinedAt) {
    updateData.doctorJoinedAt = now;
  }

  const bothJoined =
    (role === 'PATIENT' ? true : !!session.patientJoinedAt) &&
    (role === 'DOCTOR' ? true : !!session.doctorJoinedAt);

  if (bothJoined && session.status !== 'IN_PROGRESS') {
    updateData.status = 'DOCTOR_JOINED';
  } else if (role === 'PATIENT' && session.status === 'SCHEDULED') {
    updateData.status = 'PATIENT_JOINED';
  } else if (role === 'DOCTOR' && session.status === 'PATIENT_JOINED') {
    updateData.status = 'DOCTOR_JOINED';
  } else if (role === 'DOCTOR' && session.status === 'SCHEDULED') {
    updateData.status = 'DOCTOR_JOINED';
  }

  const updated = await prisma.onlineSession.update({
    where: { appointmentId },
    data: updateData,
    select: SESSION_SELECT,
  });

  return { session: updated, role };
};

export const startSession = async (appointmentId, doctorUserId) => {
  const doctorRecord = await prisma.doctor.findUnique({
    where: { userId: doctorUserId },
    select: { id: true },
  });
  if (!doctorRecord) throw ApiError.forbidden('No doctor profile found.');

  const session = await prisma.onlineSession.findUnique({
    where: { appointmentId },
    select: SESSION_SELECT,
  });
  if (!session) throw ApiError.notFound('Online session not found.');
  if (session.appointment.doctor.user.id !== doctorUserId) {
    throw ApiError.forbidden('This session does not belong to you.');
  }

  const STARTABLE = ['SCHEDULED', 'PATIENT_JOINED', 'DOCTOR_JOINED', 'WAITING_FOR_PARTICIPANTS'];
  if (!STARTABLE.includes(session.status)) {
    throw ApiError.badRequest(`Cannot start session with status: ${session.status}.`);
  }

  const now = new Date();

  const [updatedSession] = await prisma.$transaction([
    prisma.onlineSession.update({
      where: { appointmentId },
      data: {
        status: 'IN_PROGRESS',
        startedAt: now,
        doctorJoinedAt: session.doctorJoinedAt ?? now,
      },
      select: SESSION_SELECT,
    }),
    prisma.consultation.upsert({
      where: { appointmentId },
      update: { status: 'IN_PROGRESS' },
      create: {
        appointmentId,
        onlineSessionId: session.id,
        doctorId: doctorRecord.id,
        patientId: session.appointment.patientId,
        hospitalId: session.appointment.hospitalId,
        status: 'IN_PROGRESS',
        startedAt: now,
      },
    }),
  ]);

  // Notify both participants in real-time
  try { emitSessionStarted(getIO(), appointmentId); } catch {}

  return updatedSession;
};

export const endSession = async (appointmentId, doctorUserId, reason = null) => {
  const doctorRecord = await prisma.doctor.findUnique({
    where: { userId: doctorUserId },
    select: { id: true },
  });
  if (!doctorRecord) throw ApiError.forbidden('No doctor profile found.');

  const session = await prisma.onlineSession.findUnique({
    where: { appointmentId },
    select: SESSION_SELECT,
  });
  if (!session) throw ApiError.notFound('Online session not found.');
  if (session.appointment.doctor.user.id !== doctorUserId) {
    throw ApiError.forbidden('This session does not belong to you.');
  }

  if (session.status === 'COMPLETED') return session;

  const now = new Date();

  const updated = await prisma.onlineSession.update({
    where: { appointmentId },
    data: { status: 'COMPLETED', endedAt: now, endedReason: reason },
    select: SESSION_SELECT,
  });

  // Notify both participants in real-time
  try { emitSessionEnded(getIO(), appointmentId, reason); } catch {}

  return updated;
};

export const getDoctorOnlineStats = async (doctorUserId, hospitalId) => {
  const doctorRecord = await prisma.doctor.findFirst({
    where: { userId: doctorUserId, hospitalId },
    select: { id: true },
  });
  if (!doctorRecord) return { total: 0, today: 0, upcoming: 0, completed: 0 };

  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setUTCHours(23, 59, 59, 999);

  const [total, todayCount, upcoming, completed] = await Promise.all([
    prisma.onlineSession.count({
      where: { appointment: { doctorId: doctorRecord.id, hospitalId } },
    }),
    prisma.onlineSession.count({
      where: {
        appointment: { doctorId: doctorRecord.id, hospitalId },
        scheduledStart: { gte: todayStart, lte: todayEnd },
      },
    }),
    prisma.onlineSession.count({
      where: {
        appointment: { doctorId: doctorRecord.id, hospitalId, status: 'CONFIRMED' },
        status: { in: ['SCHEDULED', 'WAITING_FOR_PARTICIPANTS', 'PATIENT_JOINED', 'DOCTOR_JOINED'] },
        scheduledStart: { gt: new Date() },
      },
    }),
    prisma.onlineSession.count({
      where: {
        appointment: { doctorId: doctorRecord.id, hospitalId },
        status: 'COMPLETED',
      },
    }),
  ]);

  return { total, today: todayCount, upcoming, completed };
};
