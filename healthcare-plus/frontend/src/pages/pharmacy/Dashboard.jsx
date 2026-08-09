import { useState, useEffect } from 'react';
import {
  Pill, Clock, CheckCircle2, PackageCheck, AlertCircle, Search,
  Activity, Bell, Loader2, Check
} from 'lucide-react';
import DashboardShell from '../../components/layout/DashboardShell';
import * as pharmacyService from '../../services/pharmacyOrders.service';

const NAV_ITEMS = [
  { id: 'pending', icon: Clock, label: 'Pending Orders', shortLabel: 'Pending' },
  { id: 'preparing', icon: Activity, label: 'Preparing', shortLabel: 'Preparing' },
  { id: 'ready', icon: PackageCheck, label: 'Ready for Pickup', shortLabel: 'Ready' },
  { id: 'completed', icon: CheckCircle2, label: 'Completed', shortLabel: 'Done' },
];

export default function PharmacyDashboard() {
  const [activeTab, setActiveTab] = useState('pending');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await pharmacyService.getHospitalOrders();
      setOrders(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load hospital pharmacy orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleAdvanceStatus = async (orderId, nextStatus) => {
    try {
      setActionLoading(orderId);
      await pharmacyService.advancePharmacyOrderStatus(orderId, nextStatus);
      await fetchOrders();
    } catch (err) {
      alert(err.message || 'Failed to update order status');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      !search ||
      o.id?.toLowerCase().includes(search.toLowerCase()) ||
      o.patient?.fullName?.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'pending') return o.status === 'PENDING';
    if (activeTab === 'preparing') return o.status === 'CONFIRMED' || o.status === 'PREPARING' || o.status === 'PACKED';
    if (activeTab === 'ready') return o.status === 'READY';
    if (activeTab === 'completed') return o.status === 'COMPLETED';
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'CONFIRMED':
      case 'PREPARING':
      case 'PACKED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'READY':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'COMPLETED':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <DashboardShell
      navItems={NAV_ITEMS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      title="Pharmacy Management"
      subtitle="Fulfill prescriptions, verify stock, and dispense medications"
    >
      <div className="p-4 sm:p-6 pb-24 lg:pb-6 space-y-6">
        {/* Header bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Pill className="w-6 h-6 text-orange-600" /> Dispensing & Pharmacy Orders
            </h1>
            <p className="text-sm text-slate-500 mt-1">Live queue of prescriptions submitted for fulfillment</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search patient or order ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
          </div>
        </div>

        {/* Content list */}
        {loading ? (
          <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200 flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
            <span>Loading pharmacy orders...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700 flex items-center gap-3">
            <AlertCircle className="w-6 h-6 shrink-0" />
            <span>{error}</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200">
            No orders found in this status category.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((o) => (
              <div key={o.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-orange-200 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-slate-900">{o.patient?.fullName || 'Patient'}</span>
                      <span className="text-xs text-slate-400">Order #{o.id.substring(0, 8)}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadge(o.status)}`}>
                        {o.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Prescribed by Dr. {o.prescription?.consultation?.doctor?.user?.fullName || 'Attending Physician'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {o.status === 'PENDING' && (
                      <button
                        onClick={() => handleAdvanceStatus(o.id, 'PREPARING')}
                        disabled={actionLoading === o.id}
                        className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                      >
                        {actionLoading === o.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        Start Preparing
                      </button>
                    )}
                    {(o.status === 'CONFIRMED' || o.status === 'PREPARING' || o.status === 'PACKED') && (
                      <button
                        onClick={() => handleAdvanceStatus(o.id, 'READY')}
                        disabled={actionLoading === o.id}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                      >
                        {actionLoading === o.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PackageCheck className="w-3.5 h-3.5" />}
                        Mark Ready for Pickup
                      </button>
                    )}
                    {o.status === 'READY' && (
                      <button
                        onClick={() => handleAdvanceStatus(o.id, 'COMPLETED')}
                        disabled={actionLoading === o.id}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                      >
                        {actionLoading === o.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        Complete & Dispense
                      </button>
                    )}
                  </div>
                </div>

                {/* Prescription items */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Prescribed Items:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {o.items?.map((item) => (
                      <div key={item.id} className="p-2.5 bg-slate-50 rounded-xl text-xs flex justify-between items-center border border-slate-100">
                        <span className="font-semibold text-slate-800">{item.prescriptionItem?.medicineName || 'Medicine'}</span>
                        <span className="text-slate-500">{item.prescriptionItem?.dosage} · {item.prescriptionItem?.frequency}</span>
                      </div>
                    )) || <span className="text-xs text-slate-400">No item breakdown available</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
