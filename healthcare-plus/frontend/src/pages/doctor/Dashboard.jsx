/**
 * pages/doctor/Dashboard.jsx — Doctor Dashboard with real backend integration.
 * All data from live API: profile, queue, prescriptions, lab requests, history.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  LayoutDashboard, Users, Activity, Stethoscope, FlaskConical,
  Pill, CheckCircle2, Clock, Plus, Trash2, X,
  Loader2, Calendar, AlertCircle, RefreshCw, ChevronRight,
  ArrowRight, User, ChevronDown, FileText
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
      <Loader2 className="w-6 h-6 text-cyan-500 animate-spin" />
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
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900">Write Prescription</h3>
            {patientName && <p className="text-xs text-slate-400">{patientName}</p>}
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        {!consultationId && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-4 text-xs text-amber-700">
            Start the consultation first to enable prescriptions.
          </div>
        )}
        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
        <div className="space-y-4 mb-4">
          {items.map((item, i) => (
            <div key={i} className="bg-slate-50 rounded-xl p-3 space-y-2 relative">
              <button onClick={() => removeItem(i)} className="absolute top-2 right-2 text-slate-300 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <input placeholder="Medicine name *" value={item.name}
                onChange={(e) => updateItem(i, 'name', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-200" />
              <div className="grid grid-cols-3 gap-2">
                <input placeholder="Dosage" value={item.dosage}
                  onChange={(e) => updateItem(i, 'dosage', e.target.value)}
                  className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-200" />
                <input placeholder="Frequency" value={item.frequency}
                  onChange={(e) => updateItem(i, 'frequency', e.target.value)}
                  className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-200" />
                <input placeholder="Days" type="number" value={item.duration}
                  onChange={(e) => updateItem(i, 'duration', e.target.value)}
                  className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-200" />
              </div>
              <input placeholder="Special instructions" value={item.instructions}
                onChange={(e) => updateItem(i, 'instructions', e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-200" />
            </div>
          ))}
          <button onClick={addItem} className="w-full py-2 border border-dashed border-cyan-300 text-cyan-600 text-sm rounded-xl hover:bg-cyan-50 flex items-center justify-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Add Medicine
          </button>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">General Instructions</label>
          <textarea rows={2} value={instructions} onChange={(e) => setInstructions(e.target.value)}
            placeholder="Diet, follow-up notes…"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-200 resize-none" />
        </div>
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold">Cancel</button>
          <button onClick={handleSubmit} disabled={loading || !consultationId}
            className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
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
                          className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors ${sel ? 'bg-cyan-50' : 'hover:bg-slate-50'}`}>
                          <div className={`w-4 h-4 rounded flex-shrink-0 border-2 flex items-center justify-center ${sel ? 'bg-cyan-500 border-cyan-500' : 'border-slate-300'}`}>
                            {sel && <CheckCircle2 className="w-3 h-3 text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">{t.name}</p>
                            {t.masterTest?.code && <p className="text-[10px] font-mono text-slate-400 truncate">{t.masterTest.code}</p>}
                          </div>
                          <span className="text-xs font-bold text-cyan-700">₹{Number(t.price)}</span>
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

function QueueTab({ doctorProfile }) {
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
          className="w-full py-3.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
        >
          {actionLoading === 'call-next' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
          {waiting.length === 0 ? 'No Patients Waiting' : `Call Next Patient (${waiting.length} waiting)`}
        </button>
      )}

      {/* Current Patient */}
      {currentToken && (
        <div className="bg-gradient-to-br from-cyan-600 to-teal-700 rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-cyan-100 text-xs font-semibold uppercase tracking-wide">Now Seeing</p>
              <p className="font-bold text-xl mt-0.5 flex items-center gap-2">
                T-{currentToken.tokenNumber}
                <span className="text-sm font-normal text-cyan-200 border-l border-cyan-400/50 pl-2">
                  {currentToken.appointment?.scheduledTime || ''}
                </span>
              </p>
            </div>
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
          </div>
          <p className="font-semibold">{currentPatientName}</p>
          <StatusBadge status={currentToken.status} size="xs" className="mt-1" />

          {/* Actions */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {currentToken.status === 'CALLED' && (
              <button onClick={() => handleStartConsultation(currentToken)}
                disabled={!!actionLoading}
                className="py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-semibold disabled:opacity-50 flex items-center justify-center gap-1">
                {actionLoading === 'start' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Stethoscope className="w-3 h-3" />}
                Start Consult
              </button>
            )}
            {currentToken.status === 'IN_PROGRESS' && (
              <>
                <button onClick={() => setShowPrescribe(true)}
                  className="py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1">
                  <Pill className="w-3 h-3" /> Prescribe
                </button>
                <button onClick={() => setShowLabRequest(true)}
                  className="py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1">
                  <FlaskConical className="w-3 h-3" /> Lab Request
                </button>
                {currentToken.appointment?.appointmentType === 'LITE' && (
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
              className={`py-2 bg-amber-400/80 hover:bg-amber-400 text-white rounded-xl text-xs font-semibold disabled:opacity-50 flex items-center justify-center gap-1 ${currentToken.status === 'CALLED' ? 'col-span-2' : ''}`}>
              Skip
            </button>
          </div>
        </div>
      )}

      {/* Waiting list */}
      {waiting.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Waiting ({waiting.length})
          </p>
          <div className="space-y-2">
            {waiting.map((token, i) => (
              <div key={token.id} className="bg-white rounded-xl border border-slate-100 p-3 flex items-center gap-3">
                <div className="w-12 h-9 bg-amber-100 rounded-xl flex items-center justify-center text-amber-700 text-xs font-bold flex-shrink-0">
                  T-{token.tokenNumber}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {token.appointment?.patient?.fullName || 'Patient'}
                  </p>
                  <p className="text-[10px] text-slate-500 font-semibold">{token.appointment?.scheduledTime || ''}</p>
                </div>
                <span className="text-xs text-slate-400">#{i + 1}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <div className="bg-slate-50 rounded-2xl p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Completed ({completed.length})</p>
          <div className="space-y-1.5">
            {completed.map((t) => (
              <div key={t.id} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <span className="text-slate-700">{t.appointment?.patient?.fullName || 'Patient'}</span>
                <div className="text-right ml-auto">
                  <span className="text-slate-400 text-xs font-bold">T-{t.tokenNumber}</span>
                  <span className="text-slate-400 text-[10px] block font-semibold">{t.appointment?.scheduledTime || ''}</span>
                </div>
              </div>
            ))}
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
    { label: "Today's Total", value: total, icon: Users, color: 'bg-cyan-50 text-cyan-600' },
    { label: 'In Queue', value: waiting, icon: Clock, color: 'bg-amber-50 text-amber-600' },
    { label: 'Completed', value: completed, icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'In Progress', value: inProgress, icon: Activity, color: 'bg-violet-50 text-violet-600' },
  ];

  return (
    <div className="p-4 sm:p-6 pb-24 lg:pb-6 space-y-5">
      <div className="bg-gradient-to-r from-cyan-600 to-teal-700 rounded-2xl p-5 text-white">
        <p className="text-cyan-100 text-sm">Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'},</p>
        <h1 className="text-2xl font-bold mt-0.5">
          {doctorProfile?.user?.fullName ? `Dr. ${doctorProfile.user.fullName}` : 'Doctor'} 👨‍⚕️
        </h1>
        <p className="text-cyan-100 text-sm mt-1">
          {doctorProfile?.specialization} • {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        {doctorProfile?.hospital?.name && (
          <p className="text-cyan-200 text-xs mt-0.5">{doctorProfile.hospital.name}</p>
        )}
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
      {doctorProfile && (
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Profile</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Specialization</span>
              <span className="font-medium text-slate-900">{doctorProfile.specialization}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Department</span>
              <span className="font-medium text-slate-900">{doctorProfile.department?.name || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Consultation Fee</span>
              <span className="font-medium text-slate-900">₹{doctorProfile.consultationFee}</span>
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
      roleColor="bg-gradient-to-r from-cyan-500 to-teal-600 text-white"
    >
      {profileLoading ? (
        <div className="p-8"><LoadingCard /></div>
      ) : (
        renderContent()
      )}
    </DashboardShell>
  );
}
