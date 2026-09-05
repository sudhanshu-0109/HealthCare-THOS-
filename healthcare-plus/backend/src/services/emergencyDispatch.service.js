/**
 * services/emergencyDispatch.service.js — Ambulance dispatch logic (Phase 13).
 *
 * State Machine (backend-authoritative):
 *   REQUESTED → SEARCHING → DRIVER_ASSIGNED → EN_ROUTE
 *     → REACHED_PATIENT (auto: <=100m)
 *     → PICKUP_PENDING_CONFIRMATION (driver marks pickup; patient must confirm)
 *     → PICKED_UP (patient confirms)
 *     → ARRIVED (auto: <=50m of hospital)
 *
 * Auto-proximity rules applied on every driver location update:
 *   - EN_ROUTE + distance_to_patient <= 100m → REACHED_PATIENT
 *   - PICKED_UP  + distance_to_hospital <= 50m → ARRIVED
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

/** Proximity thresholds (metres) — single source of truth for backend */
const PATIENT_REACHED_METERS = 100;
const HOSPITAL_ARRIVED_METERS = 50;

/** All statuses considered "active" for driver rehydration */
const ACTIVE_STATUSES = ['DRIVER_ASSIGNED', 'EN_ROUTE', 'REACHED_PATIENT', 'PICKUP_PENDING_CONFIRMATION', 'PICKED_UP'];

/**
 * Resolve a driver's ambulance from their USER id.
 * Ambulance.driverId references AmbulanceDriver.id (NOT the User id), so a driver's
 * ambulance is always resolved through the driver relation off the authenticated user.
 */
const findAmbulanceByUserId = (userId, include) =>
  prisma.ambulance.findFirst({ where: { driver: { userId } }, include });

/** Shared hospital select projection */
const HOSPITAL_SELECT = {
  id: true, name: true, address: true, locality: true,
  city: true, latitude: true, longitude: true, contactPhone: true,
};

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
    await _applyFallback(emergencyRequestId);
    return;
  }

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

  for (const ambulance of withDistance) {
    emit(`driver:${ambulance.driver.userId}`, 'emergency:new-request', {
      requestId: emergencyRequestId,
      patientLat: request.latitude,
      patientLng: request.longitude,
      distanceKm: ambulance.distance.toFixed(2),
      timestamp: new Date().toISOString(),
    });
  }

  setTimeout(async () => {
    try { await checkAndApplyFallback(emergencyRequestId); }
    catch (err) { console.error('[EmergencyDispatch] Fallback check error:', err.message); }
  }, FALLBACK_TIMEOUT_MS);
};

/**
 * acceptRequest — driver atomically claims the emergency request.
 * Returns false (not 500) if already claimed by another driver.
 */
export const acceptRequest = async (emergencyRequestId, userId) => {
  const ambulance = await findAmbulanceByUserId(userId, {
    driver: { include: { user: { select: { fullName: true } } } },
  });
  if (!ambulance) throw ApiError.notFound('No ambulance assigned to this driver.');

  const updated = await prisma.emergencyRequest.updateMany({
    where: { id: emergencyRequestId, status: 'SEARCHING' },
    data: {
      status: 'DRIVER_ASSIGNED',
      ambulanceId: ambulance.id,
      acceptedAt: new Date(),
    },
  });

  if (updated.count === 0) {
    return { success: false, reason: 'This emergency request is no longer available.' };
  }

  const emergencyReq = await prisma.emergencyRequest.findUnique({
    where: { id: emergencyRequestId },
    include: { hospital: { select: HOSPITAL_SELECT } },
  });

  // Driver joins the emergency room so they can receive patient confirmation events
  if (_io) {
    const driverSockets = await _io.in(`driver:${userId}`).fetchSockets();
    for (const s of driverSockets) {
      s.join(`emergency:${emergencyRequestId}`);
    }
  }

  emit(`emergency:${emergencyRequestId}`, 'emergency:accepted', {
    requestId: emergencyRequestId,
    driverName: ambulance.driver.user?.fullName,
    vehicleNumber: ambulance.vehicleNumber,
    driverLat: ambulance.currentLatitude,
    driverLng: ambulance.currentLongitude,
    hospital: emergencyReq?.hospital || null,
    timestamp: new Date().toISOString(),
  });

  return { success: true, ambulanceId: ambulance.id, hospital: emergencyReq?.hospital || null };
};

