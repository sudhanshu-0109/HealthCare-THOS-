import React, { useState, useEffect } from 'react';
import { CreditCard, Search, Filter, RefreshCw, AlertCircle } from 'lucide-react';
import BillCard from '../../components/billing/BillCard';
import ReceiptView from '../../components/billing/ReceiptView';
import RazorpayCheckout from '../../components/booking/RazorpayCheckout';
import * as billingService from '../../services/billing.service';

export default function PatientBillingPage() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [activeReceiptId, setActiveReceiptId] = useState(null);
  const [checkoutData, setCheckoutData] = useState(null);

  const fetchBills = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await billingService.getMyBills({
        status: filterStatus || undefined,
        sourceType: filterType || undefined,
      });
      const bData = res.data?.bills || res.data || res.bills || [];
      setBills(Array.isArray(bData) ? bData : bData.bills || []);
    } catch (err) {
      setError(err.message || 'Failed to load billing history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, [filterStatus, filterType]);

  const handlePayNow = (bill) => {
    // Format checkout data for RazorpayCheckout component
    setCheckoutData({
      billId: bill.id,
      amount: bill.total,
      razorpayOrderId: bill.payments?.[0]?.razorpayOrderId,
      keyId: import.meta.env.VITE_RAZORPAY_KEY_ID || null,
      appointmentId: bill.sourceId,
    });
  };

  const handlePaymentSuccess = () => {
    setCheckoutData(null);
    fetchBills();
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-cyan-600" /> Billing & Payments
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            View unified financial history for appointments, pharmacy orders, and lab reports
          </p>
        </div>
        <button
          onClick={fetchBills}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition-colors self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <Filter className="w-4 h-4" /> Filters:
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 text-sm rounded-lg text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-cyan-500 w-full sm:w-auto"
        >
          <option value="">All Payment Statuses</option>
          <option value="PAID">Paid</option>
          <option value="UNPAID">Unpaid</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 text-sm rounded-lg text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-cyan-500 w-full sm:w-auto"
        >
          <option value="">All Services</option>
          <option value="APPOINTMENT">Appointments</option>
          <option value="PHARMACY_ORDER">Pharmacy</option>
          <option value="LAB_REQUEST">Lab Reports</option>
        </select>
      </div>

      {/* Content State */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200">
          Loading bills...
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700 flex items-center gap-3">
          <AlertCircle className="w-6 h-6 shrink-0" />
          <span>{error}</span>
        </div>
      ) : bills.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
          <CreditCard className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-semibold text-slate-800">No Bills Found</h3>
          <p className="text-sm text-slate-500">You don't have any billing records matching the selected filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bills.map((bill) => (
            <BillCard
              key={bill.id}
              bill={bill}
              onViewReceipt={(id) => setActiveReceiptId(id)}
              onPayNow={handlePayNow}
            />
          ))}
        </div>
      )}

      {/* Receipt Modal */}
      {activeReceiptId && (
        <ReceiptView
          billId={activeReceiptId}
          onClose={() => setActiveReceiptId(null)}
        />
      )}

      {/* Checkout Modal */}
      {checkoutData && (
        <RazorpayCheckout
          billId={checkoutData.billId}
          appointmentId={checkoutData.appointmentId}
          amount={checkoutData.amount}
          razorpayOrderId={checkoutData.razorpayOrderId}
          keyId={checkoutData.keyId}
          onSuccess={handlePaymentSuccess}
          onCancel={() => setCheckoutData(null)}
        />
      )}

    </div>
  );
}
