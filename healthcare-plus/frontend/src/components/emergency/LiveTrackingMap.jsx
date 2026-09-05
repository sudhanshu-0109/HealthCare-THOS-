/**
 * components/emergency/LiveTrackingMap.jsx — Uber/Ola-style ambulance live tracker.
 *
 * Map:      Leaflet.js + OpenStreetMap tiles (completely free, no API key)
 * Routing:  OSRM REST API — router.project-osrm.org (free, real road routes, no key)
 * Location: Live coordinates streamed over Socket.IO (watchPosition)
 *
 * Phases:
 *   Phase A (Ambulance → Patient): Destination = Patient pickup
 *   Phase B (Ambulance → Hospital): Destination = Assigned hospital
 */

import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  resolveTripDestination,
  calculateBearing,
  ARRIVAL_THRESHOLD_METERS,
  isValidCoord,
} from "../../utils/emergencyRouting";
import { MapPin, Navigation, RefreshCw, WifiOff, Building2 } from "lucide-react";

const OSRM_BASE = "https://router.project-osrm.org/route/v1/driving";

/** Override: recalculate route from OSRM every 8 seconds if driver has deviated */
const REROUTE_INTERVAL_MS = 8000;
/** Trigger reroute if driver is >25m from the stored polyline */
const REROUTE_DEVIATION_M = 25;

/**
 * Find the index of the closest point on a [[lat,lng]] polyline to a given
 * coordinate, using a cos(lat)-corrected distance metric so the result is
 * accurate in metres regardless of latitude (fixes C1).
 */
function findNearestPointIndex(lat, lng, latlngs) {
  const cosLat = Math.cos((lat * Math.PI) / 180);
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < latlngs.length; i++) {
    const dLat = latlngs[i][0] - lat;
    const dLng = (latlngs[i][1] - lng) * cosLat; // scale lng to match lat in metres
    const d = dLat * dLat + dLng * dLng;
    if (d < bestDist) { bestDist = d; best = i; }
  }
  return best;
}

/**
 * Compute total road distance in km for a [[lat,lng]] polyline segment.
 */
