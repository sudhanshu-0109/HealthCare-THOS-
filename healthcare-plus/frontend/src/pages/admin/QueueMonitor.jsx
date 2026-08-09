import React, { useState, useEffect } from 'react';
import { Users, RefreshCw, AlertCircle } from 'lucide-react';
import LiveQueueOverview from '../../components/admin/LiveQueueOverview';
import api from '../../services/api';
import { getSocket, onSocketEvent } from '../../services/socket';
import useAuthStore from '../../store/authStore';

export default function AdminQueueMonitorPage() {
  const [queues, setQueues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuthStore();

  const fetchQueues = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/admin/queue/overview');
      setQueues(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load hospital queues.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueues();

    const hospitalId = user?.hospitalId || user?.hospitalAdmin?.hospitalId;
    if (hospitalId) {
      const s = getSocket();
      if (s) s.emit('join-hospital-queue', { hospitalId });
    }

    const unsub = onSocketEvent('queue:updated', () => {
      fetchQueues();
    });

    return () => {
      unsub();
    };
  }, []);

  const handleForceSkip = async (tokenId) => {
    const reason = prompt('Please specify reason for administrative force-skip:');
    if (!reason) return;

    try {
      await api.post(`/admin/queue/${tokenId}/force-skip`, { reason });
      fetchQueues();
    } catch (err) {
      alert(err.message || 'Force-skip action failed.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-7 h-7 text-cyan-600" /> Hospital Live Queue Oversight
          </h1>
          <p className="text-sm text-slate-500 mt-1">Real-time OPD token streams and administrative override controls</p>
        </div>

        <button
          onClick={fetchQueues}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Queues
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200">
          Loading live hospital queues...
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700 flex items-center gap-3">
          <AlertCircle className="w-6 h-6 shrink-0" />
          <span>{error}</span>
        </div>
      ) : (
        <LiveQueueOverview doctorQueues={queues} onForceSkip={handleForceSkip} />
      )}

    </div>
  );
}
