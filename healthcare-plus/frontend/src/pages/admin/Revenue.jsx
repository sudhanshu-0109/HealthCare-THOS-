import React, { useState, useEffect } from 'react';
import { DollarSign, Calendar, TrendingUp, RefreshCw, AlertCircle } from 'lucide-react';
import RevenueBreakdownChart from '../../components/billing/RevenueBreakdownChart';
import * as billingService from '../../services/billing.service';

export default function AdminRevenuePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('all');

  const fetchRevenue = async () => {
    try {
      setLoading(true);
      setError(null);

      let from = null;
      if (dateRange === 'today') {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        from = d.toISOString();
      } else if (dateRange === 'week') {
        const d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        from = d.toISOString();
      } else if (dateRange === 'month') {
        const d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        from = d.toISOString();
      }

      const res = await billingService.getRevenue({ from });
      setData(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load revenue data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenue();
  }, [dateRange]);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-7 h-7 text-emerald-600" /> Revenue & Financial Analytics
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time financial performance and revenue stream breakdowns
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 text-sm font-medium text-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>

          <button
            onClick={fetchRevenue}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
            title="Refresh Revenue Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Breakdown Chart Component */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200">
          Loading revenue analytics...
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700 flex items-center gap-3">
          <AlertCircle className="w-6 h-6 shrink-0" />
          <span>{error}</span>
        </div>
      ) : data ? (
        <RevenueBreakdownChart breakdown={data.breakdown} total={data.total} />
      ) : null}

    </div>
  );
}
