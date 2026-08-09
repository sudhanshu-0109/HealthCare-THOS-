import { useState, useEffect } from 'react';
import {
  Shield, Building2, Users, Activity, BarChart3, Settings, AlertTriangle,
  FileText, TrendingUp, TrendingDown, CheckCircle2, XCircle, Plus,
  Search, Star, Truck, Bell, Globe, MoreHorizontal
} from 'lucide-react';
import DashboardShell from '../../components/layout/DashboardShell';
import * as adminService from '../../services/admin.service';

const NAV_ITEMS = [
  { id: 'overview', icon: BarChart3, label: 'Network Overview', shortLabel: 'Overview' },
  { id: 'hospitals', icon: Building2, label: 'Hospitals', shortLabel: 'Hospitals' },
  { id: 'users', icon: Users, label: 'Platform Users', shortLabel: 'Users' },
  { id: 'emergency', icon: Truck, label: 'Emergency Network', shortLabel: 'Emergency' },
  { id: 'audit', icon: FileText, label: 'Audit Logs', shortLabel: 'Audit' },
  { id: 'config', icon: Settings, label: 'Platform Config', shortLabel: 'Config' },
];

const RECENT_ALERTS = [
  { text: 'Emergency network uptime: 99.97% — All systems normal', time: '3 hrs ago', type: 'success', icon: Activity },
  { text: 'New hospital registration pending review', time: '5 hrs ago', type: 'info', icon: Building2 },
];

