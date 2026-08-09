/**
 * components/passport/PassportSummaryCard.jsx — Mini summary for the dashboard.
 */

import { FileText, ChevronRight, Activity, Shield, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PassportSummaryCard({ summary }) {
  if (!summary || !summary.hasPassport) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm text-center space-y-3">
        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
          <FileText className="w-6 h-6 text-slate-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Healthcare Passport</h3>
          <p className="text-xs text-slate-500 mt-1">Create your unified health record for better care</p>
        </div>
        <Link
          to="/patient/passport"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          Setup Passport <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
          <FileText className="w-4 h-4 text-cyan-500" /> Healthcare Passport
        </h3>
        <Link to="/patient/passport" className="text-xs font-semibold text-cyan-600 hover:text-cyan-700 flex items-center">
          View Full <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-slate-50 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            <span className="text-xs font-medium text-slate-500">Allergies</span>
          </div>
          <p className="font-bold text-slate-900">{summary.allergyCount}</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Activity className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-medium text-slate-500">Conditions</span>
          </div>
          <p className="font-bold text-slate-900">{summary.conditionCount}</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-xs font-medium text-slate-500">Consents</span>
          </div>
          <p className="font-bold text-slate-900 text-xs">Manage Access</p>
        </div>
      </div>
    </div>
  );
}
