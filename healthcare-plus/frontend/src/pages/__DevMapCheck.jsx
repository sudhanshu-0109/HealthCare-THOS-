// Dev-only harness to runtime-verify LiveTrackingMap (Google Maps).
// Access at /__devmap during development.
import { useState, useEffect, useRef } from 'react';
import LiveTrackingMap from '../components/emergency/LiveTrackingMap';
import { Play, Pause, RefreshCw, Building2, User, ArrowRight } from 'lucide-react';

// Real Vadodara waypoints for live simulation demo
const SIMULATION_ROUTE = [
  { lat: 22.3020, lng: 73.1890, heading: 330 },
  { lat: 22.3045, lng: 73.1870, heading: 315 },
  { lat: 22.3072, lng: 73.1840, heading: 310 },
  { lat: 22.3100, lng: 73.1800, heading: 295 },
  { lat: 22.3130, lng: 73.1750, heading: 290 },
  { lat: 22.3160, lng: 73.1700, heading: 310 },
  { lat: 22.3188, lng: 73.1670, heading: 320 },
];

export default function DevMapCheck() {
  const [status, setStatus] = useState('EN_ROUTE');
  const [stepIdx, setStepIdx] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [routeDist, setRouteDist] = useState(2.4);
  const [routeEta, setRouteEta] = useState(6);

  const timerRef = useRef(null);

  useEffect(() => {
    if (!isSimulating) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setStepIdx((prev) => (prev + 1) % SIMULATION_ROUTE.length);
    }, 2500);

    return () => clearInterval(timerRef.current);
  }, [isSimulating]);

  const currentPt = SIMULATION_ROUTE[stepIdx];

  return (
    <div style={{ maxWidth: 640, margin: '24px auto', padding: '16px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 6px', color: '#0f172a' }}>
          Live Ambulance Navigation Harness
        </h1>
        <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
          Verifies LiveTrackingMap with Google Maps JavaScript API, smooth marker animation, heading rotation, and Phase A/B road routing.
        </p>
      </div>

      {/* Controls Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
        <button
          onClick={() => setStatus((s) => (s === 'EN_ROUTE' ? 'PICKED_UP' : 'EN_ROUTE'))}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 14px',
            borderRadius: 10,
            border: '1px solid #cbd5e1',
            background: status === 'PICKED_UP' ? '#0f766e' : '#0284c7',
            color: '#fff',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {status === 'PICKED_UP' ? <Building2 size={14} /> : <User size={14} />}
          <span>Phase: {status === 'PICKED_UP' ? 'Phase B (To Hospital)' : 'Phase A (To Patient)'}</span>
          <ArrowRight size={12} />
        </button>

        <button
          onClick={() => setIsSimulating((s) => !s)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 14px',
            borderRadius: 10,
            border: '1px solid #cbd5e1',
            background: isSimulating ? '#dc2626' : '#059669',
            color: '#fff',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {isSimulating ? <Pause size={14} /> : <Play size={14} />}
          <span>{isSimulating ? 'Pause GPS Ticks' : 'Simulate GPS Ticks'}</span>
        </button>

        <button
          onClick={() => setStepIdx(0)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 14px',
            borderRadius: 10,
            border: '1px solid #cbd5e1',
            background: '#f8fafc',
            color: '#334155',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={14} />
          <span>Reset Position</span>
        </button>
      </div>

      <LiveTrackingMap
        patientLat={22.3072}
        patientLng={73.1812}
        driverLat={currentPt.lat}
        driverLng={currentPt.lng}
        driverHeading={currentPt.heading}
        hospitalLat={22.3188}
        hospitalLng={73.1670}
        hospitalName="Sterling Hospital, Vadodara"
        hospitalAddress="Race Course Circle, Alkapuri, Vadodara"
        status={status}
        driverName="Mahesh Rathod"
        vehicleNumber="GJ-06-AB-1234"
        distanceKm={routeDist}
        etaMin={routeEta}
        height="400px"
        onRouteUpdate={({ distanceKm, etaMin }) => {
          setRouteDist(distanceKm);
          setRouteEta(etaMin);
        }}
      />
    </div>
  );
}
