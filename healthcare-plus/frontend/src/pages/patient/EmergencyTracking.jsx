/**
 * pages/patient/EmergencyTracking.jsx — Uber/Ola-style dedicated full-screen emergency trip view.
 *
 * Source of truth is the backend.
 * Full State Machine supported:
 *   SEARCHING → DRIVER_ASSIGNED → EN_ROUTE → REACHED_PATIENT →
 *   PICKUP_PENDING_CONFIRMATION → PICKED_UP → ARRIVED
 *
 * Patient confirms pickup inline when status is PICKUP_PENDING_CONFIRMATION.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Phone, AlertTriangle, CheckCircle2, ArrowLeft, User, Truck,
  Heart, Loader2, PhoneCall, X, Building2, MapPin, ShieldCheck,
  Navigation, CheckSquare,
} from 'lucide-react';
import * as dispatchService from '../../services/emergencyDispatch.service';
import * as patientService from '../../services/patient.service';
import { joinEmergencyRoom, leaveEmergencyRoom, onSocketEvent, getSocket } from '../../services/socket';
import LiveTrackingMap from '../../components/emergency/LiveTrackingMap';
import { ARRIVAL_THRESHOLD_METERS } from '../../utils/emergencyRouting';

// Real EmergencyRequest status → tracking stage index
const STATUS_STAGE = {
  REQUESTED: 0,
  PENDING: 0,
  SEARCHING: 0,
  DRIVER_ASSIGNED: 1,
  EN_ROUTE: 2,
  REACHED_PATIENT: 2,       // Still "on the way" stage — urgency variant
  PICKUP_PENDING_CONFIRMATION: 3, // Patient must confirm
  PICKED_UP: 3,
  ARRIVED: 4,
};

const STAGES = [
  { label: 'Searching', sub: 'Finding nearest available ambulance…', icon: AlertTriangle, color: 'text-amber-500' },
  { label: 'Driver Assigned', sub: 'Driver accepted your emergency request', icon: User, color: 'text-blue-400' },
  { label: 'On The Way', sub: 'Ambulance is navigating to your pickup location', icon: Truck, color: 'text-cyan-400' },
  { label: 'Pickup', sub: 'Ambulance has reached your location', icon: Navigation, color: 'text-teal-400' },
  { label: 'Arrived at Hospital', sub: 'Ambulance has reached the hospital', icon: CheckCircle2, color: 'text-emerald-400' },
];

const POLL_MS = 20000; // Safety-net poll

export default function EmergencyTracking({ requestId: propRequestId, onClose }) {
  const params = useParams();
  const requestId = propRequestId || params.requestId;
  const navigate = useNavigate();

  const [status, setStatus] = useState('SEARCHING');
  const [patientLoc, setPatientLoc] = useState(null);
  const [driverLoc, setDriverLoc] = useState(null);
  const [driverHeading, setDriverHeading] = useState(null);
  const [driverInfo, setDriverInfo] = useState(null);
  const [hospitalInfo, setHospitalInfo] = useState(null);
  const [fallbackMsg, setFallbackMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [routeDist, setRouteDist] = useState(null);
  const [routeEta, setRouteEta] = useState(null);
  const [socketConnected, setSocketConnected] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState(null);
  const [confirmingPickup, setConfirmingPickup] = useState(false);
  const [confirmPickupError, setConfirmPickupError] = useState(null);
  // Location staleness: true when no driver location update received in 15s
  const [locationStale, setLocationStale] = useState(false);
  const locationStaleTimerRef = useRef(null);

  const statusRef = useRef(status);
  statusRef.current = status;

  const resetLocationStaleTimer = useCallback(() => {
    setLocationStale(false);
    if (locationStaleTimerRef.current) clearTimeout(locationStaleTimerRef.current);
    locationStaleTimerRef.current = setTimeout(() => setLocationStale(true), 15000);
  }, []);

  const handleClose = () => {
    const terminal = ['ARRIVED', 'CANCELLED', 'NO_DRIVER_FALLBACK'];
    const isTerminal = terminal.includes(status);
    if (onClose) {
      onClose(isTerminal);
    } else {
      navigate('/patient/dashboard');
    }
  };


/**
 * Normalise API response shape — the backend wraps responses as
 * { success, data } but axios interceptors may already unwrap one level.
 * Handles: res.data.id, res.id, res.data.data.id.
 * C4: single source of truth for response unwrapping.
 */
