/**
 * pages/patient/EmergencyTracking.jsx — REAL-TIME ambulance tracking.
 *
 * Source of truth is the backend. This page:
 *   1. Fetches the real request state from GET /emergency/:id/status.
 *   2. Joins the `emergency:{requestId}` Socket.IO room and reacts to the real
 *      server events — emergency:accepted, emergency:location-update,
 *      emergency:status-update — using the real EmergencyRequest status enum.
 *   3. Renders a REAL Google Map (LiveTrackingMap) with live patient + ambulance
 *      markers, and a distance-based ETA recomputed from live coordinates.
 *
 * There is NO simulated stage progression, no setTimeout stage chain, and no
 * decrementing-timer ETA. Every state change comes from the server.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Phone, AlertTriangle, CheckCircle2, ArrowLeft, User, Truck,
  Heart, Loader2, PhoneCall,
} from 'lucide-react';
import * as dispatchService from '../../services/emergencyDispatch.service';
import { joinEmergencyRoom, leaveEmergencyRoom, onSocketEvent, getSocket } from '../../services/socket';
import { haversineKm, estimateEtaMin } from '../../utils/distance';
import LiveTrackingMap from '../../components/emergency/LiveTrackingMap';

// Real EmergencyRequest status → tracking stage (index into STAGES below).
const STATUS_STAGE = {
  REQUESTED: 0,
  PENDING: 0,
  SEARCHING: 0,
  DRIVER_ASSIGNED: 1,
  EN_ROUTE: 2,
  PICKED_UP: 3,
  ARRIVED: 4,
};

const STAGES = [
  { label: 'Searching', sub: 'Finding the nearest available ambulance…', icon: AlertTriangle, color: 'text-amber-600' },
  { label: 'Driver Assigned', sub: 'A driver has accepted your request', icon: User, color: 'text-blue-600' },
  { label: 'On the Way', sub: 'The ambulance is en route to you', icon: Truck, color: 'text-cyan-600' },
  { label: 'Picked Up', sub: 'You are being transported to the hospital', icon: Heart, color: 'text-teal-600' },
  { label: 'Arrived', sub: 'Arrived at the hospital', icon: CheckCircle2, color: 'text-emerald-600' },
];

const POLL_MS = 20000; // Safety-net re-sync; live updates arrive via socket.

export default function EmergencyTracking({ requestId: propRequestId, onClose }) {
  const params = useParams();
  const requestId = propRequestId || params.requestId;
  const navigate = useNavigate();
  
  const handleClose = () => {
    const terminal = ['ARRIVED', 'CANCELLED', 'NO_DRIVER_FALLBACK'];
    const isTerminal = terminal.includes(status);
    if (onClose) {
      onClose(isTerminal);
    } else {
      navigate('/patient/dashboard');
    }
  };

  const [status, setStatus] = useState('SEARCHING');
  const [patientLoc, setPatientLoc] = useState(null); // { lat, lng }
  const [driverLoc, setDriverLoc] = useState(null);   // { lat, lng }
  const [driverInfo, setDriverInfo] = useState(null); // { name, vehicleNumber }
  const [fallbackMsg, setFallbackMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [routeDist, setRouteDist] = useState(null);
  const [routeEta, setRouteEta] = useState(null);
  const [socketConnected, setSocketConnected] = useState(true);

  // Keep a ref to the latest status so the poll can decide when to stop.
  const statusRef = useRef(status);
  statusRef.current = status;

  // Apply a fetched request payload to local state.
  const applyRequest = useCallback((req) => {
    if (!req) return;
    if (req.status) setStatus(req.status);
    if (req.latitude != null && req.longitude != null) {
      setPatientLoc({ lat: req.latitude, lng: req.longitude });
    }
    const amb = req.ambulance;
    if (amb) {
      setDriverInfo({
        name: amb.driver?.user?.fullName || 'Ambulance driver',
        vehicleNumber: amb.vehicleNumber || null,
      });
      if (amb.currentLatitude != null && amb.currentLongitude != null) {
        setDriverLoc({ lat: amb.currentLatitude, lng: amb.currentLongitude });
      }
    }
    if (req.status === 'NO_DRIVER_FALLBACK') {
      setFallbackMsg('No ambulance is available right now. Please call 108 immediately.');
    }
  }, []);

  // Initial load.
  useEffect(() => {
    if (!requestId) return;
    let cancelled = false;
    setLoading(true);
    dispatchService.getEmergencyStatus(requestId)
      .then((res) => {
        if (cancelled) return;
        const reqData = (res && res.data && res.data.id) ? res.data : (res && res.id) ? res : (res && res.data && res.data.data) ? res.data.data : res.data;
        applyRequest(reqData);
        setError(null);
      })
      .catch((err) => { if (!cancelled) setError(err.message || 'Could not load your emergency request.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [requestId, applyRequest]);

  // Track socket connected state for the disconnect banner in LiveTrackingMap.
  useEffect(() => {
    const s = getSocket();
    if (!s) return;
    const onConnect = () => setSocketConnected(true);
    const onDisconnect = () => setSocketConnected(false);
    setSocketConnected(s.connected);
    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
    };
  }, []);

  // Join the emergency room + subscribe to real server events.
  useEffect(() => {
    if (!requestId) return;
    joinEmergencyRoom(requestId);

    const unsubAccepted = onSocketEvent('emergency:accepted', (data) => {
      if (data.requestId && data.requestId !== requestId) return;
      setStatus('DRIVER_ASSIGNED');
      setDriverInfo({ name: data.driverName || 'Ambulance driver', vehicleNumber: data.vehicleNumber || null });
      if (data.driverLat != null && data.driverLng != null) {
        setDriverLoc({ lat: data.driverLat, lng: data.driverLng });
      }
    });

    const unsubLocation = onSocketEvent('emergency:location-update', (data) => {
      if (data.requestId && data.requestId !== requestId) return;
      if (data.driverLat != null && data.driverLng != null) {
        setDriverLoc({ lat: data.driverLat, lng: data.driverLng });
      }
    });

    const unsubStatus = onSocketEvent('emergency:status-update', (data) => {
      if (data.requestId && data.requestId !== requestId) return;
      if (data.status) setStatus(data.status);
      if (data.message) setFallbackMsg(data.message);
    });

    return () => {
      unsubAccepted();
      unsubLocation();
      unsubStatus();
      leaveEmergencyRoom(requestId);
    };
  }, [requestId]);

  // Safety-net poll: re-syncs from the server (also triggers the server-side
  // lazy no-driver fallback). Stops once the trip reaches a terminal state.
  useEffect(() => {
    if (!requestId) return;
    const terminal = ['ARRIVED', 'CANCELLED', 'NO_DRIVER_FALLBACK'];
    const interval = setInterval(() => {
      if (terminal.includes(statusRef.current)) return;
      dispatchService.getEmergencyStatus(requestId)
        .then((res) => applyRequest(res.data))
        .catch(() => {});
    }, POLL_MS);
    return () => clearInterval(interval);
  }, [requestId, applyRequest]);

  // Distance and ETA are now provided by LiveTrackingMap (OSRM API)
  const distanceKm = routeDist;
  const etaMin = routeEta;

  const isFallback = status === 'NO_DRIVER_FALLBACK';
  const isCancelled = status === 'CANCELLED';
  const isArrived = status === 'ARRIVED';
  const stageIndex = STATUS_STAGE[status] ?? 0;
  const stage = STAGES[Math.min(stageIndex, STAGES.length - 1)];
  const StageIcon = stage.icon;
  const showDriver = stageIndex >= 1 && driverInfo && !isFallback;
  const showEta = ['DRIVER_ASSIGNED', 'EN_ROUTE'].includes(status) && distanceKm != null;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-300">
          <Loader2 className="w-8 h-8 animate-spin text-red-500" />
          <p className="text-sm">Loading your emergency request…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4">
        <button onClick={handleClose} className="p-2 text-red-200 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isArrived ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`} />
          <span className={`font-semibold ${isArrived ? 'text-emerald-400' : 'text-red-400'}`}>
            {isArrived ? 'TRIP COMPLETE' : 'EMERGENCY ACTIVE'}
          </span>
        </div>
        <div className="w-9" />
      </header>

      {error && (
        <div className="mx-4 mb-3 bg-red-500/15 border border-red-500/30 rounded-xl px-4 py-2.5 text-sm text-red-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Real map */}
      <div className="mx-4 mb-4">
        <LiveTrackingMap
          patientLat={patientLoc?.lat}
          patientLng={patientLoc?.lng}
          driverLat={driverLoc?.lat}
          driverLng={driverLoc?.lng}
          status={status}
          driverName={driverInfo?.name}
          vehicleNumber={driverInfo?.vehicleNumber}
          distanceKm={routeDist}
          etaMin={routeEta}
          socketConnected={socketConnected}
          onRouteUpdate={({ distanceKm, etaMin }) => {
            setRouteDist(distanceKm);
            setRouteEta(etaMin);
          }}
        />
      </div>

      {/* Status card */}
      <div className="mx-4 mb-4 bg-white rounded-2xl p-5 text-slate-900">
        {/* No-driver fallback — real terminal state */}
        {isFallback ? (
          <div className="text-center py-2">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-7 h-7 text-red-600" />
            </div>
            <h2 className="font-bold text-lg text-red-700 mb-1">No Ambulance Available</h2>
            <p className="text-slate-500 text-sm mb-4">{fallbackMsg || 'Please call 108 immediately for emergency assistance.'}</p>
            <a
              href="tel:108"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm transition-colors"
            >
              <PhoneCall className="w-4 h-4" /> Call 108
            </a>
          </div>
        ) : isCancelled ? (
          <div className="text-center py-4">
            <h2 className="font-bold text-lg text-slate-700 mb-1">Request Cancelled</h2>
            <p className="text-slate-500 text-sm">This emergency request is no longer active.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-1">
              <StageIcon className={`w-5 h-5 ${stage.color}`} />
              <h2 className="font-bold text-lg">{stage.label}</h2>
            </div>
            <p className="text-slate-500 text-sm mb-4">{stage.sub}</p>

            {/* Real stage progress */}
            <div className="flex items-center gap-1.5 mb-4">
              {STAGES.map((s, i) => (
                <div key={s.label} className={`h-1.5 flex-1 rounded-full transition-all ${i <= stageIndex ? 'bg-cyan-500' : 'bg-slate-100'}`} />
              ))}
            </div>

            {/* Driver card — only once a driver is really assigned */}
            {showDriver && (
              <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3 mb-2">
                <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-cyan-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{driverInfo.name}</p>
                  <p className="text-xs text-slate-500">
                    Ambulance{driverInfo.vehicleNumber ? ` • ${driverInfo.vehicleNumber}` : ''}
                  </p>
                </div>
                {showEta && (
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-slate-400">ETA</p>
                    <p className="font-bold text-cyan-700 text-lg leading-tight">{etaMin} min</p>
                  </div>
                )}
              </div>
            )}

            {/* Searching indicator */}
            {stageIndex === 0 && (
              <div className="flex items-center justify-center gap-2 py-3 text-amber-600">
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                <span className="text-sm font-medium ml-1">Searching for nearby ambulances…</span>
              </div>
            )}

            {/* Arrived — terminal success */}
            {isArrived && (
              <div className="text-center py-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                <p className="font-bold text-emerald-600 text-lg">You've Arrived</p>
                <p className="text-sm text-slate-500 mb-4">The ambulance has reached the hospital.</p>
                <button
                  onClick={handleClose}
                  className="px-6 py-2.5 bg-cyan-600 text-white rounded-xl font-semibold text-sm hover:bg-cyan-700 transition-colors"
                >
                  Back to Dashboard
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Emergency helpline — always reachable while active */}
      {!isArrived && !isFallback && !isCancelled && (
        <div className="mx-4 mb-8">
          <a
            href="tel:108"
            className="w-full py-3 border border-red-900 text-red-300 rounded-xl text-sm font-semibold hover:bg-red-900/20 transition-colors flex items-center justify-center gap-2"
          >
            <Phone className="w-4 h-4" /> Call Emergency Helpline (108)
          </a>
        </div>
      )}
    </div>
  );
}
