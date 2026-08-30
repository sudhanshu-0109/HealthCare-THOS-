/**
 * pages/admin/Dashboard.jsx — Complete Hospital Admin Dashboard
 * All management tabs: Overview | Doctors | Lab Staff | Pharmacy Staff | Ambulance
 * Departments | Lab Tests | Medicines | Appointments | Queue | Emergency | Settings
 */

import { useState, useEffect } from 'react';
import {
  Building2, Users, Calendar, Activity, CreditCard, AlertTriangle,
  Settings, BarChart3, TrendingUp, TrendingDown, Plus, Search,
  CheckCircle2, Clock, FlaskConical, Pill, ShieldCheck, Truck,
  Stethoscope, Package, X, Loader2, ChevronDown, Edit, Power
} from 'lucide-react';
import DashboardShell from '../../components/layout/DashboardShell';
import useAuthStore from '../../store/authStore';
import * as adminService from '../../services/admin.service';
import api from '../../services/api';
import { joinHospitalQueue, leaveHospitalQueue, onSocketEvent } from '../../services/socket';
import LiveQueueOverview from '../../components/admin/LiveQueueOverview';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';

const NAV_ITEMS = [
  { id: 'overview', icon: BarChart3, label: 'Overview', shortLabel: 'Overview' },
  { id: 'doctors', icon: Stethoscope, label: 'Doctors', shortLabel: 'Doctors' },
  { id: 'labstaff', icon: FlaskConical, label: 'Lab Staff', shortLabel: 'Lab' },
  { id: 'pharmacy', icon: Pill, label: 'Pharmacy Staff', shortLabel: 'Pharmacy' },
  { id: 'ambulance', icon: Truck, label: 'Ambulance', shortLabel: 'Ambulance' },
  { id: 'departments', icon: Building2, label: 'Departments', shortLabel: 'Depts' },
  { id: 'labtests', icon: FlaskConical, label: 'Lab Tests', shortLabel: 'Lab Tests' },
  { id: 'medicines', icon: Package, label: 'Medicines', shortLabel: 'Medicines' },
  { id: 'appointments', icon: Calendar, label: 'Appointments', shortLabel: 'Appts' },
  { id: 'queue', icon: Clock, label: 'Queue Monitor', shortLabel: 'Queue' },
  { id: 'emergency', icon: AlertTriangle, label: 'Emergency', shortLabel: 'SOS' },
  { id: 'settings', icon: Settings, label: 'Settings', shortLabel: 'Settings' },
];



// ── Reusable Add Modal ─────────────────────────────────────────────────────────

