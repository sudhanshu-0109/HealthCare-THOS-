/**
 * utils/googleMapsLoader.js — Singleton loader for the Google Maps JavaScript API.
 *
 * Uses @googlemaps/js-api-loader to load the API once and cache the result.
 * Import and call `loadGoogleMaps()` anywhere in the app; subsequent calls
 * return the already-loaded instance without re-fetching the script.
 *
 * Required Google Cloud APIs:
 *   - Maps JavaScript API    (map rendering, markers)
 *   - Routes API             (real road routes, traffic-aware ETA — replaces deprecated Directions API)
 *   - Maps JavaScript API: Geometry library  (encodedPolyline decoding)
 *
 * Environment variable:
 *   VITE_GOOGLE_MAPS_API_KEY  — set in frontend/.env (git-ignored)
 */

import { Loader } from '@googlemaps/js-api-loader';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

let _loaderPromise = null;

/**
 * loadGoogleMaps() — returns a promise that resolves to `window.google.maps`.
 * Throws a descriptive error if the API key is missing.
 */
export const loadGoogleMaps = () => {
  if (_loaderPromise) return _loaderPromise;

  if (!API_KEY) {
    _loaderPromise = Promise.reject(
      new Error(
        'Google Maps API key is not configured. ' +
        'Add VITE_GOOGLE_MAPS_API_KEY to frontend/.env and restart the dev server. ' +
        'Enable Maps JavaScript API and Routes API in Google Cloud Console.'
      )
    );
    return _loaderPromise;
  }

  const loader = new Loader({
    apiKey: API_KEY,
    version: 'weekly',
    libraries: ['maps', 'marker', 'routes', 'geometry'],
  });

  _loaderPromise = loader.load().then(() => window.google.maps);
  return _loaderPromise;
};

/** Reset the cached promise — for testing or forced re-load. */
export const _resetGoogleMapsLoader = () => {
  _loaderPromise = null;
};
