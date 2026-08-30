/**
 * pages/doctor/Dashboard.jsx — Doctor Dashboard with real backend integration.
 * All data from live API: profile, queue, prescriptions, lab requests, history.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Activity, Stethoscope, FlaskConical,
  Pill, CheckCircle2, Clock, Plus, Trash2, X,
  Loader2, Calendar, AlertCircle, RefreshCw, ChevronRight,
  ArrowRight, User, ChevronDown, FileText, Video, Wifi, MapPin, Building2
} from 'lucide-react';
import DashboardShell from '../../components/layout/DashboardShell';
import useAuthStore from '../../store/authStore';
import * as queueService from '../../services/queue.service';
import * as consultationsService from '../../services/consultations.service';
import * as prescriptionsService from '../../services/prescriptions.service';
import * as labRequestsService from '../../services/labRequests.service';
import * as labTestsService from '../../services/labTests.service';
import * as doctorService from '../../services/admin.service';
import api from '../../services/api';
import {
  getSocket, joinDoctorQueue, leaveDoctorQueue, onSocketEvent
} from '../../services/socket';
import EmptyState from '../../components/common/EmptyState';
import StatusBadge from '../../components/common/StatusBadge';

const NAV_ITEMS = [
  { id: 'overview', icon: LayoutDashboard, label: 'Overview', shortLabel: 'Overview' },
  { id: 'queue', icon: Users, label: 'Patient Queue', shortLabel: 'Queue' },
  { id: 'history', icon: Calendar, label: 'History', shortLabel: 'History' },
];

const today = new Date().toISOString().split('T')[0];

// ── Shared Loading / Error helpers ────────────────────────────────────────────

function LoadingCard() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
    </div>
  );
}

function ErrorCard({ message, onRetry }) {
  return (
    <div className="bg-red-50 border border-red-100 rounded-2xl p-5 text-center">
      <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
      <p className="text-sm text-red-600 mb-3">{message || 'Something went wrong.'}</p>
      {onRetry && (
        <button onClick={onRetry} className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-800 mx-auto">
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </button>
      )}
    </div>
  );
}

// ── Prescription Modal ─────────────────────────────────────────────────────────

function PrescribeModal({ consultationId, patientName, onClose, onSuccess }) {
  const [instructions, setInstructions] = useState('');
  const [items, setItems] = useState([{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateItem = (i, field, value) =>
    setItems((prev) => prev.map((it, idx) => idx === i ? { ...it, [field]: value } : it));
  const addItem = () => setItems((p) => [...p, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
  const removeItem = (i) => setItems((p) => p.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    if (!consultationId) { setError('No active consultation. Start consultation first.'); return; }
    const validItems = items.filter((it) => it.name.trim());
    if (!validItems.length) { setError('Add at least one medicine.'); return; }
    setLoading(true);
    setError(null);
    try {
      await prescriptionsService.createPrescription(consultationId, {
        generalInstructions: instructions,
        items: validItems.map((it) => ({
          medicineName: it.name,
          dosage: it.dosage,
          frequency: it.frequency,
          durationDays: parseInt(it.duration) || null,
          instructions: it.instructions,
        })),
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save prescription.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-extrabold text-slate-900 text-lg tracking-tight">Write Prescription</h3>
            {patientName && <p className="text-xs font-medium text-slate-400">{patientName}</p>}
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
        </div>
        {!consultationId && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3 mb-4 text-xs font-semibold text-amber-800">
            Start the consultation first to enable prescriptions.
          </div>
        )}
        {error && <p className="text-xs font-semibold text-red-500 mb-3">{error}</p>}
        <div className="space-y-4 mb-4">
          {items.map((item, i) => (
            <div key={i} className="bg-slate-50/80 rounded-2xl p-3.5 space-y-2 relative border border-slate-100">
              <button onClick={() => removeItem(i)} className="absolute top-3 right-3 text-slate-300 hover:text-red-500">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <input placeholder="Medicine name *" value={item.name}
                onChange={(e) => updateItem(i, 'name', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-200 font-medium" />
              <div className="grid grid-cols-3 gap-2">
                <input placeholder="Dosage" value={item.dosage}
                  onChange={(e) => updateItem(i, 'dosage', e.target.value)}
                  className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-200 font-medium" />
                <input placeholder="Frequency" value={item.frequency}
                  onChange={(e) => updateItem(i, 'frequency', e.target.value)}
                  className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-200 font-medium" />
                <input placeholder="Days" type="number" value={item.duration}
                  onChange={(e) => updateItem(i, 'duration', e.target.value)}
                  className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-200 font-medium" />
              </div>
              <input placeholder="Special instructions" value={item.instructions}
                onChange={(e) => updateItem(i, 'instructions', e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-200 font-medium" />
            </div>
          ))}
          <button onClick={addItem} className="w-full py-2.5 border border-dashed border-teal-300 text-teal-700 font-bold text-xs rounded-2xl hover:bg-teal-50 flex items-center justify-center gap-1.5 transition-colors">
            <Plus className="w-4 h-4" /> Add Medicine
          </button>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">General Instructions</label>
          <textarea rows={2} value={instructions} onChange={(e) => setInstructions(e.target.value)}
            placeholder="Diet, follow-up notes…"
            className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-200 resize-none font-medium" />
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-2xl text-xs font-bold hover:bg-slate-50">Cancel</button>
          <button onClick={handleSubmit} disabled={loading || !consultationId}
            className="flex-1 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 disabled:opacity-50 text-white rounded-2xl text-xs font-bold shadow-sm flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {loading ? 'Saving…' : 'Save Prescription'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Lab Request Modal ──────────────────────────────────────────────────────────

function LabRequestModal({ consultationId, patientName, hospitalId, onClose, onSuccess }) {
  const [labTests, setLabTests] = useState([]);
  const [selected, setSelected] = useState([]);
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState('ROUTINE');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState(null);

  const [expandedCats, setExpandedCats] = useState({});

  useEffect(() => {
    labTestsService.getLabTests(hospitalId)
      .then((res) => setLabTests(res.data || []))
      .catch(() => setLabTests([]))
      .finally(() => setFetching(false));
  }, [hospitalId]);

  const toggleTest = (test) => {
    setSelected((prev) =>
      prev.find((t) => t.id === test.id) ? prev.filter((t) => t.id !== test.id) : [...prev, test]
    );
  };

  const toggleCat = (cat) => setExpandedCats(p => ({ ...p, [cat]: !p[cat] }));

  const handleSubmit = async () => {
    if (!consultationId) { setError('No active consultation.'); return; }
    if (!selected.length) { setError('Select at least one test.'); return; }
    setLoading(true);
    setError(null);
    try {
      await labRequestsService.createLabRequest(consultationId, {
        priority,
        notes,
        items: selected.map((t) => ({ testName: t.name, estimatedPrice: Number(t.price) })),
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create lab request.');
    } finally {
      setLoading(false);
    }
  };

  const grouped = labTests.reduce((acc, t) => {
    const cat = t.masterTest?.category?.name || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(t);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div>
            <h3 className="font-bold text-slate-900">Lab Request</h3>
            {patientName && <p className="text-xs text-slate-400">{patientName}</p>}
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        
        {!consultationId && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-4 text-xs text-amber-700 flex-shrink-0">
            Start the consultation first to create lab requests.
          </div>
        )}
        
        {error && <p className="text-xs text-red-500 mb-3 flex-shrink-0">{error}</p>}
        
        <div className="flex gap-2 mb-4 flex-shrink-0">
          {['ROUTINE', 'URGENT'].map((p) => (
            <button key={p} onClick={() => setPriority(p)}
              className={`flex-1 py-1.5 rounded-xl text-xs font-semibold border ${priority === p ? 'bg-cyan-600 text-white border-cyan-600' : 'text-slate-600 border-slate-200'}`}>
              {p}
            </button>
          ))}
        </div>
        
        <div className="flex-1 overflow-y-auto min-h-[200px] mb-4 space-y-3">
          {fetching ? <LoadingCard /> : labTests.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">No lab tests configured for this hospital.</p>
          ) : (
            Object.entries(grouped).map(([category, items]) => (
              <div key={category} className="border border-slate-200 rounded-xl overflow-hidden">
                <button 
                  onClick={() => toggleCat(category)}
                  className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <h4 className="font-bold text-slate-700 text-sm">{category} <span className="font-normal text-slate-400 text-xs ml-1">({items.length})</span></h4>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expandedCats[category] ? 'rotate-180' : ''}`} />
                </button>
                {expandedCats[category] && (
                  <div className="divide-y divide-slate-100 px-2 py-1">
                    {items.map((t) => {
                      const sel = selected.some((s) => s.id === t.id);
                      return (
                        <button key={t.id} onClick={() => toggleTest(t)}
                          className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-colors ${sel ? 'bg-teal-50/80 border border-teal-200' : 'hover:bg-slate-50'}`}>
                          <div className={`w-4 h-4 rounded-md flex-shrink-0 border-2 flex items-center justify-center ${sel ? 'bg-teal-600 border-teal-600' : 'border-slate-300'}`}>
                            {sel && <CheckCircle2 className="w-3 h-3 text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate">{t.name}</p>
                            {t.masterTest?.code && <p className="text-[10px] font-mono text-slate-400 truncate">{t.masterTest.code}</p>}
                          </div>
                          <span className="text-xs font-bold text-teal-800">₹{Number(t.price)}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)}
          placeholder="Clinical notes…"
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-200 resize-none mb-4" />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold">Cancel</button>
          <button onClick={handleSubmit} disabled={loading || !consultationId}
            className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {loading ? 'Sending…' : `Send Request (${selected.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Report List Modal ─────────────────────────────────────────────────────────

function ReportListModal({ reports, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 flex flex-col">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div>
            <h3 className="font-bold text-slate-900">Lab Reports</h3>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto max-h-[50vh] space-y-2">
          {reports.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">No reports available.</p>
          ) : (
            reports.map((r, i) => (
              <div key={i} className="p-3 border border-slate-100 rounded-xl flex items-center justify-between">
                <div className="truncate pr-2">
                  <p className="text-sm font-semibold truncate">{r.testName}</p>
                  {r.date && <p className="text-xs text-slate-400 mt-0.5">{r.date}</p>}
                </div>
                <button onClick={() => window.open(r.url, '_blank')} className="px-3 py-1.5 bg-cyan-50 text-cyan-700 rounded-lg text-xs font-semibold hover:bg-cyan-100 whitespace-nowrap">
                  View
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── Queue Tab ──────────────────────────────────────────────────────────────────

/** Small pill badge showing ONLINE (violet) or OFFLINE/In-Person (slate) */
function ConsultTypeBadge({ type }) {
  if (type === 'ONLINE') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-violet-100 text-violet-700 text-[10px] font-bold tracking-wide">
        <Wifi className="w-2.5 h-2.5" /> Online
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-bold tracking-wide">
      <MapPin className="w-2.5 h-2.5" /> In-Person
    </span>
  );
}

