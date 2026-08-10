/**
 * services/emergencyDispatch.service.js — Ambulance dispatch logic (Phase 13).
 *
 * Intentional cross-hospital exception (documented in docs/phase13/decisions.md):
 * When dispatching, ALL online active ambulances are searched regardless of which
 * hospital employs the driver. This is the only place in the system that crosses
 * hospital isolation boundaries by design.
 */

import prisma from '../prisma/client.js';
import { ApiError } from '../utils/ApiError.js';
import { calculateDistance } from '../utils/geo.js';
import { notifyHospitalRoles } from './notifications.service.js';

// Injected by sockets/index.js after Socket.IO initializes
let _io = null;
export const setIo = (io) => { _io = io; };

const emit = (room, event, data) => {
  if (_io) _io.to(room).emit(event, data);
};

const MAX_AMBULANCES_TO_NOTIFY = 5;   // Notify nearest N drivers
const FALLBACK_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes

/**
 * Resolve a driver's ambulance from their USER id.
 * Ambulance.driverId references AmbulanceDriver.id (NOT the User id), so a driver's
 * ambulance is always resolved through the driver relation off the authenticated user.
 */
const findAmbulanceByUserId = (userId, include) =>
  prisma.ambulance.findFirst({ where: { driver: { userId } }, include });

/**
 * dispatchRequest — transitions EmergencyRequest to SEARCHING and notifies nearby drivers.
 * This is the ONLY place that searches ALL online ambulances regardless of hospital.
 */
