import React, { useState, useEffect } from 'react';
import { ShieldCheck, Filter, RefreshCw, FileText } from 'lucide-react';
import * as auditLogService from '../../services/auditLog.service';

export default function AdminAuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await auditLogService.getAuditLog({ action: actionFilter || undefined });
      setLogs(res.data.logs || []);
    } catch (err) {
      setError(err.message || 'Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-cyan-600" /> Administrative Audit Log
          </h1>
          <p className="text-sm text-slate-500 mt-1">Immutable security log of all hospital staff & configuration mutations</p>
        </div>

        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <Filter className="w-4 h-4" /> Filter Action:
        </div>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 text-sm rounded-lg text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
        >
          <option value="">All Administrative Actions</option>
          <option value="STAFF_INVITED">Staff Invited</option>
          <option value="DOCTOR_ADDED">Doctor Added</option>
          <option value="QUEUE_OVERRIDDEN">Queue Overridden</option>
          <option value="DEPARTMENT_CHANGED">Department Changed</option>
          <option value="AVAILABILITY_CHANGED">Availability Changed</option>
          <option value="APPOINTMENT_CANCELLED_BY_ADMIN">Appointment Cancelled by Admin</option>
        </select>
      </div>

      {/* Audit Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Actor</th>
                <th className="p-4">Action</th>
                <th className="p-4">Target Type</th>
                <th className="p-4">Target ID</th>
                <th className="p-4">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 font-sans">Loading audit trail...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 font-sans">No audit records found.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="p-4 font-sans font-semibold text-slate-900">{log.actor?.fullName || 'Staff User'}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold border border-slate-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600 font-sans">{log.targetType}</td>
                    <td className="p-4 text-slate-400">{log.targetId?.slice(0, 8) || '—'}</td>
                    <td className="p-4 text-slate-500 max-w-xs truncate">{JSON.stringify(log.metadata)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