/**
 * rejectRequest — driver declines; no DB state change, just logs.
 */
export const rejectRequest = async (emergencyRequestId, driverId) => {
  console.info(`[EmergencyDispatch] Driver ${driverId} rejected request ${emergencyRequestId}`);
  return { acknowledged: true };
};

/**
 * updateDriverLocation — updates ambulance coordinates, emits to patient room,
 * AND performs backend-authoritative proximity checks:
 *   - EN_ROUTE + driver within 100m of patient → auto-transition REACHED_PATIENT
 *   - PICKED_UP + driver within 50m of hospital → auto-transition ARRIVED
 */
export const updateDriverLocation = async (userId, { latitude, longitude, heading, speed }) => {
  const existing = await findAmbulanceByUserId(userId);
  if (!existing) throw ApiError.notFound('No ambulance assigned to this driver.');

  const ambulance = await prisma.ambulance.update({
    where: { id: existing.id },
    data: { currentLatitude: latitude, currentLongitude: longitude, locationUpdatedAt: new Date() },
  });

  const activeRequest = await prisma.emergencyRequest.findFirst({
    where: { ambulanceId: ambulance.id, status: { in: ACTIVE_STATUSES } },
    include: { hospital: { select: HOSPITAL_SELECT } },
  });

  if (activeRequest) {
    // Persist last known driver location to EmergencyRequest (H3 / refresh recovery)
    // Fire-and-forget; don't block the GPS event chain on this write.
    prisma.emergencyRequest.update({
      where: { id: activeRequest.id },
      data: { lastDriverLat: latitude, lastDriverLng: longitude },
    }).catch((err) => console.warn('[EmergencyDispatch] Failed to persist lastDriverLat/Lng:', err.message));

    // Emit live location to patient's tracking room
    emit(`emergency:${activeRequest.id}`, 'emergency:location-update', {
      requestId: activeRequest.id,
      driverLat: latitude,
      driverLng: longitude,
      heading: heading != null ? Number(heading) : null,
      speed: speed != null ? Number(speed) : null,
      timestamp: new Date().toISOString(),
    });

    // ── Auto-proximity check: EN_ROUTE → REACHED_PATIENT ───────────────────
    if (activeRequest.status === 'EN_ROUTE') {
      const distToPatientKm = calculateDistance(
        latitude, longitude,
        activeRequest.latitude, activeRequest.longitude
      );
      if (distToPatientKm * 1000 <= PATIENT_REACHED_METERS) {
        const autoReached = await prisma.emergencyRequest.updateMany({
          where: { id: activeRequest.id, ambulanceId: ambulance.id, status: 'EN_ROUTE' },
          data: { status: 'REACHED_PATIENT', reachedPatientAt: new Date() },
        });
        if (autoReached.count > 0) {
          console.info(`[EmergencyDispatch] Auto-transition: EN_ROUTE → REACHED_PATIENT (${Math.round(distToPatientKm * 1000)}m) for request ${activeRequest.id}`);
          emit(`emergency:${activeRequest.id}`, 'emergency:status-update', {
            requestId: activeRequest.id,
            status: 'REACHED_PATIENT',
            message: 'Ambulance has reached your location.',
            timestamp: new Date().toISOString(),
          });
        }
      }
    }

    // ── Auto-proximity check: PICKED_UP → ARRIVED ──────────────────────────
    if (activeRequest.status === 'PICKED_UP') {
      const destHospitalId = activeRequest.destinationHospitalId || activeRequest.hospitalId;
      let hospitalLat = activeRequest.hospital?.latitude;
      let hospitalLng = activeRequest.hospital?.longitude;

      // If destination differs from primary hospital, fetch it
      if (destHospitalId && destHospitalId !== activeRequest.hospitalId) {
        const destHosp = await prisma.hospital.findUnique({
          where: { id: destHospitalId },
          select: { latitude: true, longitude: true },
        });
        if (destHosp) { hospitalLat = destHosp.latitude; hospitalLng = destHosp.longitude; }
      }

      if (hospitalLat != null && hospitalLng != null) {
        const distToHospKm = calculateDistance(latitude, longitude, hospitalLat, hospitalLng);
        if (distToHospKm * 1000 <= HOSPITAL_ARRIVED_METERS) {
          const autoArrived = await prisma.emergencyRequest.updateMany({
            where: { id: activeRequest.id, ambulanceId: ambulance.id, status: 'PICKED_UP' },
            data: { status: 'ARRIVED', arrivedAt: new Date() },
          });
          if (autoArrived.count > 0) {
            console.info(`[EmergencyDispatch] Auto-transition: PICKED_UP → ARRIVED (${Math.round(distToHospKm * 1000)}m) for request ${activeRequest.id}`);
            emit(`emergency:${activeRequest.id}`, 'emergency:status-update', {
              requestId: activeRequest.id,
              status: 'ARRIVED',
              message: 'Ambulance has arrived at the hospital.',
              timestamp: new Date().toISOString(),
            });
          }
        }
      }
    }
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
 * markReachedPatient — backup manual trigger for REACHED_PATIENT.
 * Primary is auto-proximity; this is a fallback if GPS detection doesn't fire.
 */
export const markReachedPatient = async (emergencyRequestId, driverId) => {
  return _advanceRequestStatus(emergencyRequestId, driverId, 'EN_ROUTE', 'REACHED_PATIENT', {
    event: 'emergency:status-update',
    payload: { status: 'REACHED_PATIENT', message: 'Ambulance has reached your location.' },
  });
};

/**
 * markPickedUp — driver marks patient as picked up. Transitions to
 * PICKUP_PENDING_CONFIRMATION — patient must confirm before status becomes PICKED_UP.
 */
export const markPickedUp = async (emergencyRequestId, driverId, { destinationHospitalId } = {}) => {
  const ambulance = await findAmbulanceByUserId(driverId);
  if (!ambulance) throw ApiError.notFound('No ambulance assigned to this driver.');

  const existingRequest = await prisma.emergencyRequest.findUnique({
    where: { id: emergencyRequestId },
  });
  if (!existingRequest) throw ApiError.notFound('Emergency request not found.');

  // Destination hospital defaults to assigned hospitalId if not explicitly provided
  const targetHospitalId = destinationHospitalId || existingRequest.destinationHospitalId || existingRequest.hospitalId;

  let hospitalDetails = null;
  if (targetHospitalId) {
    hospitalDetails = await prisma.hospital.findUnique({
      where: { id: targetHospitalId },
      select: HOSPITAL_SELECT,
    });
  }

  if (!targetHospitalId || !hospitalDetails) {
    console.error(
      `[EmergencyDispatch] markPickedUp: cannot resolve destination hospital for request ${emergencyRequestId}.` +
      ` targetHospitalId=${targetHospitalId}`
    );
    throw ApiError.badRequest(
      'Cannot mark patient as picked up: destination hospital could not be determined. ' +
      'Ensure the emergency request has an assigned hospital before marking pickup.'
    );
  }

  // Transition from REACHED_PATIENT → PICKUP_PENDING_CONFIRMATION
  // Also allow EN_ROUTE as fallback (GPS may have missed proximity threshold)
  const ambulanceRecord = await findAmbulanceByUserId(driverId);
  if (!ambulanceRecord) throw ApiError.notFound('No ambulance assigned to this driver.');

  const updated = await prisma.emergencyRequest.updateMany({
    where: {
      id: emergencyRequestId,
      ambulanceId: ambulanceRecord.id,
      status: { in: ['REACHED_PATIENT', 'EN_ROUTE'] },
    },
    data: {
      status: 'PICKUP_PENDING_CONFIRMATION',
      destinationHospitalId: targetHospitalId,
    },
  });

  if (updated.count === 0) {
    throw ApiError.badRequest('Cannot mark pickup: unexpected current state (expected REACHED_PATIENT or EN_ROUTE).');
  }

  // Notify patient's tracking room — they need to confirm
  emit(`emergency:${emergencyRequestId}`, 'emergency:status-update', {
    requestId: emergencyRequestId,
    status: 'PICKUP_PENDING_CONFIRMATION',
    message: 'Ambulance driver has marked you as picked up. Please confirm your pickup.',
    hospital: hospitalDetails,
    timestamp: new Date().toISOString(),
  });

  return { success: true, status: 'PICKUP_PENDING_CONFIRMATION', hospital: hospitalDetails };
};

/**
 * confirmPatientPickup — patient confirms they have been picked up.
 * Transitions from PICKUP_PENDING_CONFIRMATION → PICKED_UP.
 * Notifies hospital staff of incoming patient.
 */
export const confirmPatientPickup = async (emergencyRequestId, patientId) => {
  const request = await prisma.emergencyRequest.findUnique({
    where: { id: emergencyRequestId },
    include: { hospital: { select: HOSPITAL_SELECT } },
  });

  if (!request) throw ApiError.notFound('Emergency request not found.');
  if (request.patientId !== patientId) throw ApiError.forbidden('Not your emergency request.');
  if (request.status !== 'PICKUP_PENDING_CONFIRMATION') {
    throw ApiError.badRequest(`Cannot confirm pickup: current status is ${request.status}. Expected PICKUP_PENDING_CONFIRMATION.`);
  }

  const targetHospitalId = request.destinationHospitalId || request.hospitalId;
  let hospitalDetails = request.hospital;
  if (targetHospitalId && targetHospitalId !== request.hospitalId) {
    const dest = await prisma.hospital.findUnique({ where: { id: targetHospitalId }, select: HOSPITAL_SELECT });
    if (dest) hospitalDetails = dest;
  }

  const updated = await prisma.emergencyRequest.updateMany({
    where: { id: emergencyRequestId, patientId, status: 'PICKUP_PENDING_CONFIRMATION' },
    data: { status: 'PICKED_UP', pickedUpAt: new Date(), pickupConfirmedAt: new Date() },
  });

  if (updated.count === 0) {
    throw ApiError.badRequest('Could not confirm pickup — status may have changed.');
  }

  emit(`emergency:${emergencyRequestId}`, 'emergency:status-update', {
    requestId: emergencyRequestId,
    status: 'PICKED_UP',
    destination: 'hospital',
    hospital: hospitalDetails,
    message: 'Pickup confirmed! Routing to hospital emergency bay.',
    timestamp: new Date().toISOString(),
  });

  // Notify destination hospital staff
  if (targetHospitalId) {
    await notifyHospitalRoles(
      targetHospitalId,
      ['HOSPITAL_ADMIN', 'RECEPTIONIST'],
      {
        type: 'EMERGENCY_NOTIFICATION',
        title: 'Incoming Emergency Patient',
        message: 'An ambulance is en route with an emergency patient. Please prepare the emergency bay.',
        relatedId: emergencyRequestId,
      }
    );
  }

  return { success: true, status: 'PICKED_UP', hospital: hospitalDetails };
};

/**
 * markArrived — manual backup: ambulance has arrived at the hospital.
 * Primary trigger is auto-proximity (50m). This handles GPS-missed cases.
 * arrivedAt is stamped atomically in the updateMany to avoid a second round-trip.
 */
export const markArrived = async (emergencyRequestId, driverId) => {
  const ambulance = await findAmbulanceByUserId(driverId);
  if (!ambulance) throw ApiError.notFound('No ambulance assigned to this driver.');

  const updated = await prisma.emergencyRequest.updateMany({
    where: { id: emergencyRequestId, ambulanceId: ambulance.id, status: 'PICKED_UP' },
    data: { status: 'ARRIVED', arrivedAt: new Date() },
  });

  if (updated.count === 0) {
    throw ApiError.badRequest('Cannot mark arrived: unexpected current state (expected PICKED_UP).');
  }

  emit(`emergency:${emergencyRequestId}`, 'emergency:status-update', {
    requestId: emergencyRequestId,
    status: 'ARRIVED',
    message: 'Ambulance has arrived at the hospital.',
    timestamp: new Date().toISOString(),
  });

  return { success: true, status: 'ARRIVED' };
};

/**
 * getDriverState — rehydrates a driver's dashboard after a page reload.
 * Includes all active emergency states including new REACHED_PATIENT and
 * PICKUP_PENDING_CONFIRMATION so mid-trip refreshes work correctly.
 */
export const getDriverState = async (userId) => {
  const ambulance = await findAmbulanceByUserId(userId, {
    driver: { select: { hospitalId: true } },
  });
  if (!ambulance) {
    return { isOnline: false, ambulance: null, activeRequest: null, pendingRequests: [], history: [] };
  }

  const [activeRequest, pendingSearching, history] = await Promise.all([
    prisma.emergencyRequest.findFirst({
      where: { ambulanceId: ambulance.id, status: { in: ACTIVE_STATUSES } },
      include: {
        patient: { select: { fullName: true } },
        hospital: { select: HOSPITAL_SELECT },
      },
      orderBy: { acceptedAt: 'desc' },
    }),
    prisma.emergencyRequest.findMany({
      where: { status: 'SEARCHING' },
      include: { patient: { select: { fullName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.emergencyRequest.findMany({
      where: { ambulanceId: ambulance.id, status: { in: ['ARRIVED', 'CANCELLED', 'NO_DRIVER_FALLBACK'] } },
      include: { patient: { select: { fullName: true } } },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    }),
  ]);

  let activeHospital = activeRequest?.hospital || null;
  if (activeRequest?.destinationHospitalId && activeRequest.destinationHospitalId !== activeRequest.hospitalId) {
    const dest = await prisma.hospital.findUnique({
      where: { id: activeRequest.destinationHospitalId },
      select: HOSPITAL_SELECT,
    });
    if (dest) activeHospital = dest;
  }

  const pendingRequests = pendingSearching.map((r) => {
    let distanceKm = null;
    if (ambulance.currentLatitude != null && ambulance.currentLongitude != null && r.latitude != null && r.longitude != null) {
      distanceKm = calculateDistance(r.latitude, r.longitude, ambulance.currentLatitude, ambulance.currentLongitude).toFixed(2);
    }
    return {
      requestId: r.id,
      patientName: r.patient?.fullName || null,
      patientLat: r.latitude,
      patientLng: r.longitude,
      distanceKm,
      timestamp: r.createdAt,
    };
  });

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
          hospital: activeHospital,
          destinationHospitalId: activeRequest.destinationHospitalId || activeRequest.hospitalId,
        }
      : null,
    pendingRequests,
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
  const request = await prisma.emergencyRequest.findUnique({ where: { id: emergencyRequestId } });
  if (!request || request.status !== 'SEARCHING') return;
  await _applyFallback(emergencyRequestId);
};

/**
 * getEmergencyRequestStatus — used by patient polling route to check status and apply fallback.
 */
export const getEmergencyRequestStatus = async (emergencyRequestId, patientId) => {
  const request = await prisma.emergencyRequest.findUnique({
    where: { id: emergencyRequestId },
    include: {
      hospital: { select: HOSPITAL_SELECT },
      ambulance: { include: { driver: { include: { user: { select: { fullName: true } } } } } },
    },
  });

  if (!request) throw ApiError.notFound('Emergency request not found.');
  if (request.patientId !== patientId) throw ApiError.forbidden('Not your emergency request.');

  if (request.status === 'SEARCHING') {
    const elapsed = Date.now() - new Date(request.createdAt).getTime();
    if (elapsed > FALLBACK_TIMEOUT_MS) {
      await _applyFallback(emergencyRequestId);
      return prisma.emergencyRequest.findUnique({
        where: { id: emergencyRequestId },
        include: { hospital: { select: HOSPITAL_SELECT } },
      });
    }
  }

  let destinationHospital = request.hospital;
  if (request.destinationHospitalId && request.destinationHospitalId !== request.hospitalId) {
    const dest = await prisma.hospital.findUnique({ where: { id: request.destinationHospitalId }, select: HOSPITAL_SELECT });
    if (dest) destinationHospital = dest;
  }

  return {
    ...request,
    hospital: destinationHospital || request.hospital,
    destinationHospital: destinationHospital || request.hospital,
    // Last known driver position from DB — used by patient for refresh recovery
    // even if the driver is temporarily offline.
    lastDriverLat: request.lastDriverLat ?? null,
    lastDriverLng: request.lastDriverLng ?? null,
    // Ambulance / driver info for patient panel
    driverName: request.ambulance?.driver?.user?.fullName ?? null,
    vehicleNumber: request.ambulance?.vehicleNumber ?? null,
    ambulanceLat: request.ambulance?.currentLatitude ?? null,
    ambulanceLng: request.ambulance?.currentLongitude ?? null,
  };
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
    throw ApiError.badRequest(`Cannot transition to ${nextStatus}: unexpected current state (expected ${expectedCurrentStatus}).`);
  }

  emit(`emergency:${requestId}`, socketPayload.event, {
    requestId,
    ...socketPayload.payload,
    timestamp: new Date().toISOString(),
  });

  return { success: true, status: nextStatus };
}
