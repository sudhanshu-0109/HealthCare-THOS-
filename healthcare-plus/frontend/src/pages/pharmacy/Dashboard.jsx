/**
 * pages/pharmacy/Dashboard.jsx — Pharmacy Staff Dashboard with real backend integration.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Pill, Clock, CheckCircle2, Loader2, AlertCircle, RefreshCw,
  Package, CreditCard, X, Activity
} from 'lucide-react';
import DashboardShell from '../../components/layout/DashboardShell';
import * as pharmacyOrdersService from '../../services/pharmacyOrders.service';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';

const NAV_ITEMS = [
  { id: 'PENDING', icon: Clock, label: 'New Orders', shortLabel: 'New' },
  { id: 'PREPARING', icon: Package, label: 'Paid / Handover', shortLabel: 'Paid' },
  { id: 'COMPLETED', icon: CheckCircle2, label: 'Completed', shortLabel: 'Done' },
];

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

const NEXT_STATUS = {
  PENDING: null,
  PREPARING: 'COMPLETED',
};

const ACTION_LABEL = {
  PREPARING: 'Mark Handed Over',
};

function parseQuantity(frequency, durationDays) {
  let f = 1;
  const s = (frequency || '').toLowerCase();
  if (s.includes('-')) {
    f = s.split('-').reduce((sum, val) => sum + parseInt(val || 0), 0);
  } else if (s.includes('/day') || s.includes(' a day')) {
    f = parseInt(s) || 1;
  } else if (s.includes('twice')) {
    f = 2;
  } else if (s.includes('thrice')) {
    f = 3;
  } else {
    f = parseInt(s) || 1;
  }
  return f * (durationDays || 1);
}

// ── Calculate Bill Modal ────────────────────────────────────────────────────────
function CalculateBillModal({ order, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pricing, setPricing] = useState({});

  const handlePricingChange = (itemId, field, val) => {
    setPricing(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: val }
    }));
  };

  const calculateFinalPrice = (it) => {
    const p = pricing[it.prescriptionItemId] || {};
    const qty = parseQuantity(it.prescriptionItem?.frequency, it.prescriptionItem?.durationDays);
    const mrp = Number(p.mrp) || 0;
    const units = Number(p.units) || 1;
    const unitPrice = mrp / units;
    return unitPrice * qty;
  };

  const total = (order.items || []).reduce((sum, it) => sum + calculateFinalPrice(it), 0);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const finalItems = (order.items || []).map((it) => {
        const p = pricing[it.prescriptionItemId] || {};
        const qty = parseQuantity(it.prescriptionItem?.frequency, it.prescriptionItem?.durationDays);
        const mrp = Number(p.mrp) || 0;
        const units = Number(p.units) || 1;
        return {
          prescriptionItemId: it.prescriptionItemId,
          medicineId: null,
          medicineName: it.medicineName || it.prescriptionItem?.medicineName || `Medicine`,
          quantity: qty,
          unitPrice: mrp / units,
        };
      });
      await pharmacyOrdersService.confirmPharmacyOrder(order.id, finalItems);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Billing failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900">Calculate & Send Bill</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <p className="text-xs text-slate-500 mb-4">Calculate required quantity based on frequency and duration. Enter Pack MRP and Units to auto-calculate the final bill.</p>
        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
        
        <div className="space-y-4 mb-5 max-h-96 overflow-y-auto pr-2">
          {(order.items || []).map((it, i) => {
            const qty = parseQuantity(it.prescriptionItem?.frequency, it.prescriptionItem?.durationDays);
            const p = pricing[it.prescriptionItemId] || {};
            const finalP = calculateFinalPrice(it);

            return (
              <div key={it.id || i} className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-700">{it.medicineName || it.prescriptionItem?.medicineName || `Item ${i+1}`}</span>
                  <span className="text-xs bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded-full">
                    {it.prescriptionItem?.frequency} × {it.prescriptionItem?.durationDays} Days = {qty} Req.
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Pack MRP (₹)</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-300"
                      value={p.mrp || ''}
                      onChange={(e) => handlePricingChange(it.prescriptionItemId, 'mrp', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Units per Pack</label>
                    <input
                      type="number"
                      min="1"
                      className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-300"
                      value={p.units || ''}
                      onChange={(e) => handlePricingChange(it.prescriptionItemId, 'units', e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col justify-end">
                    <span className="text-xs font-semibold text-slate-500 text-right">Final: ₹{finalP.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-between items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-5">
          <span className="text-sm font-bold text-slate-600">Total Bill</span>
          <span className="text-xl font-black text-slate-900">₹{total.toFixed(2)}</span>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold">Cancel</button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {loading ? 'Sending…' : 'Send Bill to Patient'}
          </button>
        </div>
      </div>
    </div>
  );
}

function OrderCard({ order, onAdvance, loading }) {
  const patientName = order.patient?.fullName || 'Patient';
  const nextStatus = NEXT_STATUS[order.status];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 text-sm">{patientName}</p>
          {order.createdAt && (
            <p className="text-xs text-slate-400">
              {new Date(order.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Medicine items */}
      {order.items?.length > 0 && (
        <div className="space-y-1 mb-3">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-xs text-slate-600">
              <span>{item.medicineName || item.medicine?.name}</span>
              <span className="text-slate-400">×{item.quantity}</span>
            </div>
          ))}
        </div>
      )}

      {order.totalAmount && (
        <p className="text-xs font-bold text-cyan-700 mb-3">Total: ₹{Number(order.totalAmount)}</p>
      )}

      {nextStatus && (
        <button
          onClick={() => onAdvance(order.id, nextStatus)}
          disabled={loading === order.id}
          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
        >
          {loading === order.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
          {ACTION_LABEL[order.status]}
        </button>
      )}
      {!nextStatus && order.status === 'PENDING' && (
        <button
          onClick={() => onAdvance(order.id, 'BILL')}
          disabled={loading === order.id}
          className="w-full py-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
        >
          <CreditCard className="w-3 h-3" />
          Calculate & Send Bill
        </button>
      )}
    </div>
  );
}

