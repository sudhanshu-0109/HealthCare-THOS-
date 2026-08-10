/**
 * pages/lab/Dashboard.jsx — Lab Staff Dashboard, wired to the REAL lab-request lifecycle.
 *
 * Real LabRequestStatus flow (backend is the source of truth — no simulated transitions):
 *   PENDING          → staff confirms + prices  → CONFIRMED   (bill created, patient must pay)
 *   CONFIRMED        → patient pays (billing)    → SAMPLE_COLLECTED   (auto, no staff action)
 *   SAMPLE_COLLECTED → staff "Mark Processing"   → PROCESSING  (advanceLabStatus)
 *   PROCESSING       → staff uploads report      → COMPLETED   (uploadReport)
 *
 * Each tab shows one real status. Staff-driven transitions call the dedicated
 * endpoints; the payment-driven step (CONFIRMED → SAMPLE_COLLECTED) has NO staff
 * button — it only advances when the patient actually pays.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  FlaskConical, Clock, CheckCircle2, Loader2, AlertCircle, CreditCard,
  RefreshCw, UploadCloud, Activity, X, ExternalLink
} from 'lucide-react';
import DashboardShell from '../../components/layout/DashboardShell';
import * as labFulfillmentService from '../../services/labFulfillment.service';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';

const NAV_ITEMS = [
  { id: 'pending', icon: Clock, label: 'Pending', shortLabel: 'Pending' },
  { id: 'awaiting', icon: CreditCard, label: 'Awaiting Payment', shortLabel: 'Payment' },
  { id: 'collected', icon: FlaskConical, label: 'Sample Collected', shortLabel: 'Sample' },
  { id: 'processing', icon: Activity, label: 'Processing', shortLabel: 'Process' },
  { id: 'completed', icon: CheckCircle2, label: 'Completed', shortLabel: 'Done' },
];

// Tab → real LabRequestStatus enum value
const STATUS_MAP = {
  pending: 'PENDING',
  awaiting: 'CONFIRMED',
  collected: 'SAMPLE_COLLECTED',
  processing: 'PROCESSING',
  completed: 'COMPLETED',
};

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
      <p className="text-sm text-red-600 mb-3">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-800 mx-auto">
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </button>
      )}
    </div>
  );
}

// ── Confirm & Price Modal ───────────────────────────────────────────────────────
// Lab staff sets the real unit price for each test before the request is confirmed
// and a bill is raised. Prices prefill from the doctor's estimate when available.

function ConfirmPriceModal({ req, onClose, onSuccess }) {
  const [prices, setPrices] = useState(() =>
    (req.items || []).map((it) => (it.estimatedPrice != null ? String(it.estimatedPrice) : ''))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const setPrice = (i, val) => setPrices((prev) => prev.map((p, idx) => (idx === i ? val : p)));

  const total = prices.reduce((sum, p) => sum + (Number(p) || 0), 0);

  const handleSubmit = async () => {
    const items = req.items || [];
    if (items.length === 0) { setError('This request has no test items to price.'); return; }
    for (let i = 0; i < items.length; i++) {
      const n = Number(prices[i]);
      if (!prices[i] || Number.isNaN(n) || n <= 0) {
        setError(`Enter a valid price for "${items[i].testName}".`);
        return;
      }
    }
    setLoading(true);
    setError(null);
    try {
      const finalItems = items.map((it, i) => ({
        labRequestItemId: it.id,
        description: it.testName,
        unitPrice: Number(prices[i]),
      }));
      await labFulfillmentService.confirmLabRequest(req.id, finalItems);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Confirmation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-slate-900">Confirm & Set Pricing</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          A bill will be raised for the patient. They must pay before the sample is processed.
        </p>
        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
        <div className="space-y-2.5 mb-4">
          {(req.items || []).map((it, i) => (
            <div key={it.id || i} className="flex items-center gap-3">
              <span className="flex-1 text-sm text-slate-700">{it.testName}</span>
              <div className="flex items-center gap-1">
                <span className="text-slate-400 text-sm">₹</span>
                <input
                  type="number" min="0" step="1" inputMode="decimal"
                  value={prices[i]} onChange={(e) => setPrice(i, e.target.value)}
                  placeholder="0"
                  className="w-24 px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-300"
                />
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center bg-slate-50 rounded-xl px-3 py-2.5 mb-5">
          <span className="text-sm font-semibold text-slate-600">Total</span>
          <span className="text-lg font-bold text-slate-900">₹{total.toLocaleString('en-IN')}</span>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold">Cancel</button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {loading ? 'Confirming…' : 'Confirm & Bill'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Upload Report Modal ────────────────────────────────────────────────────────

function UploadReportModal({ requestId, onClose, onSuccess }) {
  const [reportUrl, setReportUrl] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (!reportUrl.trim()) { setError('Report URL/link is required.'); return; }
    setLoading(true);
    setError(null);
    try {
      await labFulfillmentService.uploadLabReport(requestId, {
        reportFileUrl: reportUrl.trim(),
        resultSummary: summary.trim() || undefined,
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Upload failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900">Upload Lab Report</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <p className="text-xs text-slate-500 mb-4">Uploading a report marks this request <strong>Completed</strong> and notifies the patient.</p>
        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
        <div className="space-y-3 mb-5">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Report URL / File Link *</label>
            <input value={reportUrl} onChange={(e) => setReportUrl(e.target.value)}
              placeholder="https://drive.google.com/..."
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-300" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Result Summary</label>
            <textarea rows={3} value={summary} onChange={(e) => setSummary(e.target.value)}
              placeholder="Key findings, normal/abnormal values…"
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-300 resize-none" />
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold">Cancel</button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {loading ? 'Uploading…' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Request Card ──────────────────────────────────────────────────────────────

function RequestCard({ req, activeTab, onAction, actionLoading, onConfirm, onUpload }) {
  const patientName = req.patient?.fullName || req.patientName || 'Patient';
  const doctorName = req.doctor?.user?.fullName ? `Dr. ${req.doctor.user.fullName}` : 'Doctor';
  const report = req.reports?.[0];

  // Per-tab call-to-action. `awaiting` and `completed` have no staff action.
  const getAction = () => {
    switch (activeTab) {
      case 'pending': return { label: 'Confirm & Set Price', style: 'bg-cyan-600 hover:bg-cyan-700 text-white', kind: 'confirm' };
      case 'collected': return { label: 'Mark Processing', style: 'bg-violet-600 hover:bg-violet-700 text-white', kind: 'advance' };
      case 'processing': return { label: 'Upload Report', style: 'bg-emerald-600 hover:bg-emerald-700 text-white', kind: 'upload' };
      default: return null;
    }
  };

  const action = getAction();

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 text-sm">{patientName}</p>
          <p className="text-xs text-slate-400">{doctorName}</p>
          {req.createdAt && (
            <p className="text-xs text-slate-400">
              {new Date(req.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
            </p>
          )}
        </div>
        <StatusBadge status={req.status} size="xs" />
      </div>

      {req.items?.length > 0 && (
        <div className="space-y-1 mb-3">
          {req.items.map((item, i) => (
            <div key={item.id || i} className="flex items-center justify-between text-xs">
              <span className="text-slate-700">{item.testName}</span>
              {item.estimatedPrice != null && <span className="text-slate-400">₹{Number(item.estimatedPrice)}</span>}
            </div>
          ))}
        </div>
      )}

      {req.notes && <p className="text-xs text-slate-500 italic mb-3">"{req.notes}"</p>}

      {/* Payment-driven step: nothing for staff to do here. */}
      {activeTab === 'awaiting' && (
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 flex items-center gap-1.5">
          <CreditCard className="w-3.5 h-3.5" /> Awaiting patient payment — sample proceeds automatically once paid.
        </div>
      )}

      {/* Completed: show the uploaded report link. */}
      {activeTab === 'completed' && report?.reportFileUrl && (
        <a href={report.reportFileUrl} target="_blank" rel="noopener noreferrer"
          className="text-xs text-cyan-700 hover:text-cyan-900 bg-cyan-50 border border-cyan-100 rounded-xl px-3 py-2 flex items-center gap-1.5">
          <ExternalLink className="w-3.5 h-3.5" /> View uploaded report
        </a>
      )}

      {action && (
        <button
          onClick={() => {
            if (action.kind === 'confirm') onConfirm(req);
            else if (action.kind === 'upload') onUpload(req.id);
            else onAction(req.id, activeTab);
          }}
          disabled={actionLoading === req.id}
          className={`w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 ${action.style}`}
        >
          {actionLoading === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
          {action.label}
        </button>
      )}
    </div>
  );
}

