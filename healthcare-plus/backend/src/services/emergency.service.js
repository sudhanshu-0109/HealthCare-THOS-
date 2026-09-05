import prisma from '../prisma/client.js';
import { searchHospitals } from './hospitalSearch.service.js';
import { dispatchRequest, confirmPatientPickup as dispatchConfirmPickup } from './emergencyDispatch.service.js';
import { ApiError } from '../utils/ApiError.js';

// emit helper — re-uses the Socket.IO instance registered by sockets/index.js
let _io = null;
export const setEmergencyIo = (io) => { _io = io; };
const _emit = (room, event, data) => { if (_io) _io.to(room).emit(event, data); };

/** Statuses that indicate an unresolved / active emergency (can't create another). */
const PRE_TERMINAL_STATUSES = ['REQUESTED', 'SEARCHING', 'DRIVER_ASSIGNED', 'EN_ROUTE', 'REACHED_PATIENT', 'PICKUP_PENDING_CONFIRMATION', 'PICKED_UP'];

export const createEmergencyRequest = async (patientId, data) => {
  const { latitude, longitude, hospitalId } = data;

  // ── Duplicate SOS Guard ───────────────────────────────────────────────────
  // If the patient already has a live emergency, return it instead of creating
  // another. This prevents double-SOS from rapid taps or page refreshes.
  const existing = await prisma.emergencyRequest.findFirst({
    where: { patientId, status: { in: PRE_TERMINAL_STATUSES } },
    orderBy: { createdAt: 'desc' },
  });
  if (existing) {
    console.info(`[EmergencyService] Duplicate SOS suppressed — returning active request ${existing.id} (status: ${existing.status})`);
    return existing;
  }

  let targetHospitalId = hospitalId;
  if (!targetHospitalId) {
    const nearestHospitals = await searchHospitals(latitude, longitude, 100);
    if (nearestHospitals.length > 0) {
      targetHospitalId = nearestHospitals[0].id;
    }
  }

  const request = await prisma.emergencyRequest.create({
    data: {
      patientId,
      hospitalId: targetHospitalId,
      latitude,
      longitude,
      status: 'REQUESTED'
    }
  });

  // Begin dispatch immediately (non-blocking)
  dispatchRequest(request.id).catch((err) => {
    console.error('[EmergencyDispatch] Dispatch failed after create:', err.message);
  });

  return request;
};

export const getEmergencyRequests = async (hospitalId) => {
  return prisma.emergencyRequest.findMany({
    where: { hospitalId },
    orderBy: { createdAt: 'desc' },
    include: {
      patient: {
        select: {
          fullName: true,
          email: true,
          patientProfile: { select: { phone: true } }
        }
      }
    }
  });
};

export const getActiveEmergency = async (patientId) => {
  return prisma.emergencyRequest.findFirst({
    where: {
      patientId,
      status: { in: PRE_TERMINAL_STATUSES },
    },
    orderBy: { createdAt: 'desc' },
    include: {
      ambulance: {
        include: {
          driver: { include: { user: { select: { fullName: true } } } },
        },
      },
    },
  });
};

/**
 * cancelEmergencyRequest — patient cancels their own active emergency.
 * Only allowed in pre-pickup statuses. Emits socket event to tracking room.
 */
export const cancelEmergencyRequest = async (requestId, patientId) => {
  const CANCELLABLE = ['REQUESTED', 'SEARCHING', 'DRIVER_ASSIGNED', 'EN_ROUTE', 'REACHED_PATIENT'];
  const request = await prisma.emergencyRequest.findUnique({ where: { id: requestId } });
  if (!request) throw new Error('Emergency request not found.');
  if (request.patientId !== patientId) throw new Error('Not your emergency request.');
  if (!CANCELLABLE.includes(request.status)) {
    throw new Error(`Cannot cancel a request in status: ${request.status}`);
  }

  const updated = await prisma.emergencyRequest.update({
    where: { id: requestId },
    data: { status: 'CANCELLED' },
  });

  _emit(`emergency:${requestId}`, 'emergency:status-update', {
    requestId,
    status: 'CANCELLED',
    message: 'Emergency cancelled by patient.',
    timestamp: new Date().toISOString(),
  });

  return updated;
};

/**
 * confirmEmergencyPickup — patient confirms they are in the ambulance.
 * Delegates to dispatchService which handles the PICKUP_PENDING_CONFIRMATION → PICKED_UP transition.
 */
export const confirmEmergencyPickup = async (requestId, patientId) => {
  return dispatchConfirmPickup(requestId, patientId);
};

export const getMyEmergencies = async (patientId) => {
  return prisma.emergencyRequest.findMany({
    where: { patientId },
    orderBy: { createdAt: 'desc' },
    include: {
      ambulance: { include: { driver: { include: { user: { select: { fullName: true } } } } } }
    }
  });
};

export const updateEmergencyStatus = async (id, status) => {
  return prisma.emergencyRequest.update({
    where: { id },
    data: { status }
  });
};