function OrdersTab({ status }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [billingOrder, setBillingOrder] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await pharmacyOrdersService.getHospitalOrders({ status });
      setOrders(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load orders.');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const showSuccess = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(null), 3000); };

  const handleAdvance = async (orderId, newStatus) => {
    if (newStatus === 'BILL') {
      setBillingOrder(orders.find(o => o.id === orderId));
      return;
    }
    setActionLoading(orderId);
    try {
      await pharmacyOrdersService.advancePharmacyOrderStatus(orderId, newStatus);
      showSuccess(`Order moved to ${newStatus.replace('_', ' ')}`);
      await fetchOrders();
    } catch (err) {
      setError(err.message || 'Failed to update order.');
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
        <p className="text-xs text-slate-500">{orders.length} order{orders.length !== 1 ? 's' : ''}</p>
        <button onClick={fetchOrders} className="text-xs text-cyan-600 hover:text-cyan-800 flex items-center gap-1">
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>
      {loading && <LoadingCard />}
      {!loading && error && <ErrorCard message={error} onRetry={fetchOrders} />}
      {!loading && !error && orders.length === 0 && (
        <EmptyState icon={Pill} title={`No ${status.toLowerCase()} orders`} description="Nothing here yet." />
      )}
      {!loading && !error && orders.map((order) => (
        <OrderCard key={order.id} order={order} onAdvance={handleAdvance} loading={actionLoading} />
      ))}
      {billingOrder && (
        <CalculateBillModal
          order={billingOrder}
          onClose={() => setBillingOrder(null)}
          onSuccess={() => { showSuccess('Bill sent to patient successfully!'); fetchOrders(); }}
        />
      )}
    </div>
  );
}

export default function PharmacyDashboard() {
  const [activeItem, setActiveItem] = useState('PENDING');

  return (
    <DashboardShell
      navItems={NAV_ITEMS}
      activeItem={activeItem}
      setActiveItem={setActiveItem}
      roleLabel="Pharmacist"
      roleColor="bg-gradient-to-r from-orange-500 to-amber-500 text-white"
    >
      <OrdersTab status={activeItem} key={activeItem} />
    </DashboardShell>
  );
}
