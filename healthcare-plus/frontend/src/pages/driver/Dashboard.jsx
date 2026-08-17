/**
 * pages/driver/Dashboard.jsx — Ambulance Driver Dashboard with real backend integration.
 * All state changes call real /driver/* endpoints. Socket.IO emergency:new-request listened.
 */

import { useState, useEffect, useRef } from 'react';
import {
  Truck, MapPin, AlertTriangle, CheckCircle2, Loader2, AlertCircle,
  RefreshCw, Navigation, Clock, Power
} from 'lucide-react';
import DashboardShell from '../../components/layout/DashboardShell';
import * as dispatchService from '../../services/emergencyDispatch.service';
import { onSocketEvent } from '../../services/socket';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import LiveTrackingMap from '../../components/emergency/LiveTrackingMap';
import { haversineKm, estimateEtaMin } from '../../utils/distance';

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
  { key: 'en-route', label: 'En Route', action: 'en-route' },
  { key: 'picked-up', label: 'Picked Up', action: 'picked-up' },
  { key: 'arrived', label: 'Arrived at Hospital', action: 'arrived' },
];

const STATUS_STEP = {
  DRIVER_ASSIGNED: 0,
  EN_ROUTE: 1,
  PICKED_UP: 2,
  ARRIVED: 3,
};

// ── Home Tab ───────────────────────────────────────────────────────────────────

function HomeTab() {
  const [isOnline, setIsOnline] = useState(false);
  const [onlineLoading, setOnlineLoading] = useState(false);
  const [activeRequest, setActiveRequest] = useState(null);
  const [pendingRequest, setPendingRequest] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [driverLoc, setDriverLoc] = useState(null); // driver's live GPS position
  const [routeDist, setRouteDist] = useState(null);
  const [routeEta, setRouteEta] = useState(null);
  const watchIdRef = useRef(null);

  // Rehydrate from the backend on mount so a page refresh mid-trip restores the
  // real online status and any in-flight assignment instead of showing "offline".
  // Also rehydrates any SEARCHING requests so drivers see them on login.
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
          // Show the closest (first) pending request — driver can accept or decline
          setPendingRequest(state.pendingRequests[0]);
        }
      })
      .catch(() => { /* first-time drivers may have no ambulance yet — stay offline */ });
    return () => { cancelled = true; };
  }, []);


  const showSuccess = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(null), 3000); };

  // Real device geolocation — rejects (no fake fallback) so the ambulance is only
  // ever placed at its true coordinates.
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

  // Toggle online/offline
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

  // Accept a pending request
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

  // Advance emergency step
  const handleStep = async (stepAction) => {
    if (!activeRequest) return;
    setActionLoading(stepAction);
    setError(null);
    try {
      if (stepAction === 'en-route') {
        // Push a fresh location immediately, then transition.
        try {
          const loc = await getLocation();
          await dispatchService.updateLocation(loc.latitude, loc.longitude);
        } catch { /* streaming continues via watchPosition; ignore one-off failure */ }
        await dispatchService.markEnRoute(activeRequest.id);
        setActiveRequest((r) => ({ ...r, status: 'EN_ROUTE' }));
      } else if (stepAction === 'picked-up') {
        await dispatchService.markPickedUp(activeRequest.id);
        setActiveRequest((r) => ({ ...r, status: 'PICKED_UP' }));
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

  // Listen for new emergency requests via Socket.IO. Payload shape:
  // { requestId, patientLat, patientLng, distanceKm, timestamp }
  useEffect(() => {
    const unsub = onSocketEvent('emergency:new-request', (request) => {
      // Show incoming request if not already handling an active trip
      if (!activeRequest) {
        setPendingRequest(request);
      }
    });
    return unsub;
  }, [activeRequest]);


  // Stream REAL GPS location to the backend while a trip is active. The server
  // re-emits it to the patient's tracking room (emergency:location-update).
  // Uses the browser's watchPosition — event-driven, NOT a setInterval poll.
  useEffect(() => {
    const trackable = activeRequest && ['DRIVER_ASSIGNED', 'EN_ROUTE', 'PICKED_UP'].includes(activeRequest.status);
    if (!trackable || !navigator.geolocation) return;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setDriverLoc({ lat: latitude, lng: longitude }); // update local map marker
        dispatchService.updateLocation(latitude, longitude).catch(() => {});
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
    );
    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [activeRequest]);

  const currentStep = activeRequest ? (STATUS_STEP[activeRequest.status] ?? 0) : -1;

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

      {/* Active emergency — Rapido-style trip view */}
      {activeRequest && (() => {
        const patLat = activeRequest.patientLat ?? activeRequest.latitude ?? null;
        const patLng = activeRequest.patientLng ?? activeRequest.longitude ?? null;
        return (
          <div className="space-y-3">
            {/* Live map — driver's GPS dot + patient marker */}
            <LiveTrackingMap
              patientLat={patLat}
              patientLng={patLng}
              driverLat={driverLoc?.lat}
              driverLng={driverLoc?.lng}
              status={activeRequest.status}
              distanceKm={routeDist}
              etaMin={routeEta}
              onRouteUpdate={({ distanceKm, etaMin }) => {
                setRouteDist(distanceKm);
                setRouteEta(etaMin);
              }}
            />

            <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-slate-900">Active Emergency</p>
                  <p className="text-sm text-slate-500">Transporting patient</p>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" />
                    {patLat != null && patLng != null
                      ? `${Number(patLat).toFixed(4)}, ${Number(patLng).toFixed(4)}`
                      : 'Location shared'}
                  </p>
                </div>
                <StatusBadge status={activeRequest.status} />
              </div>

              {/* Step progress */}
              <div className="space-y-2">
                {STEPS.map((step, i) => (
                  <div key={step.key} className={`flex items-center gap-3 ${i <= currentStep ? 'opacity-100' : 'opacity-40'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${i <= currentStep ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                      {i <= currentStep ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : <span className="text-xs text-slate-500">{i + 1}</span>}
                    </div>
                    <p className="text-sm text-slate-700">{step.label}</p>
                  </div>
                ))}
              </div>

              {/* Next action button */}
              {STEPS.filter((s) => s.action).map((step, i) => {
                const stepIdx = i + 1; // steps 1,2,3
                if (stepIdx !== currentStep + 1) return null;
                return (
                  <button
                    key={step.key}
                    onClick={() => handleStep(step.action)}
                    disabled={!!actionLoading}
                    className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
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
