/**
 * components/emergency/LiveTrackingMap.jsx — REAL ambulance tracker (MapLibre + OpenFreeMap).
 *
 * Renders an actual map with live patient + ambulance markers and a link line between
 * them, driven entirely by real coordinates supplied via props (the ambulance position
 * arrives over Socket.IO from the driver's device). There is NO simulated movement,
 * radar graphic, or fabricated position.
 *
 * Tiles come from OpenFreeMap (https://openfreemap.org) — a free, keyless vector-tile
 * host — rendered with MapLibre GL. No API key or billing account is required. The
 * style URL may be overridden with VITE_MAP_STYLE_URL. If the tiles fail to load
 * (e.g. offline), it degrades honestly to a coordinate + distance readout.
 *
 * Props: patientLat, patientLng, driverLat, driverLng, status, driverName,
 *        vehicleNumber, distanceKm, etaMin
 */

import { useEffect, useRef, useState } from 'react';
import { Map as MapLibre, Marker, NavigationControl, LngLatBounds } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapPin, Ambulance, Navigation, AlertTriangle, RefreshCw } from 'lucide-react';

// Keyless OpenFreeMap vector style; overridable for self-hosted tiles.
const MAP_STYLE = import.meta.env.VITE_MAP_STYLE_URL || 'https://tiles.openfreemap.org/styles/liberty';

// Build the red pulsing "patient" marker element.
const makePatientEl = () => {
  const outer = document.createElement('div');
  outer.style.cssText = 'position:relative;width:24px;height:24px;';
  const pulse = document.createElement('div');
  pulse.style.cssText =
    'position:absolute;inset:0;border-radius:9999px;background:rgba(239,68,68,0.25);' +
    'animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;';
  const dot = document.createElement('div');
  dot.style.cssText =
    'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);' +
    'width:14px;height:14px;border-radius:9999px;background:#ef4444;' +
    'border:2.5px solid #ffffff;box-shadow:0 1px 6px rgba(0,0,0,0.4);';
  outer.appendChild(pulse);
  outer.appendChild(dot);
  if (!document.getElementById('map-pulse-style')) {
    const s = document.createElement('style');
    s.id = 'map-pulse-style';
    s.textContent = '@keyframes ping{75%,100%{transform:scale(2);opacity:0}}';
    document.head.appendChild(s);
  }
  return outer;
};

// Build the cyan "ambulance" marker element.
const makeDriverEl = () => {
  const el = document.createElement('div');
  el.style.cssText =
    'width:20px;height:20px;border-radius:9999px;background:#06b6d4;' +
    'border:3px solid #ffffff;box-shadow:0 2px 6px rgba(0,0,0,0.35);';
  return el;
};

