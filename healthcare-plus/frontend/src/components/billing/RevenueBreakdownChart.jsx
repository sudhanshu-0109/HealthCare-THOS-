import React from 'react';
import { Calendar, Pill, FlaskConical, TrendingUp } from 'lucide-react';

export default function RevenueBreakdownChart({ breakdown, total }) {
  const categories = [
    { key: 'APPOINTMENT', label: 'Doctor Appointments', color: 'bg-cyan-500', text: 'text-cyan-600', icon: Calendar },
    { key: 'PHARMACY_ORDER', label: 'Pharmacy Orders', color: 'bg-emerald-500', text: 'text-emerald-600', icon: Pill },
    { key: 'LAB_REQUEST', label: 'Lab Tests', color: 'bg-purple-500', text: 'text-purple-600', icon: FlaskConical },
  ];

  const safeTotal = total > 0 ? total : 1;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-600" /> Revenue Breakdown
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Distribution across hospital service streams</p>
        </div>
        <div className="text-right">
          <span className="text-xs font-medium text-slate-400 uppercase">Total Revenue</span>
          <div className="text-2xl font-black text-slate-900">₹{Number(total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        </div>
      </div>

      {/* Stacked Bar Visual */}
      <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex">
        {categories.map((cat) => {
          const item = breakdown?.[cat.key] || { total: 0 };
          const pct = Math.min(100, Math.max(0, (item.total / safeTotal) * 100));
          if (pct === 0) return null;
          return (
            <div
              key={cat.key}
              style={{ width: `${pct}%` }}
              className={`${cat.color} h-full transition-all duration-500`}
              title={`${cat.label}: ₹${item.total.toFixed(2)} (${pct.toFixed(1)}%)`}
            />
          );
        })}
      </div>

      {/* Category Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {categories.map((cat) => {
          const item = breakdown?.[cat.key] || { total: 0, count: 0 };
          const pct = ((item.total / safeTotal) * 100).toFixed(1);
          const Icon = cat.icon;

          return (
            <div key={cat.key} className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg bg-white shadow-xs ${cat.text}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-700">{cat.label}</div>
                  <div className="text-xs text-slate-400">{item.count} transaction(s)</div>
                </div>
              </div>

              <div className="text-right">
                <div className="font-bold text-slate-900 text-sm">₹{Number(item.total).toFixed(2)}</div>
                <div className="text-xs font-medium text-slate-500">{pct}%</div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
