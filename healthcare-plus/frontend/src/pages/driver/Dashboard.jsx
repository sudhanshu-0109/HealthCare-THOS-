/**
 * pages/driver/Dashboard.jsx — Ambulance Driver Dashboard with real backend integration.
 * Full 10-state machine: DRIVER_ASSIGNED → EN_ROUTE → REACHED_PATIENT →
 *   PICKUP_PENDING_CONFIRMATION (waiting for patient) → PICKED_UP → ARRIVED
 * GPS updates throttled: minimum 1.5s apart and only when moved > 5m.
 */

import { useState, useEffect, useRef } from 'react';
import {
  Truck, MapPin, AlertTriangle, CheckCircle2, Loader2, AlertCircle,
  RefreshCw, Navigation, Clock, Power, ExternalLink, Building2, User,
} from 'lucide-react';
import DashboardShell from '../../components/layout/DashboardShell';
import * as dispatchService from '../../services/emergencyDispatch.service';
import { onSocketEvent } from '../../services/socket';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import LiveTrackingMap from '../../components/emergency/LiveTrackingMap';

const NAV_ITEMS = [
  { id: 'home', icon: Truck, label: 'Dashboard', shortLabel: 'Home' },
  { id: 'history', icon: Clock, label: 'History', shortLabel: 'History' },
];

function ErrorCard({ message, onRetry }) {
  return (
    <div className="bg-red-50 border border-red-100 rounded-2xl p-5 text-center">
      <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
      <p className="text-sm text-red-600 mb-3">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-800 mx-auto">
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </button>
      )}
    </div>
  );
}

// ── STEP LABELS ────────────────────────────────────────────────────────────────

const STEPS = [
  { key: 'accept', label: 'Accepted', action: null },
  { key: 'en-route', label: 'En Route to Patient', action: 'en-route' },
  { key: 'reached', label: 'Reached Patient', action: 'reached' },
  { key: 'picked-up', label: 'Patient Picked Up (Awaiting Confirm)', action: 'picked-up' },
  { key: 'arrived', label: 'Arrived at Hospital', action: 'arrived' },
];

const STATUS_STEP = {
  DRIVER_ASSIGNED: 0,
  EN_ROUTE: 1,
  REACHED_PATIENT: 2,
  PICKUP_PENDING_CONFIRMATION: 3,
  PICKED_UP: 3,
  ARRIVED: 4,
};

/** Minimum movement in degrees (~5m) before sending a location update */
const MIN_MOVEMENT_DEG = 0.00005;
/** Minimum ms between location POST requests */
const MIN_LOCATION_INTERVAL_MS = 1500;

// ── Home Tab ───────────────────────────────────────────────────────────────────

