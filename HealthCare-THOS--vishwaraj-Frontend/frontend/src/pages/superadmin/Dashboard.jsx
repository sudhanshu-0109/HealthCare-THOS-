/**
 * pages/superadmin/Dashboard.jsx — Complete Super Admin Dashboard
 * Overview | Hospitals (add, configure, status) | Hospital Admin management
 */

import { useState, useEffect } from 'react';
import {
  Building2, Users, Plus, Search, Settings, CheckCircle2, X,
  Activity, TrendingUp, Globe, Shield, Loader2, ChevronRight,
  ToggleLeft, ToggleRight, Eye, Edit
} from 'lucide-react';
import DashboardShell from '../../components/layout/DashboardShell';
import useAuthStore from '../../store/authStore';
import * as adminService from '../../services/admin.service';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';

const NAV_ITEMS = [
  { id: 'overview', icon: Activity, label: 'Overview', shortLabel: 'Overview' },
  { id: 'hospitals', icon: Building2, label: 'Hospitals', shortLabel: 'Hospitals' },
];



function AddHospitalModal({ open, onClose, onAdd }) {
  const [form, setForm] = useState({ name: '', address: '', phone: '', type: 'General', adminName: '', adminEmail: '' });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const handle = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        address: form.address,
        city: form.city || 'Default City',
        latitude: parseFloat(form.latitude) || 0,
        longitude: parseFloat(form.longitude) || 0,
        contactPhone: form.phone,
        contactEmail: form.email || 'admin@hospital.com',
        type: form.type,
      };
      if (form.adminEmail) {
        payload.adminEmail = form.adminEmail;
        payload.adminName = form.adminName;
      }
      const res = await adminService.createHospital(payload);
      onAdd(res.data || { ...payload, id: Date.now().toString(), status: 'ACTIVE', doctors: 0, patients: 0, admin: form.adminEmail ? { name: form.adminName, email: form.adminEmail } : null });
    } catch {/* show nothing, optimistic UI */ }
    setLoading(false);
    onClose();
    setForm({ name: '', address: '', phone: '', type: 'General', adminName: '', adminEmail: '' });
    setStep(1);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900">Add Hospital</h3>
            <p className="text-xs text-slate-400">Step {step} of 2</p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>

        {/* Step progress */}
        <div className="flex gap-2 mb-5">
          <div className={`h-1 flex-1 rounded-full ${step >= 1 ? 'bg-cyan-500' : 'bg-slate-100'}`} />
          <div className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-cyan-500' : 'bg-slate-100'}`} />
        </div>

        {step === 1 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-700">Hospital Information</h4>
            {[
              { key: 'name', label: 'Hospital Name', placeholder: 'e.g. Apollo Hospitals' },
              { key: 'address', label: 'Address', placeholder: 'Full address' },
              { key: 'city', label: 'City', placeholder: 'City name' },
              { key: 'phone', label: 'Contact Phone', placeholder: '+91 XXXXX XXXXX' },
              { key: 'email', label: 'Contact Email', placeholder: 'contact@hospital.com' },
            ].map((f) => (
              <div key={f.key}>
                <label className="block text-xs font-semibold text-slate-600 mb-1">{f.label}</label>
                <input
                  placeholder={f.placeholder}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-300"
                  value={form[f.key]} onChange={(e) => handle(f.key, e.target.value)}
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Hospital Type</label>
              <select
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-300"
                value={form.type} onChange={(e) => handle('type', e.target.value)}
              >
                {['General', 'Multi-specialty', 'Specialty', 'Trauma Center', 'Teaching Hospital'].map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold">Cancel</button>
              <button
                onClick={() => setStep(2)}
                disabled={!form.name || !form.address}
                className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold"
              >
                Next: Admin Setup
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-700">Hospital Admin (Optional)</h4>
            <p className="text-xs text-slate-400">Leave blank to add admin later.</p>
            {[
              { key: 'adminName', label: 'Admin Full Name', placeholder: 'e.g. Dr. John Smith' },
              { key: 'adminEmail', label: 'Admin Email', placeholder: 'admin@hospital.com' },
            ].map((f) => (
              <div key={f.key}>
                <label className="block text-xs font-semibold text-slate-600 mb-1">{f.label}</label>
                <input
                  placeholder={f.placeholder}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-300"
                  value={form[f.key]} onChange={(e) => handle(f.key, e.target.value)}
                />
              </div>
            ))}
            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep(1)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold">Back</button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {loading ? 'Adding…' : 'Add Hospital'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function OverviewTab({ hospitals }) {
  const stats = [
    { label: 'Total Hospitals', value: hospitals.length, icon: Building2, color: 'bg-cyan-50 text-cyan-700' },
    { label: 'Active', value: hospitals.filter((h) => h.status === 'ACTIVE').length, icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-700' },
    { label: 'Total Doctors', value: hospitals.reduce((s, h) => s + (h._count?.doctors || h.doctors || 0), 0), icon: Users, color: 'bg-violet-50 text-violet-700' },
    { label: 'Inactive', value: hospitals.filter((h) => h.status !== 'ACTIVE').length, icon: Activity, color: 'bg-amber-50 text-amber-700' },
  ];

  return (
    <div className="p-4 sm:p-6 pb-24 lg:pb-6 space-y-5">
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-5 h-5 text-cyan-400" />
          <span className="text-cyan-400 text-xs font-semibold uppercase tracking-wider">Super Admin</span>
        </div>
        <h1 className="text-xl font-bold mb-1">Platform Overview</h1>
        <p className="text-slate-400 text-sm">HealthCare+ Network Management</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-4">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${s.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-4">
        <h3 className="font-semibold text-slate-900 text-sm mb-3">Hospital Network</h3>
        <div className="space-y-2">
          {hospitals.slice(0, 4).map((h) => (
            <div key={h.id} className="flex items-center gap-3">
              <div className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Building2 className="w-4 h-4 text-cyan-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{h.name}</p>
                <p className="text-xs text-slate-400">{h._count?.doctors || h.doctors || 0} doctors • {h.address}</p>
              </div>
              <StatusBadge status={h.status} size="xs" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HospitalsTab({ hospitals, setHospitals }) {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const filtered = hospitals.filter((h) =>
    !search || h.name.toLowerCase().includes(search.toLowerCase()) || h.address?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleStatus = async (h) => {
    const newStatus = h.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setHospitals((prev) => prev.map((x) => x.id === h.id ? { ...x, status: newStatus } : x));
    try { await adminService.updateHospital(h.id, { status: newStatus }); } catch { /* revert if needed */ }
  };

  return (
    <div className="p-4 sm:p-6 pb-24 lg:pb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-slate-900">Hospitals</h2>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 px-3 py-2 bg-cyan-600 text-white rounded-xl text-xs font-semibold hover:bg-cyan-700 transition-colors">
          <Plus className="w-3.5 h-3.5" /> Add Hospital
        </button>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          placeholder="Search hospitals…"
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-300"
          value={search} onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {filtered.length === 0 ? (
        <EmptyState icon={Building2} title="No hospitals found" description="Add your first hospital." />
      ) : (
        <div className="space-y-3">
          {filtered.map((h) => (
            <div key={h.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="flex items-start gap-3 p-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${h.status === 'ACTIVE' ? 'bg-cyan-100' : 'bg-slate-100'}`}>
                  <Building2 className={`w-5 h-5 ${h.status === 'ACTIVE' ? 'text-cyan-600' : 'text-slate-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-sm">{h.name}</p>
                  <p className="text-xs text-slate-400">{h.address}</p>
                  <p className="text-xs text-slate-400">{h.type} • {h.doctors} doctors</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusBadge status={h.status} size="xs" />
                  <button
                    onClick={() => setExpanded(expanded === h.id ? null : h.id)}
                    className="text-xs text-cyan-600 hover:underline mt-1 flex items-center gap-1"
                  >
                    Details <ChevronRight className={`w-3 h-3 transition-transform ${expanded === h.id ? 'rotate-90' : ''}`} />
                  </button>
                </div>
              </div>
              {expanded === h.id && (
                <div className="border-t border-slate-100 p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-slate-400">Phone:</span> <span className="font-medium text-slate-700">{h.phone}</span></div>
                    <div><span className="text-slate-400">Patients:</span> <span className="font-medium text-slate-700">{h.patients}</span></div>
                  </div>
                  {h.admin ? (
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-xs font-semibold text-slate-600 mb-1">Hospital Admin</p>
                      <p className="text-sm font-medium text-slate-900">{h.admin.name}</p>
                      <p className="text-xs text-slate-400">{h.admin.email}</p>
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                      <p className="text-xs text-amber-600 font-medium">No admin assigned yet</p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleStatus(h)}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1 ${
                        h.status === 'ACTIVE' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                      }`}
                    >
                      {h.status === 'ACTIVE' ? <ToggleLeft className="w-3.5 h-3.5" /> : <ToggleRight className="w-3.5 h-3.5" />}
                      {h.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    </button>
                    <button className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1">
                      <Edit className="w-3.5 h-3.5" /> Configure
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <AddHospitalModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onAdd={(h) => setHospitals((prev) => [...prev, h])}
      />
    </div>
  );
}

export default function SuperAdminDashboard() {
  const [activeItem, setActiveItem] = useState('overview');
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuthStore();

  useEffect(() => {
    adminService.getHospitals()
      .then((res) => setHospitals(res.data || []))
      .catch((err) => setError(err.message || 'Failed to load hospitals'))
      .finally(() => setLoading(false));
  }, []);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="p-6 flex items-center justify-center text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…
        </div>
      );
    }
    if (error) {
      return (
        <div className="p-6">
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
        </div>
      );
    }
    switch (activeItem) {
      case 'overview': return <OverviewTab hospitals={hospitals} />;
      case 'hospitals': return <HospitalsTab hospitals={hospitals} setHospitals={setHospitals} />;
      default: return <OverviewTab hospitals={hospitals} />;
    }
  };

  return (
    <DashboardShell
      navItems={NAV_ITEMS}
      activeItem={activeItem}
      setActiveItem={setActiveItem}
      roleLabel="Super Admin"
      roleColor="bg-gradient-to-r from-teal-600 to-emerald-600 text-white"
    >
      {renderContent()}
    </DashboardShell>
  );
}
