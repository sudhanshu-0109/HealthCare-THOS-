/**
 * utils/navigation.js — Hospital navigation helpers for Healthcare+
 *
 * Opens Google Maps directions in a new browser tab using:
 *   - Device GPS (if available) as the starting point, OR
 *   - Hospital name + city as the starting point fallback.
 *
 * No embedded maps UI required — pure external navigation link.
 */

/**
 * Opens Google Maps directions to a hospital in a new tab.
 *
 * Attempts to get the user's current GPS coordinates first.
 * Falls back gracefully to a plain Google Maps destination search if GPS is unavailable.
 *
 * @param {Object} hospital - Hospital object
 * @param {string} hospital.name - Hospital display name
 * @param {number} hospital.latitude - Hospital latitude
 * @param {number} hospital.longitude - Hospital longitude
 * @param {string} [hospital.address] - Hospital address (used as fallback label)
 * @param {string} [hospital.city] - Hospital city
 */
export const openHospitalDirections = (hospital) => {
  if (!hospital) return;

  const destLat = hospital.latitude;
  const destLng = hospital.longitude;
  const destLabel = encodeURIComponent(`${hospital.name}, ${hospital.city || 'Vadodara'}`);

  const buildMapsUrl = (originLat, originLng) => {
    if (originLat != null && originLng != null) {
      // Precise directions: origin GPS → destination GPS
      return `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${destLat},${destLng}&travelmode=driving`;
    }
    // Fallback: destination-only search (Google Maps picks up user location automatically)
    return `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&destination_place_id=${destLabel}&travelmode=driving`;
  };

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const url = buildMapsUrl(position.coords.latitude, position.coords.longitude);
        window.open(url, '_blank', 'noopener,noreferrer');
      },
      (_err) => {
        // GPS denied or unavailable — open destination-only
        const url = buildMapsUrl(null, null);
        window.open(url, '_blank', 'noopener,noreferrer');
      },
      { timeout: 5000, maximumAge: 60000 }
    );
  } else {
    // Geolocation not supported
    const url = buildMapsUrl(null, null);
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};

/**
 * Returns a static Google Maps embed URL for a hospital location.
 * (Not used for navigation — use openHospitalDirections for that.)
 *
 * @param {number} latitude
 * @param {number} longitude
 * @param {string} [label]
 * @returns {string} Google Maps URL
 */
export const getHospitalMapUrl = (latitude, longitude, label) => {
  const q = label
    ? encodeURIComponent(label)
    : `${latitude},${longitude}`;
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
};
