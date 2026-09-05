/**
 * utils/emergencyRouting.js — Shared emergency navigation & routing engine.
 *
 * Provides:
 *   - Shared single-source-of-truth destination mapping (Phase A vs Phase B).
 *   - Named threshold constants (Arrival, Deviation, Recalculation interval).
 *   - Fast point-to-polyline perpendicular distance check for smart rerouting.
 *   - Mathematical bearing/heading calculator for rotating vehicle markers.
 *   - Robust formatting and coordinate validation helpers.
 */

// ── Named Threshold Constants ────────────────────────────────────────────────
/** Distance at which ambulance auto-transitions to REACHED_PATIENT (backend enforcement) */
export const PATIENT_REACHED_THRESHOLD_METERS = 100;

/** Distance at which ambulance auto-transitions to ARRIVED at hospital (backend enforcement) */
export const HOSPITAL_ARRIVAL_THRESHOLD_METERS = 50;

/** Distance at which "Ambulance Arriving!" urgency UI indicator fires on patient screen */
export const ARRIVAL_THRESHOLD_METERS = 200;  // UI urgency threshold (frontend only)

/** Perpendicular distance from route polyline before declaring route deviation */
export const DEVIATION_THRESHOLD_METERS = 80;

/** Minimum time floor between OSRM route recalculations (throttling) */
export const MIN_RECALCULATION_INTERVAL_MS = 25000; // 25 seconds

// ── Coordinate Validation ────────────────────────────────────────────────────
export const isValidCoord = (lat, lng) => {
  if (lat == null || lng == null) return false;
  const nLat = Number(lat);
  const nLng = Number(lng);
  return (
    Number.isFinite(nLat) &&
    Number.isFinite(nLng) &&
    nLat >= -90 &&
    nLat <= 90 &&
    nLng >= -180 &&
    nLng <= 180
  );
};

// ── Internal Distance Math (Great Circle) ────────────────────────────────────
/**
 * Internal-only Haversine distance in meters.
 * NEVER shown directly to user as primary trip distance!
 */
