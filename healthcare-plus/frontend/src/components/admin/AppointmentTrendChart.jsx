import React from 'react';
import { Calendar } from 'lucide-react';

export default function AppointmentTrendChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-slate-400">
        No appointment trend data available for the selected range.
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-600" /> Appointment Trends
          </h3>
          <p className="text-xs text-slate-500">Daily appointment volume timeline</p>
        </div>
      </div>

      <div className="h-48 w-full flex items-end gap-2 pt-6 border-b border-slate-100 pb-2 overflow-x-auto">
        {data.map((item, i) => {
          const heightPct = Math.max((item.count / maxVal) * 100, 8);
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-2 group min-w-[28px]">
              <div className="text-[10px] font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                {item.count}
              </div>
              <div
                style={{ height: `${heightPct}%` }}
                className="w-full bg-cyan-500 group-hover:bg-cyan-600 rounded-t-md transition-all duration-300 relative"
              />
              <span className="text-[9px] text-slate-400 truncate w-full text-center">
                {item.date.slice(5)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