// ── Main Tab Component ────────────────────────────────────────────────────────

function LabTab({ activeTab }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [uploadTarget, setUploadTarget] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await labFulfillmentService.getHospitalLabRequests({ status: STATUS_MAP[activeTab] });
      setRequests(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load lab requests.');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const showSuccess = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(null), 3000); };

  // Real staff-driven transition: SAMPLE_COLLECTED → PROCESSING.
  const handleAction = async (requestId, tab) => {
    if (tab !== 'collected') return;
    setActionLoading(requestId);
    setError(null);
    try {
      await labFulfillmentService.advanceLabStatus(requestId, 'PROCESSING');
      showSuccess('Moved to processing');
      await fetchRequests();
    } catch (err) {
      setError(err.message || 'Action failed.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 pb-24 lg:pb-6 space-y-3">
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5 text-sm text-emerald-700 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {successMsg}
        </div>
      )}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">{requests.length} request{requests.length !== 1 ? 's' : ''}</p>
        <button onClick={fetchRequests} className="text-xs text-cyan-600 hover:text-cyan-800 flex items-center gap-1">
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>
      {loading && <LoadingCard />}
      {!loading && error && <ErrorCard message={error} onRetry={fetchRequests} />}
      {!loading && !error && requests.length === 0 && (
        <EmptyState icon={FlaskConical} title={`No ${NAV_ITEMS.find((n) => n.id === activeTab)?.label.toLowerCase()} requests`} description="Nothing to show here." />
      )}
      {!loading && !error && requests.map((req) => (
        <RequestCard
          key={req.id}
          req={req}
          activeTab={activeTab}
          onAction={handleAction}
          actionLoading={actionLoading}
          onConfirm={(r) => setConfirmTarget(r)}
          onUpload={(id) => setUploadTarget(id)}
        />
      ))}
      {confirmTarget && (
        <ConfirmPriceModal
          req={confirmTarget}
          onClose={() => setConfirmTarget(null)}
          onSuccess={() => { showSuccess('Request confirmed & billed'); fetchRequests(); setConfirmTarget(null); }}
        />
      )}
      {uploadTarget && (
        <UploadReportModal
          requestId={uploadTarget}
          onClose={() => setUploadTarget(null)}
          onSuccess={() => { showSuccess('Report uploaded!'); fetchRequests(); setUploadTarget(null); }}
        />
      )}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────

export default function LabDashboard() {
  const [activeItem, setActiveItem] = useState('pending');

  return (
    <DashboardShell
      navItems={NAV_ITEMS}
      activeItem={activeItem}
      setActiveItem={setActiveItem}
      roleLabel="Lab Staff"
      roleColor="bg-gradient-to-r from-violet-500 to-purple-600 text-white"
    >
      <LabTab activeTab={activeItem} key={activeItem} />
    </DashboardShell>
  );
}
