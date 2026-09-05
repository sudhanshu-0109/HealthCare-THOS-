/**
 * pages/patient/HospitalWorkspace.jsx — Full hospital workspace with all tabs
 * Doctors, Appointments, Pharmacy, Laboratory, Billing, Queue
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Users, Calendar, Pill, FlaskConical, Receipt, ArrowLeft,
  Search, Star, Clock, ChevronRight, Loader2, MapPin, Navigation,
  CheckCircle2, Package, Eye, Download, Building2, CreditCard,
  Activity, AlertCircle, X, ChevronDown, Stethoscope
} from 'lucide-react';
import api from '../../services/api';
import * as appointmentsService from '../../services/appointments.service';
import * as pharmacyOrdersService from '../../services/pharmacyOrders.service';
import * as labFulfillmentService from '../../services/labFulfillment.service';
import * as billingService from '../../services/billing.service';
import { openHospitalDirections } from '../../utils/navigation';
import DoctorBooking from './DoctorBooking';
import StatusBadge from '../../components/common/StatusBadge';
import PaymentModal from '../../components/common/PaymentModal';
import EmptyState from '../../components/common/EmptyState';

// Mock data removed — all data comes from the real backend API.

// Extract the Razorpay order id to pay from a real Bill's payment records.
// Staff pre-create the Bill + Razorpay order at confirm time; the patient pays
// that existing order (paying again would duplicate the bill).
const payableOrderId = (bill) => {
  if (!bill?.payments?.length) return null;
  const created = bill.payments.find((p) => p.status === 'CREATED');
  return (created || bill.payments[0]).razorpayOrderId;
};

const NAV = [
  { id: 'doctors', label: 'Doctors', icon: Users },
  { id: 'appointments', label: 'Appointments', icon: Calendar },
  { id: 'queue', label: 'My Queue', icon: Activity },
  { id: 'pharmacy', label: 'Pharmacy', icon: Pill },
  { id: 'lab', label: 'Laboratory', icon: FlaskConical },
  { id: 'billing', label: 'Billing', icon: CreditCard },
];

// ── Doctors Tab ────────────────────────────────────────────────────────────────

function DoctorsTab({ hospitalId, onBook }) {
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('all');
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api.get(`/departments?hospitalId=${hospitalId}`),
      api.get(`/doctors?hospitalId=${hospitalId}`),
    ]).then(([dRes, docRes]) => {
      if (dRes.status === 'fulfilled') setDepartments(dRes.value.data || []);
      if (docRes.status === 'fulfilled') setDoctors(docRes.value.data?.doctors || docRes.value.data || []);
    }).finally(() => setLoading(false));
  }, [hospitalId]);

  const filtered = doctors.filter((d) => {
    const matchDept = selectedDept === 'all' || d.department?.name === selectedDept;
    const matchSearch = !search || d.user?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      d.specialization?.toLowerCase().includes(search.toLowerCase());
    return matchDept && matchSearch;
  });

  return (
    <div className="p-4 sm:p-6">
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text" placeholder="Search doctors, specializations…"
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:border-cyan-400 transition-all"
          value={search} onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {departments.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          <button onClick={() => setSelectedDept('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex-shrink-0 ${selectedDept === 'all' ? 'bg-cyan-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
            All Departments
          </button>
          {departments.map((d) => (
            <button key={d.id} onClick={() => setSelectedDept(d.name)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex-shrink-0 ${selectedDept === d.name ? 'bg-cyan-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
              {d.name}
            </button>
          ))}
        </div>
      )}
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-cyan-500" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title="No doctors found" description="Try adjusting your search or department filter." />
      ) : (
        <div className="space-y-3">
          {filtered.map((doc) => (
            <div key={doc.id} className="bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-md transition-all">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-100 to-teal-100 rounded-xl flex items-center justify-center text-cyan-700 font-bold text-lg flex-shrink-0">
                  {doc.user?.fullName?.charAt(0) || 'D'}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900">{doc.user?.fullName}</h3>
                  <p className="text-xs text-slate-500">{doc.specialization} • {doc.department?.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span className="text-xs font-semibold text-slate-700">{doc.rating || '4.8'}</span>
                    </div>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-400">{doc.experienceYears} yrs exp</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-slate-900">₹{doc.consultationFee}</p>
                  <p className="text-xs text-slate-400">per visit</p>
                </div>
              </div>
              {doc.bio && <p className="text-xs text-slate-500 mb-3 line-clamp-2">{doc.bio}</p>}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <Clock className="w-3 h-3" /> {doc.availability || 'Mon–Fri, 9AM–5PM'}
                </div>
                <button
                  onClick={() => onBook(doc)}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1"
                >
                  Book Appointment <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Appointments Tab ──────────────────────────────────────────────────────────

function AppointmentsTab({ hospitalId, hospitalName }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  const fetchAppointments = () => {
    setLoading(true);
    appointmentsService.getMyAppointments({ limit: 100 })
      .then((res) => {
        const all = res.data?.appointments || [];
        // Filter by hospital if possible (support multiple schema mappings: a.hospitalId, a.doctor?.hospital?.id, a.doctor?.hospitalId)
        const filteredByHospital = hospitalId
          ? all.filter((a) => a.hospitalId === hospitalId || a.doctor?.hospital?.id === hospitalId || a.doctor?.hospitalId === hospitalId)
          : all;
        setAppointments(filteredByHospital);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAppointments();
  }, [hospitalId]);

  const filtered = appointments.filter((a) => filter === 'all' || a.status === filter);

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-slate-900">My Appointments{hospitalName ? ` at ${hospitalName}` : ''}</h2>
        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
          {filtered.length} appointment{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {['all', 'CONFIRMED', 'PENDING_PAYMENT', 'COMPLETED', 'CANCELLED'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${filter === f ? 'bg-cyan-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            {f === 'all' ? 'All' : f === 'PENDING_PAYMENT' ? 'Pending Payment' : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-cyan-500" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Calendar} title="No appointments found" description="When you book an appointment with a doctor at this hospital, it will appear here." />
      ) : (
        <div className="space-y-3">
          {filtered.map((apt) => {
            const isOnline = apt.consultationType === 'ONLINE';
            const isConfirmed = apt.status === 'CONFIRMED';
            const isPending = apt.status === 'PENDING_PAYMENT';

            return (
              <div key={apt.id} className="bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-2.5">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${isOnline ? 'bg-violet-50 text-violet-700 border border-violet-100' : 'bg-cyan-50 text-cyan-700 border border-cyan-100'}`}>
                      {apt.doctor?.user?.fullName?.charAt(0) || 'D'}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">
                        {apt.doctor?.user?.fullName ? `Dr. ${apt.doctor.user.fullName}` : (apt.doctor?.name ? `Dr. ${apt.doctor.name}` : 'Doctor')}
                      </p>
                      <p className="text-xs text-slate-500">
                        {apt.doctor?.specialization || apt.doctor?.department?.name || 'General Physician'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StatusBadge status={apt.status} />
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${isOnline ? 'bg-violet-50 text-violet-700' : 'bg-slate-100 text-slate-600'}`}>
                      {isOnline ? '🎥 Online' : '🏥 In-Person'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 pt-2 border-t border-slate-50">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 font-medium text-slate-700">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {apt.scheduledDate ? new Date(apt.scheduledDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                    </span>
                    <span className="flex items-center gap-1 font-medium text-slate-700">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {apt.scheduledTime}
                    </span>
                    {apt.queueToken && (
                      <span className="bg-cyan-50 text-cyan-700 border border-cyan-100 px-2 py-0.5 rounded-lg font-mono font-bold">
                        T-{apt.queueToken.tokenNumber}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {isConfirmed && !isOnline && (
                      <button
                        onClick={() => navigate(`/appointments/${apt.id}/queue`)}
                        className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Activity className="w-3.5 h-3.5" />
                        <span>Live Queue</span>
                      </button>
                    )}
                    {isConfirmed && isOnline && (
                      <button
                        onClick={() => navigate(`/patient/waiting-room/${apt.id}`)}
                        className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Waiting Room</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Queue Tab ─────────────────────────────────────────────────────────────────

function QueueTab({ hospitalId }) {
  const [appts, setAppts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    appointmentsService.getMyAppointments({ status: 'CONFIRMED', limit: 10 })
      .then((res) => {
        const all = res.data?.appointments || [];
        const filtered = hospitalId
          ? all.filter((a) => a.hospitalId === hospitalId || a.doctor?.hospital?.id === hospitalId || a.doctor?.hospitalId === hospitalId)
          : all;
        setAppts(filtered.length > 0 ? filtered : all);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [hospitalId]);

  const activeAppt = appts.find((a) => a.status === 'CONFIRMED');

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-cyan-500" /></div>;

  if (!activeAppt) {
    return (
      <div className="p-4 sm:p-6">
        <EmptyState icon={Activity} title="No active queue" description="Book an appointment to join the queue." />
      </div>
    );
  }

  const token = activeAppt.queueToken;
  const ahead = token ? Math.max(0, token.tokenNumber - (token.currentServing || 0)) : 0;
  const estimatedWait = ahead * 7;
  const statusLabel = ahead === 0 ? 'your-turn' : ahead <= 2 ? 'almost' : 'waiting';

  return (
    <div className="p-4 sm:p-6">
      <h2 className="font-bold text-slate-900 mb-4">Live Queue</h2>
      <div className={`rounded-2xl p-6 text-center mb-4 ${statusLabel === 'your-turn' ? 'bg-emerald-50 border-2 border-emerald-400' : statusLabel === 'almost' ? 'bg-amber-50 border-2 border-amber-300' : 'bg-slate-50 border border-slate-200'}`}>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Your Token</p>
        <div className={`text-6xl font-black mb-3 ${statusLabel === 'your-turn' ? 'text-emerald-600' : statusLabel === 'almost' ? 'text-amber-600' : 'text-slate-700'}`}>
          T-{token?.tokenNumber || '—'}
        </div>
        {statusLabel === 'your-turn' ? (
          <div className="bg-emerald-100 rounded-xl p-3">
            <p className="font-bold text-emerald-700 text-lg">🎉 Your Turn!</p>
            <p className="text-sm text-emerald-600">Please proceed to the doctor's chamber.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="bg-white rounded-xl p-3">
                <p className="text-xs text-slate-500">Now Serving</p>
                <p className="font-bold text-slate-900">T-{token?.currentServing || '—'}</p>
              </div>
              <div className="bg-white rounded-xl p-3">
                <p className="text-xs text-slate-500">Ahead of you</p>
                <p className="font-bold text-slate-900">{ahead}</p>
              </div>
              <div className="bg-white rounded-xl p-3">
                <p className="text-xs text-slate-500">Est. Wait</p>
                <p className="font-bold text-slate-900">{estimatedWait} min</p>
              </div>
            </div>
            {statusLabel === 'almost' && (
              <div className="bg-amber-100 rounded-xl p-3">
                <p className="font-semibold text-amber-700">⚡ Almost your turn!</p>
                <p className="text-sm text-amber-600">Please stay nearby and be ready.</p>
              </div>
            )}
          </>
        )}
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 p-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Appointment Details</p>
        <p className="font-semibold text-slate-900 text-sm">
          {activeAppt.doctor?.user?.fullName ? `Dr. ${activeAppt.doctor.user.fullName}` : 'Doctor'}
        </p>
        <p className="text-xs text-slate-400">{activeAppt.doctor?.specialization}</p>
        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1.5">
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{activeAppt.scheduledDate ? new Date(activeAppt.scheduledDate).toLocaleDateString('en-IN') : ''}</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{activeAppt.scheduledTime}</span>
        </div>
      </div>
    </div>
  );
}

// ── Pharmacy Tab ───────────────────────────────────────────────────────────────

function PharmacyTab() {
  const [orders, setOrders] = useState([]);
  const [billBySource, setBillBySource] = useState({});
  const [loading, setLoading] = useState(true);
  const [payModal, setPayModal] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const fetchAll = () => {
    setLoading(true);
    Promise.allSettled([
      pharmacyOrdersService.getMyOrders(),
      billingService.getMyBills({ sourceType: 'PHARMACY_ORDER', limit: 100 }),
    ]).then(([ordRes, billRes]) => {
      if (ordRes.status === 'fulfilled') {
        const data = ordRes.value.data;
        setOrders(data?.orders || data || []);
      }
      if (billRes.status === 'fulfilled') {
        const bills = billRes.value.data?.bills || [];
        const map = {};
        bills.forEach((b) => { map[b.sourceId] = b; });
        setBillBySource(map);
      }
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  // Real PharmacyOrderStatus lifecycle after the pharmacist confirms + patient pays.
  const STATUS_STEPS = ['CONFIRMED', 'PREPARING', 'PACKED', 'READY', 'COMPLETED'];
  const STEP_LABELS = ['Confirmed', 'Preparing', 'Packed', 'Ready', 'Collected'];
  const getStepIndex = (status) => STATUS_STEPS.indexOf(status);

  return (
    <div className="p-4 sm:p-6">
      <h2 className="font-bold text-slate-900 mb-4">Pharmacy Orders</h2>
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-cyan-500" /></div>
      ) : orders.length === 0 ? (
        <EmptyState icon={Pill} title="No pharmacy orders" description="Orders from your doctor's prescriptions will appear here." />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const stepIdx = getStepIndex(order.status);
            const bill = billBySource[order.id];
            return (
              <div key={order.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <button
                  onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
                >
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">Order from {order.prescription?.consultation?.doctor?.user?.fullName ? `Dr. ${order.prescription.consultation.doctor.user.fullName}` : 'Doctor'}</p>
                    <p className="text-xs text-slate-400">{order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN') : ''} • {(order.items || order.medicines || []).length} item(s)</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={order.status} />
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expanded === order.id ? 'rotate-180' : ''}`} />
                  </div>
                </button>
                {expanded === order.id && (
                  <div className="border-t border-slate-100 p-4">
                    {/* Progress Steps */}
                    <div className="flex items-center mb-4">
                      {STATUS_STEPS.map((step, i) => (
                        <div key={step} className="flex items-center flex-1 last:flex-none">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold transition-colors ${
                            i <= stepIdx ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-400'
                          }`}>
                            {i < stepIdx ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                          </div>
                          {i < STATUS_STEPS.length - 1 && (
                            <div className={`flex-1 h-0.5 mx-1 ${i < stepIdx ? 'bg-cyan-600' : 'bg-slate-100'}`} />
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-xs text-slate-400 mb-4">
                      {STEP_LABELS.map((l) => <span key={l}>{l}</span>)}
                    </div>

                    {/* Medicine list */}
                    <div className="space-y-2 mb-4">
                      {(order.items || order.medicines || []).map((m, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="text-slate-700">{m.medicine?.name || m.medicineName || m.name || 'Medicine'} × {m.quantity}</span>
                          <span className="font-medium text-slate-900">₹{Number(m.subtotal || m.totalPrice || (m.unitPrice ? m.unitPrice * (m.quantity || 1) : 0) || 0).toLocaleString('en-IN')}</span>
                        </div>
                      ))}
                      <div className="border-t border-slate-100 pt-2 flex justify-between font-bold">
                        <span>Total</span>
                        <span>₹{Number(bill?.total ?? order.totalAmount ?? 0).toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    {order.status === 'PENDING' && (
                      <div className="flex items-center justify-center gap-2 py-2 text-slate-400 text-sm">
                        <Clock className="w-4 h-4" /> Awaiting pharmacy confirmation
                      </div>
                    )}
                    {bill?.status === 'UNPAID' && (
                      <button
                        onClick={() => setPayModal({ bill })}
                        className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-semibold transition-colors"
                      >
                        Pay ₹{Number(bill.total).toLocaleString('en-IN')}
                      </button>
                    )}
                    {bill?.status === 'PAID' && (
                      <div className="flex items-center justify-center gap-2 py-2 text-emerald-600 text-sm font-medium">
                        <CheckCircle2 className="w-4 h-4" /> Payment Confirmed
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <PaymentModal
        open={!!payModal}
        billId={payModal?.bill?.id}
        razorpayOrderId={payableOrderId(payModal?.bill)}
        amount={payModal?.bill?.total}
        description="Pharmacy Order"
        onSuccess={() => { setPayModal(null); fetchAll(); }}
        onCancel={() => setPayModal(null)}
      />
    </div>
  );
}

// ── Laboratory Tab ─────────────────────────────────────────────────────────────

function LabTab() {
  const [requests, setRequests] = useState([]);
  const [billBySource, setBillBySource] = useState({});
  const [loading, setLoading] = useState(true);
  const [payModal, setPayModal] = useState(null);

  const fetchAll = () => {
    setLoading(true);
    Promise.allSettled([
      labFulfillmentService.getMyLabResults(),
      billingService.getMyBills({ sourceType: 'LAB_REQUEST', limit: 100 }),
    ]).then(([reqRes, billRes]) => {
      if (reqRes.status === 'fulfilled') {
        const data = reqRes.value.data;
        setRequests(data?.labRequests || data || []);
      }
      if (billRes.status === 'fulfilled') {
        const bills = billRes.value.data?.bills || [];
        const map = {};
        bills.forEach((b) => { map[b.sourceId] = b; });
        setBillBySource(map);
      }
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const reportOf = (req) => (req.reports && req.reports[0]) || null;

  return (
    <div className="p-4 sm:p-6">
      <h2 className="font-bold text-slate-900 mb-4">Lab Tests</h2>
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-cyan-500" /></div>
      ) : requests.length === 0 ? (
        <EmptyState icon={FlaskConical} title="No lab tests" description="Lab test requests from your doctor will appear here." />
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const bill = billBySource[req.id];
            const report = reportOf(req);
            const firstItem = req.items?.[0];
            return (
              <div key={req.id} className="bg-white rounded-2xl border border-slate-100 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{firstItem?.testName || req.testName || 'Lab Test'}</p>
                    <p className="text-xs text-slate-400">{req.doctor?.user?.fullName ? `Dr. ${req.doctor.user.fullName}` : ''} • {req.createdAt ? new Date(req.createdAt).toLocaleDateString('en-IN') : req.date}</p>
                  </div>
                  <StatusBadge status={req.status} />
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-slate-700">₹{Number(bill?.total ?? firstItem?.estimatedPrice ?? 0).toLocaleString('en-IN')}</span>
                  {bill && <StatusBadge status={bill.status} size="xs" />}
                </div>

                {report?.resultSummary && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 mb-3">
                    <p className="text-xs font-semibold text-emerald-700 mb-0.5">Result</p>
                    <p className="text-xs text-emerald-600">{report.resultSummary}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  {bill?.status === 'UNPAID' && (
                    <button
                      onClick={() => setPayModal({ bill })}
                      className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-semibold transition-colors"
                    >
                      Pay ₹{Number(bill.total).toLocaleString('en-IN')}
                    </button>
                  )}
                  {req.status === 'PROCESSING' && (
                    <div className="flex-1 flex items-center justify-center gap-2 py-2 text-xs text-amber-600 bg-amber-50 rounded-xl">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Testing in progress…
                    </div>
                  )}
                  {report?.reportFileUrl && (
                    <>
                      <button
                        onClick={() => window.open(report.reportFileUrl, '_blank', 'noopener')}
                        className="flex-1 py-2 bg-violet-50 hover:bg-violet-100 text-violet-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Report
                      </button>
                      <a
                        href={report.reportFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" /> Download
                      </a>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <PaymentModal
        open={!!payModal}
        billId={payModal?.bill?.id}
        razorpayOrderId={payableOrderId(payModal?.bill)}
        amount={payModal?.bill?.total}
        description={payModal?.description}
        onSuccess={() => { setPayModal(null); fetchAll(); }}
        onCancel={() => setPayModal(null)}
      />
    </div>
  );
}

// ── Billing Tab ────────────────────────────────────────────────────────────────

function BillingTab() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payModal, setPayModal] = useState(null);

  const fetchBills = () => {
    setLoading(true);
    billingService.getMyBills({ limit: 100 })
      .then((res) => setBills(res.data?.bills || res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBills(); }, []);

  const total = bills.reduce((s, b) => s + Number(b.total || b.totalAmount || b.amount || 0), 0);
  const pending = bills.filter((b) => b.status === 'PENDING' || b.status === 'UNPAID').reduce((s, b) => s + Number(b.total || b.totalAmount || b.amount || 0), 0);

  const labelFor = (sourceType) => ({
    APPOINTMENT: 'Consultation',
    PHARMACY_ORDER: 'Pharmacy Order',
    LAB_REQUEST: 'Lab Test',
  }[sourceType] || sourceType || 'Bill');

  return (
    <div className="p-4 sm:p-6">
      <h2 className="font-bold text-slate-900 mb-4">Billing</h2>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-emerald-50 rounded-2xl p-3 border border-emerald-100">
          <p className="text-xs text-emerald-600 mb-1">Total Paid</p>
          <p className="text-lg font-bold text-emerald-700">₹{(total - pending).toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-amber-50 rounded-2xl p-3 border border-amber-100">
          <p className="text-xs text-amber-600 mb-1">Pending</p>
          <p className="text-lg font-bold text-amber-700">₹{pending.toLocaleString('en-IN')}</p>
        </div>
      </div>
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-cyan-500" /></div>
      ) : bills.length === 0 ? (
        <EmptyState icon={CreditCard} title="No bills yet" description="Your bills will appear here." />
      ) : (
        <div className="space-y-3">
          {bills.map((b) => (
            <div key={b.id} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="font-semibold text-slate-900 text-sm">{labelFor(b.sourceType)}</p>
                <p className="text-xs text-slate-400">{b.createdAt ? new Date(b.createdAt).toLocaleDateString('en-IN') : b.date}</p>
                <p className="font-bold text-slate-900 mt-1">₹{Number(b.total || b.totalAmount || b.amount || 0).toLocaleString('en-IN')}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <StatusBadge status={b.status} />
                {(b.status === 'PENDING' || b.status === 'UNPAID') && (
                  <button onClick={() => setPayModal(b)}
                    className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-semibold transition-colors">
                    Pay Now
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <PaymentModal
        open={!!payModal}
        billId={payModal?.id}
        razorpayOrderId={payableOrderId(payModal)}
        amount={payModal?.total}
        description={payModal ? labelFor(payModal.sourceType) : undefined}
        onSuccess={() => { setPayModal(null); fetchBills(); }}
        onCancel={() => setPayModal(null)}
      />
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function HospitalWorkspace() {
  const { hospitalId } = useParams();
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState('doctors');
  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    api.get(`/hospitals/${hospitalId}`)
      .then((res) => setHospital(res.data || null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [hospitalId]);

  if (selectedDoctor) {
    return (
      <DoctorBooking
        doctor={selectedDoctor}
        hospital={hospital}
        onBack={() => {
          setSelectedDoctor(null);
          setActiveNav('appointments');
        }}
      />
    );
  }

  const renderTab = () => {
    switch (activeNav) {
      case 'doctors': return <DoctorsTab hospitalId={hospitalId} onBook={setSelectedDoctor} />;
      case 'appointments': return <AppointmentsTab hospitalId={hospitalId} hospitalName={hospital?.name} />;
      case 'queue': return <QueueTab hospitalId={hospitalId} />;
      case 'pharmacy': return <PharmacyTab />;
      case 'lab': return <LabTab />;
      case 'billing': return <BillingTab />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 flex items-center gap-3 px-4 h-14 sticky top-0 z-20">
        <button onClick={() => navigate('/patient/dashboard')} className="text-slate-400 hover:text-slate-700 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="h-4 bg-slate-100 rounded w-32 animate-pulse" />
          ) : (
            <>
              <h1 className="font-bold text-slate-900 text-sm truncate">{hospital?.name}</h1>
              {hospital?.address && <p className="text-xs text-slate-400 truncate flex items-center gap-1"><MapPin className="w-3 h-3" />{hospital.address}</p>}
            </>
          )}
        </div>
        {hospital && (
          <button
            onClick={() => openHospitalDirections(hospital)}
            title="Get Directions"
            className="ml-1 flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium rounded-lg transition-colors flex-shrink-0"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Directions</span>
          </button>
        )}
      </header>

      {/* Desktop Nav */}
      <div className="hidden sm:flex border-b border-slate-100 bg-white overflow-x-auto">
        {NAV.map((n) => {
          const Icon = n.icon;
          return (
            <button key={n.id} onClick={() => setActiveNav(n.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeNav === n.id ? 'border-cyan-600 text-cyan-700' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}>
              <Icon className="w-4 h-4" /> {n.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-20 sm:pb-6">
        {renderTab()}
      </div>

      {/* Mobile Nav */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-100 flex z-20">
        {NAV.map((n) => {
          const Icon = n.icon;
          return (
            <button key={n.id} onClick={() => setActiveNav(n.id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-xs transition-colors ${
                activeNav === n.id ? 'text-cyan-600' : 'text-slate-400'
              }`}>
              <Icon className="w-5 h-5" />
              <span className="text-xs">{n.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
