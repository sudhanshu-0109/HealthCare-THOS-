/**
 * components/dashboard/ComingSoonCard.jsx — Honest placeholder for future phases.
 * Visually distinguishable from "genuine empty state" per the plan's requirement.
 */

import { Clock } from 'lucide-react';

export default function ComingSoonCard({ title, icon: Icon, phase, description }) {
  return (
    <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-5 text-center">
      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
        {Icon ? <Icon className="w-5 h-5 text-slate-300" /> : <Clock className="w-5 h-5 text-slate-300" />}
      </div>
      <h3 className="text-sm font-semibold text-slate-400">{title}</h3>
      {description && <p className="text-xs text-slate-300 mt-1">{description}</p>}
      <span className="inline-flex items-center gap-1 mt-2 px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[10px] text-slate-400 font-medium">
        <Clock className="w-3 h-3" /> Coming in Phase {phase}
      </span>
    </div>
  );
}