function OverviewTab({ stats }) {
  const NETWORK_STATS = [
    { label: 'Active Hospitals', value: stats.hospitals, change: 'On network', up: true, icon: Building2, color: 'bg-blue-50 text-blue-600' },
    { label: 'Total Users', value: stats.users, change: 'Registered', up: true, icon: Users, color: 'bg-cyan-50 text-cyan-600' },
    { label: 'Doctors', value: '—', change: 'Network wide', up: true, icon: Activity, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Emergency Active', value: '—', change: 'Active units', up: true, icon: Truck, color: 'bg-red-50 text-red-600' },
  ];

  return (
    <div className="p-4 sm:p-6 pb-24 lg:pb-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-slate-900">Platform Overview</h1>
          <p className="text-sm text-slate-500">healthcare+ Network • Global</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-xs font-semibold text-emerald-700">All Systems Operational</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {NETWORK_STATS.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
            <div className={`w-9 h-9 rounded-xl ${s.color} flex items-center justify-center mb-3`}>
              <s.icon className="w-4 h-4" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mb-0.5">{s.value ?? '—'}</div>
            <div className="text-xs text-slate-500 mb-1">{s.label}</div>
            <div className={`text-xs font-semibold flex items-center gap-0.5 ${s.up ? 'text-emerald-600' : 'text-red-500'}`}>
              {s.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {s.change}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 text-white">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Globe className="w-4 h-4 text-cyan-400" /> Network Health
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Platform Uptime', value: '99.97%', color: 'text-emerald-400' },
            { label: 'API Latency', value: '~42ms', color: 'text-cyan-400' },
            { label: 'SOS Response', value: '<3s', color: 'text-emerald-400' },
            { label: 'Region', value: 'Global', color: 'text-cyan-400' },
          ].map((item) => (
            <div key={item.label} className="bg-white/5 rounded-xl p-3 text-center">
              <div className={`text-lg font-bold ${item.color}`}>{item.value}</div>
              <div className="text-xs text-slate-400 mt-1">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <h2 className="font-semibold text-slate-900 mb-4">Platform Alerts</h2>
        <div className="space-y-3">
          {RECENT_ALERTS.map((a, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                a.type === 'success' ? 'bg-emerald-50' : a.type === 'warning' ? 'bg-amber-50' : 'bg-cyan-50'
              }`}>
                <a.icon className={`w-3.5 h-3.5 ${a.type === 'success' ? 'text-emerald-500' : a.type === 'warning' ? 'text-amber-500' : 'text-cyan-500'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700">{a.text}</p>
                <p className="text-xs text-slate-400 mt-0.5">{a.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HospitalsTab() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    adminService.getHospitals().then(res => setHospitals(res.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = hospitals.filter(h =>
    !search || h.name?.toLowerCase().includes(search.toLowerCase()) || h.city?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 pb-24 lg:pb-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-bold text-slate-900">Hospitals</h1>
          <p className="text-sm text-slate-500">{hospitals.length} hospitals in network</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-xl text-sm font-semibold hover:bg-cyan-700 transition-colors">
          <Plus className="w-4 h-4" /> Onboard
        </button>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input placeholder="Search hospitals…" value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-400 transition-all"
        />
      </div>
      {loading ? (
        <div className="text-center py-8"><div className="w-7 h-7 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : (
        <div className="space-y-3">
          {filtered.map((h) => (
            <div key={h.id} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm hover:border-cyan-200 transition-all">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {(h.name || 'H').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="font-semibold text-slate-900 text-sm">{h.name}</span>
                    {h.subscriptionTier && (
                      <span className={`px-1.5 py-0.5 text-xs rounded font-semibold ${h.subscriptionTier === 'PREMIUM' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                        {h.subscriptionTier}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500">{h.city}{h.state ? `, ${h.state}` : ''} {h.country ? `• ${h.country}` : ''}</div>
                  {h.averageRating > 0 && (
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {h.averageRating?.toFixed(1)}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
                    h.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    {h.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <button className="text-slate-400 hover:text-slate-700"><MoreHorizontal className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    adminService.getUsers().then(res => setUsers(res.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(u =>
    !search || u.fullName?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const ROLE_COLOR = {
    SUPER_ADMIN: 'bg-slate-100 text-slate-700',
    HOSPITAL_ADMIN: 'bg-blue-50 text-blue-700',
    DOCTOR: 'bg-emerald-50 text-emerald-700',
    PATIENT: 'bg-cyan-50 text-cyan-700',
    LAB_STAFF: 'bg-violet-50 text-violet-700',
    PHARMACIST: 'bg-orange-50 text-orange-700',
    AMBULANCE_DRIVER: 'bg-red-50 text-red-700',
  };

  return (
    <div className="p-4 sm:p-6 pb-24 lg:pb-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-bold text-slate-900">Platform Users</h1>
          <p className="text-sm text-slate-500">{users.length} total users</p>
        </div>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input placeholder="Search users…" value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-400 transition-all"
        />
      </div>
      {loading ? (
        <div className="text-center py-8"><div className="w-7 h-7 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="hidden sm:grid grid-cols-4 px-4 py-2.5 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <span>Name</span><span>Email</span><span>Role</span><span>Status</span>
          </div>
          <div className="divide-y divide-slate-100">
            {filtered.map((u) => (
              <div key={u.id} className="px-4 py-3 hover:bg-slate-50 transition-colors">
                <div className="sm:hidden">
                  <div className="font-semibold text-slate-900 text-sm">{u.fullName}</div>
                  <div className="text-xs text-slate-500">{u.email}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ROLE_COLOR[u.role] || 'bg-slate-100 text-slate-700'}`}>{u.role}</span>
                    <span className={`text-xs font-semibold ${u.isActive ? 'text-emerald-600' : 'text-red-500'}`}>{u.isActive ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
                <div className="hidden sm:grid grid-cols-4 items-center gap-2">
                  <span className="text-sm font-medium text-slate-900">{u.fullName}</span>
                  <span className="text-sm text-slate-500 truncate">{u.email}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full w-fit ${ROLE_COLOR[u.role] || 'bg-slate-100 text-slate-700'}`}>{u.role?.replace('_', ' ')}</span>
                  <span className={`text-xs font-semibold ${u.isActive ? 'text-emerald-600' : 'text-red-500'}`}>{u.isActive ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PlaceholderTab({ label }) {
  return (
    <div className="p-6 flex items-center justify-center min-h-64">
      <div className="text-center text-slate-400">
        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
          <Shield className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs mt-1">Platform module coming soon</p>
      </div>
    </div>
  );
}

export default function SuperAdminDashboard() {
  const [activeItem, setActiveItem] = useState('overview');
  const [stats, setStats] = useState({ hospitals: '—', users: '—' });

  useEffect(() => {
    Promise.all([adminService.getHospitals(), adminService.getUsers()])
      .then(([hosRes, usrRes]) => {
        setStats({ hospitals: hosRes.data?.length ?? '—', users: usrRes.data?.length ?? '—' });
      })
      .catch(() => {});
  }, []);

  const renderContent = () => {
    switch (activeItem) {
      case 'overview': return <OverviewTab stats={stats} />;
      case 'hospitals': return <HospitalsTab />;
      case 'users': return <UsersTab />;
      default: return <PlaceholderTab label={NAV_ITEMS.find(n => n.id === activeItem)?.label} />;
    }
  };

  return (
    <DashboardShell
      navItems={NAV_ITEMS}
      activeItem={activeItem}
      setActiveItem={setActiveItem}
      roleLabel="Super Admin"
      roleColor="bg-slate-100 text-slate-700"
    >
      {renderContent()}
    </DashboardShell>
  );
}
