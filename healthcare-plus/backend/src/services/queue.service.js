/**
 * services/queue.service.js — Queue management (Phase 6).
 * All mutations emit Socket.IO events after DB write.
 * Clients must use REST; server is authoritative for state.
 */

import prisma from '../prisma/client.js';
import { ApiError } from '../utils/ApiError.js';
import { getIO } from '../sockets/index.js';
import { notifyQueueYourTurn, notifyQueueYourTurnApproaching } from './notifications.service.js';

const QUEUE_TOKEN_SELECT = {
  id: true,
  tokenNumber: true,
  status: true,
  calledAt: true,
  consultationStartAt: true,
  completedAt: true,
  queueDate: true,
  appointment: {
    select: {
      id: true,
      scheduledTime: true,
      patient: { select: { id: true, fullName: true, email: true } },
    },
  },
};

/**
 * Get midnight UTC for today.
 */
const todayUTC = () => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

/**
 * Emit queue:updated event to the doctor's room and each affected patient's room.
 */
const emitQueueUpdate = async (doctorId, queueDate) => {
  const io = getIO();
  if (!io) return;

  const dateStr = queueDate.toISOString().split('T')[0];
  const queue = await prisma.queueToken.findMany({
    where: { doctorId, queueDate },
    select: { ...QUEUE_TOKEN_SELECT, hospitalId: true },
    orderBy: { tokenNumber: 'asc' },
  });

  // Notify the doctor's room
  io.to(`doctor:${doctorId}:${dateStr}`).emit('queue:updated', { doctorId, date: dateStr, queue });

  // Notify the hospital-wide monitoring room (admin Queue Monitor).
  const hospitalId = queue[0]?.hospitalId;
  if (hospitalId) {
    io.to(`hospital:${hospitalId}:queue`).emit('queue:updated', { doctorId, date: dateStr, hospitalId, queue });
  }

  // Notify each patient individually
  for (const token of queue) {
    const patientId = token.appointment?.patient?.id;
    if (patientId) {
      io.to(`patient:${patientId}`).emit('queue:updated', {
        token: { id: token.id, tokenNumber: token.tokenNumber, status: token.status },
        doctorId,
        date: dateStr,
      });
    }
  }
};

/**
 * Public wrapper around emitQueueUpdate — used by consultations.service.js
 * which manages its own $transaction and then needs to trigger socket events.
 */
export const emitQueueUpdateById = emitQueueUpdate;

/**
 * Get a doctor's full queue for a date.
 */
export const getDoctorQueue = async (doctorId, dateStr) => {
  const date = dateStr ? new Date(dateStr) : todayUTC();
  date.setUTCHours(0, 0, 0, 0);

  return prisma.queueToken.findMany({
    where: { doctorId, queueDate: date },
    select: QUEUE_TOKEN_SELECT,
    orderBy: { tokenNumber: 'asc' },
  });
};

/**
 * Get a patient's queue position for a specific appointment.
 */
export const getPatientQueuePosition = async (appointmentId, patientId) => {
  const token = await prisma.queueToken.findUnique({
    where: { appointmentId },
    select: {
      ...QUEUE_TOKEN_SELECT,
      doctorId: true,
      queueDate: true,
    },
  });

  if (!token) throw ApiError.notFound('Queue token not found.');
  if (token.appointment?.patient?.id !== patientId) throw ApiError.forbidden('Not your queue token.');

  // Count patients ahead: only WAITING tokens with smaller token number.
  // CALLED / IN_PROGRESS is the patient currently at the desk, they're NOT blocking the queue.
  const patientsAhead = await prisma.queueToken.count({
    where: {
      doctorId: token.doctorId,
      queueDate: token.queueDate,
      tokenNumber: { lt: token.tokenNumber },
      status: { in: ['WAITING', 'CALLED'] },
    },
  });

  // Use 15 minutes per slot (matches default doctor availability slotMinutes)
  const AVG_CONSULTATION_MINUTES = 15;
  const estimatedWaitMinutes = patientsAhead * AVG_CONSULTATION_MINUTES;

  // Get currently serving token number (IN_PROGRESS or CALLED)
  const currentlyServing = await prisma.queueToken.findFirst({
    where: {
      doctorId: token.doctorId,
      queueDate: token.queueDate,
      status: { in: ['CALLED', 'IN_PROGRESS'] },
    },
    orderBy: { tokenNumber: 'asc' },
    select: { tokenNumber: true },
  });

  return {
    token,
    patientsAhead,
    estimatedWaitMinutes,
    currentlyServing: currentlyServing?.tokenNumber || null,
  };
};


