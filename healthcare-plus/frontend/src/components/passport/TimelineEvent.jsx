/**
 * components/passport/TimelineEvent.jsx — Single medical timeline entry.
 */

import { Calendar, Stethoscope, FlaskConical, Pill, Activity } from 'lucide-react';

const TYPE_CONFIG = {
  APPOINTMENT: { icon: Calendar, color: 'bg-cyan-50 text-cyan-600 border-cyan-200', dot: 'bg-cyan-500' },
  CONSULTATION: { icon: Stethoscope, color: 'bg-purple-50 text-purple-600 border-purple-200', dot: 'bg-purple-500' },
  PRESCRIPTION: { icon: Pill, color: 'bg-emerald-50 text-emerald-600 border-emerald-200', dot: 'bg-emerald-500' },
  LAB_REPORT: { icon: FlaskConical, color: 'bg-amber-50 text-amber-600 border-amber-200', dot: 'bg-amber-500' },
  MEDICATION: { icon: Activity, color: 'bg-rose-50 text-rose-600 border-rose-200', dot: 'bg-rose-500' },
};

export default function TimelineEvent({ event, isLast }) {
  const config = TYPE_CONFIG[event.eventType] || TYPE_CONFIG.APPOINTMENT;
  const Icon = config.icon;

  return (
    <div className="flex gap-3">
      {/* Timeline line + dot */}
      <div className="flex flex-col items-center">
        <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${config.dot}`} />
        {!isLast && <div className="w-px flex-1 bg-slate-200 mt-1.5 mb-0" />}
      </div>

      {/* Content */}
      <div className="flex-1 pb-5">
        <div className="flex items-start gap-2">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${config.color}`}>
            <Icon className="w-3 h-3" />
            {event.eventType.replace('_', ' ')}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5">
            {new Date(event.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
        <p className="text-sm font-semibold text-slate-800 mt-1">{event.title}</p>
        {event.description && (
          <p className="text-xs text-slate-500 mt-0.5">{event.description}</p>
        )}
      </div>
    </div>
  );
}
