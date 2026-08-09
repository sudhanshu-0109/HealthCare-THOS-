import React from 'react';
import { Power } from 'lucide-react';

export default function OnlineToggle({ isOnline, onToggle, loading }) {
  return (
    <button
      onClick={onToggle}
      disabled={loading}
      className={`flex items-center gap-3 px-5 py-3 rounded-xl font-bold text-sm transition-all shadow-md ${
        isOnline
          ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20'
          : 'bg-slate-700 hover:bg-slate-600 text-slate-200 shadow-slate-700/20'
      }`}
    >
      <Power className={`w-5 h-5 ${isOnline ? 'text-white' : 'text-slate-400'}`} />
      <span>{isOnline ? 'ONLINE — READY FOR DISPATCH' : 'OFFLINE — TAP TO GO ONLINE'}</span>
    </button>
  );
}
