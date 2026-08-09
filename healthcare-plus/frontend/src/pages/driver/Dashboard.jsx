import React, { useState, useEffect } from 'react';
import { Truck, MapPin, Clock, CheckCircle2, Navigation, Phone, AlertTriangle, Activity } from 'lucide-react';
import DashboardShell from '../../components/layout/DashboardShell';
import OnlineToggle from '../../components/emergency/OnlineToggle';
import IncomingRequestModal from '../../components/emergency/IncomingRequestModal';
import LiveTrackingMap from '../../components/emergency/LiveTrackingMap';
import { onSocketEvent } from '../../services/socket';
import * as dispatchService from '../../services/emergencyDispatch.service';

const NAV_ITEMS = [
  { id: 'dispatch', icon: AlertTriangle, label: 'Dispatch', shortLabel: 'Dispatch' },
  { id: 'status', icon: Activity, label: 'Driver Status', shortLabel: 'Status' },
];

export default function AmbulanceDashboard() {
  const [activeTab, setActiveTab] = useState('dispatch');
  const [isOnline, setIsOnline] = useState(false);
  const [loadingToggle, setLoadingToggle] = useState(false);
  const [incomingRequest, setIncomingRequest] = useState(null);
  const [activeDuty, setActiveDuty] = useState(null);
  const [currentCoords, setCurrentCoords] = useState({ lat: 12.9716, lng: 77.5946 });

  // Watch geolocation position
  useEffect(() => {
    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setCurrentCoords({ lat, lng });

          if (isOnline) {
            dispatchService.updateLocation(lat, lng).catch(() => {});
          }
        },
        (err) => console.warn('[Driver] Geolocation warning:', err.message),
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [isOnline]);

  // Subscribe to real socket events
  useEffect(() => {
    const unsubNew = onSocketEvent('emergency:new-request', (data) => {
      console.log('[Driver Socket] New incoming emergency request:', data);
      setIncomingRequest(data);
    });

    return () => {
      unsubNew();
    };
  }, []);

  const handleToggleOnline = async () => {
    try {
      setLoadingToggle(true);
      if (isOnline) {
        await dispatchService.goOffline();
        setIsOnline(false);
      } else {
        await dispatchService.goOnline(currentCoords.lat, currentCoords.lng);
        setIsOnline(true);
      }
    } catch (err) {
      alert(err.message || 'Failed to toggle online status');
    } finally {
      setLoadingToggle(false);
    }
  };

  const handleAccept = async (requestId) => {
    try {
      const res = await dispatchService.acceptRequest(requestId);
      if (res.success || res.data?.success) {
        setIncomingRequest(null);
        setActiveDuty({
          id: requestId,
          status: 'DRIVER_ASSIGNED',
          patientLat: incomingRequest?.patientLat,
          patientLng: incomingRequest?.patientLng,
        });
      } else {
        alert(res.message || res.reason || 'Failed to accept request.');
        setIncomingRequest(null);
      }
    } catch (err) {
      alert(err.message || 'Error accepting duty.');
    }
  };

  const handleReject = async (requestId) => {
    try {
      await dispatchService.rejectRequest(requestId);
    } catch {}
    setIncomingRequest(null);
  };

  const handleEnRoute = async () => {
    if (!activeDuty) return;
    await dispatchService.markEnRoute(activeDuty.id);
    setActiveDuty((prev) => ({ ...prev, status: 'EN_ROUTE' }));
  };

  const handlePickedUp = async () => {
    if (!activeDuty) return;
    await dispatchService.markPickedUp(activeDuty.id);
    setActiveDuty((prev) => ({ ...prev, status: 'PICKED_UP' }));
  };

  const handleArrived = async () => {
    if (!activeDuty) return;
    await dispatchService.markArrived(activeDuty.id);
    setActiveDuty(null);
  };

  return (
    <DashboardShell navItems={NAV_ITEMS} activeTab={activeTab} onTabChange={setActiveTab}>
      <div className="p-4 sm:p-6 pb-24 lg:pb-6 space-y-6">
        
        {/* Header with Online Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-6 rounded-2xl text-white shadow-xl">
          <div>
            <h1 className="text-2xl font-black tracking-wide flex items-center gap-2">
              <Truck className="w-7 h-7 text-cyan-400" /> Ambulance Control Center
            </h1>
            <p className="text-xs text-slate-400 mt-1">Real-time emergency dispatch response hub</p>
          </div>

          <OnlineToggle isOnline={isOnline} onToggle={handleToggleOnline} loading={loadingToggle} />
        </div>

        {/* Incoming Request Overlay Modal */}
        {incomingRequest && (
          <IncomingRequestModal
            request={incomingRequest}
            onAccept={handleAccept}
            onReject={handleReject}
          />
        )}

        {/* Active Emergency Duty View */}
        {activeDuty ? (
          <div className="space-y-6">
            <div className="bg-red-600 text-white rounded-2xl p-6 shadow-xl flex items-center justify-between">
              <div>
                <span className="text-xs uppercase font-bold bg-white/20 px-3 py-1 rounded-full">ACTIVE EMERGENCY DUTY</span>
                <h2 className="text-xl font-black mt-2">Emergency Request #{activeDuty.id.slice(0, 8)}</h2>
              </div>
              <div className="p-3 bg-white/10 rounded-xl">
                <Activity className="w-8 h-8 animate-pulse" />
              </div>
            </div>

            {/* Radar Tracking Component */}
            <LiveTrackingMap
              driverLat={currentCoords.lat}
              driverLng={currentCoords.lng}
              patientLat={activeDuty.patientLat}
              patientLng={activeDuty.patientLng}
              status={activeDuty.status}
            />

            {/* Progress Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {activeDuty.status === 'DRIVER_ASSIGNED' && (
                <button
                  onClick={handleEnRoute}
                  className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-all shadow-lg"
                >
                  Mark En Route
                </button>
              )}
              {activeDuty.status === 'EN_ROUTE' && (
                <button
                  onClick={handlePickedUp}
                  className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition-all shadow-lg"
                >
                  Mark Patient Picked Up
                </button>
              )}
              {activeDuty.status === 'PICKED_UP' && (
                <button
                  onClick={handleArrived}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg"
                >
                  Mark Arrived at ER Bay
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Waiting Standby State */
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-4">
            <Truck className="w-16 h-16 text-slate-300 mx-auto" />
            <h3 className="text-xl font-bold text-slate-800">
              {isOnline ? 'Active & Waiting for Dispatch Calls' : 'You are currently Offline'}
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              {isOnline
                ? 'Stay on this screen. Incoming emergency SOS calls will pop up automatically with patient GPS telemetry.'
                : 'Turn your status to ONLINE above to start receiving emergency dispatch signals from nearby patients.'}
            </p>
          </div>
        )}

      </div>
    </DashboardShell>
  );
}
