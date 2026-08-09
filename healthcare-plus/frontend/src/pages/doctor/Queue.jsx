/**
 * pages/doctor/Queue.jsx — Doctor's live queue management dashboard.
 * Subscribes to queue:updated socket events via join-doctor-queue room.
 */

import { useState } from 'react';
import { Wifi, WifiOff, RefreshCw, Clock, History } from 'lucide-react';
import DashboardShell from '../../components/layout/DashboardShell';
import QueueList from '../../components/queue/QueueList';
import QueueControls from '../../components/queue/QueueControls';
import useDoctorQueue from '../../hooks/useDoctorQueue';
import useAuthStore from '../../store/authStore';

const NAV_ITEMS = [
  { id: 'queue', icon: Clock, label: 'Today\'s Queue' },
  { id: 'history', icon: History, label: 'History' },
];

export default function DoctorQueue() {
  const [activeItem, setActiveItem] = useState('queue');
  const [actionLoading, setActionLoading] = useState(false);
  const { queue, stats, loading, isLive, fetchQueue } = useDoctorQueue();


  return (
    <DashboardShell
      navItems={NAV_ITEMS}
      activeItem={activeItem}
      setActiveItem={setActiveItem}
      roleLabel="Doctor"
      roleColor="from-cyan-500 to-teal-600"
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Today's Queue</h1>
            <p className="text-sm text-slate-400">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg ${isLive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
              {isLive ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              {isLive ? 'Live' : 'Offline'}
            </div>
            <button onClick={fetchQueue} className="text-slate-400 hover:text-slate-700 transition-colors" title="Refresh">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-px bg-slate-100 border-b border-slate-100">
          {[
            { label: 'Total', value: stats.total, color: 'text-slate-700' },
            { label: 'Waiting', value: stats.waiting, color: 'text-blue-600' },
            { label: 'Active', value: stats.called, color: 'text-amber-600' },
            { label: 'Done', value: stats.completed, color: 'text-emerald-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white p-3 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-slate-400">{label}</p>
            </div>
          ))}
        </div>

        {/* Queue list */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-slate-400">Loading queue…</div>
        ) : (
          <QueueList queue={queue} onUpdate={fetchQueue} />
        )}

        {/* Controls */}
        <QueueControls queue={queue} loading={actionLoading} setLoading={setActionLoading} onUpdate={fetchQueue} />
      </div>
    </DashboardShell>
  );
}