export const haversineDistanceMeters = (lat1, lng1, lat2, lng2) => {
  if (!isValidCoord(lat1, lng1) || !isValidCoord(lat2, lng2)) return Infinity;
  const R = 6371000; // Earth radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ── Shared Destination Resolver (Step 12) ────────────────────────────────────
/**
 * Resolves trip phase and target destination based on emergency status.
 * Used identically by Patient Emergency Tracking and Driver Dashboard.
 *
 * Phase A (Ambulance → Patient):
 *   status IN ('REQUESTED', 'SEARCHING', 'DRIVER_ASSIGNED', 'EN_ROUTE')
 *
 * Phase B (Patient → Hospital):
 *   status IN ('PICKED_UP', 'ARRIVED')
 *
 * @param {string} status - Current EmergencyStatus enum
 * @param {Object} patientCoords - { lat/latitude, lng/longitude }
 * @param {Object} hospitalCoords - { lat/latitude, lng/longitude, name, address, contactPhone }
 * @returns {Object} Destination descriptor
 */
export const resolveTripDestination = (status, patientCoords, hospitalCoords) => {
  // Phase B: patient is in ambulance heading to hospital
  const isPhaseB = ['PICKED_UP', 'ARRIVED'].includes(status);

  if (isPhaseB) {
    const lat = hospitalCoords?.latitude ?? hospitalCoords?.lat ?? null;
    const lng = hospitalCoords?.longitude ?? hospitalCoords?.lng ?? null;
    const name = hospitalCoords?.name || 'Assigned Hospital';
    const address = hospitalCoords?.address || '';
    const contactPhone = hospitalCoords?.contactPhone || '';

    return {
      type: 'HOSPITAL',
      phase: 'PHASE_B',
      isPhaseB: true,
      lat: lat != null ? Number(lat) : null,
      lng: lng != null ? Number(lng) : null,
      name,
      address,
      contactPhone,
      label: name,
      hasCoord: isValidCoord(lat, lng),
    };
  }

  // Phase A: all states up to and including PICKUP_PENDING_CONFIRMATION
  // REQUESTED, SEARCHING, DRIVER_ASSIGNED, EN_ROUTE, REACHED_PATIENT, PICKUP_PENDING_CONFIRMATION
  const lat = patientCoords?.latitude ?? patientCoords?.lat ?? null;
  const lng = patientCoords?.longitude ?? patientCoords?.lng ?? null;

  return {
    type: 'PATIENT',
    phase: 'PHASE_A',
    isPhaseB: false,
    lat: lat != null ? Number(lat) : null,
    lng: lng != null ? Number(lng) : null,
    label: 'Patient Pickup',
    hasCoord: isValidCoord(lat, lng),
  };
};

// ── Mathematical Bearing Calculator (Vehicle Heading) ────────────────────────
/**
 * Calculates initial compass bearing from Point A to Point B in degrees (0°..360°).
 * Returns null if points are identical or invalid.
 */
export const calculateBearing = (lat1, lng1, lat2, lng2) => {
  if (!isValidCoord(lat1, lng1) || !isValidCoord(lat2, lng2)) return null;

  const toRad = (d) => (d * Math.PI) / 180;
  const toDeg = (r) => (r * 180) / Math.PI;

  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const deltaLambda = toRad(lng2 - lng1);

  // If points are practically identical (< 1 meter), keep previous bearing
  if (Math.abs(lat2 - lat1) < 1e-6 && Math.abs(lng2 - lng1) < 1e-6) {
    return null;
  }

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

  const theta = Math.atan2(y, x);
  return (toDeg(theta) + 360) % 360;
};

// ── Point-to-Polyline Perpendicular Distance (Deviation Check) ────────────────
/**
 * Distance in meters from a point (P) to a line segment (A-B) in flat-earth projection
 * suitable for local urban distances (< 50 km).
 */
const pointToSegmentDistanceMeters = (pLat, pLng, aLat, aLng, bLat, bLng) => {
  // Convert lat/lng differences to meters using local projection
  const midLatRad = ((aLat + bLat) / 2) * (Math.PI / 180);
  const metersPerDegLat = 111132.954;
  const metersPerDegLng = 111132.954 * Math.cos(midLatRad);

  const px = (pLng - aLng) * metersPerDegLng;
  const py = (pLat - aLat) * metersPerDegLat;
  const bx = (bLng - aLng) * metersPerDegLng;
  const by = (bLat - aLat) * metersPerDegLat;

  const segLengthSq = bx * bx + by * by;
  if (segLengthSq === 0) {
    return Math.hypot(px, py);
  }

  // Project P onto segment AB, clamped to [0, 1]
  const t = Math.max(0, Math.min(1, (px * bx + py * by) / segLengthSq));
  const projX = t * bx;
  const projY = t * by;

  return Math.hypot(px - projX, py - projY);
};

/**
 * Calculates the shortest perpendicular distance in meters from a point to an array
 * of polyline vertices (e.g. from Directions route path).
 *
 * @param {{ lat: number, lng: number }} point
 * @param {Array<{ lat: number, lng: number }>} pathPoints
 * @returns {number} Minimum distance in meters
 */
export const pointToPolylineDistanceMeters = (point, pathPoints) => {
  if (!point || !Array.isArray(pathPoints) || pathPoints.length < 2) {
    return 0;
  }
  if (!isValidCoord(point.lat, point.lng)) return 0;

  let minDistance = Infinity;

  for (let i = 0; i < pathPoints.length - 1; i++) {
    const a = pathPoints[i];
    const b = pathPoints[i + 1];
    const aLat = typeof a.lat === 'function' ? a.lat() : a.lat;
    const aLng = typeof a.lng === 'function' ? a.lng() : a.lng;
    const bLat = typeof b.lat === 'function' ? b.lat() : b.lat;
    const bLng = typeof b.lng === 'function' ? b.lng() : b.lng;

    const d = pointToSegmentDistanceMeters(point.lat, point.lng, aLat, aLng, bLat, bLng);
    if (d < minDistance) {
      minDistance = d;
      // Early exit if on route
      if (minDistance <= 10) return minDistance;
    }
  }

  return minDistance;
};

// ── Presentation Formatters ──────────────────────────────────────────────────
/**
 * Format meters or km into clean road distance string.
 */
export const formatRoadDistance = (meters) => {
  if (meters == null || Number.isNaN(Number(meters))) return '—';
  const m = Number(meters);
  if (m < 900) {
    return `${Math.round(m / 10) * 10} m`;
  }
  return `${(m / 1000).toFixed(1)} km`;
};

/**
 * Format duration in seconds into clean ETA string.
 */
export const formatRoadEta = (seconds) => {
  if (seconds == null || Number.isNaN(Number(seconds))) return '—';
  const s = Number(seconds);
  const mins = Math.ceil(s / 60);
  if (mins <= 1) return '1 min';
  return `${mins} min`;
};
