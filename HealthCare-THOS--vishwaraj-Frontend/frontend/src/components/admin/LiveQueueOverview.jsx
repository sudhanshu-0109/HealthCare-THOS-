import React from 'react';
import { Clock, UserX, CheckCircle2, Play, Users } from 'lucide-react';

export default function LiveQueueOverview({ doctorQueues = [], onForceSkip }) {
  if (!doctorQueues || doctorQueues.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
        <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
        <h4 className="font-semibold text-slate-700">No Queue Records Today</h4>
        <p className="text-xs text-slate-500">No tokens generated for today's OPD schedule yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {doctorQueues.map((dq) => (
        <div key={dq.doctorId} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          
          {/* Doctor Header */}
          <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-600 text-white rounded-xl font-bold text-xs">
                OPD
              </div>
              <div>
                <h4 className="font-bold text-slate-900">{dq.doctorName}</h4>
                <p className="text-xs text-slate-500">{dq.tokens?.length || 0} total tokens registered today</p>
              </div>
            </div>
          </div>

          {/* Tokens List */}
          <div className="p-4 overflow-x-auto">
            <div className="flex items-center gap-3 min-w-max pb-2">
              {dq.tokens?.map((t) => {
                const isWaiting = t.status === 'WAITING';
                const isCalled = t.status === 'CALLED';
                const isInProgress = t.status === 'IN_PROGRESS';
                const isDone = t.status === 'COMPLETED' || t.status === 'DONE';

                let bgClass = 'bg-slate-50 border-slate-200 text-slate-600';
                if (isWaiting) bgClass = 'bg-amber-50 border-amber-200 text-amber-900';
                if (isCalled) bgClass = 'bg-cyan-50 border-cyan-300 text-cyan-900 ring-2 ring-cyan-500/20';
                if (isInProgress) bgClass = 'bg-purple-50 border-purple-300 text-purple-900 ring-2 ring-purple-500/20';
                if (isDone) bgClass = 'bg-emerald-50 border-emerald-200 text-emerald-800 opacity-60';

                return (
                  <div key={t.id} className={`p-3 rounded-xl border ${bgClass} w-36 flex flex-col justify-between space-y-2 shrink-0`}>
                    <div className="flex items-center justify-between">
                      <span className="font-black text-lg">#{t.tokenNumber}</span>
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-white/60">
                        {t.status}
                      </span>
                    </div>

                    <div className="text-xs font-semibold truncate">
                      {t.appointment?.patient?.fullName || 'Patient'}
                    </div>

                    {(isWaiting || isCalled) && (
                      <button
                        onClick={() => onForceSkip(t.id)}
                        className="mt-1 w-full py-1 text-[11px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded border border-red-200 transition-colors flex items-center justify-center gap-1"
                      >
                        <UserX className="w-3 h-3" /> Force Skip
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      ))}
    </div>
  );
}
