import React from 'react';
import { Navigation, MapPin, Ambulance, Phone } from 'lucide-react';

export default function LiveTrackingMap({
  driverLat,
  driverLng,
  patientLat,
  patientLng,
  status = 'EN_ROUTE',
  driverName,
  vehicleNumber,
}) {
  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 text-white space-y-6 relative overflow-hidden shadow-xl">
      
      {/* Background Animated Radar Grid Visual */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

      {/* Status Header */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="p-3 bg-red-500/20 text-red-400 rounded-xl border border-red-500/30">
              <Ambulance className="w-6 h-6 animate-pulse" />
            </div>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Live GPS Radar</div>
            <div className="text-lg font-bold text-slate-100">{status.replace('_', ' ')}</div>
          </div>
        </div>

        {vehicleNumber && (
          <div className="text-right">
            <span className="text-xs text-slate-400 block font-mono">Vehicle No.</span>
            <span className="text-sm font-bold font-mono px-2.5 py-1 bg-slate-800 rounded-lg border border-slate-700 text-cyan-400">
              {vehicleNumber}
            </span>
          </div>
        )}
      </div>

      {/* Map Radar Graphic Component */}
      <div className="relative h-64 w-full bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-center overflow-hidden">
        
        {/* Radar concentric circles */}
        <div className="absolute w-48 h-48 border border-slate-800/60 rounded-full animate-ping opacity-20" />
        <div className="absolute w-32 h-32 border border-cyan-500/20 rounded-full" />
        <div className="absolute w-16 h-16 border border-cyan-500/30 rounded-full" />

        {/* Center Grid axis lines */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-full h-px bg-slate-800/40" />
          <div className="h-full w-px bg-slate-800/40" />
        </div>

        {/* Patient Location Marker (Static Center) */}
        <div className="absolute flex flex-col items-center gap-1">
          <div className="p-2 bg-red-500 text-white rounded-full shadow-lg shadow-red-500/50 animate-bounce">
            <MapPin className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold bg-slate-900/90 text-red-400 px-2 py-0.5 rounded-full border border-red-500/30 backdrop-blur-xs">
            PATIENT LOCATION
          </span>
        </div>

        {/* Driver Marker (Positioned relatively or animated offset) */}
        {driverLat != null && driverLng != null && (
          <div className="absolute top-12 left-16 flex flex-col items-center gap-1 transition-all duration-1000">
            <div className="p-2.5 bg-cyan-500 text-slate-950 rounded-full shadow-lg shadow-cyan-500/50 ring-4 ring-cyan-500/20">
              <Navigation className="w-5 h-5 transform rotate-45" />
            </div>
            <span className="text-[10px] font-bold bg-slate-900/90 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-500/30 backdrop-blur-xs">
              {driverName || 'AMBULANCE DRIVER'}
            </span>
          </div>
        )}
      </div>

      {/* Coordinate Telemetry Grid */}
      <div className="grid grid-cols-2 gap-4 text-xs font-mono">
        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
          <span className="text-slate-500 block text-[10px] uppercase">Patient Coordinates</span>
          <span className="text-slate-200 font-semibold">
            {patientLat?.toFixed(4) ?? '0.0000'}, {patientLng?.toFixed(4) ?? '0.0000'}
          </span>
        </div>
        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
          <span className="text-slate-500 block text-[10px] uppercase">Ambulance Coordinates</span>
          <span className="text-cyan-400 font-semibold">
            {driverLat?.toFixed(4) ?? '0.0000'}, {driverLng?.toFixed(4) ?? '0.0000'}
          </span>
        </div>
      </div>

    </div>
  );
}
