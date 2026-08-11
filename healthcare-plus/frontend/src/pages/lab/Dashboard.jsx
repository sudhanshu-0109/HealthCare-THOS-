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
import * as uploadService from '../../services/upload.service';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const total = (req.items || []).reduce((sum, it) => sum + (Number(it.estimatedPrice) || 0), 0);

  const handleSubmit = async () => {
    const items = req.items || [];
    if (items.length === 0) { setError('This request has no test items to confirm.'); return; }
    
    setLoading(true);
    setError(null);
    try {
      const finalItems = items.map((it) => ({
        labRequestItemId: it.id,
        description: it.testName,
        unitPrice: Number(it.estimatedPrice) || 0,
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
          <h3 className="font-bold text-slate-900">Confirm Lab Request</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          A bill will be raised for the patient based on standard test prices. They must pay before the sample is processed.
        </p>
        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
        <div className="space-y-2.5 mb-4">
          {(req.items || []).map((it, i) => (
            <div key={it.id || i} className="flex items-center justify-between">
              <span className="text-sm text-slate-700">{it.testName}</span>
              <span className="text-sm font-semibold text-slate-900">₹{Number(it.estimatedPrice || 0).toLocaleString('en-IN')}</span>
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

function UploadReportModal({ request, onClose, onSuccess }) {
  const [testStates, setTestStates] = useState({});
  const [loadingItemId, setLoadingItemId] = useState(null);
  const [error, setError] = useState(null);
  const [selectedItemId, setSelectedItemId] = useState(request.items?.[0]?.id || null);

  const getTestState = (id) => testStates[id] || { reportUrl: '', selectedFile: null, summary: '' };
  
  const updateTestState = (id, field, value) => {
    setTestStates(prev => ({
      ...prev,
      [id]: { ...getTestState(id), [field]: value }
    }));
  };

  const handleSubmit = async (itemId) => {
    const state = getTestState(itemId);
    if (!state.reportUrl.trim() && !state.selectedFile) { setError('Report URL or File is required.'); return; }
    
    setLoadingItemId(itemId);
    setError(null);
    try {
      let finalUrl = state.reportUrl.trim();
      
      if (state.selectedFile) {
        const uploadRes = await uploadService.uploadFile(state.selectedFile);
        finalUrl = `http://localhost:5000${uploadRes.url}`;
      }

      await labFulfillmentService.uploadLabReport(request.id, {
        reportFileUrl: finalUrl,
        resultSummary: state.summary.trim() || undefined,
        labRequestItemId: itemId,
      });
      
      if (!request.reports) request.reports = [];
      request.reports.push({ labRequestItemId: itemId, reportFileUrl: finalUrl });
      
      const coveredIds = new Set(request.reports.map(r => r.labRequestItemId).filter(Boolean));
      const allDone = coveredIds.size >= (request.items?.length || 1);
      
      onSuccess?.(allDone);
      
      if (!allDone) {
        setSelectedItemId(null);
      }
    } catch (err) {
      setError(err.message || 'Upload failed.');
    } finally {
      setLoadingItemId(null);
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
        <p className="text-xs text-slate-500 mb-4">Select a specific test to upload its report. The request will automatically complete when all tests are uploaded.</p>
        {error && !selectedItemId && <p className="text-xs text-red-500 mb-3">{error}</p>}
        
        <div className="space-y-3 mb-5 max-h-[65vh] overflow-y-auto pr-1">
          {request.items?.map(it => {
            const hasReport = request.reports?.some(r => r.labRequestItemId === it.id);
            const isExpanded = selectedItemId === it.id;
            return (
              <div key={it.id} className={`border rounded-2xl overflow-hidden transition-all ${isExpanded ? 'border-cyan-300 ring-4 ring-cyan-50' : 'border-slate-200'}`}>
                <button 
                  onClick={() => {
                    if (!hasReport) {
                      setSelectedItemId(isExpanded ? null : it.id);
                      setError(null);
                    }
                  }}
                  disabled={hasReport}
                  className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between transition-colors ${hasReport ? 'bg-slate-50 opacity-60' : isExpanded ? 'bg-cyan-50' : 'bg-white hover:bg-slate-50'}`}
                >
                  <span className="font-semibold text-slate-800">{it.testName}</span>
                  {hasReport ? <span className="text-xs text-emerald-600 font-bold flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Uploaded</span> : <span className="text-xs text-slate-400 font-medium">Pending</span>}
                </button>
                
                {isExpanded && !hasReport && (
                  <div className="p-4 bg-white border-t border-slate-100">
                    {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
                    <div className="space-y-4">
                      <div className="p-4 border border-dashed border-slate-300 rounded-xl bg-slate-50 flex flex-col items-center justify-center text-center">
                        <UploadCloud className="w-6 h-6 text-slate-400 mb-2" />
                        <label className="block text-xs font-semibold text-slate-600 mb-2">Upload Local File</label>
                        <input 
                          type="file" 
                          onChange={(e) => updateTestState(it.id, 'selectedFile', e.target.files[0])}
                          className="w-full max-w-[250px] text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100"
                        />
                      </div>

                      <div className="relative flex items-center py-1">
                        <div className="flex-grow border-t border-slate-200"></div>
                        <span className="flex-shrink-0 mx-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider">Or provide link</span>
                        <div className="flex-grow border-t border-slate-200"></div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">External Report Link</label>
                        <input value={getTestState(it.id).reportUrl} onChange={(e) => updateTestState(it.id, 'reportUrl', e.target.value)}
                          disabled={!!getTestState(it.id).selectedFile}
                          placeholder="https://drive.google.com/..."
                          className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-300 disabled:opacity-50" />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Result Summary (Optional)</label>
                        <textarea rows={2} value={getTestState(it.id).summary} onChange={(e) => updateTestState(it.id, 'summary', e.target.value)}
                          placeholder="Key findings..."
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-300 resize-none" />
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        <button onClick={() => setSelectedItemId(null)} className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors">Cancel</button>
                        <button onClick={() => handleSubmit(it.id)} disabled={!!loadingItemId}
                          className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
                          {loadingItemId === it.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          {loadingItemId === it.id ? 'Uploading…' : 'Upload Report'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
        
        <div className="pt-2 border-t border-slate-100">
          <button onClick={onClose} className="w-full py-2.5 text-slate-500 hover:bg-slate-50 rounded-xl text-sm font-semibold transition-colors">Close Modal</button>
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
      case 'pending': return { label: 'Confirm Lab Request', style: 'bg-cyan-600 hover:bg-cyan-700 text-white', kind: 'confirm' };
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

      {/* Completed or partially completed: show the uploaded report links. */}
      {req.reports?.length > 0 && (
        <div className="space-y-2 mt-3">
          {req.reports.map(r => {
            const testName = req.items?.find(it => it.id === r.labRequestItemId)?.testName || req.items?.[0]?.testName || 'Report';
            return (
              <a key={r.id} href={r.reportFileUrl} target="_blank" rel="noopener noreferrer"
                className="text-xs text-cyan-700 hover:text-cyan-900 bg-cyan-50 border border-cyan-100 rounded-xl px-3 py-2 flex items-center gap-1.5 w-full">
                <ExternalLink className="w-3.5 h-3.5" /> View {testName} Report
              </a>
            );
          })}
        </div>
      )}

      {action && (
        <button
          onClick={() => {
            if (action.kind === 'confirm') onConfirm(req);
            else if (action.kind === 'upload') onUpload(req);
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
          onUpload={(reqObj) => setUploadTarget(reqObj)}
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
          request={uploadTarget}
          onClose={() => setUploadTarget(null)}
          onSuccess={(allDone = true) => { 
            showSuccess('Report uploaded!'); 
            fetchRequests(); 
            if (allDone) setUploadTarget(null); 
          }}
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
