import React from 'react';
import { PhoneCall, AlertTriangle, ShieldAlert } from 'lucide-react';

export default function FallbackCallScreen() {
  return (
    <div className="bg-red-950/40 border-2 border-red-500 rounded-3xl p-8 text-center space-y-6 max-w-lg mx-auto shadow-2xl">
      <div className="p-4 bg-red-500/20 text-red-400 rounded-full w-20 h-20 mx-auto flex items-center justify-center border border-red-500/40">
        <ShieldAlert className="w-10 h-10 animate-pulse" />
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-black text-red-400 uppercase tracking-wide">No Ambulance Available</h2>
        <p className="text-sm text-slate-300">
          All local ambulances are currently occupied. Please dial national emergency services immediately.
        </p>
      </div>

      <a
        href="tel:108"
        className="inline-flex items-center justify-center gap-3 w-full py-4 bg-red-600 hover:bg-red-500 text-white font-black text-lg rounded-2xl transition-all shadow-xl shadow-red-600/40 transform hover:scale-[1.02]"
      >
        <PhoneCall className="w-6 h-6" /> CALL EMERGENCY 108 NOW
      </a>

      <div className="text-xs text-slate-400">
        Direct toll-free connection to emergency response services
      </div>
    </div>
  );
}
