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
  { id: 'NEW', icon: Clock, label: 'New Orders', shortLabel: 'New' },
  { id: 'PREPARING', icon: Package, label: 'Preparing', shortLabel: 'Preparing' },
  { id: 'READY', icon: CheckCircle2, label: 'Ready', shortLabel: 'Ready' },
  { id: 'COMPLETED', icon: CreditCard, label: 'Completed', shortLabel: 'Done' },
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
  NEW: 'PREPARING',
  PREPARING: 'READY',
  READY: 'COMPLETED',
};

const ACTION_LABEL = {
  NEW: 'Start Preparing',
  PREPARING: 'Mark as Ready',
  READY: 'Mark Completed',
};

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
          className="w-full py-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
        >
          {loading === order.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
          {ACTION_LABEL[order.status]}
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
    </div>
  );
}

export default function PharmacyDashboard() {
  const [activeItem, setActiveItem] = useState('NEW');

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
