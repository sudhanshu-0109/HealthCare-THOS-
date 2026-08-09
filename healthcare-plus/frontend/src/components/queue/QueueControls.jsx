/**
 * components/queue/QueueControls.jsx — Doctor queue action buttons.
 * Buttons are enabled/disabled based on current queue state.
 * All actions call REST endpoints (no direct socket emissions).
 */

import { Loader2, Phone, Play, CheckCircle2, SkipForward, RotateCcw } from 'lucide-react';
import * as queueService from '../../services/queue.service';

export default function QueueControls({ queue, loading, setLoading, onUpdate }) {
  const called = queue.find((t) => t.status === 'CALLED');
  const inProgress = queue.find((t) => t.status === 'IN_PROGRESS');
  const hasWaiting = queue.some((t) => t.status === 'WAITING');

  const action = async (fn) => {
    setLoading(true);
    try {
      await fn();
      onUpdate();
    } catch (err) {
      console.error('[QueueControls]', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 p-4 bg-slate-50 border-t border-slate-100">
      {/* Call Next — only when no one is CALLED or IN_PROGRESS */}
      <button
        onClick={() => action(() => queueService.callNext())}
        disabled={loading || !hasWaiting || !!called || !!inProgress}
        className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
        Call Next
      </button>

      {/* Start — only when someone is CALLED */}
      <button
        onClick={() => called && action(() => queueService.startConsultation(called.id))}
        disabled={loading || !called}
        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors"
      >
        <Play className="w-4 h-4" /> Start
      </button>

      {/* Complete — only when someone is IN_PROGRESS */}
      <button
        onClick={() => inProgress && action(() => queueService.completeConsultation(inProgress.id))}
        disabled={loading || !inProgress}
        className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors"
      >
        <CheckCircle2 className="w-4 h-4" /> Complete
      </button>

      {/* Skip — only when someone is CALLED */}
      <button
        onClick={() => called && action(() => queueService.skipPatient(called.id))}
        disabled={loading || !called}
        className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors"
      >
        <SkipForward className="w-4 h-4" /> Skip
      </button>
    </div>
  );
}