/**
 * Phase 16: Online Appointments Panel — shown at the top of the Queue tab.
 * Uses the doctor-scoped GET /appointments/doctor/mine endpoint (no PATIENT role conflict).
 */
function OnlineAppointmentsPanel({ doctorProfile }) {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!doctorProfile) return;
    api.get('/appointments/doctor/mine', {
      params: { consultationType: 'ONLINE', status: 'CONFIRMED', date: today, limit: 10 },
    })
      .then((res) => setSessions(res.data?.appointments || []))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, [doctorProfile]);

  if (loading || sessions.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-emerald-900 rounded-3xl p-5 text-white mb-4 shadow-xl border border-teal-600/30">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-md">
          <Video className="w-4 h-4 text-white" />
        </div>
        <p className="text-white text-sm font-extrabold tracking-tight">Online Consultations Today</p>
        <span className="ml-auto bg-white/20 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
          {sessions.length}
        </span>
      </div>
      <div className="space-y-2">
        {sessions.map((apt) => (
          <div key={apt.id} className="bg-white/10 hover:bg-white/20 transition-colors rounded-2xl p-3.5 flex items-center justify-between gap-3 backdrop-blur-xs border border-white/10">
            <div className="min-w-0">
              <p className="font-extrabold text-sm truncate">{apt.patient?.fullName || 'Patient'}</p>
              <p className="text-teal-200 text-xs mt-0.5 font-medium">{apt.scheduledTime} · {apt.doctor?.user?.fullName || apt.doctor?.specialization || ''}</p>
            </div>
            <button
              onClick={() => navigate(`/doctor/video-consultation/${apt.id}`)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 bg-white text-teal-900 rounded-xl text-xs font-extrabold hover:bg-teal-50 transition-all shadow-sm"
            >
              <Video className="w-3.5 h-3.5 text-teal-600" /> Start Call
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function QueueTab({ doctorProfile }) {
  const navigate = useNavigate();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [consultation, setConsultation] = useState(null); // active consultation
  const [showPrescribe, setShowPrescribe] = useState(false);
  const [showLabRequest, setShowLabRequest] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [availableReports, setAvailableReports] = useState([]);
  const [showReportModal, setShowReportModal] = useState(false);

  const doctorId = doctorProfile?.id;
  const hospitalId = doctorProfile?.hospital?.id || doctorProfile?.hospitalId;

  const fetchQueue = useCallback(async () => {
    if (!doctorId) return;
    setError(null);
    try {
      const res = await queueService.getDoctorQueue(doctorId, today);
      setQueue(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load queue.');
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // Socket.IO real-time queue updates
  useEffect(() => {
    if (!doctorId) return;
    joinDoctorQueue(doctorId, today);
    const unsub = onSocketEvent('queue:updated', (data) => {
      if (data?.doctorId === doctorId) fetchQueue();
    });
    return () => {
      unsub();
      leaveDoctorQueue(doctorId, today);
    };
  }, [doctorId, fetchQueue]);

  const currentToken = queue.find((t) => t.status === 'IN_PROGRESS' || t.status === 'CALLED');
  const waiting = queue.filter((t) => t.status === 'WAITING');
  const completed = queue.filter((t) => t.status === 'COMPLETED');

  const showSuccess = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(null), 3000); };

  const doAction = async (fn, label) => {
    setActionLoading(label);
    try { await fn(); await fetchQueue(); }
    catch (err) { setError(err.message || `${label} failed.`); }
    finally { setActionLoading(null); }
  };

  const handleCallNext = () => doAction(async () => {
    const res = await queueService.callNext();
    showSuccess(`Called token T-${res.data?.token?.tokenNumber}`);
  }, 'call-next');

  const handleStartConsultation = (token) => doAction(async () => {
    const res = await consultationsService.startConsultation(token.appointment?.id, token.id);
    setConsultation(res.data);
    showSuccess('Consultation started');
  }, 'start');

  const handleCompleteConsultation = (tokenId) => doAction(async () => {
    await queueService.completeConsultation(tokenId);
    setConsultation(null);
    showSuccess('Consultation completed');
  }, 'complete');

  const handleSkip = (tokenId) => doAction(() => queueService.skipPatient(tokenId), 'skip');

  const handleViewReport = async (patientId) => {
    setActionLoading('report');
    try {
      const res = await consultationsService.getConsultationHistory(patientId);
      const consultations = res.data || [];
      let allReports = [];
      for (const c of consultations) {
        if (c.labRequests && c.labRequests.length > 0) {
          for (const req of c.labRequests) {
            if (req.reports && req.reports.length > 0) {
              for (let i = 0; i < req.reports.length; i++) {
                const rep = req.reports[i];
                const item = req.items?.find(it => it.id === rep.labRequestItemId) || req.items?.[0];
                allReports.push({ 
                  url: rep.reportFileUrl, 
                  testName: item?.testName || `Lab Report ${i+1}`,
                  date: new Date(rep.reportDate || rep.createdAt).toLocaleDateString('en-IN')
                });
              }
            }
          }
        }
      }
      
      if (allReports.length === 1) {
        window.open(allReports[0].url, '_blank');
      } else if (allReports.length > 1) {
        setAvailableReports(allReports);
        setShowReportModal(true);
      } else {
        setError('No recent lab reports found for this patient.');
      }
    } catch (err) {
      setError(err.message || 'Failed to open report');
    } finally {
      setActionLoading(null);
    }
  };

  const currentPatient = currentToken?.appointment?.patient || currentToken?.patient;
  const currentPatientName = currentPatient?.fullName || currentToken?.patientName || 'Patient';

  if (loading) return <div className="p-4"><LoadingCard /></div>;

  return (
    <div className="p-4 sm:p-6 pb-24 lg:pb-6 space-y-4">
      {/* Phase 16: Online Appointments Panel (shown above offline queue) */}
      <OnlineAppointmentsPanel doctorProfile={doctorProfile} />

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5 text-sm text-emerald-700 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {successMsg}
        </div>
      )}
      {error && <ErrorCard message={error} onRetry={fetchQueue} />}

      {/* Call Next */}
      {!currentToken && (
        <button
          onClick={handleCallNext}
          disabled={actionLoading === 'call-next' || waiting.length === 0}
          className="w-full py-4 bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-700 hover:from-teal-700 hover:to-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-3xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-md transition-all"
        >
          {actionLoading === 'call-next' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
          {waiting.length === 0 ? 'No Patients Waiting' : `Call Next Patient (${waiting.length} waiting)`}
        </button>
      )}

      {/* Current Patient */}
      {currentToken && (() => {
        const isOnline = currentToken.appointment?.consultationType === 'ONLINE';
        const cardGradient = isOnline
          ? 'bg-gradient-to-br from-violet-700 to-purple-800'
          : 'bg-gradient-to-br from-teal-700 via-teal-800 to-emerald-900';
        const mutedText = isOnline ? 'text-violet-200' : 'text-teal-200';
        const dividerBorder = isOnline ? 'border-violet-400/50' : 'border-teal-400/50';
        return (
          <div className={`${cardGradient} rounded-3xl p-6 text-white shadow-xl border border-white/10`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <p className={`${mutedText} text-xs font-semibold uppercase tracking-wide`}>Now Seeing</p>
                  <ConsultTypeBadge type={currentToken.appointment?.consultationType} />
                </div>
                <p className="font-bold text-xl mt-0.5 flex items-center gap-2">
                  {isOnline ? '🎥' : 'T-'}{isOnline ? '' : currentToken.tokenNumber}{isOnline ? `Appt` : ''}
                  <span className={`text-sm font-normal ${mutedText} border-l ${dividerBorder} pl-2`}>
                    {currentToken.appointment?.scheduledTime || ''}
                  </span>
                </p>
              </div>
              <div className={`w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center`}>
                {isOnline ? <Video className="w-5 h-5" /> : <User className="w-5 h-5" />}
              </div>
            </div>
            <p className="font-semibold">{currentPatientName}</p>
            <StatusBadge status={currentToken.status} size="xs" className="mt-1" />

            {/* Actions */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              {/* ONLINE: show Start Video Call button */}
              {isOnline && currentToken.status === 'CALLED' && (
                <button onClick={() => navigate(`/doctor/video-consultation/${currentToken.appointment?.id}`)}
                  className="col-span-2 py-2.5 bg-white text-violet-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-violet-50 transition-colors shadow-sm">
                  <Video className="w-3.5 h-3.5" /> Start Video Call
                </button>
              )}
              {/* OFFLINE: standard Start Consult */}
              {!isOnline && currentToken.status === 'CALLED' && (
                <button onClick={() => handleStartConsultation(currentToken)}
                  disabled={!!actionLoading}
                  className="py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-semibold disabled:opacity-50 flex items-center justify-center gap-1">
                  {actionLoading === 'start' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Stethoscope className="w-3 h-3" />}
                  Start Consult
                </button>
              )}
              {currentToken.status === 'IN_PROGRESS' && (
                <>
                  {isOnline && (
                    <button onClick={() => navigate(`/doctor/video-consultation/${currentToken.appointment?.id}`)}
                      className="col-span-2 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5">
                      <Video className="w-3 h-3" /> Rejoin Video Call
                    </button>
                  )}
                  <button onClick={() => setShowPrescribe(true)}
                    className="py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1">
                    <Pill className="w-3 h-3" /> Prescribe
                  </button>
                  <button onClick={() => setShowLabRequest(true)}
                    className="py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1">
                    <FlaskConical className="w-3 h-3" /> Lab Request
                  </button>
                  {!isOnline && currentToken.appointment?.appointmentType === 'LITE' && (
                    <button onClick={() => handleViewReport(currentToken.appointment.patient.id)}
                      disabled={actionLoading === 'report'}
                      className="col-span-2 py-2 bg-blue-500/80 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1">
                      {actionLoading === 'report' ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
                      View Uploaded Report
                    </button>
                  )}
                  <button onClick={() => handleCompleteConsultation(currentToken.id)}
                    disabled={!!actionLoading}
                    className="col-span-2 py-2 bg-emerald-400/80 hover:bg-emerald-400 text-white rounded-xl text-xs font-semibold disabled:opacity-50 flex items-center justify-center gap-1">
                    {actionLoading === 'complete' ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                    Complete & Next
                  </button>
                </>
              )}
              <button onClick={() => handleSkip(currentToken.id)}
                disabled={!!actionLoading}
                className={`py-2 bg-amber-400/80 hover:bg-amber-400 text-white rounded-xl text-xs font-semibold disabled:opacity-50 flex items-center justify-center gap-1 ${(currentToken.status === 'CALLED' && !isOnline) ? 'col-span-2' : ''}`}>
                Skip
              </button>
            </div>
          </div>
        );
      })()}

      {/* Waiting list */}
      {waiting.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Waiting ({waiting.length})
          </p>
          <div className="space-y-2">
            {waiting.map((token, i) => {
              const isOnline = token.appointment?.consultationType === 'ONLINE';
              return (
                <div key={token.id} className={`bg-white rounded-xl border p-3 flex items-center gap-3 ${
                  isOnline ? 'border-violet-200 bg-violet-50/40' : 'border-slate-100'
                }`}>
                  <div className={`w-12 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    isOnline ? 'bg-violet-100 text-violet-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {isOnline ? <Video className="w-4 h-4" /> : `T-${token.tokenNumber}`}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {token.appointment?.patient?.fullName || 'Patient'}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <p className="text-[10px] text-slate-500 font-semibold">{token.appointment?.scheduledTime || ''}</p>
                      <ConsultTypeBadge type={token.appointment?.consultationType} />
                    </div>
                  </div>
                  <span className="text-xs text-slate-400">#{i + 1}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <div className="bg-slate-50 rounded-2xl p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Completed ({completed.length})</p>
          <div className="space-y-1.5">
            {completed.map((t) => {
              const isOnline = t.appointment?.consultationType === 'ONLINE';
              return (
                <div key={t.id} className="flex items-center gap-2 text-sm">
                  {isOnline
                    ? <Video className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                    : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  }
                  <span className="text-slate-700">{t.appointment?.patient?.fullName || 'Patient'}</span>
                  <ConsultTypeBadge type={t.appointment?.consultationType} />
                  <div className="text-right ml-auto">
                    {!isOnline && <span className="text-slate-400 text-xs font-bold">T-{t.tokenNumber}</span>}
                    <span className="text-slate-400 text-[10px] block font-semibold">{t.appointment?.scheduledTime || ''}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {queue.length === 0 && !loading && !error && (
        <EmptyState icon={Users} title="No patients today" description="Your queue is empty." />
      )}

      {showPrescribe && (
        <PrescribeModal
          consultationId={consultation?.id || currentToken?.consultation?.id}
          patientName={currentPatientName}
          onClose={() => setShowPrescribe(false)}
          onSuccess={() => showSuccess('Prescription saved!')}
        />
      )}
      {showLabRequest && (
        <LabRequestModal
          consultationId={consultation?.id || currentToken?.consultation?.id}
          patientName={currentPatientName}
          hospitalId={hospitalId}
          onClose={() => setShowLabRequest(false)}
          onSuccess={() => showSuccess('Lab request sent!')}
        />
      )}
      {showReportModal && (
        <ReportListModal
          reports={availableReports}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
}

// ── Overview Tab ───────────────────────────────────────────────────────────────

function OverviewTab({ doctorProfile, queue }) {
  const waiting = queue.filter((t) => t.status === 'WAITING').length;
  const completed = queue.filter((t) => t.status === 'COMPLETED').length;
  const inProgress = queue.filter((t) => t.status === 'IN_PROGRESS').length;
  const total = queue.length;

  const stats = [
    { label: "Today's Total", value: total, icon: Users, color: 'bg-teal-50 text-teal-700 border border-teal-100' },
    { label: 'In Queue', value: waiting, icon: Clock, color: 'bg-amber-50 text-amber-700 border border-amber-100' },
    { label: 'Completed', value: completed, icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-700 border border-emerald-100' },
    { label: 'In Progress', value: inProgress, icon: Activity, color: 'bg-purple-50 text-purple-700 border border-purple-100' },
  ];

  return (
    <div className="p-4 sm:p-6 pb-24 lg:pb-6 space-y-6">
      
      {/* Premium Minimal Doctor Hero Banner */}
      <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 rounded-3xl p-6 text-white shadow-xl overflow-hidden border border-slate-700/50">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-extrabold mb-3">
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Doctor Consultation OS</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
            {doctorProfile?.user?.fullName ? `Dr. ${doctorProfile.user.fullName}` : 'Doctor Workspace'} 👨‍⚕️
          </h1>

          <p className="text-slate-300 text-xs sm:text-sm font-medium mt-1">
            {doctorProfile?.specialization || 'Clinical Specialist'} • {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>

          {doctorProfile?.hospital?.name && (
            <p className="text-teal-300 text-xs font-semibold mt-2 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-teal-400" /> {doctorProfile.hospital.name}
            </p>
          )}
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-md transition-all">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-3 ${s.color}`}>
                <Icon className="w-5 h-5 stroke-[2.2]" />
              </div>
              <p className="text-3xl font-black text-slate-900 tracking-tight">{s.value}</p>
              <p className="text-xs font-bold text-slate-500 mt-0.5">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Profile Card */}
      {doctorProfile && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-2xs">
          <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-4">Doctor Profile Details</p>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Specialization</span>
              <span className="font-extrabold text-slate-900">{doctorProfile.specialization}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Department</span>
              <span className="font-extrabold text-slate-900">{doctorProfile.department?.name || '—'}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500 font-medium">Consultation Fee</span>
              <span className="font-extrabold text-teal-700">₹{doctorProfile.consultationFee}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── History Tab ────────────────────────────────────────────────────────────────

function HistoryTab() {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await consultationsService.getRecentConsultations(20);
      setConsultations(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load history.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  if (loading) return <div className="p-4"><LoadingCard /></div>;

  return (
    <div className="p-4 sm:p-6 pb-24 lg:pb-6">
      <h2 className="font-bold text-slate-900 mb-4">Consultation History</h2>
      {error && <ErrorCard message={error} onRetry={fetch} />}
      {!error && consultations.length === 0 && (
        <EmptyState icon={Calendar} title="No consultations yet" description="Completed consultations will appear here." />
      )}
      <div className="space-y-3">
        {consultations.map((c) => (
          <div key={c.id} className="bg-white rounded-2xl border border-slate-100 p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-semibold text-slate-900 text-sm">
                  {c.patient?.fullName || c.appointment?.patient?.fullName || 'Patient'}
                </p>
                <p className="text-xs text-slate-400">
                  {c.startedAt ? new Date(c.startedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                </p>
              </div>
              <StatusBadge status={c.status} size="xs" />
            </div>
            {c.symptoms && <p className="text-xs text-slate-500 mb-1"><span className="font-medium">Symptoms:</span> {c.symptoms}</p>}
            {c.diagnosis && <p className="text-xs text-slate-500"><span className="font-medium">Diagnosis:</span> {c.diagnosis}</p>}
          </div>
        ))}

      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────

export default function DoctorDashboard() {
  const [activeItem, setActiveItem] = useState('overview');
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [queue, setQueue] = useState([]);
  const [profileLoading, setProfileLoading] = useState(true);
  const { user } = useAuthStore();

  // Load doctor profile once on mount
  useEffect(() => {
    api.get('/doctors/me')
      .then((res) => {
        const profile = res.data || res;
        setDoctorProfile(profile);
      })
      .catch(() => {
        // Fallback: construct basic profile from auth user
        setDoctorProfile({ user: { fullName: user?.fullName || 'Doctor' }, specialization: '', hospitalId: null });
      })
      .finally(() => setProfileLoading(false));
  }, [user]);

  // Pre-load today's queue so overview stats are populated
  useEffect(() => {
    if (!doctorProfile?.id) return;
    queueService.getDoctorQueue(doctorProfile.id, today)
      .then((res) => setQueue(res.data || []))
      .catch(() => {});
  }, [doctorProfile?.id]);

  const renderContent = () => {
    switch (activeItem) {
      case 'overview': return <OverviewTab doctorProfile={doctorProfile} queue={queue} />;
      case 'queue': return <QueueTab doctorProfile={doctorProfile} />;
      case 'history': return <HistoryTab />;
      default: return <OverviewTab doctorProfile={doctorProfile} queue={queue} />;
    }
  };

  return (
    <DashboardShell
      navItems={NAV_ITEMS}
      activeItem={activeItem}
      setActiveItem={setActiveItem}
      roleLabel="Doctor"
      roleColor="bg-gradient-to-r from-teal-600 to-emerald-600 text-white"
    >
      {profileLoading ? (
        <div className="p-8"><LoadingCard /></div>
      ) : (
        renderContent()
      )}
    </DashboardShell>
  );
}