function extractReq(res) {
  if (!res) return null;
  if (res.id) return res;                        // already unwrapped
  if (res.data?.id) return res.data;             // { data: { id: ... } }
  if (res.data?.data?.id) return res.data.data;  // { data: { data: { id: ... } } }
  return null;
}

  // Apply fetched request payload to local state
  const applyRequest = useCallback((req) => {
    if (!req) return;
    if (req.status) setStatus(req.status);
    if (req.latitude != null && req.longitude != null) {
      setPatientLoc({ lat: req.latitude, lng: req.longitude });
    }

    const hosp = req.destinationHospital || req.hospital;
    if (hosp) {
      setHospitalInfo({
        id: hosp.id,
        name: hosp.name,
        address: hosp.address,
        locality: hosp.locality,
        city: hosp.city,
        latitude: hosp.latitude,
        longitude: hosp.longitude,
        contactPhone: hosp.contactPhone,
      });
    }

    // Driver info may come directly in the status response (C3/H3 addition)
    const driverName = req.driverName || req.ambulance?.driver?.user?.fullName;
    const vehicleNumber = req.vehicleNumber || req.ambulance?.vehicleNumber;
    const amb = req.ambulance;
    if (driverName || vehicleNumber || amb) {
      setDriverInfo({
        name: driverName || amb?.driver?.user?.fullName || 'Ambulance driver',
        vehicleNumber: vehicleNumber || null,
        phone: amb?.driver?.user?.patientProfile?.phone || null,
      });
    }

    // Restore last known driver position from DB (C3: refresh recovery)
    const recoveredLat = req.lastDriverLat ?? req.ambulanceLat ?? req.ambulance?.currentLatitude;
    const recoveredLng = req.lastDriverLng ?? req.ambulanceLng ?? req.ambulance?.currentLongitude;
    if (recoveredLat != null && recoveredLng != null) {
      setDriverLoc((prev) => {
        // Don't overwrite a live socket-streamed position with a stale DB value
        // unless we have nothing at all
        if (prev != null) return prev;
        return { lat: recoveredLat, lng: recoveredLng };
      });
    }

    if (req.status === 'NO_DRIVER_FALLBACK') {
      setFallbackMsg('No ambulance is available right now. Please call 108 immediately.');
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (!requestId) return;
    let cancelled = false;
    setLoading(true);

    dispatchService.getEmergencyStatus(requestId)
      .then((res) => {
        if (cancelled) return;
        applyRequest(extractReq(res));
        setError(null);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Could not load your emergency request.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [requestId, applyRequest]);

  // Socket connection status tracking
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

  // Socket subscriptions
  useEffect(() => {
    if (!requestId) return;
    joinEmergencyRoom(requestId);

    const unsubAccepted = onSocketEvent('emergency:accepted', (data) => {
      if (data.requestId && data.requestId !== requestId) return;
      setStatus('DRIVER_ASSIGNED');
      setDriverInfo({
        name: data.driverName || 'Ambulance driver',
        vehicleNumber: data.vehicleNumber || null,
        phone: data.driverPhone || null,
      });
      if (data.driverLat != null && data.driverLng != null) {
        setDriverLoc({ lat: data.driverLat, lng: data.driverLng });
      }
      if (data.hospital) {
        setHospitalInfo(data.hospital);
      }
    });

    const unsubLocation = onSocketEvent('emergency:location-update', (data) => {
      if (data.requestId && data.requestId !== requestId) return;
      if (data.driverLat != null && data.driverLng != null) {
        setDriverLoc({ lat: data.driverLat, lng: data.driverLng });
        resetLocationStaleTimer();
      }
      if (data.heading != null) {
        setDriverHeading(data.heading);
      }
    });

    const unsubStatus = onSocketEvent('emergency:status-update', (data) => {
      if (data.requestId && data.requestId !== requestId) return;
      if (data.status) setStatus(data.status);
      if (data.hospital) setHospitalInfo(data.hospital);
      if (data.message) setFallbackMsg(data.message);
      // Clear confirmation error on new status
      if (data.status && data.status !== 'PICKUP_PENDING_CONFIRMATION') {
        setConfirmPickupError(null);
      }
    });

    // M3: Handle emergency:joined — server confirms auth + returns last-known location
    // for immediate refresh recovery (driver position before next GPS event)
    const unsubJoined = onSocketEvent('emergency:joined', (data) => {
      if (data.requestId && data.requestId !== requestId) return;
      if (data.lastDriverLat != null && data.lastDriverLng != null) {
        setDriverLoc((prev) => prev ?? { lat: data.lastDriverLat, lng: data.lastDriverLng });
      }
    });

    // Start stale timer when driver is assigned (active trip)
    resetLocationStaleTimer();

    return () => {
      unsubAccepted();
      unsubLocation();
      unsubStatus();
      unsubJoined();
      if (locationStaleTimerRef.current) clearTimeout(locationStaleTimerRef.current);
      leaveEmergencyRoom(requestId);
    };
  }, [requestId, resetLocationStaleTimer]);

  // Safety-net periodic sync
  useEffect(() => {
    if (!requestId) return;
    const terminal = ['ARRIVED', 'CANCELLED', 'NO_DRIVER_FALLBACK'];
    const interval = setInterval(() => {
      if (terminal.includes(statusRef.current)) return;
      dispatchService.getEmergencyStatus(requestId)
        .then((res) => applyRequest(extractReq(res)))
        .catch(() => {});
    }, POLL_MS);
    return () => clearInterval(interval);
  }, [requestId, applyRequest]);

  // Cancel action
  const handleCancel = async () => {
    if (!requestId || cancelling) return;
    setCancelling(true);
    setCancelError(null);
    try {
      await patientService.cancelEmergencyRequest(requestId);
      setStatus('CANCELLED');
    } catch (err) {
      setCancelError(err?.response?.data?.message || err.message || 'Could not cancel request.');
    } finally {
      setCancelling(false);
    }
  };

  // Patient confirms pickup
  const handleConfirmPickup = async () => {
    if (!requestId || confirmingPickup) return;
    setConfirmingPickup(true);
    setConfirmPickupError(null);
    try {
      await patientService.confirmPickup(requestId);
      // Status update will arrive via socket; optimistically set it here too
      setStatus('PICKED_UP');
    } catch (err) {
      setConfirmPickupError(err?.response?.data?.message || err.message || 'Could not confirm pickup. Please try again.');
    } finally {
      setConfirmingPickup(false);
    }
  };

  const isFallback = status === 'NO_DRIVER_FALLBACK';
  const isCancelled = status === 'CANCELLED';
  const isArrived = status === 'ARRIVED';
  const isPickedUp = status === 'PICKED_UP';
  const isReachedPatient = status === 'REACHED_PATIENT';
  const isPickupPending = status === 'PICKUP_PENDING_CONFIRMATION';
  const isTerminalForCancel = isArrived || isFallback || isCancelled || isPickedUp || isPickupPending;

  const stageIndex = STATUS_STAGE[status] ?? 0;
  const stage = STAGES[Math.min(stageIndex, STAGES.length - 1)];
  const StageIcon = stage.icon;

  const showDriver = stageIndex >= 1 && driverInfo && !isFallback && !isCancelled;
  const isArrivingUrgency =
    (status === 'EN_ROUTE') &&
    routeDist != null &&
    routeDist * 1000 <= ARRIVAL_THRESHOLD_METERS;

  // H1: Memoize route update callback so LiveTrackingMap does not see a new
  // function reference on every render, preventing unnecessary re-renders and
  // stale distance/ETA updates.
  const handleRouteUpdate = useCallback(({ distanceKm: dist, etaMin: eta }) => {
    setRouteDist(dist);
    setRouteEta(eta);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
          <Loader2 className="w-7 h-7 text-red-500 animate-spin" />
        </div>
        <p className="text-sm font-semibold text-slate-200">Connecting to Emergency Dispatch…</p>
        <p className="text-xs text-slate-500 mt-1">Establishing real-time ambulance telemetry</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col selection:bg-cyan-500 selection:text-white">
      {/* ── Top Header Navigation Bar ───────────────────────────────────── */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <button
            onClick={handleClose}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Return to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  isArrived
                    ? 'bg-emerald-400'
                    : isReachedPatient || isPickupPending
                      ? 'bg-amber-400 animate-pulse'
                      : isArrivingUrgency
                        ? 'bg-amber-400 animate-ping'
                        : 'bg-red-500 animate-pulse'
                }`}
              />
              <h1 className="text-sm font-extrabold tracking-wide uppercase">
                {isArrived
                  ? 'TRIP COMPLETED'
                  : isPickedUp
                    ? 'HOSPITAL TRANSPORT'
                    : isPickupPending
                      ? 'CONFIRM YOUR PICKUP'
                      : isReachedPatient
                        ? 'AMBULANCE AT YOUR LOCATION'
                        : 'LIVE AMBULANCE TRACKING'}
              </h1>
            </div>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              Ref: {requestId ? requestId.slice(0, 8) : '—'}
            </p>
          </div>
        </div>

        <a
          href="tel:108"
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-600/90 hover:bg-red-600 text-white font-bold text-xs shadow-lg shadow-red-900/30 transition-all cursor-pointer"
        >
          <PhoneCall className="w-3.5 h-3.5" />
          <span>Call 108</span>
        </a>
      </header>

      {/* ── Error Banners ──────────────────────────────────────────────── */}
      {error && (
        <div className="mx-4 mt-3 bg-red-500/15 border border-red-500/30 rounded-xl px-4 py-2.5 text-xs text-red-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {cancelError && (
        <div className="mx-4 mt-3 bg-amber-500/15 border border-amber-500/30 rounded-xl px-4 py-2.5 text-xs text-amber-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{cancelError}</span>
        </div>
      )}

      {/* ── Main Layout: Map Backdrop + Overlay Trip Sheet (Mobile-First) ── */}
      <main className="flex-1 flex flex-col lg:grid lg:grid-cols-12 lg:gap-6 p-3 sm:p-4 max-w-7xl mx-auto w-full">
        {/* Left / Top Map Container */}
        <div className="lg:col-span-8 flex flex-col">
          <LiveTrackingMap
            patientLat={patientLoc?.lat}
            patientLng={patientLoc?.lng}
            driverLat={driverLoc?.lat}
            driverLng={driverLoc?.lng}
            driverHeading={driverHeading}
            hospitalLat={hospitalInfo?.latitude}
            hospitalLng={hospitalInfo?.longitude}
            hospitalName={hospitalInfo?.name}
            hospitalAddress={hospitalInfo?.address}
            status={status}
            driverName={driverInfo?.name}
            vehicleNumber={driverInfo?.vehicleNumber}
            distanceKm={routeDist}
            etaMin={routeEta}
            socketConnected={socketConnected}
            height="460px"
            showTelemetryBar={false}
            onRouteUpdate={handleRouteUpdate}
          />
        </div>

        {/* Right / Bottom Trip Details Sheet */}
        <div className="lg:col-span-4 mt-3 lg:mt-0 flex flex-col space-y-3">
          {/* Terminal: No Driver Available Fallback */}
          {isFallback ? (
            <div className="bg-slate-900 border border-red-900/50 rounded-2xl p-6 text-center shadow-xl">
              <div className="w-14 h-14 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto mb-3 text-red-400">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <h2 className="text-base font-extrabold text-red-400 mb-1">
                No Ambulance Available
              </h2>
              <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                {fallbackMsg || 'All local fleet drivers are engaged. Please dial the emergency helpline immediately.'}
              </p>
              <a
                href="tel:108"
                className="w-full inline-flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-red-950/50 transition-colors"
              >
                <PhoneCall className="w-4 h-4" /> Call 108 Emergency Now
              </a>
            </div>
          ) : isCancelled ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center shadow-xl">
              <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center mx-auto mb-2 text-slate-400">
                <X className="w-6 h-6" />
              </div>
              <h2 className="text-base font-bold text-slate-200 mb-1">Request Cancelled</h2>
              <p className="text-xs text-slate-400 mb-4">This emergency dispatch was cancelled.</p>
              <button
                onClick={handleClose}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
              >
                Return to Dashboard
              </button>
            </div>
          ) : (
            <>
              {/* Location Stale Banner */}
              {locationStale && ['DRIVER_ASSIGNED', 'EN_ROUTE', 'REACHED_PATIENT', 'PICKED_UP'].includes(status) && (
                <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 flex items-center gap-2 text-xs text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
                  <span>Updating ambulance location… last known position shown.</span>
                </div>
              )}

              {/* ── PICKUP PENDING CONFIRMATION CARD ─────────────────────── */}
              {isPickupPending && (
                <div className="bg-amber-950/40 border border-amber-500/50 rounded-2xl p-5 shadow-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0 animate-pulse">
                      <Truck className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-extrabold text-amber-300 text-sm">Ambulance Has Arrived!</p>
                      <p className="text-xs text-amber-200/80 mt-0.5">
                        The driver has marked you as picked up. Please confirm you are in the ambulance.
                      </p>
                    </div>
                  </div>
                  {confirmPickupError && (
                    <div className="mb-3 bg-red-900/30 border border-red-800/50 rounded-xl px-3 py-2 text-xs text-red-300 flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{confirmPickupError}</span>
                    </div>
                  )}
                  <button
                    onClick={handleConfirmPickup}
                    disabled={confirmingPickup}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-900 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-900/30 cursor-pointer"
                  >
                    {confirmingPickup
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <CheckSquare className="w-4 h-4" />}
                    {confirmingPickup ? 'Confirming…' : "Yes, I'm in the Ambulance"}
                  </button>
                  <p className="text-[11px] text-amber-200/50 text-center mt-2">
                    Confirming will start navigation to the hospital emergency bay.
                  </p>
                </div>
              )}

              {/* Trip Telemetry & Live Status Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                {/* Reached Patient Urgency Banner */}
                {isReachedPatient && (
                  <div className="bg-amber-500/15 border border-amber-500/30 rounded-xl p-3 flex items-center gap-3 animate-pulse">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-amber-300">Ambulance Has Arrived!</p>
                      <p className="text-[11px] text-amber-200/80">
                        Vehicle is at your pickup location. Wait for driver to confirm pickup.
                      </p>
                    </div>
                  </div>
                )}

                {/* Urgency Alert for Arriving (EN_ROUTE, within 200m) */}
                {isArrivingUrgency && (
                  <div className="bg-amber-500/15 border border-amber-500/30 rounded-xl p-3 flex items-center gap-3 animate-pulse">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-amber-300">Ambulance Arriving!</p>
                      <p className="text-[11px] text-amber-200/80">
                        Vehicle is within {Math.round((routeDist || 0.2) * 1000)}m of your pickup location.
                      </p>
                    </div>
                  </div>
                )}

                {/* Status Stage Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <StageIcon className={`w-5 h-5 ${stage.color}`} />
                      <h2 className="font-extrabold text-base text-white">
                        {isPickupPending ? 'Awaiting Your Confirmation' : stage.label}
                      </h2>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {isPickupPending
                        ? 'Please confirm you are in the ambulance above'
                        : isReachedPatient
                          ? 'Ambulance is at your location — driver is marking pickup'
                          : stage.sub}
                    </p>
                  </div>
                  {routeEta != null && ['DRIVER_ASSIGNED', 'EN_ROUTE', 'PICKED_UP'].includes(status) && (
                    <div className="text-right flex-shrink-0 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
                      <span className="block text-[10px] uppercase font-bold text-slate-400">Traffic ETA</span>
                      <span className="text-base font-extrabold text-cyan-400 font-mono">
                        {routeEta} min
                      </span>
                    </div>
                  )}
                </div>

                {/* Stage Progress Bar */}
                <div className="flex items-center gap-1.5">
                  {STAGES.map((s, i) => (
                    <div
                      key={s.label}
                      className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                        i <= stageIndex ? 'bg-cyan-500 shadow-xs shadow-cyan-500/50' : 'bg-slate-800'
                      }`}
                    />
                  ))}
                </div>

                {/* Road Metrics Display */}
                {['DRIVER_ASSIGNED', 'EN_ROUTE', 'REACHED_PATIENT', 'PICKED_UP'].includes(status) && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                      <span className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">
                        Road Distance
                      </span>
                      <span className="text-sm font-extrabold text-white font-mono">
                        {routeDist != null ? `${Number(routeDist).toFixed(1)} km` : 'Calculating…'}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                      <span className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">
                        {isPickedUp ? 'Destination' : 'Trip Destination'}
                      </span>
                      <span className="text-xs font-bold text-teal-400 truncate block">
                        {isPickedUp
                          ? hospitalInfo?.name || 'Hospital'
                          : 'Your Pickup Point'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Assigned Driver Card */}
                {showDriver && (
                  <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 flex-shrink-0">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-white truncate">
                          {driverInfo.name}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          Ambulance • {driverInfo.vehicleNumber || 'GJ-06-AMB'}
                        </p>
                      </div>
                    </div>
                    {driverInfo.phone && (
                      <a
                        href={`tel:${driverInfo.phone}`}
                        className="p-2.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 transition-colors"
                        title="Call Ambulance Driver"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                )}

                {/* Phase B: Hospital Destination Card */}
                {hospitalInfo && (
                  <div className="p-3.5 bg-teal-950/40 rounded-xl border border-teal-800/50 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 flex-shrink-0 mt-0.5">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-extrabold text-teal-200 truncate">
                          {hospitalInfo.name}
                        </p>
                        {hospitalInfo.contactPhone && (
                          <a
                            href={`tel:${hospitalInfo.contactPhone}`}
                            className="text-teal-400 hover:text-teal-300 transition-colors"
                            title="Call Hospital"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                      <p className="text-[11px] text-teal-300/80 truncate mt-0.5">
                        {hospitalInfo.address || `${hospitalInfo.locality || ''}, ${hospitalInfo.city || 'Vadodara'}`}
                      </p>
                      {isPickedUp && (
                        <span className="inline-block text-[10px] font-bold text-teal-400 mt-1 uppercase tracking-wider">
                          🏥 Emergency Bay Pre-Alerted
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Searching Animation */}
                {stageIndex === 0 && (
                  <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/60 text-center">
                    <div className="flex items-center justify-center gap-2 text-amber-400 mb-2">
                      <span className="w-2 h-2 bg-amber-400 rounded-full animate-ping" />
                      <span className="text-xs font-bold">Searching Nearest Available Ambulances…</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Dispatched to all on-duty emergency drivers in your area.
                    </p>
                  </div>
                )}

                {/* Terminal Success State */}
                {isArrived && (
                  <div className="text-center py-3 bg-emerald-950/30 border border-emerald-800/40 rounded-xl p-4">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                    <p className="font-extrabold text-sm text-emerald-300">
                      Arrived at Hospital
                    </p>
                    <p className="text-xs text-slate-400 mt-1 mb-4">
                      The patient has safely arrived at {hospitalInfo?.name || 'the hospital emergency center'}.
                    </p>
                    <button
                      onClick={handleClose}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Return to Dashboard
                    </button>
                  </div>
                )}

                {/* Cancel Action (Pre-terminal only, not during pickup confirmation) */}
                {!isTerminalForCancel && !isPickupPending && (
                  <button
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-900/60 text-red-400 font-bold text-xs hover:bg-red-950/30 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {cancelling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                    Cancel Emergency Request
                  </button>
                )}
              </div>

              {/* Safety & Dispatch Assurance Card */}
              <div className="p-4 bg-slate-900/60 border border-slate-800/60 rounded-2xl flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                <div className="text-[11px] text-slate-400 leading-relaxed">
                  <span className="font-bold text-slate-300">Certified Emergency Fleet:</span> GPS telemetry and road routing are verified in real time. For immediate critical triage, dial 108.
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
