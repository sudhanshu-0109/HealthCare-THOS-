/**
 * components/queue/QueueList.jsx — Doctor's queue token list.
 */

import { RotateCcw } from 'lucide-react';
import * as queueService from '../../services/queue.service';

const STATUS_STYLES = {
  WAITING: 'bg-blue-50 text-blue-700 border-blue-200',
  CALLED: 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse',
  IN_PROGRESS: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  COMPLETED: 'bg-slate-50 text-slate-500 border-slate-200',
  SKIPPED: 'bg-red-50 text-red-600 border-red-200',
  CANCELLED: 'bg-slate-50 text-slate-400 border-slate-100',
};

export default function QueueList({ queue, onUpdate }) {
  const handleRequeue = async (tokenId) => {
    try {
      await queueService.requeueSkipped(tokenId);
      onUpdate();
    } catch (err) {
      console.error('[QueueList] Requeue error:', err);
    }
  };

  if (queue.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400 py-12">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">🏥</span>
          </div>
          <p className="font-medium text-slate-500">No patients in queue</p>
          <p className="text-sm mt-1">Confirmed appointments will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
      {queue.map((token) => (
        <div key={token.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors">
          {/* Token number badge */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm border ${
            token.status === 'CALLED' ? 'bg-amber-100 text-amber-800 border-amber-300' :
            token.status === 'IN_PROGRESS' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
            token.status === 'COMPLETED' ? 'bg-slate-100 text-slate-500 border-slate-200' :
            'bg-blue-50 text-blue-700 border-blue-200'
          }`}>
            #{Math.floor(token.tokenNumber)}
          </div>

          {/* Patient info */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-800 text-sm truncate">
              {token.appointment?.patient?.fullName || 'Patient'}
            </p>
            <p className="text-xs text-slate-400">{token.appointment?.scheduledTime}</p>
          </div>

          {/* Status badge */}
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${STATUS_STYLES[token.status] || 'bg-slate-50 text-slate-500'}`}>
            {token.status.replace('_', ' ')}
          </span>

          {/* Requeue button for skipped */}
          {token.status === 'SKIPPED' && (
            <button
              onClick={() => handleRequeue(token.id)}
              className="text-slate-400 hover:text-cyan-600 transition-colors"
              title="Re-queue patient"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