/**
 * Call the next waiting patient.
 * doctorId must come from req.user — never from body.
 */
export const callNext = async (doctorId) => {
  const today = todayUTC();

  const nextToken = await prisma.queueToken.findFirst({
    where: { doctorId, queueDate: today, status: 'WAITING' },
    orderBy: { tokenNumber: 'asc' },
  });

  if (!nextToken) {
    return { message: 'No patients currently waiting in the queue.' };
  }

  const updated = await prisma.queueToken.update({
    where: { id: nextToken.id },
    data: { status: 'CALLED', calledAt: new Date() },
    select: { ...QUEUE_TOKEN_SELECT, doctorId: true, queueDate: true, appointment: { select: { patient: { select: { id: true, fullName: true } } } } },
  });

  // Emit targeted "you're being called" to the patient
  const io = getIO();
  if (io) {
    const patientId = updated.appointment?.patient?.id;
    if (patientId) {
      io.to(`patient:${patientId}`).emit('queue:token-called', {
        tokenNumber: updated.tokenNumber,
        message: "It's your turn! Please proceed to the doctor's room now.",
      });
    }
  }

  // Phase 15: Persistent notification + check for patient approaching (2 spots away)
  try {
    const patientId = updated.appointment?.patient?.id;
    if (patientId) {
      // Notify the called patient
      await notifyQueueYourTurn(patientId, updated);

      // Find the patient 2 positions behind and notify them
      const approachingToken = await prisma.queueToken.findFirst({
        where: {
          doctorId,
          queueDate: today,
          status: 'WAITING',
          tokenNumber: { gt: updated.tokenNumber },
        },
        orderBy: { tokenNumber: 'asc' },
        skip: 1, // 2nd in remaining queue = 2 spots behind
        select: {
          id: true,
          tokenNumber: true,
          appointment: { select: { patient: { select: { id: true } } } },
        },
      });
      const approachingPatientId = approachingToken?.appointment?.patient?.id;
      if (approachingPatientId) {
        await notifyQueueYourTurnApproaching(approachingPatientId, approachingToken);
      }
    }
  } catch (notifErr) {
    console.warn('[Queue] Failed to send turn notifications:', notifErr.message);
  }

  await emitQueueUpdate(doctorId, today);
  return updated;
};

/**
 * Start consultation (CALLED → IN_PROGRESS).
 */
export const startConsultation = async (queueTokenId, doctorId) => {
  const token = await prisma.queueToken.findUnique({ where: { id: queueTokenId } });
  if (!token) throw ApiError.notFound('Queue token not found.');
  if (token.doctorId !== doctorId) throw ApiError.forbidden('Not your queue token.');
  if (token.status !== 'CALLED') throw ApiError.badRequest(`Cannot start consultation for status: ${token.status}`);

  const updated = await prisma.queueToken.update({
    where: { id: queueTokenId },
    data: { status: 'IN_PROGRESS', consultationStartAt: new Date() },
  });

  await emitQueueUpdate(doctorId, token.queueDate);
  return updated;
};

/**
 * Complete consultation (IN_PROGRESS → COMPLETED). Also marks Appointment COMPLETED.
 */
export const completeConsultation = async (queueTokenId, doctorId) => {
  const token = await prisma.queueToken.findUnique({
    where: { id: queueTokenId },
    include: { appointment: true },
  });
  if (!token) throw ApiError.notFound('Queue token not found.');
  if (token.doctorId !== doctorId) throw ApiError.forbidden('Not your queue token.');
  if (token.status !== 'IN_PROGRESS') throw ApiError.badRequest(`Cannot complete consultation for status: ${token.status}`);

  const updated = await prisma.$transaction(async (tx) => {
    const t = await tx.queueToken.update({
      where: { id: queueTokenId },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });
    await tx.appointment.update({
      where: { id: token.appointmentId },
      data: { status: 'COMPLETED' },
    });
    return t;
  });

  await emitQueueUpdate(doctorId, token.queueDate);
  return updated;
};

/**
 * Skip a patient (WAITING/CALLED → SKIPPED).
 */
export const skipPatient = async (queueTokenId, doctorId) => {
  const token = await prisma.queueToken.findUnique({ where: { id: queueTokenId } });
  if (!token) throw ApiError.notFound('Queue token not found.');
  if (token.doctorId !== doctorId) throw ApiError.forbidden('Not your queue token.');
  if (!['WAITING', 'CALLED'].includes(token.status)) {
    throw ApiError.badRequest(`Cannot skip patient in status: ${token.status}`);
  }

  const updated = await prisma.queueToken.update({
    where: { id: queueTokenId },
    data: { status: 'SKIPPED' },
  });

  await emitQueueUpdate(doctorId, token.queueDate);
  return updated;
};

