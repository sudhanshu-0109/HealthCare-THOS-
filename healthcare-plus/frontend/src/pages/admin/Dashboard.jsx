import { useState, useEffect } from 'react';
import {
  Building2, Users, Calendar, Activity, CreditCard, AlertTriangle,
  Settings, BarChart3, TrendingUp, TrendingDown, Plus, Search,
  MoreHorizontal, CheckCircle2, Clock, FlaskConical, Pill, Bell, ShieldCheck
} from 'lucide-react';
import DashboardShell from '../../components/layout/DashboardShell';
import useAuthStore from '../../store/authStore';
import * as adminService from '../../services/admin.service';
import AdminAnalyticsPage from './Analytics';
import AdminQueueMonitorPage from './QueueMonitor';
import AdminAuditLogPage from './AuditLog';
import AdminRevenuePage from './Revenue';

const NAV_ITEMS = [
  { id: 'overview', icon: BarChart3, label: 'Overview', shortLabel: 'Overview' },
  { id: 'doctors', icon: Users, label: 'Doctors & Staff', shortLabel: 'Staff' },
  { id: 'departments', icon: Building2, label: 'Departments', shortLabel: 'Depts' },
  { id: 'queue', icon: Clock, label: 'Live Queue Monitor', shortLabel: 'Queue' },
  { id: 'appointments', icon: Calendar, label: 'Appointments', shortLabel: 'Appts' },
  { id: 'pharmacy', icon: Pill, label: 'Pharmacy', shortLabel: 'Pharmacy' },
  { id: 'lab', icon: FlaskConical, label: 'Laboratory', shortLabel: 'Lab' },
  { id: 'billing', icon: CreditCard, label: 'Revenue & Billing', shortLabel: 'Revenue' },
  { id: 'emergency', icon: AlertTriangle, label: 'Emergency', shortLabel: 'Emergency' },
  { id: 'analytics', icon: TrendingUp, label: 'Analytics', shortLabel: 'Analytics' },
  { id: 'audit', icon: ShieldCheck, label: 'Audit Log', shortLabel: 'Audit' },
  { id: 'settings', icon: Settings, label: 'Settings', shortLabel: 'Settings' },
];

const RECENT_ACTIVITIES = [
  { text: 'New appointment booked — Cardiology', time: '2 min ago', type: 'info' },
  { text: 'Emergency patient admitted — ER', time: '8 min ago', type: 'warning' },
  { text: 'Lab report ready — Pending review', time: '15 min ago', type: 'success' },
  { text: 'Pharmacy stock alert — Low inventory', time: '32 min ago', type: 'warning' },
];