function HomeTab() {
  const [isOnline, setIsOnline] = useState(false);
  const [onlineLoading, setOnlineLoading] = useState(false);
  const [activeRequest, setActiveRequest] = useState(null);
  const [pendingRequest, setPendingRequest] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [driverLoc, setDriverLoc] = useState(null);
  const [driverHeading, setDriverHeading] = useState(null);
  const [routeDist, setRouteDist] = useState(null);
  const [routeEta, setRouteEta] = useState(null);
  const watchIdRef = useRef(null);
  const lastLocationRef = useRef(null); // { lat, lng }
  const lastLocationSentRef = useRef(0); // timestamp ms

  // Rehydrate from the backend on mount
  useEffect(() => {
    let cancelled = false;
    dispatchService.getDriverState()
      .then((res) => {
        if (cancelled) return;
        const state = res.data || {};
        setIsOnline(Boolean(state.isOnline));
        if (state.activeRequest) {
          setActiveRequest(state.activeRequest);
        } else if (state.pendingRequests && state.pendingRequests.length > 0) {
          setPendingRequest(state.pendingRequests[0]);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const showSuccess = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(null), 3000); };

  const getLocation = () => new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Location services are not available on this device.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => reject(new Error('Enable location access to go online and receive dispatches.')),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  });

  const toggleOnline = async () => {
    setOnlineLoading(true);
    setError(null);
    try {
      if (isOnline) {
        await dispatchService.goOffline();
        setIsOnline(false);
        showSuccess('You are now offline');
      } else {
        const loc = await getLocation();
        await dispatchService.goOnline(loc.latitude, loc.longitude);
        setIsOnline(true);
        showSuccess('You are now online and accepting requests');
      }
    } catch (err) {
      setError(err.message || 'Failed to update status.');
    } finally {
      setOnlineLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!pendingRequest) return;
    setActionLoading('accept');
    setError(null);
    try {
      await dispatchService.acceptRequest(pendingRequest.requestId);
      setActiveRequest({ ...pendingRequest, id: pendingRequest.requestId, status: 'DRIVER_ASSIGNED' });
      setPendingRequest(null);
      showSuccess('Request accepted!');
    } catch (err) {
      setError(err.message || 'Failed to accept request.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!pendingRequest) return;
    setActionLoading('reject');
    try {
      await dispatchService.rejectRequest(pendingRequest.requestId);
      setPendingRequest(null);
    } catch (err) {
      setError(err.message || 'Failed to reject request.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStep = async (stepAction) => {
    if (!activeRequest) return;
    setActionLoading(stepAction);
    setError(null);
    try {
      if (stepAction === 'en-route') {
        // GPS watchPosition is already streaming from handleAccept → no blocking getLocation() needed.
        // Just mark en-route; next watchPosition tick will POST the location.
        await dispatchService.markEnRoute(activeRequest.id);
        setActiveRequest((r) => ({ ...r, status: 'EN_ROUTE' }));
      } else if (stepAction === 'reached') {
        // Manual backup reached trigger
        await dispatchService.markReached(activeRequest.id);
        setActiveRequest((r) => ({ ...r, status: 'REACHED_PATIENT' }));
      } else if (stepAction === 'picked-up') {
        const targetHospitalId = activeRequest.destinationHospitalId || activeRequest.hospital?.id;
        const res = await dispatchService.markPickedUp(activeRequest.id, targetHospitalId);
        const hospital = res.data?.hospital || activeRequest.hospital;
        setActiveRequest((r) => ({
          ...r,
          status: 'PICKUP_PENDING_CONFIRMATION',
          hospital,
          destinationHospitalId: targetHospitalId,
        }));
        showSuccess('Awaiting patient confirmation…');
      } else if (stepAction === 'arrived') {
        await dispatchService.markArrived(activeRequest.id);
        setActiveRequest(null);
        showSuccess('Emergency completed!');
      }
    } catch (err) {
      setError(err.message || 'Step failed.');
    } finally {
      setActionLoading(null);
    }
  };

  // Listen for socket events including patient confirmation
  useEffect(() => {
    const unsubNewRequest = onSocketEvent('emergency:new-request', (request) => {
      if (!activeRequest) {
        setPendingRequest(request);
      }
    });

    const unsubStatus = onSocketEvent('emergency:status-update', (data) => {
      // If patient confirmed pickup, advance our local state
      if (data.status === 'PICKED_UP' && activeRequest?.status === 'PICKUP_PENDING_CONFIRMATION') {
        const hospital = data.hospital || activeRequest.hospital;
        setActiveRequest((r) => ({ ...r, status: 'PICKED_UP', hospital }));
        showSuccess('Patient confirmed pickup — routing to hospital!');
      }
      // Handle auto-proximity transitions
      if (data.status === 'REACHED_PATIENT' && activeRequest?.status === 'EN_ROUTE') {
        setActiveRequest((r) => ({ ...r, status: 'REACHED_PATIENT' }));
      }
      if (data.status === 'ARRIVED') {
        setActiveRequest(null);
        showSuccess('Arrived at hospital — emergency complete!');
      }
    });

    return () => {
      unsubNewRequest();
      unsubStatus();
    };
  }, [activeRequest]);

  // GPS throttled location streaming
  useEffect(() => {
    const trackable = activeRequest && ['DRIVER_ASSIGNED', 'EN_ROUTE', 'REACHED_PATIENT', 'PICKUP_PENDING_CONFIRMATION', 'PICKED_UP'].includes(activeRequest.status);
    if (!trackable || !navigator.geolocation) {
      if (trackable && !navigator.geolocation) {
        setError('Location services are unavailable. GPS tracking is required during an active dispatch.');
      }
      return;
    }

    let staleTimer = null;
    const resetStaleTimer = () => {
      if (staleTimer) clearTimeout(staleTimer);
      staleTimer = setTimeout(() => {
        setError('GPS signal lost — unable to retrieve live location. Check device location permissions.');
      }, 12000);
    };
    resetStaleTimer();

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setError(null);
        resetStaleTimer();
        const { latitude, longitude, heading, speed } = pos.coords;
        setDriverLoc({ lat: latitude, lng: longitude });
        if (heading != null && !Number.isNaN(heading)) {
          setDriverHeading(heading);
        }

        // Throttle: only POST if moved more than MIN_MOVEMENT_DEG AND MIN_LOCATION_INTERVAL_MS elapsed
        const now = Date.now();
        const last = lastLocationRef.current;
        const movedEnough = !last ||
          Math.abs(latitude - last.lat) > MIN_MOVEMENT_DEG ||
          Math.abs(longitude - last.lng) > MIN_MOVEMENT_DEG;
        const timeElapsed = now - lastLocationSentRef.current > MIN_LOCATION_INTERVAL_MS;

        if (movedEnough && timeElapsed) {
          lastLocationRef.current = { lat: latitude, lng: longitude };
          lastLocationSentRef.current = now;
          dispatchService.updateLocation(latitude, longitude, heading, speed).catch(() => {});
        }
      },
      (geoErr) => {
        setError(
          geoErr.code === 1
            ? 'Location access denied. Please enable GPS permissions for this browser and reload.'
            : 'Unable to retrieve live location. GPS signal may be weak.'
        );
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
    );
    return () => {
      if (staleTimer) clearTimeout(staleTimer);
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [activeRequest]);

  const currentStep = activeRequest ? (STATUS_STEP[activeRequest.status] ?? 0) : -1;
  const isPickupPending = activeRequest?.status === 'PICKUP_PENDING_CONFIRMATION';

  return (
    <div className="p-4 sm:p-6 pb-24 lg:pb-6 space-y-4">
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5 text-sm text-emerald-700 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {successMsg}
        </div>
      )}
      {error && <ErrorCard message={error} />}

      {/* Availability toggle */}
      <div className={`rounded-2xl p-5 ${isOnline ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : 'bg-slate-200'}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`font-bold text-lg ${isOnline ? 'text-white' : 'text-slate-700'}`}>
              {isOnline ? '🟢 Online' : '⭕ Offline'}
            </p>
            <p className={`text-sm ${isOnline ? 'text-emerald-100' : 'text-slate-500'}`}>
              {isOnline ? 'Accepting emergency requests' : 'Not accepting requests'}
            </p>
          </div>
          <button
            onClick={toggleOnline}
            disabled={onlineLoading}
            className={`px-4 py-2 rounded-xl font-semibold text-sm flex items-center gap-2 transition-colors ${
              isOnline ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            } disabled:opacity-50`}
          >
            {onlineLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
            {isOnline ? 'Go Offline' : 'Go Online'}
          </button>
        </div>
      </div>

      {/* Pending incoming request */}
      {pendingRequest && (
        <div className="bg-red-600 rounded-2xl p-5 text-white animate-pulse">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5" />
            <p className="font-bold">Incoming Emergency!</p>
          </div>
          <p className="text-sm mb-1">Patient needs urgent assistance</p>
          <p className="text-red-200 text-xs mb-4 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {pendingRequest.distanceKm != null ? `${pendingRequest.distanceKm} km away` : 'Location shared'}
            {pendingRequest.patientLat != null && pendingRequest.patientLng != null
              ? ` • ${Number(pendingRequest.patientLat).toFixed(4)}, ${Number(pendingRequest.patientLng).toFixed(4)}`
              : ''}
          </p>
          <div className="flex gap-3">
            <button onClick={handleReject} disabled={!!actionLoading}
              className="flex-1 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
              Decline
            </button>
            <button onClick={handleAccept} disabled={!!actionLoading}
              className="flex-1 py-2.5 bg-white text-red-600 hover:bg-red-50 rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
              {actionLoading === 'accept' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Accept
            </button>
          </div>
        </div>
      )}

      {/* Active emergency */}
      {activeRequest && (() => {
        const patLat = activeRequest.patientLat ?? activeRequest.latitude ?? null;
        const patLng = activeRequest.patientLng ?? activeRequest.longitude ?? null;
        const isPhaseB = ['PICKED_UP', 'ARRIVED'].includes(activeRequest.status);

        const extDestLat = isPhaseB ? activeRequest.hospital?.latitude : patLat;
        const extDestLng = isPhaseB ? activeRequest.hospital?.longitude : patLng;
        const extNavUrl =
          extDestLat != null && extDestLng != null
            ? `https://www.google.com/maps/dir/?api=1&destination=${extDestLat},${extDestLng}&travelmode=driving`
            : null;

        return (
          <div className="space-y-3">
            {/* Live map */}
            <LiveTrackingMap
              patientLat={patLat}
              patientLng={patLng}
              driverLat={driverLoc?.lat}
              driverLng={driverLoc?.lng}
              driverHeading={driverHeading}
              hospitalLat={activeRequest.hospital?.latitude}
              hospitalLng={activeRequest.hospital?.longitude}
              hospitalName={activeRequest.hospital?.name}
              hospitalAddress={activeRequest.hospital?.address}
              status={activeRequest.status}
              distanceKm={routeDist}
              etaMin={routeEta}
              height="360px"
              showTelemetryBar={false}
              onRouteUpdate={({ distanceKm, etaMin }) => {
                setRouteDist(distanceKm);
                setRouteEta(etaMin);
              }}
            />

            <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4 shadow-xs">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-extrabold text-slate-900 text-base">Active Emergency Dispatch</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isPhaseB ? 'Transporting patient to hospital emergency bay' : 'Navigating to patient pickup'}
                  </p>
                </div>
                <StatusBadge status={activeRequest.status} />
              </div>

              {/* Pickup Pending Banner */}
              {isPickupPending && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                  <p className="text-xs font-bold text-amber-700">⏳ Waiting for patient to confirm pickup…</p>
                  <p className="text-[11px] text-amber-600 mt-0.5">Patient must tap "I'm in the Ambulance" on their screen.</p>
                </div>
              )}

              {/* Destination Card */}
              <div className={`p-4 rounded-xl border ${isPhaseB ? 'bg-teal-50/70 border-teal-200' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {isPhaseB
                      ? <Building2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
                      : <MapPin className="w-4 h-4 text-red-500 flex-shrink-0" />}
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      {isPhaseB ? 'Hospital Destination' : activeRequest.status === 'REACHED_PATIENT' ? 'Reached — Pickup Location' : 'Patient Pickup'}
                    </span>
                  </div>
                  {routeEta != null && !isPickupPending && (
                    <span className="text-xs font-bold text-cyan-700 bg-cyan-100 px-2 py-0.5 rounded-full font-mono">
                      ETA: {routeEta} min
                    </span>
                  )}
                </div>
                <p className="text-sm font-bold text-slate-900">
                  {isPhaseB
                    ? activeRequest.hospital?.name || 'Assigned Hospital'
                    : activeRequest.patientName || 'Emergency Patient'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isPhaseB
                    ? activeRequest.hospital?.address || 'Hospital Emergency Bay'
                    : patLat != null && patLng != null
                      ? `GPS: ${Number(patLat).toFixed(4)}, ${Number(patLng).toFixed(4)}`
                      : 'Coordinates shared'}
                </p>
                {routeDist != null && !isPickupPending && (
                  <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Road Distance Remaining:</span>
                    <span className="font-bold text-slate-800 font-mono">{Number(routeDist).toFixed(1)} km</span>
                  </div>
                )}
              </div>

              {/* External Navigation Link */}
              {extNavUrl && !isPickupPending && (
                <a
                  href={extNavUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-slate-800 transition-colors shadow-sm"
                >
                  <ExternalLink className="w-4 h-4 text-cyan-400" />
                  <span>Open in Google Maps Turn-by-Turn</span>
                </a>
              )}

              {/* Step progress */}
              <div className="space-y-2 pt-1">
                {STEPS.map((step, i) => (
                  <div key={step.key} className={`flex items-center gap-3 ${i <= currentStep ? 'opacity-100' : 'opacity-40'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${i <= currentStep ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                      {i <= currentStep ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : <span className="text-xs text-slate-500">{i + 1}</span>}
                    </div>
                    <p className="text-xs font-semibold text-slate-700">{step.label}</p>
                  </div>
                ))}
              </div>

              {/* Next action button */}
              {!isPickupPending && STEPS.filter((s) => s.action).map((step, i) => {
                const stepIdx = i + 1;
                if (stepIdx !== currentStep + 1) return null;
                // Don't show "arrived" button when status is PICKUP_PENDING_CONFIRMATION
                if (step.key === 'arrived' && activeRequest.status === 'PICKUP_PENDING_CONFIRMATION') return null;
                return (
                  <button
                    key={step.key}
                    onClick={() => handleStep(step.action)}
                    disabled={!!actionLoading}
                    className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
                  >
                    {actionLoading === step.action ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                    {step.label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Idle state */}
      {!activeRequest && !pendingRequest && isOnline && (
        <EmptyState icon={Truck} title="Ready for dispatch" description="Waiting for emergency requests…" />
      )}
      {!activeRequest && !pendingRequest && !isOnline && (
        <div className="bg-slate-100 rounded-2xl p-6 text-center">
          <Power className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-slate-600 font-medium">You are offline</p>
          <p className="text-xs text-slate-400 mt-1">Go online to receive emergency requests</p>
        </div>
      )}
    </div>
  );
}

// ── History Tab ────────────────────────────────────────────────────────────────

function HistoryTab() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    dispatchService.getDriverState()
      .then((res) => setHistory(res.data?.history || []))
      .catch((err) => setError(err.message || 'Failed to load dispatch history.'))
      .finally(() => setLoading(false));
  }, []);

  const fmt = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString();
  };

  return (
    <div className="p-4 sm:p-6 pb-24 lg:pb-6">
      <h2 className="font-bold text-slate-900 mb-4">Dispatch History</h2>
      {error && <ErrorCard message={error} />}
      {loading ? (
        <div className="flex items-center justify-center text-slate-400 py-12">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading history…
        </div>
      ) : history.length === 0 ? (
        <EmptyState icon={Clock} title="No history yet" description="Completed dispatches will appear here." />
      ) : (
        <div className="space-y-3">
          {history.map((h) => (
            <div key={h.id} className="bg-white rounded-2xl border border-slate-100 p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-slate-900">{h.patientName || 'Patient'}</p>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" />
                    {h.patientLat != null && h.patientLng != null
                      ? `${Number(h.patientLat).toFixed(4)}, ${Number(h.patientLng).toFixed(4)}`
                      : 'Location shared'}
                  </p>
                </div>
                <StatusBadge status={h.status} />
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-500">
                <span>Requested: {fmt(h.createdAt)}</span>
                <span>Accepted: {fmt(h.acceptedAt)}</span>
                <span>Picked up: {fmt(h.pickedUpAt)}</span>
                <span>Arrived: {fmt(h.arrivedAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────

export default function AmbulanceDashboard() {
  const [activeItem, setActiveItem] = useState('home');

  return (
    <DashboardShell
      navItems={NAV_ITEMS}
      activeItem={activeItem}
      setActiveItem={setActiveItem}
      roleLabel="Ambulance Driver"
      roleColor="bg-gradient-to-r from-red-500 to-rose-600 text-white"
    >
      {activeItem === 'home' ? <HomeTab /> : <HistoryTab />}
    </DashboardShell>
  );
}
