/**
 * components/queue/PatientQueueTracker.jsx — Live queue position view for patients.
 * Subscribes to queue:updated and queue:token-called socket events.
 */

import { useEffect, useState } from 'react';
import { Clock, Users, Radio, Bell } from 'lucide-react';
import * as queueService from '../../services/queue.service';
import { joinPatientRoom, onSocketEvent } from '../../services/socket';

export default function PatientQueueTracker({ appointmentId }) {
  const [data, setData] = useState(null);
  const [called, setCalled] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchPosition = async () => {
    try {
      const res = await queueService.getMyQueuePosition(appointmentId);
      setData(res.data || res);
    } catch (err) {
      console.error('[PatientQueueTracker]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosition();
    joinPatientRoom();

    const offUpdate = onSocketEvent('queue:updated', () => {
      fetchPosition();
    });

    const offCalled = onSocketEvent('queue:token-called', (payload) => {
      setCalled(true);
      // Auto-dismiss after 30 seconds
      setTimeout(() => setCalled(false), 30000);
    });

    return () => {
      offUpdate();
      offCalled();
    };
  }, [appointmentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-slate-400">
        <Radio className="w-5 h-5 animate-spin mr-2" /> Connecting to live queue…
      </div>
    );
  }

  if (!data) return null;

  const { token, patientsAhead, estimatedWaitMinutes, currentlyServing } = data;

  // "You're being called" banner
  if (called || token?.status === 'CALLED') {
    return (
      <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white text-center shadow-xl shadow-orange-500/25 animate-pulse">
        <Bell className="w-12 h-12 mx-auto mb-3" />
        <h2 className="text-2xl font-bold mb-1">It's Your Turn!</h2>
        <p className="opacity-90">Token #{Math.floor(token.tokenNumber)} — Please proceed to the doctor's room now.</p>
      </div>
    );
  }

  if (token?.status === 'IN_PROGRESS') {
    return (
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white text-center shadow-xl shadow-emerald-500/25">
        <div className="text-5xl mb-3">🩺</div>
        <h2 className="text-xl font-bold mb-1">Consultation in Progress</h2>
        <p className="opacity-90">You're with the doctor now.</p>
      </div>
    );
  }

  if (token?.status === 'COMPLETED') {
    return (
      <div className="bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl p-6 text-white text-center">
        <div className="text-5xl mb-3">✅</div>
        <h2 className="text-xl font-bold mb-1">Consultation Complete</h2>
        <p className="opacity-80 text-sm">Your appointment has been marked as completed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Live indicator */}
      <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        Live — updates automatically
      </div>

      {/* Token number */}
      <div className="bg-gradient-to-br from-cyan-500 to-teal-600 rounded-2xl p-6 text-white text-center shadow-lg shadow-cyan-500/25">
        <p className="text-sm opacity-80 mb-1">Your Token</p>
        <p className="text-6xl font-black">#{Math.floor(token.tokenNumber)}</p>
        <p className="text-sm opacity-80 mt-2 capitalize">{token.status.toLowerCase().replace('_', ' ')}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-slate-100 p-3 text-center">
          <Radio className="w-4 h-4 text-cyan-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-slate-900">{currentlyServing ?? '—'}</p>
          <p className="text-xs text-slate-400">Now Serving</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-3 text-center">
          <Users className="w-4 h-4 text-slate-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-slate-900">{patientsAhead}</p>
          <p className="text-xs text-slate-400">Ahead of You</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-3 text-center">
          <Clock className="w-4 h-4 text-amber-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-slate-900">~{estimatedWaitMinutes}m</p>
          <p className="text-xs text-slate-400">Est. Wait</p>
        </div>
      </div>

      <p className="text-xs text-slate-400 text-center">Estimated wait is based on an average consultation time of 10 minutes.</p>
    </div>
  );
}