function polylineDistanceKm(points) {
  let km = 0;
  for (let i = 1; i < points.length; i++) {
    km += haversineKm(points[i - 1][0], points[i - 1][1], points[i][0], points[i][1]);
  }
  return km;
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function makeAmbulanceIcon(heading = 0, vehicleNumber = "") {
  return L.divIcon({
    className: "",
    html: `<div style="position:relative;width:48px;height:54px;display:flex;flex-direction:column;align-items:center;">
      <div style="transform:rotate(${heading}deg);width:44px;height:44px;background:#0ea5e9;border-radius:12px;border:2.5px solid #fff;box-shadow:0 2px 12px rgba(14,165,233,0.55);display:flex;align-items:center;justify-content:center;transition:transform 0.4s ease;">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="1" y="3" width="15" height="13" rx="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
          <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
          <line x1="9" y1="9" x2="9" y2="13"/><line x1="7" y1="11" x2="11" y2="11"/>
        </svg>
      </div>
      ${vehicleNumber ? `<div style="font-size:9px;font-weight:700;color:#0f172a;background:#e0f2fe;border-radius:4px;padding:1px 4px;margin-top:2px;white-space:nowrap;max-width:60px;overflow:hidden;text-overflow:ellipsis;box-shadow:0 1px 3px rgba(0,0,0,0.2);">${vehicleNumber}</div>` : ""}
    </div>`,
    iconSize: [48, 54],
    iconAnchor: [24, 27],
  });
}

function makePatientIcon(isPickedUp = false) {
  const bg = isPickedUp ? "#14b8a6" : "#ef4444";
  const label = isPickedUp ? "Picked Up" : "You (Pickup)";
  return L.divIcon({
    className: "",
    html: `<div style="display:flex;flex-direction:column;align-items:center;">
      <div style="width:36px;height:36px;background:${bg};border-radius:50%;border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;position:relative;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
        </svg>
        <div style="position:absolute;top:-4px;right:-4px;width:12px;height:12px;background:#ef4444;border-radius:50%;border:2px solid #fff;animation:lm-ping 1.4s infinite;"></div>
      </div>
      <div style="margin-top:3px;font-size:10px;font-weight:700;color:#fff;background:${bg};padding:2px 6px;border-radius:6px;box-shadow:0 1px 4px rgba(0,0,0,0.3);white-space:nowrap;">${label}</div>
    </div>`,
    iconSize: [60, 58],
    iconAnchor: [30, 20],
  });
}

function makeHospitalIcon(name = "Hospital") {
  return L.divIcon({
    className: "",
    html: `<div style="display:flex;flex-direction:column;align-items:center;">
      <div style="width:40px;height:40px;background:#0d9488;border-radius:10px;border:2.5px solid #fff;box-shadow:0 2px 10px rgba(13,148,136,0.5);display:flex;align-items:center;justify-content:center;">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="4" y="2" width="16" height="20" rx="2"/><line x1="12" y1="6" x2="12" y2="12"/><line x1="9" y1="9" x2="15" y2="9"/><rect x="9" y="14" width="6" height="8"/>
        </svg>
      </div>
      <div style="margin-top:3px;font-size:9px;font-weight:700;color:#fff;background:#0d9488;padding:2px 5px;border-radius:5px;max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.3);">${name}</div>
    </div>`,
    iconSize: [60, 56],
    iconAnchor: [30, 22],
  });
}

function injectLeafletStyles() {
  if (document.getElementById("hc-leaflet-styles")) return;
  const s = document.createElement("style");
  s.id = "hc-leaflet-styles";
  s.textContent = `
    @keyframes lm-ping { 0%{transform:scale(1);opacity:1} 75%,100%{transform:scale(2.2);opacity:0} }
    .leaflet-container { font-family:inherit; }
    .leaflet-control-attribution { font-size:10px !important; }
    .leaflet-control-attribution a { color:#0ea5e9 !important; }
  `;
  document.head.appendChild(s);
}

function animateMarkerTo(marker, fromLat, fromLng, toLat, toLng, durationMs) {
  const start = performance.now();
  const dLat = toLat - fromLat;
  const dLng = toLng - fromLng;
  function step(now) {
    const t = Math.min(1, (now - start) / durationMs);
    const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    marker.setLatLng([fromLat + dLat * ease, fromLng + dLng * ease]);
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

export default function LiveTrackingMap({
  patientLat, patientLng,
  driverLat, driverLng, driverHeading,
  hospitalLat, hospitalLng, hospitalName, hospitalAddress,
  status: _status = "EN_ROUTE",
  driverName, vehicleNumber,
  distanceKm, etaMin,
  socketConnected = true,
  height = "420px",
  showTelemetryBar = true,
  onRouteUpdate,
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const patientMarkerRef = useRef(null);
  const driverMarkerRef = useRef(null);
  const hospitalMarkerRef = useRef(null);
  const driverPosRef = useRef(null);
  const currentHeadingRef = useRef(driverHeading || 0);
  const routePolylineRef = useRef(null);
  const initialFitDoneRef = useRef(false);
  const lastRouteFetchRef = useRef(0);
  const routePointsRef = useRef([]);
  const prevPhaseRef = useRef(null);
  const prevDestCoordRef = useRef(null);
  const isFollowingRef = useRef(true);
  const fetchAbortRef = useRef(null);
  /** Last distance (km) reported by OSRM — kept so fallback haversine is never used
   *  as the displayed value when an old polyline exists (fixes C2). */
  const lastGoodDistRef = useRef(null);
  /** Last [lat,lng] where camera was updated — prevents rapid-fire setView (fixes C5). */
  const lastCameraPosRef = useRef(null);
  /** User zoom before a phase transition so we can restore it afterwards (fixes M1). */
  const savedZoomRef = useRef(null);

  const [mapReady, setMapReady] = useState(false);
  const [isFollowing, setIsFollowing] = useState(true);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState(false);

  const targetDestination = resolveTripDestination(
    _status,
    { lat: patientLat, lng: patientLng },
    { lat: hospitalLat, lng: hospitalLng, name: hospitalName, address: hospitalAddress }
  );
  const hasDriver = isValidCoord(driverLat, driverLng);
  const hasDestination = targetDestination.hasCoord;
  const hasPatient = isValidCoord(patientLat, patientLng);
  const hasHospital = isValidCoord(hospitalLat, hospitalLng);

  // Map init
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    injectLeafletStyles();
    const initialCenter = hasDriver
      ? [driverLat, driverLng]
      : hasDestination
        ? [targetDestination.lat, targetDestination.lng]
        : [22.3072, 73.1812];

    const map = L.map(mapContainerRef.current, {
      center: initialCenter, zoom: 14, zoomControl: false, attributionControl: true,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    map.on("dragstart", () => { isFollowingRef.current = false; setIsFollowing(false); });
    mapRef.current = map;
    setMapReady(true);
    return () => {
      if (fetchAbortRef.current) fetchAbortRef.current.abort();
      map.remove();
      mapRef.current = null;
      patientMarkerRef.current = null;
      driverMarkerRef.current = null;
      hospitalMarkerRef.current = null;
      routePolylineRef.current = null;
      initialFitDoneRef.current = false;
      routePointsRef.current = [];
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch road route from OSRM — always starts from current driver position → destination.
  // Trims the displayed polyline from the driver's nearest point so stale segments vanish.
  const fetchRoute = useCallback(
    (forceRecalculate = false) => {
      const map = mapRef.current;
      if (!map || !mapReady || !hasDriver || !hasDestination) return;
      const now = Date.now();
      const elapsed = now - lastRouteFetchRef.current;
      let needsReroute = forceRecalculate;

      // Check deviation from stored route
      if (!needsReroute && routePointsRef.current.length > 0) {
        const nearIdx = findNearestPointIndex(driverLat, driverLng, routePointsRef.current);
        const [nLat, nLng] = routePointsRef.current[nearIdx];
        const devM = haversineKm(driverLat, driverLng, nLat, nLng) * 1000;
        if (devM > REROUTE_DEVIATION_M && elapsed >= REROUTE_INTERVAL_MS) needsReroute = true;
      }
      if (routePointsRef.current.length === 0) needsReroute = true;

      if (!needsReroute) {
        // No full reroute needed — trim the displayed polyline from current position
        // and recompute remaining distance from the trimmed segment.
        if (routePointsRef.current.length > 1) {
          const nearIdx = findNearestPointIndex(driverLat, driverLng, routePointsRef.current);
          const remaining = routePointsRef.current.slice(nearIdx);
          if (remaining.length > 1 && routePolylineRef.current) {
            routePolylineRef.current.setLatLngs(remaining);
            const distKm = polylineDistanceKm(remaining);
            // Only update if meaningful change (>50m) to avoid jitter in the UI panel
            if (lastGoodDistRef.current === null || Math.abs(distKm - lastGoodDistRef.current) > 0.05) {
              lastGoodDistRef.current = distKm;
              const speedKmh = 30;
              const etaMins = Math.max(1, Math.ceil((distKm / speedKmh) * 60));
              if (onRouteUpdate) onRouteUpdate({ distanceKm: distKm, etaMin: etaMins, phase: targetDestination.phase, target: targetDestination.type });
            }
          }
        }
        return;
      }

      // Full reroute from OSRM
      if (fetchAbortRef.current) fetchAbortRef.current.abort();
      const ctrl = new AbortController();
      fetchAbortRef.current = ctrl;
      lastRouteFetchRef.current = now;
      setRouteLoading(true);
      setRouteError(false);

      const url = `${OSRM_BASE}/${driverLng},${driverLat};${targetDestination.lng},${targetDestination.lat}?overview=full&geometries=geojson`;
      fetch(url, { signal: ctrl.signal })
        .then((res) => { if (!res.ok) throw new Error(`OSRM HTTP ${res.status}`); return res.json(); })
        .then((data) => {
          fetchAbortRef.current = null;
          setRouteLoading(false);
          const route = data.routes?.[0];
          if (!route) { setRouteError(true); return; }
          // All coords from OSRM are already from current driver position → destination,
          // so no trimming needed on fresh fetch.
          const latlngs = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
          routePointsRef.current = latlngs;
          const distKm = route.distance / 1000;
          const etaMins = Math.max(1, Math.ceil(route.duration / 60));
          lastGoodDistRef.current = distKm; // cache for C2 fallback guard
          if (routePolylineRef.current) {
            routePolylineRef.current.setLatLngs(latlngs);
          } else {
            routePolylineRef.current = L.polyline(latlngs, {
              color: "#0ea5e9",
              weight: 6,
              opacity: 0.92,
              lineJoin: "round",
              lineCap: "round",
            }).addTo(map);
            routePolylineRef.current.bringToBack();
          }
          if ((!initialFitDoneRef.current || forceRecalculate) && isFollowingRef.current) {
            map.fitBounds(routePolylineRef.current.getBounds(), { padding: [70, 70] });
            // M1: restore saved zoom after phase transition so the view doesn't reset abruptly
            if (savedZoomRef.current != null && forceRecalculate) {
              requestAnimationFrame(() => {
                if (mapRef.current) mapRef.current.setZoom(savedZoomRef.current, { animate: false });
                savedZoomRef.current = null;
              });
            }
            initialFitDoneRef.current = true;
          }
          if (onRouteUpdate) onRouteUpdate({ distanceKm: distKm, etaMin: etaMins, distanceMeters: route.distance, durationSeconds: route.duration, phase: targetDestination.phase, target: targetDestination.type });
        })
        .catch((err) => {
          fetchAbortRef.current = null;
          if (err.name === "AbortError") return;
          setRouteLoading(false);
          setRouteError(true);
          console.warn("[LiveTrackingMap] OSRM error:", err.message);
          // Fallback: use last OSRM-computed distance if we have one; otherwise haversine.
          // This prevents a stale haversine value appearing when OSRM is temporarily down.
          if (onRouteUpdate && hasDriver && hasDestination) {
            if (lastGoodDistRef.current !== null) {
              // Keep last known good value; just refresh ETA estimate
              const fbKm = lastGoodDistRef.current;
              if (onRouteUpdate) onRouteUpdate({ distanceKm: fbKm, etaMin: Math.max(1, Math.ceil((fbKm / 30) * 60)), phase: targetDestination.phase, target: targetDestination.type });
            } else {
              // No cached value yet — haversine as last resort
              const fbKm = haversineKm(driverLat, driverLng, targetDestination.lat, targetDestination.lng);
              onRouteUpdate({ distanceKm: fbKm, etaMin: Math.max(1, Math.ceil((fbKm / 30) * 60)), distanceMeters: fbKm * 1000, durationSeconds: null, phase: targetDestination.phase, target: targetDestination.type });
            }
          }
          // Allow retry sooner on error
          lastRouteFetchRef.current = now - REROUTE_INTERVAL_MS + 3000;
        });
    },
    [driverLat, driverLng, targetDestination, hasDriver, hasDestination, onRouteUpdate, mapReady]
  );

  // Sync markers + phase transitions
  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;
    // Patient
    if (hasPatient) {
      const pos = [patientLat, patientLng];
      const icon = makePatientIcon(targetDestination.isPhaseB);
      if (!patientMarkerRef.current) { patientMarkerRef.current = L.marker(pos, { icon, zIndexOffset: 10 }).addTo(map); }
      else { patientMarkerRef.current.setLatLng(pos); patientMarkerRef.current.setIcon(icon); }
    }
    // Hospital (Phase B)
    if (targetDestination.isPhaseB && hasHospital) {
      const pos = [hospitalLat, hospitalLng];
      if (!hospitalMarkerRef.current) { hospitalMarkerRef.current = L.marker(pos, { icon: makeHospitalIcon(hospitalName || targetDestination.name), zIndexOffset: 15 }).addTo(map); }
      else hospitalMarkerRef.current.setLatLng(pos);
    } else if (!targetDestination.isPhaseB && hospitalMarkerRef.current) {
      hospitalMarkerRef.current.remove(); hospitalMarkerRef.current = null;
    }
    // Ambulance
    if (hasDriver) {
      let heading = driverHeading != null ? Number(driverHeading) : null;
      if (heading == null && driverPosRef.current) {
        const c = calculateBearing(driverPosRef.current[0], driverPosRef.current[1], driverLat, driverLng);
        heading = c ?? currentHeadingRef.current;
      } else if (heading != null) currentHeadingRef.current = heading;
      const icon = makeAmbulanceIcon(currentHeadingRef.current, vehicleNumber);
      if (!driverMarkerRef.current) {
        driverMarkerRef.current = L.marker([driverLat, driverLng], { icon, zIndexOffset: 25 }).addTo(map);
        driverPosRef.current = [driverLat, driverLng];
      } else {
        const [pLat, pLng] = driverPosRef.current || [driverLat, driverLng];
        animateMarkerTo(driverMarkerRef.current, pLat, pLng, driverLat, driverLng, 900);
        driverMarkerRef.current.setIcon(icon);
        driverPosRef.current = [driverLat, driverLng];
      }
      // Clear route once ambulance has reached patient — no more route to show
      if (['REACHED_PATIENT', 'PICKUP_PENDING_CONFIRMATION'].includes(_status)) {
        if (routePolylineRef.current) {
          routePolylineRef.current.remove();
          routePolylineRef.current = null;
          routePointsRef.current = [];
          lastGoodDistRef.current = null;
        }
      }
      // C5: Camera — only update if ambulance moved >5m since last camera position
      // to avoid rapid-fire setView calls that block Leaflet's RAF queue on mobile.
      if (isFollowingRef.current && initialFitDoneRef.current) {
        const lastCam = lastCameraPosRef.current;
        const movedEnough = !lastCam || haversineKm(lastCam[0], lastCam[1], driverLat, driverLng) * 1000 > 5;
        if (movedEnough) {
          lastCameraPosRef.current = [driverLat, driverLng];
          const distM = hasDestination
            ? haversineKm(driverLat, driverLng, targetDestination.lat, targetDestination.lng) * 1000
            : null;
          if (distM != null && distM < 200) {
            map.setView([driverLat, driverLng], 18, { animate: true, duration: 0.6 });
          } else if (distM != null && distM < 600) {
            map.setView([driverLat, driverLng], 17, { animate: true, duration: 0.6 });
          } else if (distM != null && distM < 1500) {
            map.setView([driverLat, driverLng], 16, { animate: true, duration: 0.6 });
          } else {
            map.panTo([driverLat, driverLng], { animate: true, duration: 0.8 });
          }
        }
      }
    }
    // Phase change → clear old route, save zoom first (M1)
    let forceRecalc = false;
    if (prevPhaseRef.current !== targetDestination.phase) {
      forceRecalc = true;
      prevPhaseRef.current = targetDestination.phase;
      // Save zoom before clearing so we can restore after fitBounds
      if (mapRef.current) savedZoomRef.current = mapRef.current.getZoom();
      if (routePolylineRef.current) { routePolylineRef.current.remove(); routePolylineRef.current = null; routePointsRef.current = []; initialFitDoneRef.current = false; lastGoodDistRef.current = null; }
    }
    const destKey = `${targetDestination.lat},${targetDestination.lng}`;
    if (prevDestCoordRef.current !== destKey) { forceRecalc = true; prevDestCoordRef.current = destKey; }
    fetchRoute(forceRecalc);
  }, [mapReady, patientLat, patientLng, driverLat, driverLng, driverHeading, hospitalLat, hospitalLng, hospitalName, targetDestination, vehicleNumber, hasPatient, hasDriver, hasHospital, fetchRoute]);

  const handleRecenter = () => {
    isFollowingRef.current = true;
    setIsFollowing(true);
    const map = mapRef.current;
    if (!map) return;
    if (routePolylineRef.current) map.fitBounds(routePolylineRef.current.getBounds(), { padding: [70, 70] });
    else if (hasDriver && hasDestination) map.fitBounds([[driverLat, driverLng], [targetDestination.lat, targetDestination.lng]], { padding: [70, 70] });
    else if (hasDriver) map.setView([driverLat, driverLng], 16);
  };

  // Show arrival urgency indicator only during active EN_ROUTE state
  const isArriving = distanceKm != null && distanceKm * 1000 <= ARRIVAL_THRESHOLD_METERS && _status === 'EN_ROUTE';

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-100 shadow-lg flex flex-col" style={{ minHeight: height }}>
      <div className="relative flex-1" style={{ height }}>
        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />
        {!hasDriver && (
          <div className="absolute inset-0 z-[400] flex flex-col items-center justify-center gap-3 bg-slate-900/80 text-white">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center"><MapPin className="w-6 h-6 text-slate-400" /></div>
            <p className="text-sm font-bold text-slate-200">Waiting for ambulance location…</p>
            <p className="text-xs text-slate-400">Map will activate once driver goes online</p>
          </div>
        )}
        {routeLoading && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur-sm text-slate-800 text-[11px] font-semibold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5">
            <RefreshCw className="w-3 h-3 animate-spin text-cyan-500" /> Calculating road route…
          </div>
        )}
        {routeError && !routeLoading && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-amber-500/90 text-white text-[11px] font-semibold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5">
            <RefreshCw className="w-3 h-3" /> Retrying route…
          </div>
        )}
        {isArriving && (
          <div className="absolute top-3 left-3 z-[1000] bg-amber-500 text-white text-xs font-extrabold px-3 py-1.5 rounded-xl shadow-lg animate-pulse flex items-center gap-1.5">
            🚑 Ambulance Arriving!
          </div>
        )}
        {!socketConnected && (
          <div className="absolute top-3 right-3 z-[1000] bg-red-600/90 text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-full shadow flex items-center gap-1.5">
            <WifiOff className="w-3 h-3" /> Reconnecting…
          </div>
        )}
        {hasDriver && (
          <div className="absolute top-3 left-3 z-[1000]">
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold shadow-md ${
              _status === 'EN_ROUTE' ? 'bg-cyan-600 text-white'
              : _status === 'REACHED_PATIENT' ? 'bg-amber-500 text-white'
              : _status === 'PICKUP_PENDING_CONFIRMATION' ? 'bg-amber-600 text-white'
              : _status === 'PICKED_UP' ? 'bg-teal-600 text-white'
              : _status === 'DRIVER_ASSIGNED' ? 'bg-blue-600 text-white'
              : 'bg-slate-800 text-white'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              {_status === 'DRIVER_ASSIGNED' ? 'DRIVER ASSIGNED'
                : _status === 'EN_ROUTE' ? 'EN ROUTE'
                : _status === 'REACHED_PATIENT' ? 'AT PICKUP'
                : _status === 'PICKUP_PENDING_CONFIRMATION' ? 'PICKUP PENDING'
                : _status === 'PICKED_UP' ? 'TO HOSPITAL'
                : String(_status).replace(/_/g, ' ')}
            </div>
          </div>
        )}
        {!isFollowing && hasDriver && (
          <button onClick={handleRecenter} className="absolute bottom-16 right-3 z-[1000] w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-cyan-600 hover:bg-cyan-50 transition-colors border border-slate-200" title="Re-center map">
            <Navigation className="w-4 h-4" />
          </button>
        )}
        {isFollowing && hasDriver && (
          <button onClick={() => { isFollowingRef.current = false; setIsFollowing(false); }} className="absolute bottom-16 right-3 z-[1000] flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 text-white text-[11px] font-bold rounded-full shadow-lg hover:bg-cyan-700 transition-colors">
            <Navigation className="w-3 h-3" /> Following
          </button>
        )}
      </div>
      {showTelemetryBar && hasDriver && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-slate-900 border-t border-slate-700 text-white text-xs flex-shrink-0">
          <div className="flex items-center gap-3">
            {distanceKm != null && <span className="font-mono font-bold text-cyan-400">{Number(distanceKm).toFixed(1)} km</span>}
            {etaMin != null && <span className="text-slate-300">ETA <span className="font-mono font-bold text-white">{etaMin} min</span></span>}
            {driverName && <span className="text-slate-400">· {driverName}</span>}
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            {targetDestination.isPhaseB ? <Building2 className="w-3.5 h-3.5 text-teal-400" /> : <MapPin className="w-3.5 h-3.5 text-red-400" />}
            <span>{targetDestination.isPhaseB ? hospitalName || "Hospital" : "Pickup Point"}</span>
          </div>
        </div>
      )}
    </div>
  );
}
