/**
 * utils/distance.js — Real geospatial helpers for the frontend.
 *
 * Haversine great-circle distance + a distance-based ETA estimate. These are REAL
 * computations from live coordinates (recomputed on every location update) — never
 * a decrementing timer or a hardcoded countdown.
 */

/**
 * Great-circle distance between two lat/lng points, in kilometres.
 * Returns null if any coordinate is missing/NaN.
 */
export const haversineKm = (lat1, lng1, lat2, lng2) => {
  if ([lat1, lng1, lat2, lng2].some((v) => v == null || Number.isNaN(Number(v)))) return null;
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// City ambulance average speed (~40 km/h). Used only when a route-based ETA
// (Google Directions) is unavailable.
const AVG_SPEED_KMH = 40;

/**
 * Distance-based ETA in whole minutes (min 1). Returns null if distance is unknown.
 */
export const estimateEtaMin = (km) => {
  if (km == null || Number.isNaN(Number(km))) return null;
  return Math.max(1, Math.round((km / AVG_SPEED_KMH) * 60));
};