export default function LiveTrackingMap({
  patientLat, patientLng,
  driverLat, driverLng,
  status = 'SEARCHING',
  driverName,
  vehicleNumber,
  distanceKm,
  etaMin,
}) {
  const mapEl = useRef(null);
  const mapRef = useRef(null);
  const patientMarker = useRef(null);
  const driverMarker = useRef(null);
  const mapReadyRef = useRef(false); // ref to avoid stale closure in error handler
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [retryKey, setRetryKey] = useState(0); // increment to force map re-init

  const hasPatient = patientLat != null && patientLng != null;
  const hasDriver = driverLat != null && driverLng != null;

  // Create the map once (or on retry).
  useEffect(() => {
    if (!mapEl.current) return undefined;
    // Destroy existing map on retry
    if (mapRef.current) {
      if (mapRef.current._roCleanup) mapRef.current._roCleanup();
      mapRef.current.remove();
      mapRef.current = null;
      patientMarker.current = null;
      driverMarker.current = null;
      mapReadyRef.current = false;
      setMapReady(false);
    }
    setMapError(false);
    let cancelled = false;
    try {
      const map = new MapLibre({
        container: mapEl.current,
        style: MAP_STYLE,
        center: hasPatient ? [patientLng, patientLat] : [73.1812, 22.3072], // Vadodara fallback
        zoom: 14,
        failIfMajorPerformanceCaveat: false,
        attributionControl: false,
      });
      map.addControl(new NavigationControl({ showCompass: false }), 'top-right');
      map.on('load', () => {
        if (cancelled) return;
        map.addSource('route', {
          type: 'geojson',
          data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } },
        });
        map.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: { 'line-color': '#0891b2', 'line-width': 3, 'line-dasharray': [2, 1], 'line-opacity': 0.8 },
        });
        mapReadyRef.current = true;
        setMapReady(true);
      });

      // Non-fatal tile errors ignored; only style-load failures are fatal.
      // Use mapReadyRef (not mapReady state) to avoid stale closure.
      map.on('error', (e) => {
        if (cancelled) return;
        if (mapReadyRef.current) return; // tile blip after load — ignore
        const isFatal =
          e?.error?.status >= 400 ||
          String(e?.error?.message || '').toLowerCase().includes('style') ||
          String(e?.error?.message || '').toLowerCase().includes('failed to fetch');
        if (isFatal) setMapError(true);
      });

      mapRef.current = map;

      if (typeof ResizeObserver !== 'undefined' && mapEl.current) {
        const ro = new ResizeObserver(() => { if (mapRef.current) mapRef.current.resize(); });
        ro.observe(mapEl.current);
        map._roCleanup = () => ro.disconnect();
      }
    } catch {
      if (!cancelled) setMapError(true);
    }
    return () => {
      cancelled = true;
      if (mapRef.current) {
        if (mapRef.current._roCleanup) mapRef.current._roCleanup();
        mapRef.current.remove();
        mapRef.current = null;
      }
      patientMarker.current = null;
      driverMarker.current = null;
      mapReadyRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryKey]);

  // Sync markers + link line + viewport whenever coordinates change.
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;

    if (hasPatient) {
      const pos = [patientLng, patientLat];
      if (!patientMarker.current) {
        patientMarker.current = new Marker({ element: makePatientEl() }).setLngLat(pos).addTo(map);
      } else {
        patientMarker.current.setLngLat(pos);
      }
    }

    if (hasDriver) {
      const pos = [driverLng, driverLat];
      if (!driverMarker.current) {
        driverMarker.current = new Marker({ element: makeDriverEl() }).setLngLat(pos).addTo(map);
      } else {
        driverMarker.current.setLngLat(pos);
      }
    }

    const routeSrc = map.getSource('route');
    if (hasPatient && hasDriver) {
      const coordinates = [[driverLng, driverLat], [patientLng, patientLat]];
      if (routeSrc) routeSrc.setData({ type: 'Feature', geometry: { type: 'LineString', coordinates } });
      const bounds = new LngLatBounds();
      coordinates.forEach((c) => bounds.extend(c));
      map.fitBounds(bounds, { padding: 72, maxZoom: 15, duration: 600 });
    } else {
      if (routeSrc) routeSrc.setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: [] } });
      if (hasPatient) map.easeTo({ center: [patientLng, patientLat], zoom: 14, duration: 500 });
      else if (hasDriver) map.easeTo({ center: [driverLng, driverLat], zoom: 14, duration: 500 });
    }
  }, [mapReady, patientLat, patientLng, driverLat, driverLng, hasPatient, hasDriver]);

  const statusLabel = String(status).replace(/_/g, ' ');

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
      {/* Map container — canvas always in DOM so the ref is always valid */}
      <div className="relative h-72 w-full bg-slate-100">
        <div
          ref={mapEl}
          className="absolute inset-0 h-full w-full"
          style={{ display: mapError ? 'none' : 'block' }}
        />

        {/* Error fallback with coordinate readout + retry */}
        {mapError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center bg-slate-50">
            <div className="w-14 h-14 rounded-full bg-slate-200 flex items-center justify-center">
              <MapPin className="w-7 h-7 text-slate-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">Live map unavailable</p>
              <p className="text-xs text-slate-400 mt-0.5">Map tiles could not be loaded</p>
            </div>
            <div className="grid grid-cols-2 gap-3 w-full max-w-xs text-left">
              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <span className="block text-[10px] uppercase text-slate-400 mb-0.5">📍 You</span>
                <span className="text-xs font-mono text-slate-700">
                  {hasPatient ? `${Number(patientLat).toFixed(4)}, ${Number(patientLng).toFixed(4)}` : '—'}
                </span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <span className="block text-[10px] uppercase text-slate-400 mb-0.5">🚑 Ambulance</span>
                <span className="text-xs font-mono text-cyan-700">
                  {hasDriver ? `${Number(driverLat).toFixed(4)}, ${Number(driverLng).toFixed(4)}` : 'Awaiting…'}
                </span>
              </div>
            </div>
            <button
              onClick={() => setRetryKey((k) => k + 1)}
              className="flex items-center gap-1.5 text-xs text-cyan-600 hover:text-cyan-800 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry map
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {!mapError && !mapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100/80 pointer-events-none">
            <div className="flex items-center gap-2 text-slate-500 text-sm bg-white px-4 py-2 rounded-full shadow-sm">
              <Navigation className="w-4 h-4 animate-pulse text-cyan-500" /> Loading map…
            </div>
          </div>
        )}

        {/* Live status pill */}
        <div className="absolute top-3 left-3 z-[1] inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 border border-slate-200 shadow-sm pointer-events-none">
          <span className={`w-1.5 h-1.5 rounded-full ${status === 'ARRIVED' ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`} />
          <span className="text-xs font-semibold text-slate-700">{statusLabel}</span>
        </div>

        {/* Map legend */}
        {mapReady && (
          <div className="absolute bottom-3 left-3 z-[1] flex flex-col gap-1 pointer-events-none">
            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/95 border border-slate-200 shadow-sm text-xs text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 border border-white flex-shrink-0" /> You
            </div>
            {hasDriver && (
              <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/95 border border-slate-200 shadow-sm text-xs text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 border border-white flex-shrink-0" /> Ambulance
              </div>
            )}
          </div>
        )}
      </div>

      {/* Telemetry footer — real values only */}
      <div className="grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100">
        <div className="p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-[10px] uppercase text-slate-400 mb-0.5">
            <Ambulance className="w-3 h-3" /> Vehicle
          </div>
          <p className="text-sm font-bold text-slate-800 font-mono truncate">{vehicleNumber || '—'}</p>
        </div>
        <div className="p-3 text-center">
          <div className="text-[10px] uppercase text-slate-400 mb-0.5">Distance</div>
          <p className="text-sm font-bold text-slate-800">
            {distanceKm != null ? `${distanceKm.toFixed(1)} km` : '—'}
          </p>
        </div>
        <div className="p-3 text-center">
          <div className="text-[10px] uppercase text-slate-400 mb-0.5">ETA</div>
          <p className="text-sm font-bold text-cyan-700">
            {etaMin != null ? `${etaMin} min` : '—'}
          </p>
        </div>
      </div>

      {(driverName || vehicleNumber) && !mapError && (
        <div className="flex items-center gap-2 px-3 py-2 border-t border-slate-100 bg-slate-50">
          <AlertTriangle className="w-3.5 h-3.5 text-cyan-600 flex-shrink-0" />
          <span className="text-xs text-slate-500">
            Ambulance position updates live as the driver moves.
          </span>
        </div>
      )}
    </div>
  );
}