/**
 * Re-queue a skipped patient (SKIPPED → WAITING at end of queue).
 */
export const requeueSkipped = async (queueTokenId, doctorId) => {
  const token = await prisma.queueToken.findUnique({ where: { id: queueTokenId } });
  if (!token) throw ApiError.notFound('Queue token not found.');
  if (token.doctorId !== doctorId) throw ApiError.forbidden('Not your queue token.');
  if (token.status !== 'SKIPPED') throw ApiError.badRequest('Only SKIPPED tokens can be re-queued.');

  // Assign a new token number at the end of current waiting queue
  const lastToken = await prisma.queueToken.findFirst({
    where: { doctorId, queueDate: token.queueDate, status: { not: 'CANCELLED' } },
    orderBy: { tokenNumber: 'desc' },
  });
  const newNumber = lastToken ? Math.floor(lastToken.tokenNumber) + 1 : 1;

  const updated = await prisma.queueToken.update({
    where: { id: queueTokenId },
    data: { status: 'WAITING', tokenNumber: newNumber },
  });

  await emitQueueUpdate(doctorId, token.queueDate);
  return updated;
};

/**
 * Cancel a queue token (called from appointment cancellation).
 */
export const cancelQueueToken = async (queueTokenId) => {
  const token = await prisma.queueToken.findUnique({ where: { id: queueTokenId } });
  if (!token) return; // Already gone
  if (['COMPLETED', 'CANCELLED'].includes(token.status)) return;

  await prisma.queueToken.update({
    where: { id: queueTokenId },
    data: { status: 'CANCELLED' },
  });
};

// ─────────────────────────────────────────────
// PHASE 14: ADMIN QUEUE OVERSIGHT
// ─────────────────────────────────────────────

/**
 * Admin force-skip a patient (bypasses doctor ownership check).
 * Records an audit log entry after the skip.
 *
 * @param {string} queueTokenId
 * @param {string} adminUserId
 * @param {string} hospitalId
 * @param {string} reason
 */
export const adminForceSkip = async (queueTokenId, adminUserId, hospitalId, reason) => {
  const token = await prisma.queueToken.findUnique({
    where: { id: queueTokenId },
    include: { doctor: true },
  });

  if (!token) throw ApiError.notFound('Queue token not found.');
  if (token.hospitalId !== hospitalId) throw ApiError.forbidden('Token does not belong to your hospital.');
  if (!['WAITING', 'CALLED'].includes(token.status)) {
    throw ApiError.badRequest(`Cannot skip token in status: ${token.status}`);
  }

  const updated = await prisma.queueToken.update({
    where: { id: queueTokenId },
    data: { status: 'SKIPPED' },
  });

  await emitQueueUpdate(token.doctorId, token.queueDate);

  // Audit log (fire-and-forget)
  try {
    const { recordAction } = await import('./auditLog.service.js');
    await recordAction(hospitalId, adminUserId, 'QUEUE_OVERRIDDEN', 'QueueToken', queueTokenId, { reason });
  } catch (auditErr) {
    console.warn('[Queue] Failed to write audit log for force-skip:', auditErr.message);
  }

  return updated;
};

/**
 * Get all active queue tokens for a hospital on a given date (admin overview).
 * @param {string} hospitalId
 * @param {string} dateStr — YYYY-MM-DD
 */
export const adminGetHospitalQueues = async (hospitalId, dateStr) => {
  const date = dateStr ? new Date(dateStr) : new Date();
  date.setUTCHours(0, 0, 0, 0);

  const tokens = await prisma.queueToken.findMany({
    where: { hospitalId, queueDate: date },
    select: {
      ...QUEUE_TOKEN_SELECT,
      doctorId: true,
      hospitalId: true,
      doctor: { include: { user: { select: { fullName: true } } } },
    },
    orderBy: [{ tokenNumber: 'asc' }],
  });

  // Group by doctor
  const byDoctor = {};
  for (const token of tokens) {
    const dId = token.doctorId;
    if (!byDoctor[dId]) {
      byDoctor[dId] = {
        doctorId: dId,
        doctorName: token.doctor?.user?.fullName || 'Unknown',
        tokens: [],
      };
    }
    byDoctor[dId].tokens.push(token);
  }

  return Object.values(byDoctor);
};