function AddModal({ title, fields, open, onClose, onSubmit, loading }) {
  const [form, setForm] = useState({});
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-extrabold text-slate-900 text-lg tracking-tight">{title}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
        </div>
        <div className="space-y-3.5 mb-5">
          {fields.map((f) => (
            f.type === 'select' ? (
              <div key={f.key}>
                <label className="block text-xs font-bold text-slate-700 mb-1">{f.label}</label>
                <select
                  required={f.required}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-200 font-medium"
                  value={form[f.key] || ''}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                >
                  <option value="">Select {f.label}</option>
                  {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            ) : (
              <div key={f.key}>
                <label className="block text-xs font-bold text-slate-700 mb-1">{f.label}</label>
                <input
                  type={f.type || 'text'}
                  required={f.required}
                  placeholder={f.placeholder || f.label}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-200 font-medium"
                  value={form[f.key] || ''}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                />
              </div>
            )
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-2xl text-xs font-bold hover:bg-slate-50">Cancel</button>
          <button
            onClick={() => onSubmit(form)}
            disabled={loading}
            className="flex-1 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-2xl text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Staff List Component ───────────────────────────────────────────────────────

function StaffList({ staff, onToggle, roleLabel }) {
  if (staff.length === 0) {
    return <EmptyState icon={Users} title={`No ${roleLabel}`} description={`Add ${roleLabel.toLowerCase()} to see them here.`} />;
  }
  return (
    <div className="space-y-3">
      {staff.map((s) => (
        <div key={s.id} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {s.user?.fullName?.charAt(0) || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 text-sm">{s.user?.fullName}</p>
            <p className="text-xs text-slate-400">{s.user?.email}</p>
            {s.vehicleNumber && <p className="text-xs text-slate-400">{s.vehicleNumber}</p>}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {s.isAvailable !== undefined && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${s.isAvailable ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                {s.isAvailable ? 'Available' : 'Off duty'}
              </span>
            )}
            <StatusBadge status={s.isActive ? 'ACTIVE' : 'INACTIVE'} size="xs" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Overview Tab ──────────────────────────────────────────────────────────────

function OverviewTab() {
  const { user } = useAuthStore();
  const [depts, setDepts] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [todayAppts, setTodayAppts] = useState([]);

  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    Promise.allSettled([
      adminService.getDepartments(),
      adminService.getDoctors(),
      import('../../services/appointments.service').then((svc) =>
        svc.getHospitalAppointments?.({ limit: 50, date: todayStr })
      ),
    ]).then(([d, doc, appts]) => {
      if (d.status === 'fulfilled') setDepts(d.value.data || []);
      if (doc.status === 'fulfilled') setDoctors(doc.value.data || []);
      if (appts.status === 'fulfilled') setTodayAppts(appts.value?.data?.appointments || []);
    });
  }, []);

  const activeDoctors = doctors.filter((d) => d.isActive).length;
  const confirmedToday = todayAppts.filter((a) => a.status === 'CONFIRMED' || a.status === 'COMPLETED').length;

  const stats = [
    { label: 'Total Doctors', value: doctors.length, icon: Stethoscope, color: 'bg-teal-50 text-teal-700 border border-teal-100', trend: `${activeDoctors} active` },
    { label: 'Departments', value: depts.length, icon: Building2, color: 'bg-emerald-50 text-emerald-700 border border-emerald-100', trend: 'Configured' },
    { label: "Today's Appointments", value: todayAppts.length, icon: Calendar, color: 'bg-amber-50 text-amber-700 border border-amber-100', trend: `${confirmedToday} confirmed` },
    { label: 'Active Doctors', value: activeDoctors, icon: Activity, color: 'bg-purple-50 text-purple-700 border border-purple-100', trend: 'On duty today' },
  ];

  return (
    <div className="p-4 sm:p-6 pb-24 lg:pb-6 space-y-6">
      
      {/* Premium Minimal Admin Hero Banner */}
      <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 rounded-3xl p-6 text-white shadow-xl overflow-hidden border border-slate-700/50">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-extrabold mb-3">
            <Building2 className="w-3.5 h-3.5" />
            <span>Hospital Administration Hub</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
            Hospital Admin Operations 🏥
          </h1>

          <p className="text-slate-300 text-xs sm:text-sm font-medium mt-1">
            Real-time management for doctors, departments, queue flow &amp; emergency response • {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-md transition-all">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-3 ${s.color}`}>
                <Icon className="w-5 h-5 stroke-[2.2]" />
              </div>
              <p className="text-3xl font-black text-slate-900 tracking-tight">{s.value}</p>
              <p className="text-xs font-bold text-slate-500 mt-0.5">{s.label}</p>
              <p className="text-xs font-extrabold text-emerald-600 mt-1">{s.trend}</p>
            </div>
          );
        })}
      </div>

      {/* Today's appointments preview */}
      {todayAppts.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <h3 className="font-semibold text-slate-900 text-sm mb-3">Today's Appointments Preview</h3>
          <div className="space-y-2">
            {todayAppts.slice(0, 5).map((a) => (
              <div key={a.id} className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-cyan-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-3.5 h-3.5 text-cyan-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 text-xs truncate">{a.patient?.fullName || 'Patient'}</p>
                  <p className="text-xs text-slate-400">
                    Dr. {a.doctor?.user?.fullName} • {a.scheduledTime}
                  </p>
                </div>
                <StatusBadge status={a.status} size="xs" />
              </div>
            ))}
            {todayAppts.length > 5 && (
              <p className="text-xs text-slate-400 text-center pt-1">+{todayAppts.length - 5} more appointments today</p>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 p-4">
        <h3 className="font-semibold text-slate-900 text-sm mb-3">Quick Summary</h3>
        <div className="space-y-2 text-sm text-slate-600">
          <p>{activeDoctors} of {doctors.length} doctors active</p>
          <p>{depts.length} departments configured</p>
          <p>{confirmedToday} appointments confirmed today</p>
          <p className="text-xs text-slate-400">{new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>
    </div>
  );
}


// ── Doctors Tab ───────────────────────────────────────────────────────────────

function DoctorsTab() {
  const [doctors, setDoctors] = useState([]);
  const [depts, setDepts] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([adminService.getDoctors(), adminService.getDepartments()])
      .then(([d, dep]) => { setDoctors(d.data || []); setDepts(dep.data || []); })
      .catch(() => {});
  }, []);

  const filtered = doctors.filter((d) =>
    !search || d.user?.fullName?.toLowerCase().includes(search.toLowerCase()) || d.specialization?.toLowerCase().includes(search.toLowerCase())
  );

  const fetchDoctors = async () => {
    try {
      const res = await adminService.getDoctors();
      setDoctors(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdd = async (form) => {
    setLoading(true);
    try {
      await adminService.inviteDoctor(form);
      setShowModal(false);
      await fetchDoctors();
    } catch (err) {
      alert(err.message || 'Failed to add doctor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 pb-24 lg:pb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-slate-900">Doctors</h2>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 px-3 py-2 bg-cyan-600 text-white rounded-xl text-xs font-semibold hover:bg-cyan-700 transition-colors">
          <Plus className="w-3.5 h-3.5" /> Add Doctor
        </button>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input placeholder="Search doctors…" className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-300" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="space-y-3">
        {filtered.map((d) => (
          <div key={d.id} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3">
            <div className="w-11 h-11 bg-cyan-100 rounded-xl flex items-center justify-center text-cyan-700 font-bold flex-shrink-0">
              {d.user?.fullName?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900 text-sm">{d.user?.fullName}</p>
              <p className="text-xs text-slate-500">{d.specialization} • {d.department?.name}</p>
              <p className="text-xs text-slate-400">Fee: ₹{d.consultationFee}</p>
            </div>
            <StatusBadge status={d.isActive ? 'ACTIVE' : d.user?.status === 'INVITED' ? 'INVITED' : 'INACTIVE'} size="xs" />
          </div>
        ))}
      </div>
      <AddModal
        title="Add Doctor"
        open={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleAdd}
        loading={loading}
        fields={[
          { key: 'fullName', label: 'Full Name', required: true },
          { key: 'email', label: 'Email', type: 'email', required: true },
          { key: 'specialization', label: 'Specialization', required: true },
          { key: 'departmentId', label: 'Department', type: 'select', required: true, options: depts.map((d) => ({ value: d.id, label: d.name })) },
          { key: 'consultationFee', label: 'Consultation Fee (₹)', type: 'number', required: true },
          { key: 'experienceYears', label: 'Experience (years)', type: 'number' },
        ]}
      />
    </div>
  );
}

// ── Generic Staff Tab ──────────────────────────────────────────────────────────

function GenericStaffTab({ title, roleLabel, fetchFn, inviteFn, fields }) {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = () =>
    fetchFn?.()
      .then((res) => setStaff(res.data || []))
      .catch((err) => setError(err.message || 'Failed to load staff.'));

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdd = async (form) => {
    setAddLoading(true);
    setError(null);
    try {
      await inviteFn?.(form);
      setShowModal(false);
      await load(); // Re-sync from the server — no fabricated rows.
    } catch (err) {
      setError(err.message || 'Failed to send invite.');
    } finally {
      setAddLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 pb-24 lg:pb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-slate-900">{title}</h2>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 px-3 py-2 bg-cyan-600 text-white rounded-xl text-xs font-semibold hover:bg-cyan-700 transition-colors">
          <Plus className="w-3.5 h-3.5" /> Add {roleLabel}
        </button>
      </div>
      {error && (
        <div className="mb-3 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 text-sm text-red-600">
          {error}
        </div>
      )}
      {loading ? (
        <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-cyan-500" /></div>
      ) : (
        <StaffList staff={staff} roleLabel={roleLabel} />
      )}
      <AddModal
        title={`Add ${roleLabel}`}
        open={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleAdd}
        loading={addLoading}
        fields={fields}
      />
    </div>
  );
}

// ── Departments Tab ───────────────────────────────────────────────────────────

function DepartmentsTab() {
  const [depts, setDepts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    adminService.getDepartments()
      .then((res) => setDepts(res.data || []))
      .catch(() => {});
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await adminService.getDepartments();
      setDepts(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdd = async (form) => {
    setLoading(true);
    try {
      await adminService.createDepartment(form);
      setShowModal(false);
      await fetchDepartments();
    } catch (err) {
      alert(err.message || 'Failed to add department');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 pb-24 lg:pb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-slate-900">Departments</h2>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 px-3 py-2 bg-cyan-600 text-white rounded-xl text-xs font-semibold hover:bg-cyan-700 transition-colors">
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {depts.map((d) => (
          <div key={d.id} className="bg-white rounded-2xl border border-slate-100 p-4">
            <div className="flex items-start justify-between mb-1">
              <h3 className="font-semibold text-slate-900">{d.name}</h3>
              <span className="text-xs bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded-full">
                {d._count?.doctors ?? d.doctorCount ?? 0} doctors
              </span>
            </div>
            {d.description && <p className="text-xs text-slate-500">{d.description}</p>}
          </div>
        ))}

      </div>
      <AddModal
        title="Add Department"
        open={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleAdd}
        loading={loading}
        fields={[
          { key: 'name', label: 'Department Name', required: true },
          { key: 'description', label: 'Description' },
        ]}
      />
    </div>
  );
}

// ── Lab Tests Tab ─────────────────────────────────────────────────────────────

function LabTestsTab() {
  const [tests, setTests] = useState([]);
  const [expandedCats, setExpandedCats] = useState({});
  const [editingPrice, setEditingPrice] = useState(null);
  const [loadingId, setLoadingId] = useState(null);

  useEffect(() => {
    import('../../services/labTests.service').then((svc) =>
      svc.getLabTests()
        .then((res) => setTests(res.data || []))
        .catch(() => {})
    );
  }, []);

  const handleToggle = async (id) => {
    setLoadingId(id);
    try {
      const svc = await import('../../services/labTests.service');
      const res = await svc.toggleLabTest(id);
      if(res.data) {
        setTests(prev => prev.map(t => t.id === id ? { ...t, isActive: res.data.isActive } : t));
      }
    } catch {}
    setLoadingId(null);
  };

  const handleSavePrice = async (e, id) => {
    e.preventDefault();
    setLoadingId(id);
    try {
      const svc = await import('../../services/labTests.service');
      const newPrice = Number(e.target.price.value);
      const res = await svc.updateLabTestPrice(id, newPrice);
      if(res.data) {
        setTests(prev => prev.map(t => t.id === id ? { ...t, price: res.data.price } : t));
      }
      setEditingPrice(null);
    } catch {}
    setLoadingId(null);
  };

  const grouped = tests.reduce((acc, t) => {
    const cat = t.masterTest?.category?.name || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(t);
    return acc;
  }, {});

  const toggleCat = (cat) => setExpandedCats(p => ({ ...p, [cat]: !p[cat] }));

  return (
    <div className="p-4 sm:p-6 pb-24 lg:pb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-bold text-slate-900">Lab Test Catalogue</h2>
          <p className="text-xs text-slate-500 mt-1">Manage active tests and prices for your hospital.</p>
        </div>
      </div>
      
      {Object.keys(grouped).length === 0 ? (
        <EmptyState icon={FlaskConical} message="No tests available in catalog." />
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <button 
                onClick={() => toggleCat(category)}
                className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600">
                    <FlaskConical className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-700 text-sm">{category} <span className="text-slate-400 font-normal ml-1">({items.length})</span></h3>
                </div>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${expandedCats[category] ? 'rotate-180' : ''}`} />
              </button>
              
              {expandedCats[category] && (
                <div className="divide-y divide-slate-100 p-2">
                  {items.map(t => (
                    <div key={t.id} className={`p-3 flex items-center gap-3 rounded-xl ${!t.isActive ? 'opacity-60 bg-slate-50' : 'hover:bg-slate-50'}`}>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 text-sm">{t.name}</p>
                        {t.masterTest?.code && <p className="text-[10px] font-mono text-slate-400 mt-0.5">{t.masterTest.code}</p>}
                        
                        {editingPrice === t.id ? (
                          <form onSubmit={(e) => handleSavePrice(e, t.id)} className="mt-2 flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-600">₹</span>
                            <input type="number" name="price" defaultValue={t.price} min="0" step="1" required className="w-20 px-2 py-1 text-sm border rounded-lg" autoFocus />
                            <button type="submit" disabled={loadingId === t.id} className="text-xs bg-cyan-600 text-white px-3 py-1.5 rounded-lg hover:bg-cyan-700">Save</button>
                            <button type="button" onClick={() => setEditingPrice(null)} className="text-xs bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-300">Cancel</button>
                          </form>
                        ) : (
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs font-bold text-cyan-700">₹{t.price}</p>
                            <button onClick={() => setEditingPrice(t.id)} className="p-1 text-slate-400 hover:text-cyan-600 rounded-full hover:bg-cyan-50">
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        <StatusBadge status={t.isActive ? 'ACTIVE' : 'INACTIVE'} size="xs" />
                        <button 
                          onClick={() => handleToggle(t.id)}
                          disabled={loadingId === t.id}
                          className={`text-xs px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${t.isActive ? 'text-rose-600 bg-rose-50 hover:bg-rose-100' : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'}`}
                        >
                          <Power className="w-3.5 h-3.5" />
                          {t.isActive ? 'Disable' : 'Enable'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Medicines Tab ─────────────────────────────────────────────────────────────

function MedicinesTab() {
  const [medicines, setMedicines] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    import('../../services/medicines.service').then((svc) =>
      svc.getMedicines()
        .then((res) => setMedicines(res.data || []))
        .catch(() => {})
    );
  }, []);

  const fetchMedicines = async () => {
    try {
      const svc = await import('../../services/medicines.service');
      const res = await svc.getMedicines();
      setMedicines(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdd = async (form) => {
    setLoading(true);
    try {
      const svc = await import('../../services/medicines.service');
      await svc.createMedicine(form);
      setShowModal(false);
      await fetchMedicines();
    } catch (err) {
      alert(err.message || 'Failed to add medicine');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 pb-24 lg:pb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-slate-900">Medicines</h2>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 px-3 py-2 bg-cyan-600 text-white rounded-xl text-xs font-semibold hover:bg-cyan-700 transition-colors">
          <Plus className="w-3.5 h-3.5" /> Add Medicine
        </button>
      </div>
      <div className="space-y-3">
        {medicines.map((m) => (
          <div key={m.id} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900 text-sm">{m.name}</p>
              {(m.genericName || m.manufacturer) && (
                <p className="text-xs text-slate-400">{[m.genericName, m.manufacturer].filter(Boolean).join(' · ')}</p>
              )}
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-xs font-bold text-cyan-700">₹{m.price}/{m.unit || 'unit'}</span>
                <span className={`text-xs ${m.stockQuantity > 0 ? 'text-emerald-600' : 'text-red-500'}`}>Stock: {m.stockQuantity ?? 0}</span>
              </div>
            </div>
            <StatusBadge status={m.isActive ? 'ACTIVE' : 'INACTIVE'} size="xs" />
          </div>
        ))}
      </div>
      <AddModal
        title="Add Medicine"
        open={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleAdd}
        loading={loading}
        fields={[
          { key: 'name', label: 'Medicine Name', required: true },
          { key: 'genericName', label: 'Generic Name' },
          { key: 'manufacturer', label: 'Manufacturer' },
          { key: 'unit', label: 'Unit (e.g. tablet, ml)', required: true },
          { key: 'price', label: 'Price per unit (₹)', type: 'number', required: true },
          { key: 'stockQuantity', label: 'Initial Stock', type: 'number' },
        ]}
      />
    </div>
  );
}

// ── Appointments Tab ──────────────────────────────────────────────────────────

function AppointmentsTab() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    import('../../services/appointments.service').then((svc) =>
      svc.getHospitalAppointments?.({ limit: 50 })
        .then((res) => setAppointments(res.data?.appointments || []))
        .catch(() => {})
        .finally(() => setLoading(false))
    );
  }, []);

  const filtered = appointments.filter((a) => filter === 'all' || a.status === filter);
  return (
    <div className="p-4 sm:p-6 pb-24 lg:pb-6">
      <h2 className="font-bold text-slate-900 mb-4">Appointments</h2>
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {['all', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap ${filter === f ? 'bg-cyan-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
            {f === 'all' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-cyan-500" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Calendar} title="No appointments" description="No appointments match the selected filter." />
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => (
            <div key={a.id} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="font-semibold text-slate-900 text-sm">{a.patient?.fullName || 'Patient'}</p>
                <p className="text-xs text-slate-500">
                  {a.doctor?.user?.fullName ? `Dr. ${a.doctor.user.fullName}` : 'Doctor'} • {a.doctor?.department?.name}
                </p>
                <p className="text-xs text-slate-400">
                  {a.scheduledDate ? new Date(a.scheduledDate).toLocaleDateString('en-IN') : ''} • {a.scheduledTime}
                </p>
                {a.fee && <p className="text-xs font-medium text-cyan-700">₹{a.fee}</p>}
              </div>
              <StatusBadge status={a.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Queue Monitor Tab ─────────────────────────────────────────────────────────

function QueueMonitorTab() {
  const { user } = useAuthStore();
  const [queues, setQueues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchQueues = async () => {
    try {
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

    // Join the hospital-wide room and re-fetch on any queue mutation. The join is
    // tracked by the socket layer and re-emitted automatically after a reconnect.
    const hospitalId = user?.hospitalId || user?.hospitalAdmin?.hospitalId;
    if (hospitalId) joinHospitalQueue(hospitalId);
    const unsub = onSocketEvent('queue:updated', () => fetchQueues());

    return () => {
      unsub();
      if (hospitalId) leaveHospitalQueue(hospitalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleForceSkip = async (tokenId) => {
    const reason = window.prompt('Please specify reason for administrative force-skip:');
    if (!reason) return;
    try {
      await api.post(`/admin/queue/${tokenId}/force-skip`, { reason });
      fetchQueues();
    } catch (err) {
      setError(err.message || 'Force-skip action failed.');
    }
  };

  return (
    <div className="p-4 sm:p-6 pb-24 lg:pb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-slate-900">Live Queue Monitor</h2>
        <button onClick={fetchQueues}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors">
          <Loader2 className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
      )}
      {loading ? (
        <div className="flex items-center justify-center text-slate-400 py-12">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading live queues…
        </div>
      ) : (
        <LiveQueueOverview doctorQueues={queues} onForceSkip={handleForceSkip} />
      )}
    </div>
  );
}

// ── Emergency Tab ─────────────────────────────────────────────────────────────

function EmergencyTab() {
  return (
    <div className="p-4 sm:p-6 pb-24 lg:pb-6">
      <h2 className="font-bold text-slate-900 mb-4">Emergency Activity</h2>
      <EmptyState icon={AlertTriangle} title="No emergencies" description="Active emergency dispatches will appear here." />
    </div>
  );
}

// ── Settings Tab ──────────────────────────────────────────────────────────────

function SettingsTab() {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    adminService.getHospitalProfile()
      .then((res) => {
        const h = res.data || {};
        setForm({
          name: h.name || '',
          address: h.address || '',
          city: h.city || '',
          contactPhone: h.contactPhone || '',
          contactEmail: h.contactEmail || '',
        });
      })
      .catch((err) => setError(err.message || 'Failed to load hospital settings'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await adminService.updateHospitalProfile(form);
      const h = res.data || {};
      setForm({
        name: h.name || '',
        address: h.address || '',
        city: h.city || '',
        contactPhone: h.contactPhone || '',
        contactEmail: h.contactEmail || '',
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err.message || 'Failed to save hospital settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 flex items-center justify-center text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading settings…
      </div>
    );
  }

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="p-4 sm:p-6 pb-24 lg:pb-6">
      <h2 className="font-bold text-slate-900 mb-4">Hospital Settings</h2>
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
      )}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Hospital Name</label>
          <input value={form.name} onChange={update('name')}
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-300" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Address</label>
          <textarea rows={2} value={form.address} onChange={update('address')}
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-300 resize-none" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">City</label>
          <input value={form.city} onChange={update('city')}
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-300" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Phone</label>
          <input value={form.contactPhone} onChange={update('contactPhone')}
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-300" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Contact Email</label>
          <input type="email" value={form.contactEmail} onChange={update('contactEmail')}
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-300" />
        </div>
        <button onClick={handleSave} disabled={saving}
          className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-60 ${saved ? 'bg-emerald-600 text-white' : 'bg-cyan-600 hover:bg-cyan-700 text-white'}`}>
          {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────

export default function HospitalAdminDashboard() {
  const { user } = useAuthStore();
  const isReceptionist = user?.role === 'RECEPTIONIST';
  const [activeItem, setActiveItem] = useState(isReceptionist ? 'queue' : 'overview');

  const renderContent = () => {
    switch (activeItem) {
      case 'overview': return <OverviewTab />;
      case 'doctors': return <DoctorsTab />;
      case 'labstaff': return (
        <GenericStaffTab
          key="labstaff"
          title="Lab Staff"
          roleLabel="Lab Technician"
          fetchFn={adminService.getLabStaff}
          inviteFn={adminService.inviteLabStaff}
          fields={[
            { key: 'fullName', label: 'Full Name', required: true },
            { key: 'email', label: 'Email', type: 'email', required: true },
            { key: 'department', label: 'Department' },
          ]}
        />
      );
      case 'pharmacy': return (
        <GenericStaffTab
          key="pharmacy"
          title="Pharmacy Staff"
          roleLabel="Pharmacist"
          fetchFn={adminService.getPharmacyStaff}
          inviteFn={adminService.invitePharmacyStaff}
          fields={[
            { key: 'fullName', label: 'Full Name', required: true },
            { key: 'email', label: 'Email', type: 'email', required: true },
          ]}
        />
      );
      case 'ambulance': return (
        <GenericStaffTab
          key="ambulance"
          title="Ambulance Drivers"
          roleLabel="Driver"
          fetchFn={adminService.getDrivers}
          inviteFn={adminService.inviteDriver}
          fields={[
            { key: 'fullName', label: 'Full Name', required: true },
            { key: 'email', label: 'Email', type: 'email', required: true },
            { key: 'vehicleNumber', label: 'Vehicle Number', required: true },
          ]}
        />
      );
      case 'departments': return <DepartmentsTab />;
      case 'labtests': return <LabTestsTab />;
      case 'medicines': return <MedicinesTab />;
      case 'appointments': return <AppointmentsTab />;
      case 'queue': return <QueueMonitorTab />;
      case 'emergency': return <EmergencyTab />;
      case 'settings': return <SettingsTab />;
      default: return <OverviewTab />;
    }
  };

  return (
    <DashboardShell
      navItems={NAV_ITEMS}
      activeItem={activeItem}
      setActiveItem={setActiveItem}
      roleLabel={isReceptionist ? 'Receptionist' : 'Hospital Admin'}
      roleColor="bg-gradient-to-r from-teal-600 to-emerald-600 text-white"
    >
      {renderContent()}
    </DashboardShell>
  );
}