export const dispatchRequest = async (emergencyRequestId) => {
  const request = await prisma.emergencyRequest.findUnique({
    where: { id: emergencyRequestId },
  });

  if (!request) return;
  if (!['REQUESTED', 'PENDING'].includes(request.status)) return;

  await prisma.emergencyRequest.update({
    where: { id: emergencyRequestId },
    data: { status: 'SEARCHING' },
  });

  // CROSS-HOSPITAL EXCEPTION: search ALL online active ambulances
  const onlineAmbulances = await prisma.ambulance.findMany({
    where: { isOnline: true, isActive: true },
    include: {
      driver: { include: { user: { select: { id: true, fullName: true } } } },
    },
  });

  if (onlineAmbulances.length === 0) {
    // No drivers online — skip directly to fallback
    await _applyFallback(emergencyRequestId);
    return;
  }

  // Sort by distance to patient
  const withDistance = onlineAmbulances
    .filter((a) => a.currentLatitude != null && a.currentLongitude != null)
    .map((a) => ({
      ...a,
      distance: calculateDistance(
        request.latitude, request.longitude,
        a.currentLatitude, a.currentLongitude
      ),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, MAX_AMBULANCES_TO_NOTIFY);

  // Emit to each driver's socket room
  for (const ambulance of withDistance) {
    emit(`driver:${ambulance.driver.userId}`, 'emergency:new-request', {
      requestId: emergencyRequestId,
      patientLat: request.latitude,
      patientLng: request.longitude,
      distanceKm: ambulance.distance.toFixed(2),
      timestamp: new Date().toISOString(),
    });
  }

  // Schedule fallback check after timeout (non-blocking)
  setTimeout(async () => {
    try {
      await checkAndApplyFallback(emergencyRequestId);
    } catch (err) {
      console.error('[EmergencyDispatch] Fallback check error:', err.message);
    }
  }, FALLBACK_TIMEOUT_MS);
};

/**
 * acceptRequest — driver atomically claims the emergency request.
 * Returns false (not 500) if already claimed by another driver.
 * @param {string} userId — the authenticated driver's User id.
 */
export const acceptRequest = async (emergencyRequestId, userId) => {
  const ambulance = await findAmbulanceByUserId(userId, {
    driver: { include: { user: { select: { fullName: true } } } },
  });
  if (!ambulance) throw ApiError.notFound('No ambulance assigned to this driver.');

  // Atomic conditional update — only succeeds if still SEARCHING
  const updated = await prisma.emergencyRequest.updateMany({
    where: { id: emergencyRequestId, status: 'SEARCHING' },
    data: {
      status: 'DRIVER_ASSIGNED',
      ambulanceId: ambulance.id,
      acceptedAt: new Date(),
    },
  });

  if (updated.count === 0) {
    // Already claimed by another driver
    return { success: false, reason: 'This emergency request is no longer available.' };
  }

  // Notify patient's tracking room
  emit(`emergency:${emergencyRequestId}`, 'emergency:accepted', {
    requestId: emergencyRequestId,
    driverName: ambulance.driver.user?.fullName,
    vehicleNumber: ambulance.vehicleNumber,
    driverLat: ambulance.currentLatitude,
    driverLng: ambulance.currentLongitude,
    timestamp: new Date().toISOString(),
  });

  return { success: true, ambulanceId: ambulance.id };
};

/**
 * rejectRequest — driver declines; no DB state change, just logs.
 */
export const rejectRequest = async (emergencyRequestId, driverId) => {
  console.info(`[EmergencyDispatch] Driver ${driverId} rejected request ${emergencyRequestId}`);
  return { acknowledged: true };
};

/**
 * updateDriverLocation — updates ambulance coordinates and emits to patient's room if assigned.
 * @param {string} userId — the authenticated driver's User id.
 */
export const updateDriverLocation = async (userId, { latitude, longitude }) => {
  const existing = await findAmbulanceByUserId(userId);
  if (!existing) throw ApiError.notFound('No ambulance assigned to this driver.');

  const ambulance = await prisma.ambulance.update({
    where: { id: existing.id },
    data: { currentLatitude: latitude, currentLongitude: longitude, locationUpdatedAt: new Date() },
  });

  // If driver has an active assignment, emit location to patient
  const activeRequest = await prisma.emergencyRequest.findFirst({
    where: {
      ambulanceId: ambulance.id,
      status: { in: ['DRIVER_ASSIGNED', 'EN_ROUTE', 'PICKED_UP'] },
    },
  });

  if (activeRequest) {
    emit(`emergency:${activeRequest.id}`, 'emergency:location-update', {
      requestId: activeRequest.id,
      driverLat: latitude,
      driverLng: longitude,
      timestamp: new Date().toISOString(),
    });
  }

  return ambulance;
};

/**
 * markEnRoute — driver is en route to patient.
 */
export const markEnRoute = async (emergencyRequestId, driverId) => {
  return _advanceRequestStatus(emergencyRequestId, driverId, 'DRIVER_ASSIGNED', 'EN_ROUTE', {
    event: 'emergency:status-update',
    payload: { status: 'EN_ROUTE' },
  });
};

/**
 * markPickedUp — patient has been picked up. Notifies destination hospital staff.
 */
export const markPickedUp = async (emergencyRequestId, driverId, { destinationHospitalId }) => {
  const result = await _advanceRequestStatus(
    emergencyRequestId, driverId, 'EN_ROUTE', 'PICKED_UP',
    { event: 'emergency:status-update', payload: { status: 'PICKED_UP' } }
  );

  // Update destinationHospitalId and pickedUpAt
  await prisma.emergencyRequest.update({
    where: { id: emergencyRequestId },
    data: { destinationHospitalId: destinationHospitalId || null, pickedUpAt: new Date() },
  });

  // Notify destination hospital admin and receptionists
  if (destinationHospitalId) {
    await notifyHospitalRoles(
      destinationHospitalId,
      ['HOSPITAL_ADMIN', 'RECEPTIONIST'],
      {
        type: 'EMERGENCY_NOTIFICATION',
        title: 'Incoming Emergency Patient',
        message: 'An ambulance is en route with an emergency patient. Please prepare the emergency bay.',
        relatedId: emergencyRequestId,
      }
    );
  }

  return result;
};

/**
 * markArrived — ambulance has arrived at the hospital.
 */
export const markArrived = async (emergencyRequestId, driverId) => {
  const result = await _advanceRequestStatus(emergencyRequestId, driverId, 'PICKED_UP', 'ARRIVED', {
    event: 'emergency:status-update',
    payload: { status: 'ARRIVED' },
  });

  // Stamp completion time so dispatch history has an accurate finished-at.
  await prisma.emergencyRequest.update({
    where: { id: emergencyRequestId },
    data: { arrivedAt: new Date() },
  });

  return result;
};

/**
 * getDriverState — rehydrates a driver's dashboard after a page reload: their
 * ambulance's online status, any in-flight assignment, and past dispatches.
 * Without this, a refresh mid-trip would silently drop the active emergency from
 * the UI even though the backend still holds it. (R15)
 * @param {string} userId — the authenticated driver's User id.
 */
export const getDriverState = async (userId) => {
  const ambulance = await findAmbulanceByUserId(userId);
  if (!ambulance) {
    return { isOnline: false, ambulance: null, activeRequest: null, history: [] };
  }

  const ACTIVE = ['DRIVER_ASSIGNED', 'EN_ROUTE', 'PICKED_UP'];
  const [activeRequest, history] = await Promise.all([
    prisma.emergencyRequest.findFirst({
      where: { ambulanceId: ambulance.id, status: { in: ACTIVE } },
      include: { patient: { select: { fullName: true } } },
      orderBy: { acceptedAt: 'desc' },
    }),
    prisma.emergencyRequest.findMany({
      where: { ambulanceId: ambulance.id, status: { in: ['ARRIVED', 'CANCELLED'] } },
      include: { patient: { select: { fullName: true } } },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    }),
  ]);

  return {
    isOnline: Boolean(ambulance.isOnline),
    ambulance: {
      id: ambulance.id,
      vehicleNumber: ambulance.vehicleNumber,
      currentLatitude: ambulance.currentLatitude,
      currentLongitude: ambulance.currentLongitude,
    },
    activeRequest: activeRequest
      ? {
          id: activeRequest.id,
          status: activeRequest.status,
          patientLat: activeRequest.latitude,
          patientLng: activeRequest.longitude,
          patientName: activeRequest.patient?.fullName || null,
          acceptedAt: activeRequest.acceptedAt,
        }
      : null,
    history: history.map((r) => ({
      id: r.id,
      status: r.status,
      patientName: r.patient?.fullName || null,
      patientLat: r.latitude,
      patientLng: r.longitude,
      createdAt: r.createdAt,
      acceptedAt: r.acceptedAt,
      pickedUpAt: r.pickedUpAt,
      arrivedAt: r.arrivedAt,
    })),
  };
};

/**
 * checkAndApplyFallback — triggered after 3 minutes if still SEARCHING.
 */
export const checkAndApplyFallback = async (emergencyRequestId) => {
  const request = await prisma.emergencyRequest.findUnique({
    where: { id: emergencyRequestId },
  });
  if (!request || request.status !== 'SEARCHING') return;

  await _applyFallback(emergencyRequestId);
};

// ── Private helpers ──────────────────────────────────────────────────────────

async function _applyFallback(emergencyRequestId) {
  await prisma.emergencyRequest.update({
    where: { id: emergencyRequestId },
    data: { status: 'NO_DRIVER_FALLBACK' },
  });

  emit(`emergency:${emergencyRequestId}`, 'emergency:status-update', {
    requestId: emergencyRequestId,
    status: 'NO_DRIVER_FALLBACK',
    message: 'No ambulance available. Please call 108 immediately.',
    timestamp: new Date().toISOString(),
  });
}

async function _advanceRequestStatus(requestId, userId, expectedCurrentStatus, nextStatus, socketPayload) {
  const ambulance = await findAmbulanceByUserId(userId);
  if (!ambulance) throw ApiError.notFound('No ambulance assigned to this driver.');

  const updated = await prisma.emergencyRequest.updateMany({
    where: { id: requestId, ambulanceId: ambulance.id, status: expectedCurrentStatus },
    data: { status: nextStatus },
  });

  if (updated.count === 0) {
    throw ApiError.badRequest(`Cannot transition to ${nextStatus}: unexpected current state.`);
  }

  emit(`emergency:${requestId}`, socketPayload.event, {
    requestId,
    ...socketPayload.payload,
    timestamp: new Date().toISOString(),
  });

  return { success: true, status: nextStatus };
}

/**
 * getEmergencyRequestStatus — used by patient polling route to check status and apply fallback.
 */
export const getEmergencyRequestStatus = async (emergencyRequestId, patientId) => {
  const request = await prisma.emergencyRequest.findUnique({
    where: { id: emergencyRequestId },
    include: {
      ambulance: {
        include: {
          driver: { include: { user: { select: { fullName: true } } } },
        },
      },
    },
  });

  if (!request) throw ApiError.notFound('Emergency request not found.');
  if (request.patientId !== patientId) throw ApiError.forbidden('Not your emergency request.');

  // Lazy fallback check
  if (request.status === 'SEARCHING') {
    const elapsed = Date.now() - new Date(request.createdAt).getTime();
    if (elapsed > FALLBACK_TIMEOUT_MS) {
      await _applyFallback(emergencyRequestId);
      return prisma.emergencyRequest.findUnique({ where: { id: emergencyRequestId } });
    }
  }

  return request;
};
