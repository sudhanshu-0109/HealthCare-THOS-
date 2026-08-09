import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AlertTriangle, MapPin, Truck, PhoneCall, ShieldAlert, CheckCircle2, ChevronLeft } from 'lucide-react';
import LiveTrackingMap from '../../components/emergency/LiveTrackingMap';
import FallbackCallScreen from '../../components/emergency/FallbackCallScreen';
import { getSocket, onSocketEvent } from '../../services/socket';
import * as dispatchService from '../../services/emergencyDispatch.service';

export default function EmergencyTrackingPage() {
  const { requestId } = useParams();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await dispatchService.getEmergencyStatus(requestId);
      setRequest(res.data);
    } catch (err) {
      setError(err.message || 'Failed to retrieve emergency status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    // Join emergency socket room for real-time driver updates
    if (requestId) {
      const s = getSocket();
      if (s) s.emit('join-emergency-room', { requestId });
    }

    // Poll status every 10 seconds as backup
    const pollInterval = setInterval(fetchStatus, 10000);

    // Socket updates
    const unsubAccepted = onSocketEvent('emergency:accepted', (data) => {
      if (data.requestId === requestId) {
        setRequest((prev) => ({
          ...prev,
          status: 'DRIVER_ASSIGNED',
          ambulance: {
            vehicleNumber: data.vehicleNumber,
            currentLatitude: data.driverLat,
            currentLongitude: data.driverLng,
            driver: { user: { fullName: data.driverName } },
          },
        }));
      }
    });

    const unsubLoc = onSocketEvent('emergency:location-update', (data) => {
      if (data.requestId === requestId) {
        setRequest((prev) => ({
          ...prev,
          ambulance: {
            ...prev?.ambulance,
            currentLatitude: data.driverLat,
            currentLongitude: data.driverLng,
          },
        }));
      }
    });

    const unsubStatus = onSocketEvent('emergency:status-update', (data) => {
      if (data.requestId === requestId) {
        setRequest((prev) => ({ ...prev, status: data.status }));
      }
    });

    return () => {
      clearInterval(pollInterval);
      if (requestId) {
        const s = getSocket();
        if (s) s.emit('leave-emergency-room', { requestId });
      }
      unsubAccepted();
      unsubLoc();
      unsubStatus();
    };
  }, [requestId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <AlertTriangle className="w-12 h-12 text-red-500 animate-bounce mx-auto" />
          <div className="text-lg font-bold">Connecting to Emergency Dispatch Radar...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="bg-red-950 border border-red-800 p-6 rounded-2xl text-center space-y-4 max-w-md">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto" />
          <div className="text-red-300">{error}</div>
          <Link to="/patient/dashboard" className="inline-block px-4 py-2 bg-slate-800 rounded-xl text-sm font-bold">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (request?.status === 'NO_DRIVER_FALLBACK') {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-6 flex flex-col justify-center">
        <FallbackCallScreen />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
      
      {/* Back button & Header */}
      <div className="flex items-center justify-between">
        <Link to="/patient/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-semibold">
          <ChevronLeft className="w-5 h-5" /> Dashboard
        </Link>

        <span className="text-xs font-mono text-cyan-400 bg-cyan-950 px-3 py-1 rounded-full border border-cyan-800">
          ID: {requestId?.slice(0, 8)}
        </span>
      </div>

      {/* Progress Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center justify-between">
        <div>
          <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">Dispatch Progress</span>
          <h1 className="text-2xl font-black text-white mt-1">
            {request?.status === 'SEARCHING' && 'Searching for Nearest Available Ambulance...'}
            {request?.status === 'DRIVER_ASSIGNED' && 'Ambulance Assigned — Preparing Response'}
            {request?.status === 'EN_ROUTE' && 'Ambulance En Route to Your Location'}
            {request?.status === 'PICKED_UP' && 'Patient Picked Up — Heading to Hospital ER'}
            {request?.status === 'ARRIVED' && 'Arrived Safely at Hospital Emergency Bay'}
          </h1>
        </div>

        <div className="p-3 bg-red-500/20 text-red-400 rounded-xl border border-red-500/30">
          <Truck className="w-8 h-8 animate-pulse" />
        </div>
      </div>

      {/* Live Radar Map */}
      <LiveTrackingMap
        driverLat={request?.ambulance?.currentLatitude}
        driverLng={request?.ambulance?.currentLongitude}
        patientLat={request?.latitude}
        patientLng={request?.longitude}
        status={request?.status}
        driverName={request?.ambulance?.driver?.user?.fullName}
        vehicleNumber={request?.ambulance?.vehicleNumber}
      />

      {/* Manual Emergency Call Fallback */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between text-xs text-slate-400">
        <span>Need urgent direct phone dispatch?</span>
        <a href="tel:108" className="flex items-center gap-1.5 text-red-400 font-bold hover:underline">
          <PhoneCall className="w-4 h-4" /> Call 108 Hotline
        </a>
      </div>

    </div>
  );
}
