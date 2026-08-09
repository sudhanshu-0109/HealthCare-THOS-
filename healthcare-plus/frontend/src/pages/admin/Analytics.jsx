import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Calendar, AlertCircle, RefreshCw } from 'lucide-react';
import MetricCard from '../../components/admin/MetricCard';
import AppointmentTrendChart from '../../components/admin/AppointmentTrendChart';
import DepartmentUsageChart from '../../components/admin/DepartmentUsageChart';
import DoctorActivityTable from '../../components/admin/DoctorActivityTable';
import * as analyticsService from '../../services/analytics.service';

export default function AdminAnalyticsPage() {
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [deptUsage, setDeptUsage] = useState([]);
  const [docActivity, setDocActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const [sumRes, trendRes, deptRes, docRes] = await Promise.all([
        analyticsService.getDashboardSummary(),
        analyticsService.getAppointmentTrends(),
        analyticsService.getDepartmentUsage(),
        analyticsService.getDoctorActivity(),
      ]);

      setSummary(sumRes.data);
      setTrends(trendRes.data || []);
      setDeptUsage(deptRes.data || []);
      setDocActivity(docRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-cyan-600" /> Executive Operational Analytics
          </h1>
          <p className="text-sm text-slate-500 mt-1">Cross-departmental performance metrics & capacity trends</p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Data
        </button>
      </div>

      {/* Metrics Row */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Appointments Today"
            value={summary.todayAppointments}
            icon={Calendar}
            color="bg-cyan-50 text-cyan-600"
          />
          <MetricCard
            label="Patients Seen Today"
            value={summary.distinctPatientsToday}
            icon={Users}
            color="bg-emerald-50 text-emerald-600"
          />
          <MetricCard
            label="Active Doctors"
            value={summary.activeDoctors}
            icon={TrendingUp}
            color="bg-purple-50 text-purple-600"
          />
          <MetricCard
            label="Waiting Tokens"
            value={summary.waitingTokenCount}
            icon={BarChart3}
            color="bg-amber-50 text-amber-600"
          />
        </div>
      )}

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AppointmentTrendChart data={trends} />
        <DepartmentUsageChart data={deptUsage} />
      </div>

      {/* Practitioner Table */}
      <DoctorActivityTable data={docActivity} />

    </div>
  );
}
