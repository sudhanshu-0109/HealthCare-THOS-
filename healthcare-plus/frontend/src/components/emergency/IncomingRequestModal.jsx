import React, { useState, useEffect } from 'react';
import { AlertTriangle, MapPin, Check, X, Clock } from 'lucide-react';

export default function IncomingRequestModal({ request, onAccept, onReject }) {
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    if (timeLeft <= 0) {
      onReject(request.requestId);
      return;
    }
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-red-500 rounded-3xl max-w-md w-full p-6 text-white space-y-6 shadow-2xl shadow-red-500/20">
        
        {/* Urgent Header */}
        <div className="flex items-center gap-3 bg-red-500/20 border border-red-500/30 p-4 rounded-2xl">
          <AlertTriangle className="w-8 h-8 text-red-500 animate-bounce shrink-0" />
          <div>
            <div className="font-black text-red-400 text-lg uppercase tracking-wider">Emergency Dispatch</div>
            <div className="text-xs text-slate-300">New SOS trigger detected nearby</div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Estimated Distance</span>
            <span className="text-cyan-400 font-bold font-mono text-sm">{request.distanceKm || '2.4'} km</span>
          </div>

          <div className="flex items-start gap-2 text-xs text-slate-300 border-t border-slate-900 pt-3">
            <MapPin className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-400 block text-[10px]">Patient Coordinates</span>
              <span className="font-mono text-slate-200">{request.patientLat?.toFixed(4)}, {request.patientLng?.toFixed(4)}</span>
            </div>
          </div>
        </div>

        {/* Countdown Timer */}
        <div className="flex items-center justify-center gap-2 text-amber-400 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 text-xs font-semibold">
          <Clock className="w-4 h-4 animate-spin" />
          <span>Auto-reject in {timeLeft} seconds if no action taken</span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <button
            onClick={() => onReject(request.requestId)}
            className="flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors border border-slate-700"
          >
            <X className="w-5 h-5" /> Decline
          </button>
          <button
            onClick={() => onAccept(request.requestId)}
            className="flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-red-600/30"
          >
            <Check className="w-5 h-5" /> Accept Duty
          </button>
        </div>

      </div>
    </div>
  );
}