function OverviewTab() {
  const [stats, setStats] = useState({ doctors: 0, staff: 0, departments: 0 });
  const [depts, setDepts] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [error, setError] = useState(null);
  const { user } = useAuthStore();

  useEffect(() => {
    const load = async () => {
      try {
        const [deptsRes, doctorsRes] = await Promise.all([
          adminService.getDepartments(),
          adminService.getDoctors(),
        ]);
        const deptsData = deptsRes.data || deptsRes || [];
        const doctorsData = doctorsRes.data || doctorsRes || [];
        setDepts(deptsData);
        setDoctors(doctorsData);
        setStats({
          doctors: Array.isArray(doctorsData) ? doctorsData.length : 0,
          departments: Array.isArray(deptsData) ? deptsData.length : 0,
        });
      } catch (err) {
        console.error('[AdminDashboard] Load error:', err);
        setError(err.message || 'Failed to load hospital statistics');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const STATS_CARDS = [
    { label: 'Doctors', value: stats.doctors, change: '+2 this month', up: true, icon: Users, color: 'bg-cyan-50 text-cyan-600' },
    { label: 'Departments', value: stats.departments, change: 'Active', up: true, icon: Building2, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Appointments', value: '—', change: 'Coming soon', up: true, icon: Calendar, color: 'bg-violet-50 text-violet-600' },
    { label: 'Emergency', value: '—', change: 'Coming soon', up: false, icon: AlertTriangle, color: 'bg-red-50 text-red-600' },
  ];

  return (
    <div className="p-4 sm:p-6 pb-24 lg:pb-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-slate-900">Hospital Dashboard</h1>
          <p className="text-sm text-slate-500">{user?.hospital?.name || 'Your Hospital'}</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-xl text-sm font-semibold hover:bg-cyan-700 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Quick Add
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS_CARDS.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
            <div className={`w-9 h-9 rounded-xl ${s.color} flex items-center justify-center mb-3`}>
              <s.icon className="w-4 h-4" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mb-0.5">
              {loading ? '—' : s.value}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">{s.label}</span>
              <span className={`text-xs font-semibold flex items-center gap-0.5 ${s.up ? 'text-emerald-600' : 'text-red-500'}`}>
                {s.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {s.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Department occupancy */}
      {depts.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <h2 className="font-semibold text-slate-900 mb-4">Departments</h2>
          <div className="space-y-3">
            {depts.map((d) => (
              <div key={d.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-700">{d.name}</span>
                  <span className="text-xs font-semibold text-slate-500">{d.doctorCount || 0} doctors</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="h-2 rounded-full bg-cyan-500" style={{ width: `${Math.min(((d.doctorCount || 0) / 10) * 100, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent activity */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900">Recent Activity</h2>
          <button className="text-xs text-cyan-600 hover:underline">View All</button>
        </div>
        <div className="space-y-3">
          {RECENT_ACTIVITIES.map((a, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                a.type === 'success' ? 'bg-emerald-500' : a.type === 'warning' ? 'bg-amber-500' : 'bg-cyan-500'
              }`} />
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

function DoctorsTab() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteDept, setInviteDept] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState(null);
  const [inviteSuccess, setInviteSuccess] = useState(null);
  const [depts, setDepts] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [docRes, deptRes] = await Promise.all([adminService.getDoctors(), adminService.getDepartments()]);
        setDoctors(docRes.data || []);
        setDepts(deptRes.data || []);
      } catch { /* ignore */ }
      setLoading(false);
    };
    load();
  }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteLoading(true);
    setInviteError(null);
    try {
      await adminService.inviteDoctor({ email: inviteEmail, fullName: inviteName, departmentId: inviteDept });
      setInviteSuccess(`Invitation sent to ${inviteEmail}`);
      setInviteEmail(''); setInviteName(''); setInviteDept('');
      setTimeout(() => { setShowInvite(false); setInviteSuccess(null); }, 2000);
    } catch (err) {
      setInviteError(err.message || 'Failed to send invitation');
    } finally {
      setInviteLoading(false);
    }
  };

  const filtered = doctors.filter(d =>
    !search || d.user?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    d.department?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 pb-24 lg:pb-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-bold text-slate-900">Doctors & Staff</h1>
        <button onClick={() => setShowInvite(!showInvite)} className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-xl text-sm font-semibold hover:bg-cyan-700 transition-colors">
          <Plus className="w-4 h-4" /> Invite Doctor
        </button>
      </div>

      {showInvite && (
        <div className="bg-white border border-cyan-100 rounded-2xl p-5 mb-5 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-4">Invite a Doctor</h3>
          {inviteError && <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{inviteError}</div>}
          {inviteSuccess && <div className="mb-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">{inviteSuccess}</div>}
          <form onSubmit={handleInvite} className="space-y-3">
            <input placeholder="Full name" required className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg" value={inviteName} onChange={e => setInviteName(e.target.value)} />
            <input type="email" placeholder="Email address" required className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
            <select required className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg" value={inviteDept} onChange={e => setInviteDept(e.target.value)}>
              <option value="">Select Department</option>
              {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowInvite(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold">Cancel</button>
              <button type="submit" disabled={inviteLoading} className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
                {inviteLoading ? 'Sending…' : 'Send Invite'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input placeholder="Search doctors…" className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-400 transition-all" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="text-center py-8 text-slate-400"><div className="w-7 h-7 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" /></div>
      ) : (
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-8">No doctors found. Invite one!</p>
          ) : filtered.map((d) => (
            <div key={d.id} className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-3 shadow-sm">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {(d.user?.fullName || 'Dr')[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-900 text-sm">{d.user?.fullName || 'Unknown'}</div>
                <div className="text-xs text-slate-500">{d.department?.name || 'No department'}</div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                d.user?.isActive !== false ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
              }`}>
                {d.user?.isActive !== false ? 'Active' : 'Inactive'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DepartmentsTab() {
  const [depts, setDepts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    try {
      const res = await adminService.getDepartments();
      setDepts(res.data || []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    setError(null);
    try {
      await adminService.createDepartment({ name, description });
      setName(''); setDescription(''); setShowCreate(false);
      load();
    } catch (err) {
      setError(err.message || 'Failed to create department');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 pb-24 lg:pb-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-bold text-slate-900">Departments</h1>
        <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-xl text-sm font-semibold hover:bg-cyan-700 transition-colors">
          <Plus className="w-4 h-4" /> Add Department
        </button>
      </div>

      {showCreate && (
        <div className="bg-white border border-cyan-100 rounded-2xl p-5 mb-5 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-4">New Department</h3>
          {error && <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
          <form onSubmit={handleCreate} className="space-y-3">
            <input placeholder="Department name" required className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg" value={name} onChange={e => setName(e.target.value)} />
            <textarea placeholder="Description (optional)" rows={2} className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg resize-none" value={description} onChange={e => setDescription(e.target.value)} />
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold">Cancel</button>
              <button type="submit" disabled={createLoading} className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
                {createLoading ? 'Creating…' : 'Create Department'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8"><div className="w-7 h-7 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : depts.length === 0 ? (
        <div className="text-center py-10 text-slate-400">
          <Building2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No departments yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {depts.map((d) => (
            <div key={d.id} className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm hover:border-cyan-200 transition-all">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-slate-900">{d.name}</h3>
                <span className="text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded">{d.doctorCount || 0} doctors</span>
              </div>
              {d.description && <p className="text-sm text-slate-500">{d.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PlaceholderTab({ label }) {
  return (
    <div className="p-6 pb-24 lg:pb-6 flex items-center justify-center min-h-64">
      <div className="text-center text-slate-400">
        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
          <Building2 className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs mt-1">Feature module coming soon</p>
      </div>
    </div>
  );
}

export default function HospitalAdminDashboard() {
  const [activeItem, setActiveItem] = useState('overview');

  const renderContent = () => {
    switch (activeItem) {
      case 'overview': return <OverviewTab />;
      case 'doctors': return <DoctorsTab />;
      case 'departments': return <DepartmentsTab />;
      case 'analytics': return <AdminAnalyticsPage />;
      case 'queue': return <AdminQueueMonitorPage />;
      case 'audit': return <AdminAuditLogPage />;
      case 'billing': return <AdminRevenuePage />;
      default: return <PlaceholderTab label={NAV_ITEMS.find(n => n.id === activeItem)?.label} />;
    }
  };

  return (
    <DashboardShell
      navItems={NAV_ITEMS}
      activeItem={activeItem}
      setActiveItem={setActiveItem}
      roleLabel="Hospital Admin"
      roleColor="bg-blue-50 text-blue-700"
    >
      {renderContent()}
    </DashboardShell>
  );
}
