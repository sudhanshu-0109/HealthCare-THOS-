import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function MetricCard({ label, value, change, up, icon: Icon, color = 'bg-cyan-50 text-cyan-600' }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
      <div className="space-y-1">
        <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">{label}</span>
        <div className="text-2xl font-black text-slate-900">{value}</div>
        {change && (
          <div className={`flex items-center gap-1 text-xs font-medium ${up ? 'text-emerald-600' : 'text-red-500'}`}>
            {up ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            <span>{change}</span>
          </div>
        )}
      </div>

      <div className={`p-3.5 rounded-2xl ${color} shrink-0`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
}
