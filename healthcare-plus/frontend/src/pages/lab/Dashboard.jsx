import { useState, useEffect } from 'react';
import {
  FlaskConical, Clock, CheckCircle2, Upload, AlertCircle, Search,
  Activity, Bell, Loader2, FileText, Check
} from 'lucide-react';
import DashboardShell from '../../components/layout/DashboardShell';
import * as labService from '../../services/labFulfillment.service';

const NAV_ITEMS = [
  { id: 'pending', icon: Clock, label: 'Pending Requests', shortLabel: 'Pending' },
  { id: 'processing', icon: Activity, label: 'In Processing', shortLabel: 'Processing' },
  { id: 'completed', icon: CheckCircle2, label: 'Completed', shortLabel: 'Done' },
  { id: 'upload', icon: Upload, label: 'Upload Report', shortLabel: 'Upload' },
];

export default function LabDashboard() {
  const [activeItem, setActiveItem] = useState('pending');
  const [labRequests, setLabRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  // Form state for upload tab
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [resultSummary, setResultSummary] = useState('');
  const [reportFileUrl, setReportFileUrl] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await labService.getHospitalLabRequests();
      setLabRequests(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load hospital lab requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleConfirmRequest = async (requestId) => {
    try {
      setActionLoading(requestId);
      await labService.confirmLabRequest(requestId);
      await fetchRequests();
    } catch (err) {
      alert(err.message || 'Failed to confirm lab request.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUploadReport = async (e) => {
    e.preventDefault();
    if (!selectedRequestId || !reportFileUrl) {
      alert('Please enter Request ID and Report File URL.');
      return;
    }
    try {
      setActionLoading(selectedRequestId);
      await labService.uploadLabReport(selectedRequestId, {
        reportFileUrl,
        resultSummary,
      });
      setUploadSuccess(true);
      setReportFileUrl('');
      setResultSummary('');
      setSelectedRequestId('');
      await fetchRequests();
      setTimeout(() => setUploadSuccess(false), 4000);
    } catch (err) {
      alert(err.message || 'Failed to upload report.');
    } finally {
      setActionLoading(null);
    }
  };

  const pendingRequests = labRequests.filter(
    (r) => r.status === 'PENDING'
  );
  const processingRequests = labRequests.filter(
    (r) => r.status === 'CONFIRMED' || r.status === 'SAMPLE_COLLECTED' || r.status === 'PROCESSING'
  );
  const completedRequests = labRequests.filter(
    (r) => r.status === 'COMPLETED'
  );

  const filterBySearch = (list) =>
    list.filter(
      (r) =>
        !search ||
        r.id?.toLowerCase().includes(search.toLowerCase()) ||
        r.patient?.fullName?.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <DashboardShell
      navItems={NAV_ITEMS}
      activeItem={activeItem}
      setActiveItem={setActiveItem}
      roleLabel="Lab Technician"
      roleColor="bg-violet-50 text-violet-700"
    >
      <div className="p-4 sm:p-6 pb-24 lg:pb-6 space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <FlaskConical className="w-6 h-6 text-violet-600" /> Laboratory Order Fulfillment
            </h1>
            <p className="text-sm text-slate-500 mt-1">Collect samples, run diagnostics, and publish reports</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search patient or request ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            />
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200 flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
            <span>Loading lab requests...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700 flex items-center gap-3">
            <AlertCircle className="w-6 h-6 shrink-0" />
            <span>{error}</span>
          </div>
        ) : (
          <>
            {/* Pending Requests Tab */}
            {activeItem === 'pending' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-slate-900">Pending Requests ({pendingRequests.length})</h2>
                </div>
                {filterBySearch(pendingRequests).length === 0 ? (
                  <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200">
                    No pending lab requests awaiting processing.
                  </div>
                ) : (
                  filterBySearch(pendingRequests).map((r) => (
                    <div key={r.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-violet-200 transition-all">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-slate-900">{r.patient?.fullName || 'Patient'}</span>
                            <span className="text-xs text-slate-400">#{r.id.substring(0, 8)}</span>
                            {r.priority === 'URGENT' && (
                              <span className="px-2 py-0.5 bg-red-50 text-red-600 text-xs rounded-full font-semibold border border-red-200">
                                URGENT
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            Ordered by Dr. {r.consultation?.doctor?.user?.fullName || 'Attending Doctor'}
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {r.items?.map((item) => (
                              <span key={item.id} className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium">
                                {item.testName}
                              </span>
                            ))}
                          </div>
                        </div>
                        <button
                          onClick={() => handleConfirmRequest(r.id)}
                          disabled={actionLoading === r.id}
                          className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0"
                        >
                          {actionLoading === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          Confirm & Sample
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Processing Tab */}
            {activeItem === 'processing' && (
              <div className="space-y-4">
                <h2 className="font-bold text-slate-900">In Processing ({processingRequests.length})</h2>
                {filterBySearch(processingRequests).length === 0 ? (
                  <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200">
                    No lab requests currently in analysis stage.
                  </div>
                ) : (
                  filterBySearch(processingRequests).map((r) => (
                    <div key={r.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="font-semibold text-slate-900 text-sm">{r.patient?.fullName || 'Patient'}</div>
                          <div className="text-xs text-slate-500">#{r.id.substring(0, 8)}</div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedRequestId(r.id);
                            setActiveItem('upload');
                          }}
                          className="px-3 py-1.5 bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100 rounded-xl text-xs font-semibold transition-colors"
                        >
                          Upload Report
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {r.items?.map((item) => (
                          <span key={item.id} className="px-2.5 py-1 bg-violet-50 text-violet-700 rounded-lg text-xs font-medium border border-violet-100">
                            {item.testName}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Completed Tab */}
            {activeItem === 'completed' && (
              <div className="space-y-4">
                <h2 className="font-bold text-slate-900">Completed Reports ({completedRequests.length})</h2>
                {filterBySearch(completedRequests).length === 0 ? (
                  <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200">
                    No completed lab reports available.
                  </div>
                ) : (
                  filterBySearch(completedRequests).map((r) => (
                    <div key={r.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 text-sm">{r.patient?.fullName || 'Patient'}</div>
                          <div className="text-xs text-slate-500">
                            #{r.id.substring(0, 8)} • {r.reports?.length || 0} Report(s) attached
                          </div>
                        </div>
                      </div>
                      {r.reports?.[0]?.reportFileUrl && (
                        <a
                          href={r.reports[0].reportFileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" /> View PDF
                        </a>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Upload Tab */}
            {activeItem === 'upload' && (
              <div className="max-w-2xl mx-auto space-y-4">
                <h2 className="font-bold text-slate-900">Upload Test Results</h2>
                {uploadSuccess && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Lab report published successfully! Patient & Doctor notified.</span>
                  </div>
                )}
                <form onSubmit={handleUploadReport} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Target Lab Request ID</label>
                    <input
                      type="text"
                      placeholder="e.g. uuid of lab request"
                      value={selectedRequestId}
                      onChange={(e) => setSelectedRequestId(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Report PDF File URL</label>
                    <input
                      type="url"
                      placeholder="https://storage.example.com/reports/lab-report-123.pdf"
                      value={reportFileUrl}
                      onChange={(e) => setReportFileUrl(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Diagnostic Result Summary</label>
                    <textarea
                      rows={3}
                      placeholder="Enter key findings, normal ranges, and clinical observations..."
                      value={resultSummary}
                      onChange={(e) => setResultSummary(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={actionLoading === selectedRequestId}
                    className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    {actionLoading === selectedRequestId ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Upload className="w-4 h-4" /> Publish Report & Trigger Notification
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardShell>
  );
}
