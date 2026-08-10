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
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapPin, Ambulance, Navigation, AlertTriangle } from 'lucide-react';

// Keyless OpenFreeMap vector style; overridable for self-hosted tiles.
const MAP_STYLE = import.meta.env.VITE_MAP_STYLE_URL || 'https://tiles.openfreemap.org/styles/liberty';

// Build the cyan "ambulance" marker element (solid dot, white ring).
const makeDriverEl = () => {
  const el = document.createElement('div');
  el.style.cssText =
    'width:18px;height:18px;border-radius:9999px;background:#06b6d4;' +
    'border:3px solid #ffffff;box-shadow:0 1px 4px rgba(0,0,0,0.3);';
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
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);

  const hasPatient = patientLat != null && patientLng != null;
  const hasDriver = driverLat != null && driverLng != null;

  // Create the map once.
  useEffect(() => {
    if (!mapEl.current || mapRef.current) return undefined;
    let cancelled = false;
    try {
      const map = new maplibregl.Map({
        container: mapEl.current,
        style: MAP_STYLE,
        center: hasPatient ? [patientLng, patientLat] : [73.1812, 22.3072], // Vadodara
        zoom: 13,
      });
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
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
          paint: { 'line-color': '#0891b2', 'line-width': 3, 'line-opacity': 0.7 },
        });
        setMapReady(true);
      });
      map.on('error', () => { if (!cancelled) setMapError(true); });
      mapRef.current = map;
    } catch {
      setMapError(true);
    }
    return () => {
      cancelled = true;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync markers + link line + viewport whenever coordinates change.
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;

    if (hasPatient) {
      const pos = [patientLng, patientLat];
      if (!patientMarker.current) {
        patientMarker.current = new maplibregl.Marker({ color: '#ef4444' }).setLngLat(pos).addTo(map);
      } else {
        patientMarker.current.setLngLat(pos);
      }
    }

    if (hasDriver) {
      const pos = [driverLng, driverLat];
      if (!driverMarker.current) {
        driverMarker.current = new maplibregl.Marker({ element: makeDriverEl() }).setLngLat(pos).addTo(map);
      } else {
        driverMarker.current.setLngLat(pos);
      }
    }

    const routeSrc = map.getSource('route');
    if (hasPatient && hasDriver) {
      const coordinates = [[driverLng, driverLat], [patientLng, patientLat]];
      if (routeSrc) routeSrc.setData({ type: 'Feature', geometry: { type: 'LineString', coordinates } });
      const bounds = new maplibregl.LngLatBounds();
      coordinates.forEach((c) => bounds.extend(c));
      map.fitBounds(bounds, { padding: 64, maxZoom: 15, duration: 500 });
    } else {
      if (routeSrc) routeSrc.setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: [] } });
      if (hasPatient) map.easeTo({ center: [patientLng, patientLat], duration: 500 });
    }
  }, [mapReady, patientLat, patientLng, driverLat, driverLng, hasPatient, hasDriver]);

  const statusLabel = String(status).replace(/_/g, ' ');

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
      {/* Live map (or honest fallback) */}
      <div className="relative h-64 w-full bg-slate-100">
        {!mapError && <div ref={mapEl} className="absolute inset-0 h-full w-full" />}

        {mapError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-slate-200 flex items-center justify-center">
              <MapPin className="w-7 h-7 text-slate-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">Live map unavailable</p>
              <p className="text-xs text-slate-400 mt-0.5">Map tiles could not be loaded. Check your connection.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 w-full max-w-xs text-left mt-1">
              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <span className="block text-[10px] uppercase text-slate-400">You</span>
                <span className="text-xs font-mono text-slate-700">
                  {hasPatient ? `${patientLat.toFixed(4)}, ${patientLng.toFixed(4)}` : '—'}
                </span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <span className="block text-[10px] uppercase text-slate-400">Ambulance</span>
                <span className="text-xs font-mono text-cyan-700">
                  {hasDriver ? `${driverLat.toFixed(4)}, ${driverLng.toFixed(4)}` : 'Awaiting…'}
                </span>
              </div>
            </div>
          </div>
        )}

        {!mapError && !mapReady && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Navigation className="w-4 h-4 animate-pulse" /> Loading map…
            </div>
          </div>
        )}

        {/* Live status pill */}
        <div className="absolute top-3 left-3 z-[1] inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 border border-slate-200 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-semibold text-slate-700">{statusLabel}</span>
        </div>
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

