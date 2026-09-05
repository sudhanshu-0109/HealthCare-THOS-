/**
 * hooks/useGeolocation.js
 *
 * Returns the user's live GPS position using watchPosition so distance
 * calculations update as the user moves.
 *
 * Returns:
 *   location: { latitude, longitude } | null
 *   error: string | null
 *   loading: boolean  (true until first fix arrives or fails)
 */
import { useState, useEffect, useRef } from 'react';

export const useGeolocation = () => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const watchIdRef = useRef(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000, // cache for 30s — avoids hammering GPS
    };

    const onSuccess = (position) => {
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      });
      setLoading(false);
      setError(null);
    };

    const onError = (err) => {
      setError(err.message);
      setLoading(false);
      // Don't clear an already-resolved location on a subsequent watch error
    };

    // Start watching so position updates as user moves
    watchIdRef.current = navigator.geolocation.watchPosition(onSuccess, onError, options);

    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Expose both `location` (correct) and `coords` (alias for backward compat)
  return { location, coords: location, error, loading };
};
