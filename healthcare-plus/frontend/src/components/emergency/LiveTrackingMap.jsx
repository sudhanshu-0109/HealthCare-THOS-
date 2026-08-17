/**
 * components/emergency/LiveTrackingMap.jsx — Uber/Ola-style ambulance live tracker.
 *
 * Map:      MapLibre GL JS  (maplibre-gl)
 * Tiles:    OpenFreeMap     (tiles.openfreemap.org) — free, keyless
 * Routing:  OSRM            (router.project-osrm.org) — free, keyless
 * Location: Props from EmergencyTracking.jsx, driven by Socket.IO
 *
 * Props:
 *   patientLat, patientLng   — real patient GPS
 *   driverLat,  driverLng    — live ambulance GPS (updated via socket)
 *   status                   — EmergencyStatus string
 *   driverName, vehicleNumber
 *   distanceKm, etaMin       — passed down; updated by onRouteUpdate callback
 *   onRouteUpdate({ distanceKm, etaMin }) — called after each OSRM fetch
 *   socketConnected          — boolean from parent (shows reconnecting banner)
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { Map as MapLibreMap, Marker, NavigationControl, LngLatBounds } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapPin, Ambulance, Navigation, AlertTriangle, RefreshCw, WifiOff } from 'lucide-react';

// ── Map style ─────────────────────────────────────────────────────────────────
// IMPORTANT: Must use OpenFreeMap. The previous CartoDB URL
// (basemaps.cartocdn.com/gl/voyager-gl-style/style.json) has CORS/auth issues
// and was the direct root cause of the map never reaching the 'load' event.
const MAP_STYLE =
  import.meta.env.VITE_MAP_STYLE_URL ||
  'https://tiles.openfreemap.org/styles/liberty';

// ── Coordinate validation ─────────────────────────────────────────────────────
const isValidCoord = (lat, lng) =>
  Number.isFinite(lat) &&
  Number.isFinite(lng) &&
  lat >= -90 && lat <= 90 &&
  lng >= -180 && lng <= 180;

// ── Patient marker — pulsing red dot ─────────────────────────────────────────
const makePatientEl = () => {
  if (!document.getElementById('hc-map-pulse-style')) {
    const s = document.createElement('style');
    s.id = 'hc-map-pulse-style';
    s.textContent = '@keyframes hc-ping{75%,100%{transform:scale(2.2);opacity:0}}';
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

// ── Ambulance marker — SVG icon ───────────────────────────────────────────────
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
  label.textContent = '\uD83D\uDE91 Ambulance';
  label.style.cssText =
    'margin-top:2px;white-space:nowrap;font-size:10px;font-weight:700;' +
    'color:#0891b2;text-shadow:0 1px 3px rgba(0,0,0,0.8);';

  wrap.appendChild(svg);
  wrap.appendChild(label);
  return wrap;
};

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
const animateMarker = (marker, fromLngLat, toLngLat, durationMs) => {
  const dur = durationMs || 800;
  const start = performance.now();
  const [fromLng, fromLat] = fromLngLat;
  const [toLng, toLat] = toLngLat;

  const step = (now) => {
    const t = Math.min((now - start) / dur, 1);
    const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    marker.setLngLat([
      fromLng + (toLng - fromLng) * ease,
      fromLat + (toLat - fromLat) * ease,
    ]);
    if (t < 1) requestAnimationFrame(step);
  };

  requestAnimationFrame(step);
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
  const mapRef = useRef(null);
  const patientMarkerRef = useRef(null);
  const driverMarkerRef = useRef(null);
  const driverPosRef = useRef(null);    // last rendered driver [lng, lat]
  const mapReadyRef = useRef(false);    // ref for stale-closure safety inside map event handlers

  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [mapErrorMsg, setMapErrorMsg] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  const [isFollowing, setIsFollowing] = useState(true);
  const isFollowingRef = useRef(true);

  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState(false);

  const lastRouteFetchRef = useRef(0);      // ms timestamp of last OSRM fetch
  const lastRoutePosRef = useRef(null);     // [lat, lng] at last fetch
  const initialFitDoneRef = useRef(false);  // fit-bounds only once

  const hasPatient = isValidCoord(patientLat, patientLng);
  const hasDriver = isValidCoord(driverLat, driverLng);
  const statusLabel = String(_status).replace(/_/g, ' ');

  // ── Map initialisation — once per mount (or retry) ────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current) return undefined;

    // Destroy stale instance on retry
    if (mapRef.current) {
      if (mapRef.current._roCleanup) mapRef.current._roCleanup();
      mapRef.current.remove();
      mapRef.current = null;
      patientMarkerRef.current = null;
      driverMarkerRef.current = null;
      mapReadyRef.current = false;
      initialFitDoneRef.current = false;
      setMapReady(false);
    }

    setMapError(false);
    setMapErrorMsg('');

    let cancelled = false;

    try {
      const initialCenter = hasPatient
        ? [patientLng, patientLat]
        : hasDriver
          ? [driverLng, driverLat]
          : [73.1812, 22.3072]; // Vadodara fallback

      const map = new MapLibreMap({
        container: mapContainerRef.current,
        style: MAP_STYLE,
        center: initialCenter,
        zoom: (hasPatient || hasDriver) ? 14 : 5,
        failIfMajorPerformanceCaveat: false,
        attributionControl: false,
      });

      map.addControl(
        new NavigationControl({ showCompass: false }),
        'top-right'
      );

      // Disable auto-follow on user map interaction
      const stopFollowing = () => {
        if (isFollowingRef.current) {
          isFollowingRef.current = false;
          setIsFollowing(false);
        }
      };
      map.on('dragstart', stopFollowing);
      map.on('zoomstart', (e) => { if (e.originalEvent) stopFollowing(); });

      // Log all MapLibre events — visible in browser DevTools console
      map.on('style.load', () => {
        console.log('[LiveTrackingMap] style.load OK — style URL:', MAP_STYLE);
      });

      map.on('load', () => {
        console.log('[LiveTrackingMap] map.load OK — map fully ready');
        if (cancelled) return;
        try {
          map.addSource('emergency-route', {
            type: 'geojson',
            data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } },
          });
          map.addLayer({
            id: 'emergency-route-line',
            type: 'line',
            source: 'emergency-route',
            layout: { 'line-cap': 'round', 'line-join': 'round' },
            paint: {
              'line-color': '#0891b2',
              'line-width': 4,
              'line-dasharray': [2, 1.2],
              'line-opacity': 0.85,
            },
          });
          mapReadyRef.current = true;
          setMapReady(true);
        } catch (err) {
          console.error('[LiveTrackingMap] Error in load handler:', err);
          if (!cancelled) {
            setMapErrorMsg('Layer setup failed: ' + err.message);
            setMapError(true);
          }
        }
      });

      map.on('error', (e) => {
        // Log ALL map errors visibly in DevTools — check Network tab if this fires.
        const err = (e && e.error) ? e.error : e;
        console.warn('[LiveTrackingMap] MapLibre error event (non-fatal, logged only):', err);
        //
        // IMPORTANT: Do NOT set mapError here for pre-load 404 errors.
        //
        // MapLibre fires 'error' for individual tile/glyph/sprite 404s — these are
        // non-fatal. If we set mapError = true and hide the container, MapLibre's
        // canvas loses its dimensions and the 'load' event can never fire, which
        // is exactly what caused the 15-second timeout loop.
        //
        // The 15-second timeout below is the real safety net for a truly broken map.
        // Only post-load tile blips are explicitly ignored.
        if (cancelled || mapReadyRef.current) {
          // Tile blip after map.load — definitely non-fatal, ignore.
          return;
        }
        // Pre-load errors: log with full context so the developer can investigate,
        // but do NOT trigger the error UI — let the map keep trying to load.
        console.warn(
          '[LiveTrackingMap] Pre-load error (map still initializing — will wait for 15s timeout):',
          typeof err === 'object' ? JSON.stringify(err) : String(err)
        );
      });

      mapRef.current = map;

      // Resize map when container dimensions change
      if (typeof ResizeObserver !== 'undefined' && mapContainerRef.current) {
        const ro = new ResizeObserver(() => {
          if (mapRef.current) mapRef.current.resize();
        });
        ro.observe(mapContainerRef.current);
        map._roCleanup = () => ro.disconnect();
      }

      // 15-second fallback timeout — only fires if map never reaches 'load'.
      // Logs the exact style URL so the developer can check what failed in DevTools.
      const timeoutId = setTimeout(() => {
        if (!mapReadyRef.current && !cancelled) {
          console.warn(
            '[LiveTrackingMap] 15s timeout: map still not ready.',
            'Style URL:', MAP_STYLE,
            '— Open DevTools → Network tab and filter for the style URL to see the error.'
          );
          setMapErrorMsg(
            'Map tiles timed out after 15s. Check network access to: ' +
            MAP_STYLE.slice(0, 60) + '…'
          );
          setMapError(true);
        }
      }, 15000);
      map._timeoutCleanup = () => clearTimeout(timeoutId);

    } catch (err) {
      console.error('[LiveTrackingMap] MapLibre constructor threw:', err);
      if (!cancelled) {
        setMapErrorMsg(err.message || 'MapLibre failed to initialize');
        setMapError(true);
      }
    }

    return () => {
      cancelled = true;
      if (mapRef.current) {
        if (mapRef.current._roCleanup) mapRef.current._roCleanup();
        if (mapRef.current._timeoutCleanup) mapRef.current._timeoutCleanup();
        mapRef.current.remove();
        mapRef.current = null;
      }
      patientMarkerRef.current = null;
      driverMarkerRef.current = null;
      mapReadyRef.current = false;
      initialFitDoneRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryKey]);

  // ── OSRM route fetch — throttled (15s elapsed AND 150m moved) ────────────
  const fetchRoute = useCallback(async () => {
    if (!mapRef.current || !mapReadyRef.current) return;
    if (!hasPatient || !hasDriver) return;

    const now = Date.now();
    const THROTTLE_MS = 15000; // 15 seconds minimum between fetches
    const MIN_MOVE_M = 150;    // 150 metres minimum movement

    const elapsed = now - lastRouteFetchRef.current;
    const movedEnough = !lastRoutePosRef.current ||
      haversineM(
        lastRoutePosRef.current[0], lastRoutePosRef.current[1],
        driverLat, driverLng
      ) >= MIN_MOVE_M;

    if (elapsed < THROTTLE_MS && !movedEnough) return;

    lastRouteFetchRef.current = now;
    lastRoutePosRef.current = [driverLat, driverLng];

    setRouteLoading(true);
    setRouteError(false);

    try {
      // OSRM coordinate order: longitude,latitude (NOT lat,lng — this is critical)
      const url =
        'https://router.project-osrm.org/route/v1/driving/' +
        driverLng + ',' + driverLat + ';' +
        patientLng + ',' + patientLat +
        '?overview=full&geometries=geojson';

      const res = await fetch(url);
      if (!res.ok) throw new Error('OSRM HTTP ' + res.status);
      const data = await res.json();

      if (data.code === 'Ok' && data.routes && data.routes[0]) {
        const route = data.routes[0];
        const map = mapRef.current;
        if (!map) return;

        const src = map.getSource('emergency-route');
        if (src) src.setData({ type: 'Feature', geometry: route.geometry });

        const calcDistKm = route.distance / 1000;
        const calcEtaMin = Math.ceil(route.duration / 60);
        if (onRouteUpdate) onRouteUpdate({ distanceKm: calcDistKm, etaMin: calcEtaMin });

        // Fit bounds only on the very first successful route fetch
        if (!initialFitDoneRef.current && isFollowingRef.current) {
          const bounds = new LngLatBounds();
          route.geometry.coordinates.forEach((c) => bounds.extend(c));
          map.fitBounds(bounds, { padding: 80, maxZoom: 15, duration: 700 });
          initialFitDoneRef.current = true;
        }
      } else {
        throw new Error((data && data.code) ? data.code : 'No route found');
      }
    } catch (err) {
      console.warn('[LiveTrackingMap] OSRM routing failed — straight-line fallback:', err.message);
      setRouteError(true);

      // Render a straight line between ambulance and patient as fallback
      const map = mapRef.current;
      if (map) {
        const src = map.getSource('emergency-route');
        if (src) {
          src.setData({
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: [[driverLng, driverLat], [patientLng, patientLat]],
            },
          });
        }
      }
    } finally {
      setRouteLoading(false);
    }
  }, [driverLat, driverLng, patientLat, patientLng, hasPatient, hasDriver, onRouteUpdate]);

  // ── Sync markers and viewport whenever coords change ──────────────────────
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;

    // Patient marker — created once, position updated thereafter
    if (hasPatient) {
      const pos = [patientLng, patientLat];
      if (!patientMarkerRef.current) {
        patientMarkerRef.current = new Marker({
          element: makePatientEl(),
          anchor: 'bottom',
        })
          .setLngLat(pos)
          .addTo(map);
      } else {
        patientMarkerRef.current.setLngLat(pos);
      }
    }

    // Ambulance marker — smooth animation to new position
    if (hasDriver) {
      const pos = [driverLng, driverLat];
      if (!driverMarkerRef.current) {
        driverMarkerRef.current = new Marker({
          element: makeAmbulanceEl(),
          anchor: 'bottom',
        })
          .setLngLat(pos)
          .addTo(map);
        driverPosRef.current = pos;
      } else {
        const from = driverPosRef.current || pos;
        animateMarker(driverMarkerRef.current, from, pos, 800);
        driverPosRef.current = pos;
      }

      // Pan to follow ambulance if follow mode is active
      if (isFollowingRef.current) {
        map.easeTo({ center: pos, duration: 500 });
      }
    }

    // Initial fit-bounds when both markers first appear (before first route fetch)
    if (hasPatient && hasDriver && !initialFitDoneRef.current) {
      const bounds = new LngLatBounds();
      bounds.extend([patientLng, patientLat]);
      bounds.extend([driverLng, driverLat]);
      map.fitBounds(bounds, { padding: 80, maxZoom: 15, duration: 700 });
      initialFitDoneRef.current = true;
    } else if (hasPatient && !hasDriver && !initialFitDoneRef.current) {
      map.easeTo({ center: [patientLng, patientLat], zoom: 14, duration: 500 });
      initialFitDoneRef.current = true;
    }

    // Throttled OSRM route fetch
    fetchRoute();
  }, [mapReady, patientLat, patientLng, driverLat, driverLng, hasPatient, hasDriver, fetchRoute]);

  // ── Re-center / Follow Ambulance handler ─────────────────────────────────
  const handleRecenter = () => {
    isFollowingRef.current = true;
    setIsFollowing(true);
    const map = mapRef.current;
    if (!map) return;

    if (hasPatient && hasDriver) {
      const bounds = new LngLatBounds();
      bounds.extend([patientLng, patientLat]);
      bounds.extend([driverLng, driverLat]);
      map.fitBounds(bounds, { padding: 80, maxZoom: 15, duration: 700 });
    } else if (hasDriver) {
      map.easeTo({ center: [driverLng, driverLat], zoom: 15, duration: 500 });
    } else if (hasPatient) {
      map.easeTo({ center: [patientLng, patientLat], zoom: 14, duration: 500 });
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">

      {/* ── Map viewport — must always have explicit height ─────────────── */}
      <div className="relative bg-slate-100" style={{ height: '320px' }}>

        {/*
         * MapLibre canvas container.
         * CRITICAL: Must always be in the DOM (not conditional) so the ref
         * is always valid during useEffect. Hidden via display:none when
         * showing the error fallback instead.
         */}
        <div
          ref={mapContainerRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            // NEVER use display:none — MapLibre needs the canvas to have real dimensions
            // at all times. If the container is hidden before load, the 'load' event
            // never fires. The error overlay (below) sits on top with z-index instead.
          }}
        />

        {/* ── Error fallback — sits ON TOP of map (z-index), never hides canvas ── */}
        {mapError && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 p-6 text-center bg-slate-50/98">
            <div className="w-14 h-14 rounded-full bg-slate-200 flex items-center justify-center">
              <MapPin className="w-7 h-7 text-slate-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">Live map unavailable</p>
              <p className="text-xs text-slate-400 mt-0.5 max-w-xs">
                {mapErrorMsg || 'Map tiles could not be loaded. Check your network connection.'}
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

        {/* ── Loading skeleton ────────────────────────────────────────── */}
        {!mapError && !mapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100/80 pointer-events-none">
            <div className="flex items-center gap-2 text-slate-500 text-sm bg-white px-4 py-2 rounded-full shadow-sm">
              <Navigation className="w-4 h-4 animate-pulse text-cyan-500" />
              Loading live map…
            </div>
          </div>
        )}

        {/* ── Socket disconnected banner ──────────────────────────────── */}
        {!_socketConnected && mapReady && (
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-center gap-2 px-3 py-1.5 bg-amber-500/95 text-white text-xs font-semibold pointer-events-none">
            <WifiOff className="w-3.5 h-3.5" />
            Live location temporarily disconnected — reconnecting…
          </div>
        )}

        {/* ── Status pill ─────────────────────────────────────────────── */}
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

        {/* ── Route-error badge ────────────────────────────────────────── */}
        {routeError && !routeLoading && mapReady && (
          <div className="absolute top-3 right-12 z-10 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 border border-amber-300 shadow-sm pointer-events-none">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            <span className="text-[10px] font-semibold text-amber-700">Straight-line only</span>
          </div>
        )}

        {/* ── Map legend ──────────────────────────────────────────────── */}
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

        {/* ── Follow / Re-center button ────────────────────────────────── */}
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
