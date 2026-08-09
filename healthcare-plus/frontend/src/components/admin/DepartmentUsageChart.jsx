import React from 'react';
import { Building2 } from 'lucide-react';

export default function DepartmentUsageChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-slate-400">
        No department usage data available.
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.count, 0) || 1;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
      <div>
        <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
          <Building2 className="w-5 h-5 text-purple-600" /> Department Volume Usage
        </h3>
        <p className="text-xs text-slate-500">Consultation distribution across departments</p>
      </div>

      <div className="space-y-3">
        {data.map((dept, i) => {
          const pct = ((dept.count / total) * 100).toFixed(1);
          return (
            <div key={i} className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-800">{dept.departmentName}</span>
                <span className="text-slate-500">{dept.count} consultations ({pct}%)</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  style={{ width: `${pct}%` }}
                  className="h-full bg-purple-500 rounded-full transition-all duration-500"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
