/**
 * components/emergency/LiveTrackingMap.jsx — Uber/Ola-style ambulance live tracker.
 *
 * Map:      Google Maps JavaScript API  (@googlemaps/js-api-loader)
 * Routing:  Google Maps Directions API  (real road routes, distance, ETA)
 * Location: Props from EmergencyTracking.jsx, driven by real Socket.IO updates
 *
 * Props:
 *   patientLat, patientLng   — real patient GPS
 *   driverLat,  driverLng    — live ambulance GPS (updated via socket)
 *   status                   — EmergencyStatus string
 *   driverName, vehicleNumber
 *   distanceKm, etaMin       — passed down; updated by onRouteUpdate callback
 *   onRouteUpdate({ distanceKm, etaMin }) — called after each Directions fetch
 *   socketConnected          — boolean from parent (shows reconnecting banner)
 *
 * Required Google Cloud APIs:
 *   - Maps JavaScript API
 *   - Directions API
 *
 * API Key: VITE_GOOGLE_MAPS_API_KEY in frontend/.env (git-ignored, never hardcoded)
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { loadGoogleMaps } from '../../utils/googleMapsLoader';
import { MapPin, Ambulance, Navigation, AlertTriangle, RefreshCw, WifiOff } from 'lucide-react';

// ── Coordinate validation ─────────────────────────────────────────────────────
const isValidCoord = (lat, lng) =>
  Number.isFinite(lat) &&
  Number.isFinite(lng) &&
  lat >= -90 && lat <= 90 &&
  lng >= -180 && lng <= 180;

// ── Haversine distance (metres) ───────────────────────────────────────────────
const haversineM = (lat1, lng1, lat2, lng2) => {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ── Smooth marker movement via requestAnimationFrame ─────────────────────────
// Interpolates a google.maps.marker.AdvancedMarkerElement between two positions.
const animateMarker = (marker, fromLat, fromLng, toLat, toLng, durationMs = 800) => {
  const start = performance.now();
  const step = (now) => {
    const t = Math.min((now - start) / durationMs, 1);
    // cubic ease-in-out
    const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const lat = fromLat + (toLat - fromLat) * ease;
    const lng = fromLng + (toLng - fromLng) * ease;
    marker.position = { lat, lng };
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
};

// ── Create patient marker element — pulsing red dot ───────────────────────────
const makePatientEl = () => {
  // Inject pulse keyframe once
  if (!document.getElementById('hc-map-pulse-style')) {
    const s = document.createElement('style');
    s.id = 'hc-map-pulse-style';
    s.textContent = '@keyframes hc-ping{75%,100%{transform:scale(2.4);opacity:0}}';
    document.head.appendChild(s);
  }
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:relative;width:28px;height:28px;cursor:default;';

  const ring = document.createElement('div');
  ring.style.cssText =
    'position:absolute;inset:0;border-radius:9999px;background:rgba(239,68,68,0.3);' +
    'animation:hc-ping 1.6s cubic-bezier(0,0,0.2,1) infinite;';

  const dot = document.createElement('div');
  dot.style.cssText =
    'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);' +
    'width:16px;height:16px;border-radius:9999px;background:#ef4444;' +
    'border:2.5px solid #ffffff;box-shadow:0 2px 8px rgba(0,0,0,0.4);';

  const label = document.createElement('div');
  label.textContent = 'You';
  label.style.cssText =
    'position:absolute;top:100%;left:50%;transform:translateX(-50%);' +
    'margin-top:3px;white-space:nowrap;font-size:10px;font-weight:700;' +
    'color:#ef4444;text-shadow:0 1px 3px rgba(0,0,0,0.8);';

  wrap.appendChild(ring);
  wrap.appendChild(dot);
  wrap.appendChild(label);
  return wrap;
};

// ── Create ambulance marker element — SVG icon ────────────────────────────────
const makeAmbulanceEl = () => {
  const wrap = document.createElement('div');
  wrap.style.cssText =
    'position:relative;display:flex;flex-direction:column;align-items:center;cursor:default;';

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '36');
  svg.setAttribute('height', '36');
  svg.setAttribute('viewBox', '0 0 36 36');
  svg.style.cssText = 'filter:drop-shadow(0 2px 6px rgba(0,0,0,0.45));';
  svg.innerHTML =
    '<rect x="3" y="12" width="30" height="18" rx="3" fill="#0891b2"/>' +
    '<rect x="16" y="6" width="17" height="12" rx="2" fill="#0e7490"/>' +
    '<circle cx="10" cy="20" r="5" fill="white"/>' +
    '<rect x="8.5" y="17" width="3" height="6" rx="0.5" fill="#ef4444"/>' +
    '<rect x="7" y="18.5" width="6" height="3" rx="0.5" fill="#ef4444"/>' +
    '<rect x="19" y="8" width="12" height="7" rx="1.5" fill="#bae6fd" opacity="0.9"/>' +
    '<circle cx="8" cy="30" r="3" fill="#1e293b"/>' +
    '<circle cx="8" cy="30" r="1.5" fill="#475569"/>' +
    '<circle cx="28" cy="30" r="3" fill="#1e293b"/>' +
    '<circle cx="28" cy="30" r="1.5" fill="#475569"/>' +
    '<rect x="12" y="4" width="6" height="3" rx="1" fill="#ef4444"/>' +
    '<rect x="19" y="4" width="6" height="3" rx="1" fill="#3b82f6"/>';

  const label = document.createElement('div');
  label.textContent = '🚑 Ambulance';
  label.style.cssText =
    'margin-top:2px;white-space:nowrap;font-size:10px;font-weight:700;' +
    'color:#0891b2;text-shadow:0 1px 3px rgba(0,0,0,0.8);';

  wrap.appendChild(svg);
  wrap.appendChild(label);
  return wrap;
};

// ─────────────────────────────────────────────────────────────────────────────

export default function LiveTrackingMap({
  patientLat,
  patientLng,
  driverLat,
  driverLng,
  status,
  driverName,
  vehicleNumber,
  distanceKm,
  etaMin,
  onRouteUpdate,
  socketConnected,
}) {
  const _status = status || 'SEARCHING';
  const _socketConnected = socketConnected !== false; // default true

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);               // google.maps.Map instance
  const mapsApiRef = useRef(null);           // google.maps namespace
  const patientMarkerRef = useRef(null);     // AdvancedMarkerElement for patient
  const driverMarkerRef = useRef(null);      // AdvancedMarkerElement for driver
  const driverPosRef = useRef(null);         // { lat, lng } last rendered driver position
  const directionsRendererRef = useRef(null);
  const initialFitDoneRef = useRef(false);
  const lastRouteFetchRef = useRef(0);
  const lastRoutePosRef = useRef(null);
  const isFollowingRef = useRef(true);

  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [mapErrorMsg, setMapErrorMsg] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const [isFollowing, setIsFollowing] = useState(true);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState(false);

  const hasPatient = isValidCoord(patientLat, patientLng);
  const hasDriver = isValidCoord(driverLat, driverLng);
  const statusLabel = String(_status).replace(/_/g, ' ');

  // ── Map initialisation — once per mount (or retry) ────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current) return undefined;
    let cancelled = false;

    // Destroy stale instance on retry
    if (mapRef.current) {
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
        directionsRendererRef.current = null;
      }
      if (patientMarkerRef.current) {
        patientMarkerRef.current.map = null;
        patientMarkerRef.current = null;
      }
      if (driverMarkerRef.current) {
        driverMarkerRef.current.map = null;
        driverMarkerRef.current = null;
      }
      mapRef.current = null;
      mapsApiRef.current = null;
      initialFitDoneRef.current = false;
      setMapReady(false);
    }

    setMapError(false);
    setMapErrorMsg('');

    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !mapContainerRef.current) return;
        mapsApiRef.current = maps;

        const initialCenter = hasPatient
          ? { lat: patientLat, lng: patientLng }
          : hasDriver
            ? { lat: driverLat, lng: driverLng }
            : { lat: 22.3072, lng: 73.1812 }; // Vadodara fallback

        const map = new maps.Map(mapContainerRef.current, {
          center: initialCenter,
          zoom: (hasPatient || hasDriver) ? 14 : 5,
          mapId: 'healthcare_emergency_map',
          disableDefaultUI: true,   // we supply our own controls
          gestureHandling: 'greedy',
          clickableIcons: false,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        // Stop auto-follow when user manually interacts with the map
        const stopFollowing = () => {
          if (isFollowingRef.current) {
            isFollowingRef.current = false;
            setIsFollowing(false);
          }
        };
        map.addListener('dragstart', stopFollowing);
        map.addListener('zoom_changed', () => {
          // Only stop following on programmatic zoom changes triggered by user
          // We can't tell the difference easily, so we check a flag
          if (!isFollowingRef._programmatic) stopFollowing();
        });

        // Directions renderer — draws real road route
        const renderer = new maps.DirectionsRenderer({
          map,
          suppressMarkers: true, // we draw our own markers
          polylineOptions: {
            strokeColor: '#0891b2',
            strokeWeight: 4,
            strokeOpacity: 0.85,
          },
        });
        directionsRendererRef.current = renderer;

        mapRef.current = map;
        if (!cancelled) setMapReady(true);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('[LiveTrackingMap] Google Maps load error:', err.message);
        setMapErrorMsg(err.message || 'Google Maps could not be loaded.');
        setMapError(true);
      });

    return () => {
      cancelled = true;
      // Markers and renderer are cleaned up inside the effect when retryKey changes
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryKey]);

  // ── Fetch real road route via Google Directions Service ───────────────────
  const fetchRoute = useCallback(() => {
    const maps = mapsApiRef.current;
    const map = mapRef.current;
    if (!maps || !map || !mapReady) return;
    if (!hasPatient || !hasDriver) return;

    const now = Date.now();
    const THROTTLE_MS = 15000; // 15 seconds minimum between fetches
    const MIN_MOVE_M = 150;    // 150 metres minimum driver movement

    const elapsed = now - lastRouteFetchRef.current;
    const movedEnough = !lastRoutePosRef.current ||
      haversineM(
        lastRoutePosRef.current.lat, lastRoutePosRef.current.lng,
        driverLat, driverLng
      ) >= MIN_MOVE_M;

    if (elapsed < THROTTLE_MS && !movedEnough) return;

    lastRouteFetchRef.current = now;
    lastRoutePosRef.current = { lat: driverLat, lng: driverLng };

    setRouteLoading(true);
    setRouteError(false);

    const directionsService = new maps.DirectionsService();
    directionsService.route(
      {
        origin: { lat: driverLat, lng: driverLng },
        destination: { lat: patientLat, lng: patientLng },
        travelMode: maps.TravelMode.DRIVING,
        drivingOptions: {
          departureTime: new Date(),
          trafficModel: maps.TrafficModel.BEST_GUESS,
        },
      },
      (result, dirStatus) => {
        setRouteLoading(false);
        if (dirStatus === maps.DirectionsStatus.OK && result.routes[0]) {
          directionsRendererRef.current?.setDirections(result);

          const leg = result.routes[0].legs[0];
          const calcDistKm = leg.distance.value / 1000;
          const calcEtaMin = Math.ceil(
            (leg.duration_in_traffic?.value ?? leg.duration.value) / 60
          );
          if (onRouteUpdate) onRouteUpdate({ distanceKm: calcDistKm, etaMin: calcEtaMin });

          // Fit bounds on very first successful route (uses route bounding box)
          if (!initialFitDoneRef.current && isFollowingRef.current) {
            map.fitBounds(result.routes[0].bounds, 80);
            initialFitDoneRef.current = true;
          }
        } else {
          console.warn('[LiveTrackingMap] Google Directions failed:', dirStatus, '— straight-line fallback');
          setRouteError(true);
          // Clear stale route
          directionsRendererRef.current?.setDirections({ routes: [] });

          // Fallback: draw a straight-line polyline
          new maps.Polyline({
            path: [
              { lat: driverLat, lng: driverLng },
              { lat: patientLat, lng: patientLng },
            ],
            geodesic: true,
            strokeColor: '#f59e0b',
            strokeWeight: 3,
            strokeOpacity: 0.8,
            map,
          });

          // Fallback distance/ETA via Haversine
          const fallbackKm = haversineM(driverLat, driverLng, patientLat, patientLng) / 1000;
          const fallbackEta = Math.max(1, Math.round((fallbackKm / 40) * 60));
          if (onRouteUpdate) onRouteUpdate({ distanceKm: fallbackKm, etaMin: fallbackEta });
        }
      }
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driverLat, driverLng, patientLat, patientLng, hasPatient, hasDriver, onRouteUpdate, mapReady]);

  // ── Sync markers and viewport whenever coords change ──────────────────────
  useEffect(() => {
    const maps = mapsApiRef.current;
    const map = mapRef.current;
    if (!mapReady || !maps || !map) return;

    // Patient marker — created once, position updated thereafter
    if (hasPatient) {
      const pos = { lat: patientLat, lng: patientLng };
      if (!patientMarkerRef.current) {
        patientMarkerRef.current = new maps.marker.AdvancedMarkerElement({
          map,
          position: pos,
          content: makePatientEl(),
          zIndex: 10,
        });
      } else {
        patientMarkerRef.current.position = pos;
      }
    }

    // Ambulance marker — smooth animation to new position
    if (hasDriver) {
      const pos = { lat: driverLat, lng: driverLng };
      if (!driverMarkerRef.current) {
        driverMarkerRef.current = new maps.marker.AdvancedMarkerElement({
          map,
          position: pos,
          content: makeAmbulanceEl(),
          zIndex: 20,
        });
        driverPosRef.current = pos;
      } else {
        const from = driverPosRef.current || pos;
        animateMarker(
          driverMarkerRef.current,
          from.lat, from.lng,
          driverLat, driverLng,
          800
        );
        driverPosRef.current = pos;
      }

      // Pan to follow ambulance if follow mode is active
      if (isFollowingRef.current) {
        map.panTo(pos);
      }
    }

    // Initial fit-bounds when both markers first appear (before first route fetch)
    if (hasPatient && hasDriver && !initialFitDoneRef.current) {
      const bounds = new maps.LatLngBounds();
      bounds.extend({ lat: patientLat, lng: patientLng });
      bounds.extend({ lat: driverLat, lng: driverLng });
      isFollowingRef._programmatic = true;
      map.fitBounds(bounds, 80);
      isFollowingRef._programmatic = false;
      // fitBounds fires zoom_changed; mark initial fit
      initialFitDoneRef.current = true;
    } else if (hasPatient && !hasDriver && !initialFitDoneRef.current) {
      isFollowingRef._programmatic = true;
      map.panTo({ lat: patientLat, lng: patientLng });
      map.setZoom(14);
      isFollowingRef._programmatic = false;
      initialFitDoneRef.current = true;
    }

    // Throttled Google Directions route fetch
    fetchRoute();
  }, [mapReady, patientLat, patientLng, driverLat, driverLng, hasPatient, hasDriver, fetchRoute]);

  // ── Re-center / Follow Ambulance handler ─────────────────────────────────
  const handleRecenter = () => {
    isFollowingRef.current = true;
    setIsFollowing(true);
    const maps = mapsApiRef.current;
    const map = mapRef.current;
    if (!map || !maps) return;

    isFollowingRef._programmatic = true;
    if (hasPatient && hasDriver) {
      const bounds = new maps.LatLngBounds();
      bounds.extend({ lat: patientLat, lng: patientLng });
      bounds.extend({ lat: driverLat, lng: driverLng });
      map.fitBounds(bounds, 80);
    } else if (hasDriver) {
      map.panTo({ lat: driverLat, lng: driverLng });
      map.setZoom(15);
    } else if (hasPatient) {
      map.panTo({ lat: patientLat, lng: patientLng });
      map.setZoom(14);
    }
    isFollowingRef._programmatic = false;
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">

      {/* ── Map viewport — must always have explicit height ─────────────── */}
      <div className="relative bg-slate-100" style={{ height: '320px' }}>

        {/*
         * Google Maps canvas container.
         * CRITICAL: Must always be in the DOM (not conditional) so the ref
         * is always valid during useEffect. Error overlay uses z-index.
         */}
        <div
          ref={mapContainerRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
          }}
        />

        {/* ── Error fallback — sits ON TOP of map (z-index) ──────────────── */}
        {mapError && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 p-6 text-center bg-slate-50/98">
            <div className="w-14 h-14 rounded-full bg-slate-200 flex items-center justify-center">
              <MapPin className="w-7 h-7 text-slate-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">Live map unavailable</p>
              <p className="text-xs text-slate-400 mt-0.5 max-w-xs leading-relaxed">
                {mapErrorMsg || 'Google Maps could not be loaded. Check your network or API key configuration.'}
              </p>
            </div>
            {/* Coordinate fallback — always shows real GPS data */}
            <div className="grid grid-cols-2 gap-3 w-full max-w-xs text-left">
              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <span className="block text-[10px] uppercase text-slate-400 mb-0.5">
                  {'📍 You'}
                </span>
                <span className="text-xs font-mono text-slate-700">
                  {hasPatient
                    ? Number(patientLat).toFixed(4) + ', ' + Number(patientLng).toFixed(4)
                    : '—'}
                </span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <span className="block text-[10px] uppercase text-slate-400 mb-0.5">
                  {'🚑 Ambulance'}
                </span>
                <span className="text-xs font-mono text-cyan-700">
                  {hasDriver
                    ? Number(driverLat).toFixed(4) + ', ' + Number(driverLng).toFixed(4)
                    : 'Awaiting…'}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                initialFitDoneRef.current = false;
                lastRouteFetchRef.current = 0;
                lastRoutePosRef.current = null;
                setRetryKey((k) => k + 1);
              }}
              className="flex items-center gap-1.5 text-xs text-cyan-600 hover:text-cyan-800 transition-colors font-medium"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry map
            </button>
          </div>
        )}

        {/* ── Loading skeleton ─────────────────────────────────────────── */}
        {!mapError && !mapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100/80 pointer-events-none">
            <div className="flex items-center gap-2 text-slate-500 text-sm bg-white px-4 py-2 rounded-full shadow-sm">
              <Navigation className="w-4 h-4 animate-pulse text-cyan-500" />
              Loading live map…
            </div>
          </div>
        )}

        {/* ── Socket disconnected banner ────────────────────────────────── */}
        {!_socketConnected && mapReady && (
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-center gap-2 px-3 py-1.5 bg-amber-500/95 text-white text-xs font-semibold pointer-events-none">
            <WifiOff className="w-3.5 h-3.5" />
            Live location temporarily disconnected — reconnecting…
          </div>
        )}

        {/* ── Status pill ──────────────────────────────────────────────── */}
        <div className="absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 border border-slate-200 shadow-sm pointer-events-none">
          <span
            className={
              'w-1.5 h-1.5 rounded-full ' +
              (_status === 'ARRIVED' ? 'bg-emerald-500' : 'bg-red-500 animate-pulse')
            }
          />
          <span className="text-xs font-semibold text-slate-700">{statusLabel}</span>
        </div>

        {/* ── Route-loading badge ──────────────────────────────────────── */}
        {routeLoading && mapReady && (
          <div className="absolute top-3 right-12 z-10 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/90 text-white shadow-sm pointer-events-none">
            <span className="text-[10px] font-semibold">Calculating route…</span>
          </div>
        )}

        {/* ── Route-error badge (straight-line fallback notice) ────────── */}
        {routeError && !routeLoading && mapReady && (
          <div className="absolute top-3 right-12 z-10 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 border border-amber-300 shadow-sm pointer-events-none">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            <span className="text-[10px] font-semibold text-amber-700">Straight-line only</span>
          </div>
        )}

        {/* ── Map legend ───────────────────────────────────────────────── */}
        {mapReady && (
          <div className="absolute bottom-3 left-3 z-10 flex flex-col gap-1 pointer-events-none">
            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/95 border border-slate-200 shadow-sm text-xs text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 border border-white flex-shrink-0" />
              You
            </div>
            {hasDriver && (
              <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/95 border border-slate-200 shadow-sm text-xs text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 border border-white flex-shrink-0" />
                Ambulance
              </div>
            )}
          </div>
        )}

        {/* ── Follow / Re-center button ─────────────────────────────────── */}
        {mapReady && (
          <div className="absolute bottom-3 right-3 z-10">
            <button
              onClick={handleRecenter}
              className={
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-md font-semibold text-xs border transition-colors pointer-events-auto ' +
                (isFollowing
                  ? 'bg-cyan-600 text-white border-cyan-600 hover:bg-cyan-700'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50')
              }
            >
              <Navigation className="w-3 h-3" />
              {isFollowing ? 'Following' : 'Follow Ambulance'}
            </button>
          </div>
        )}
      </div>

      {/* ── ETA / Distance / Vehicle telemetry ───────────────────────────── */}
      <div className="grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100">
        <div className="p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-[10px] uppercase text-slate-400 mb-0.5">
            <Ambulance className="w-3 h-3" /> Vehicle
          </div>
          <p className="text-sm font-bold text-slate-800 font-mono truncate">
            {vehicleNumber || '—'}
          </p>
        </div>
        <div className="p-3 text-center">
          <div className="text-[10px] uppercase text-slate-400 mb-0.5">Distance</div>
          <p className="text-sm font-bold text-slate-800">
            {distanceKm != null ? Number(distanceKm).toFixed(1) + ' km' : '—'}
          </p>
        </div>
        <div className="p-3 text-center">
          <div className="text-[10px] uppercase text-slate-400 mb-0.5">ETA</div>
          <p className="text-sm font-bold text-cyan-700">
            {etaMin != null ? etaMin + ' min' : '—'}
          </p>
        </div>
      </div>

      {/* ── Live-location status note ─────────────────────────────────────── */}
      {(driverName || vehicleNumber) && !mapError && (
        <div className="flex items-center gap-2 px-3 py-2 border-t border-slate-100 bg-slate-50">
          <span
            className={
              'w-2 h-2 rounded-full flex-shrink-0 ' +
              (_socketConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400')
            }
          />
          <span className="text-xs text-slate-500">
            {_socketConnected
              ? 'Ambulance position updates live as the driver moves.'
              : 'Live updates paused — reconnecting…'}
          </span>
        </div>
      )}
    </div>
  );
}
