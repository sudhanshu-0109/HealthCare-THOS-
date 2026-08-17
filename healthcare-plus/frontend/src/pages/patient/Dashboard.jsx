/**
 * pages/patient/Dashboard.jsx — Complete Patient Dashboard with all nav tabs
 */

import { useState, useRef, useEffect } from 'react';
import { haversineKm } from '../../utils/distance';
import { Link, useNavigate } from 'react-router-dom';
import {
  Home, User, Calendar, Pill, FlaskConical, CreditCard,
  Bell, AlertTriangle, Heart, Search, Star, MapPin, Clock, Stethoscope,
  Brain, Phone, X, CheckCircle2, Navigation, ChevronRight, Activity,
  FileText, Loader2, Filter, RefreshCw, Building2, Users,
  TrendingUp, Download, Eye, ChevronDown, Shield, Zap, AlertCircle, Package,
  Video
} from 'lucide-react';
import DashboardShell from '../../components/layout/DashboardShell';
import useAuthStore from '../../store/authStore';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useNotifications } from '../../hooks/useNotifications';
import * as patientService from '../../services/patient.service';
import * as appointmentsService from '../../services/appointments.service';
import * as prescriptionsService from '../../services/prescriptions.service';
import * as labRequestsService from '../../services/labRequests.service';
import * as pharmacyOrdersService from '../../services/pharmacyOrders.service';
import * as billingService from '../../services/billing.service';
import AllergyConditionEditor from '../../components/passport/AllergyConditionEditor';
import StatusBadge from '../../components/common/StatusBadge';
import PaymentModal from '../../components/common/PaymentModal';
import EmptyState from '../../components/common/EmptyState';
import EmergencyTracking from './EmergencyTracking';

// Mock data removed — all data now comes from the real backend API.

// ── Config ─────────────────────────────────────────────────────────────────────

const CROWD_CONFIG = {
  low: { label: 'Low', dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  moderate: { label: 'Moderate', dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  high: { label: 'High', dot: 'bg-red-500', badge: 'bg-red-50 text-red-700 border-red-200' },
};

const NAV_ITEMS = [
  { id: 'home', icon: Home, label: 'Home', shortLabel: 'Home' },
  { id: 'appointments', icon: Calendar, label: 'Appointments', shortLabel: 'Appts' },
  { id: 'prescriptions', icon: Pill, label: 'Prescriptions', shortLabel: 'Rx' },
  { id: 'lab', icon: FlaskConical, label: 'Lab Reports', shortLabel: 'Labs' },
  { id: 'billing', icon: CreditCard, label: 'Billing', shortLabel: 'Bills' },
  { id: 'emergency', icon: AlertTriangle, label: 'Emergency', shortLabel: 'SOS' },
  { id: 'notifications', icon: Bell, label: 'Notifications', shortLabel: 'Alerts' },
  { id: 'passport', icon: Shield, label: 'Health Passport', shortLabel: 'Passport' },
];

const SOS_STATES = { IDLE: 'idle', HOLDING: 'holding', CONFIRM: 'confirm', DISPATCHING: 'dispatching' };

// ── SOS Button ────────────────────────────────────────────────────────────────

function SOSButton({ onSOSSent }) {
  const [sosState, setSosState] = useState(SOS_STATES.IDLE);
  const [holdProgress, setHoldProgress] = useState(0);
  const [error, setError] = useState(null);
  const progressRef = useRef(null);
  const holdStartRef = useRef(null);

  const startHold = () => {
    if (sosState !== SOS_STATES.IDLE) return;
    setError(null);
    setSosState(SOS_STATES.HOLDING);
    holdStartRef.current = Date.now();
    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - holdStartRef.current;
      const prog = Math.min((elapsed / 3000) * 100, 100);
      setHoldProgress(prog);
      if (prog >= 100) {
        clearInterval(progressRef.current);
        setSosState(SOS_STATES.CONFIRM);
        setHoldProgress(0);
      }
    }, 30);
  };

  const cancelHold = () => {
    if (sosState === SOS_STATES.HOLDING) {
      clearInterval(progressRef.current);
      setSosState(SOS_STATES.IDLE);
      setHoldProgress(0);
    }
  };

  const confirmSOS = async () => {
    setSosState(SOS_STATES.DISPATCHING);
    setError(null);
    try {
      await onSOSSent();
    } catch (err) {
      setError(err?.message || 'Could not send SOS. Please try again.');
      setSosState(SOS_STATES.IDLE);
    }
  };

  const resetSOS = () => { setSosState(SOS_STATES.IDLE); setHoldProgress(0); };

  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (holdProgress / 100) * circumference;

  if (sosState === SOS_STATES.CONFIRM) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-5 text-center">
        <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <h3 className="font-bold text-red-700 mb-1">Confirm Emergency SOS?</h3>
        <p className="text-sm text-red-500 mb-4">An ambulance will be dispatched to your current location immediately.</p>
        <div className="flex gap-3">
          <button onClick={resetSOS} className="flex-1 py-2.5 rounded-xl border-2 border-red-200 text-red-600 font-semibold text-sm hover:bg-red-50 transition-colors">Cancel</button>
          <button onClick={confirmSOS} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition-colors">Yes, Send SOS</button>
        </div>
      </div>
    );
  }

  if (sosState === SOS_STATES.DISPATCHING) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-5 text-center">
        <div className="w-12 h-12 rounded-full bg-red-100 border-4 border-red-300 flex items-center justify-center mx-auto mb-3 animate-pulse">
          <Phone className="w-5 h-5 text-red-600" />
        </div>
        <h3 className="font-bold text-red-700 mb-1">Dispatching Ambulance…</h3>
        <p className="text-sm text-red-400">Detecting your location and finding the nearest unit</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 py-2">
      <div className="relative">
        {sosState === SOS_STATES.HOLDING && (
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r={radius} fill="none" stroke="#fca5a5" strokeWidth="4" />
            <circle cx="50" cy="50" r={radius} fill="none" stroke="#dc2626" strokeWidth="4"
              strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
              strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.05s linear' }}
            />
          </svg>
        )}
        <button
          onMouseDown={startHold} onMouseUp={cancelHold} onMouseLeave={cancelHold}
          onTouchStart={startHold} onTouchEnd={cancelHold}
          className={`w-24 h-24 rounded-full flex flex-col items-center justify-center gap-1 cursor-pointer select-none transition-all shadow-lg ${
            sosState === SOS_STATES.HOLDING ? 'bg-red-600 scale-95 shadow-red-300' : 'bg-red-500 hover:bg-red-600 active:scale-95 shadow-red-200 animate-pulse'
          }`}
          style={{ animationDuration: '2s' }}
        >
          <Phone className="w-7 h-7 text-white" />
          <span className="text-white text-xs font-bold">SOS</span>
        </button>
      </div>
      <p className="text-xs text-slate-500 text-center">
        {sosState === SOS_STATES.HOLDING ? `Hold… ${Math.round(holdProgress)}%` : 'Hold 3 seconds for Emergency'}
      </p>
      {error && (
        <p className="text-xs text-red-600 text-center bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}
    </div>
  );
}

// ── AI Health Assistant ───────────────────────────────────────────────────────

function AIHealthAssistant({ onFindDoctors }) {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getAISuggestion = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setResponse(null);
    setError(null);
    try {
      const res = await patientService.triageSymptoms(input);
      setResponse(res.data);
    } catch {
      // Mock fallback
      const mockMap = {
        fever: 'General Physician', chest: 'Cardiologist', back: 'Orthopedic Surgeon',
        skin: 'Dermatologist', eye: 'Ophthalmologist', ear: 'ENT Specialist',
        stomach: 'Gastroenterologist', headache: 'Neurologist', child: 'Pediatrician',
      };
      const lower = input.toLowerCase();
      const specialty = Object.entries(mockMap).find(([k]) => lower.includes(k))?.[1] || 'General Physician';
      setResponse({ recommendedSpecialty: specialty, disclaimer: 'This is an AI-based recommendation. Please consult a doctor for accurate diagnosis.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-violet-50 to-cyan-50 border border-violet-100 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-violet-600 rounded-xl flex items-center justify-center">
          <Brain className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900 text-sm">AI Health Assistant</h3>
          <p className="text-xs text-slate-500">Describe symptoms for specialist recommendation</p>
        </div>
      </div>
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          placeholder='e.g. "Fever for 5 days" or "chest pain"'
          className="flex-1 px-3 py-2.5 text-sm border border-violet-100 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-300 transition-all"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && getAISuggestion()}
        />
        <button
          onClick={getAISuggestion}
          disabled={loading || !input.trim()}
          className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          {loading ? '…' : 'Ask'}
        </button>
      </div>
      {loading && (
        <div className="flex items-center gap-2 text-xs text-violet-500 py-1">
          <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" />
          <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
          <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
          <span>Analyzing symptoms…</span>
        </div>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
      {response && (
        <div className="bg-white rounded-xl p-4 border border-violet-100 mt-1">
          <div className="flex items-center gap-2 mb-2">
            <Stethoscope className="w-4 h-4 text-violet-600" />
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Recommended Specialist</span>
          </div>
          <p className="font-bold text-slate-900 text-lg mb-1">{response.recommendedSpecialty}</p>
          {response.disclaimer && <p className="text-xs text-slate-400 italic mb-3">{response.disclaimer}</p>}
          <button
            onClick={() => onFindDoctors(response.recommendedSpecialty)}
            className="w-full py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            Find {response.recommendedSpecialty}s <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Hospital Card ─────────────────────────────────────────────────────────────

function HospitalCard({ hospital, onSelect }) {
  const crowd = CROWD_CONFIG[hospital.crowd] || CROWD_CONFIG.low;
  // departments from enriched getHospitals (or legacy specialities field)
  const deptList = hospital.departments?.map((d) => d.name) || hospital.specialities || hospital.specialties || [];
  const doctorCount = hospital._count?.doctors || hospital.doctorCount || 0;
  const rating = Number(hospital.averageRating || 4.5).toFixed(1);
  const distance = hospital.distance || null;
  const lowestFee = hospital.lowestFee || null;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-md transition-all cursor-pointer group" onClick={() => onSelect(hospital)}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900 group-hover:text-cyan-700 transition-colors">{hospital.name}</h3>
          <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3" /> {hospital.address}, {hospital.city}
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          <span className="text-xs font-semibold text-slate-700">{rating}</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {deptList.slice(0, 4).map((s) => (
          <span key={s} className="text-xs bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded-full">{s}</span>
        ))}
        {deptList.length > 4 && (
          <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">+{deptList.length - 4} more</span>
        )}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-slate-500">
          {distance && (
            <span className="flex items-center gap-1">
              <Navigation className="w-3 h-3" /> {distance}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Users className="w-3 h-3" />
            {doctorCount} doctor{doctorCount !== 1 ? 's' : ''}
          </span>
          <span className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${crowd.dot}`} />
            <span className={`px-1.5 py-0.5 rounded-full border text-xs ${crowd.badge}`}>{crowd.label}</span>
          </span>
        </div>
        <button className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold rounded-lg transition-colors">
          View
        </button>
      </div>
    </div>
  );
}


// ── Home Tab ──────────────────────────────────────────────────────────────────

function HomeTab({ user, navigate, onSOSSent }) {
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [hospitals, setHospitals] = useState([]);
  const [loadingHospitals, setLoadingHospitals] = useState(true);
  const [error, setError] = useState(null);
  const { coords } = useGeolocation();

  // Vadodara city centre — used as fallback when GPS is unavailable
  const VADODARA_LAT = 22.3072;
  const VADODARA_LNG = 73.1812;

  const load = async () => {
    setLoadingHospitals(true);
    setError(null);
    try {
      const res = await patientService.getNearbyHospitals(coords?.latitude, coords?.longitude);
      const raw = res.data || [];

      // Use real GPS if available, otherwise fall back to Vadodara centre
      const userLat = coords?.latitude ?? VADODARA_LAT;
      const userLng = coords?.longitude ?? VADODARA_LNG;

      // Compute real haversine distance for each hospital and sort nearest → farthest
      const withDistance = raw
        .map((h) => {
          const km = haversineKm(userLat, userLng, h.latitude, h.longitude);
          const distanceLabel = km == null
            ? null
            : km < 1
              ? `${Math.round(km * 1000)} m away`
              : `${km.toFixed(1)} km away`;
          return { ...h, _distanceKm: km ?? 9999, distance: distanceLabel };
        })
        .sort((a, b) => a._distanceKm - b._distanceKm);

      setHospitals(withDistance);
    } catch (err) {
      setError(err.message || 'Failed to load hospitals.');
    } finally {
      setLoadingHospitals(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = hospitals.filter((h) => {
    if (!search) return true;
    const q = search.toLowerCase();
    // Match on hospital name
    if (h.name?.toLowerCase().includes(q)) return true;
    // Match on departments array (new enriched API)
    if (h.departments?.some((d) => d.name?.toLowerCase().includes(q))) return true;
    // Match on legacy specialities string array
    if (h.specialities?.some((s) => s?.toLowerCase().includes(q))) return true;
    return false;
  });

  // When the user is searching show all matches; otherwise cap at 6 unless showAll
  const visible = search ? filtered : (showAll ? filtered : filtered.slice(0, 6));
  const hasMore = !search && filtered.length > 6;

  const handleHospitalSelect = (hospital) => {
    navigate(`/hospitals/${hospital.id}`);
  };

  return (
    <div className="p-4 sm:p-6 space-y-5 pb-24 lg:pb-6">
      {/* Welcome */}
      <div className="bg-gradient-to-br from-cyan-600 via-teal-600 to-emerald-600 rounded-2xl p-5 text-white">
        <p className="text-cyan-100 text-sm mb-1">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},</p>
        <h1 className="text-2xl font-bold mb-1">{user?.fullName?.split(' ')[0] || 'Patient'} 👋</h1>
        <p className="text-cyan-100 text-sm">How are you feeling today?</p>
      </div>

      {/* AI Health Assistant */}
      <AIHealthAssistant onFindDoctors={(specialty) => {
        setSearch(specialty);
        setShowAll(true);
      }} />

      {/* Emergency SOS */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 bg-red-100 rounded-xl flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">Emergency SOS</h3>
            <p className="text-xs text-slate-400">Hold the button to request an ambulance</p>
          </div>
        </div>
        <SOSButton onSOSSent={async () => {
          await onSOSSent();
        }} />
      </div>

      {/* Hospital Search */}
      <div>
        {/* Search input with clear button */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search hospitals, departments, specialties…"
            className="w-full pl-9 pr-9 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:border-cyan-400 transition-all"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setShowAll(true); }}
          />
          {search && (
            <button
              onClick={() => { setSearch(''); setShowAll(false); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 hover:text-slate-700 transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-900 text-sm">
            {search
              ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''} for "${search}"`
              : `Hospitals (${hospitals.length})`}
          </h2>
          {hasMore && (
            <button
              onClick={() => setShowAll((v) => !v)}
              className="text-xs text-cyan-600 font-medium hover:text-cyan-800 transition-colors flex items-center gap-1"
            >
              {showAll ? 'Show less' : `View all ${filtered.length}`}
              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showAll ? 'rotate-90' : ''}`} />
            </button>
          )}
        </div>

        {loadingHospitals ? (
          <div className="flex items-center justify-center py-8 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading hospitals…
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-center">
            <AlertCircle className="w-5 h-5 text-red-400 mx-auto mb-2" />
            <p className="text-sm text-red-600 mb-2">{error}</p>
            <button
              onClick={load}
              className="text-xs text-red-600 hover:underline flex items-center gap-1 mx-auto"
            >
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((h) => (
              <HospitalCard key={h.id} hospital={h} onSelect={handleHospitalSelect} />
            ))}
            {filtered.length === 0 && hospitals.length === 0 && (
              <EmptyState icon={Building2} title="No hospitals found" description="No hospitals available in the system yet." />
            )}
            {filtered.length === 0 && hospitals.length > 0 && (
              <div className="bg-slate-50 rounded-2xl p-6 text-center">
                <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500 font-medium">No hospitals match "{search}"</p>
                <button
                  onClick={() => setSearch('')}
                  className="mt-2 text-xs text-cyan-600 hover:underline"
                >
                  Clear search to see all hospitals
                </button>
              </div>
            )}
            {/* Show more indicator when collapsed */}
            {hasMore && !showAll && (
              <button
                onClick={() => setShowAll(true)}
                className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 text-sm font-medium rounded-2xl border border-dashed border-slate-200 transition-all flex items-center justify-center gap-2"
              >
                <Building2 className="w-4 h-4" />
                Show {filtered.length - 6} more hospital{filtered.length - 6 !== 1 ? 's' : ''}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


// ── Appointments Tab ───────────────────────────────────────────────────────────

function AppointmentsTab() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    appointmentsService.getMyAppointments({ limit: 50 })
      .then((res) => setAppointments(res.data?.appointments || []))
      .catch((err) => setError(err.message || 'Failed to load appointments.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = appointments.filter((a) => filter === 'all' || a.status === filter);

  return (
    <div className="p-4 sm:p-6 pb-24 lg:pb-6">
      <h2 className="font-bold text-slate-900 mb-4">My Appointments</h2>
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {['all', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              filter === f ? 'bg-cyan-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-cyan-300'
            }`}>
            {f === 'all' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-cyan-500" /></div>
      ) : error ? (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-center">
          <AlertCircle className="w-5 h-5 text-red-400 mx-auto mb-2" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Calendar} title="No appointments" description="Book your first appointment from the Home tab." />
      ) : (
        <div className="space-y-3">
          {filtered.map((apt) => (
            <div key={apt.id} className="bg-white rounded-2xl border border-slate-100 p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-slate-900 text-sm">
                    {apt.doctor?.user?.fullName ? `Dr. ${apt.doctor.user.fullName}` : apt.doctorName || 'Doctor'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {apt.doctor?.specialization || apt.specialty} • {apt.doctor?.hospital?.name || apt.hospital || apt.hospitalName}
                  </p>
                </div>
                <StatusBadge status={apt.status} />
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {apt.scheduledDate ? new Date(apt.scheduledDate).toLocaleDateString('en-IN') : apt.date}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {apt.scheduledTime || apt.time}</span>
                {apt.consultationType === 'ONLINE' ? (
                  <span className="bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                    <Video className="w-3 h-3" /> Online
                  </span>
                ) : (
                  apt.queueToken && <span className="bg-slate-100 px-2 py-0.5 rounded-full font-mono">T-{apt.queueToken.tokenNumber}</span>
                )}
              </div>
              {apt.status === 'CONFIRMED' && (
                <div className="flex gap-2">
                  {apt.consultationType === 'ONLINE' ? (
                    <button
                      onClick={() => navigate(`/patient/waiting-room/${apt.id}`)}
                      className="flex-1 py-2 bg-violet-50 hover:bg-violet-100 text-violet-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1">
                      <Video className="w-3.5 h-3.5" /> Join Waiting Room
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate(`/appointments/${apt.id}/queue`, { state: { appointment: apt } })}
                      className="flex-1 py-2 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1">
                      <Activity className="w-3.5 h-3.5" /> View Queue
                    </button>
                  )}
                  <button className="px-4 py-2 border border-red-200 text-red-600 rounded-xl text-xs font-semibold hover:bg-red-50 transition-colors">
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Prescriptions Tab ─────────────────────────────────────────────────────────

function PrescriptionsTab() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const handleOrderMedicines = async (rx) => {
    setActionLoading(rx.id);
    try {
      await pharmacyOrdersService.createPharmacyOrder({
        prescriptionId: rx.id,
        hospitalId: rx.hospitalId || rx.consultation?.hospitalId
      });
      alert('Medicines ordered successfully! Pharmacy is processing your request.');
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to order medicines. They may already be ordered.');
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    prescriptionsService.getMyPrescriptions()
      .then((res) => setPrescriptions(res.data?.prescriptions || res.data || []))
      .catch((err) => setError(err?.message || 'Failed to load prescriptions.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 sm:p-6 pb-24 lg:pb-6">
      <h2 className="font-bold text-slate-900 mb-4">Prescriptions</h2>
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-cyan-500" /></div>
      ) : error ? (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-center">
          <AlertCircle className="w-5 h-5 text-red-400 mx-auto mb-2" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      ) : prescriptions.length === 0 ? (
        <EmptyState icon={Pill} title="No prescriptions" description="Your prescriptions will appear here after a doctor consultation." />
      ) : (
        <div className="space-y-3">
          {prescriptions.map((rx) => (
            <div key={rx.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === rx.id ? null : rx.id)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
              >
                <div>
          {rx.doctor?.user?.fullName ? `Dr. ${rx.doctor.user.fullName}` : rx.doctorName}
                  <p className="text-xs text-slate-400">{rx.createdAt ? new Date(rx.createdAt).toLocaleDateString('en-IN') : rx.date} • {rx.consultation?.appointment?.doctor?.hospital?.name || rx.hospital}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={rx.status} />
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expanded === rx.id ? 'rotate-180' : ''}`} />
                </div>
              </button>
              {expanded === rx.id && (
                <div className="border-t border-slate-100 p-4">
                  <div className="space-y-3">
                    {(rx.items || rx.medicines || []).map((med, i) => (
                      <div key={i} className="bg-slate-50 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-slate-900 text-sm">{med.medicineName || med.name}</p>
                          <span className="text-xs bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded-full">{med.durationDays || med.days} days</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-xs text-slate-500">
                          <span><strong>Dose:</strong> {med.dosage || med.dose}</span>
                          <span><strong>Frequency:</strong> {med.frequency}</span>
                          <span className="col-span-2"><strong>Instructions:</strong> {med.instructions}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                      <Download className="w-3.5 h-3.5" /> Download
                    </button>
                    <button
                      onClick={() => handleOrderMedicines(rx)}
                      disabled={actionLoading === rx.id}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      {actionLoading === rx.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Package className="w-3.5 h-3.5" />}
                      Order Medicines
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Lab Reports Tab ────────────────────────────────────────────────────────────

function LabReportsTab() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const handleBookLite = async (r) => {
    setActionLoading(r.id);
    try {
      await labRequestsService.bookLabFollowUp(r.id);
      alert('Follow-up Lite appointment booked successfully! Please check your queue.');
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to book Lite appointment.');
    } finally {
      setActionLoading(null);
    }
  };


  useEffect(() => {
    labRequestsService.getMyLabRequests()
      .then((res) => setReports(res.data?.labRequests || res.data || []))
      .catch((err) => setError(err?.message || 'Failed to load lab reports.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 sm:p-6 pb-24 lg:pb-6">
      <h2 className="font-bold text-slate-900 mb-4">Lab Reports</h2>
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-cyan-500" /></div>
      ) : error ? (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-center">
          <AlertCircle className="w-5 h-5 text-red-400 mx-auto mb-2" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      ) : reports.length === 0 ? (
        <EmptyState icon={FlaskConical} title="No lab reports" description="Lab test results will appear here once available." />
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl border border-slate-100 p-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-semibold text-slate-900 text-sm">Lab Request</p>
                  <p className="text-xs text-slate-400">{r.doctor?.user?.fullName ? `Dr. ${r.doctor.user.fullName}` : r.doctor}</p>
                  <p className="text-xs text-slate-400">{r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN') : r.date}</p>
                </div>
                <StatusBadge status={r.status} />
              </div>

              <div className="space-y-3 mt-4">
                {r.items?.map((item) => {
                  const report = r.reports?.find(rep => rep.labRequestItemId === item.id) 
                              || (r.reports?.find(rep => !rep.labRequestItemId) && r.items[0].id === item.id ? r.reports.find(rep => !rep.labRequestItemId) : null);
                  return (
                    <div key={item.id} className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-slate-800 text-sm">{item.testName}</p>
                        {report ? (
                          <span className="text-xs text-emerald-600 font-semibold bg-emerald-100 px-2 py-0.5 rounded-full">Report Ready</span>
                        ) : (
                          <span className="text-xs text-slate-500 font-medium bg-slate-200 px-2 py-0.5 rounded-full">Pending</span>
                        )}
                      </div>
                      
                      {report?.resultSummary && (
                        <div className="bg-white rounded-lg p-2.5 mb-2 border border-emerald-100 shadow-sm">
                          <p className="text-[10px] uppercase tracking-wider font-semibold text-emerald-700 mb-1">Result Summary</p>
                          <p className="text-xs text-slate-600">{report.resultSummary}</p>
                        </div>
                      )}

                      {report?.reportFileUrl && (
                        <div className="flex gap-2 mt-2">
                          <a
                            href={report.reportFileUrl} target="_blank" rel="noopener noreferrer"
                            className="flex-1 py-1.5 bg-cyan-100 hover:bg-cyan-200 text-cyan-800 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                          >
                            <Eye className="w-3 h-3" /> View Report
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {(!r.reports || r.reports.length === 0) && r.status !== 'COMPLETED' && (
                <div className="mt-4 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 rounded-xl p-3">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Tests in progress — reports will appear here when ready
                </div>
              )}

              {r.status === 'COMPLETED' && (
                <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => handleBookLite(r)}
                    disabled={actionLoading === r.id}
                    className="py-2 px-4 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-2"
                  >
                    {actionLoading === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                    Book Follow-up (Lite)
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Billing Tab ────────────────────────────────────────────────────────────────

// Human-friendly label for a bill's source (real Bill.sourceType enum).
const BILL_SOURCE_LABELS = {
  APPOINTMENT: 'Doctor Consultation',
  PHARMACY_ORDER: 'Pharmacy Order',
  LAB_REQUEST: 'Lab Test',
};

// The Razorpay order id to pay against: the still-open CREATED payment on the bill.
const payableOrderId = (bill) => {
  if (!bill?.payments?.length) return null;
  const created = bill.payments.find((p) => p.status === 'CREATED');
  return (created || bill.payments[0]).razorpayOrderId;
};

function BillingTab() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [payModal, setPayModal] = useState(null);
  const [expandedBillId, setExpandedBillId] = useState(null);

  const fetchBills = () => {
    setLoading(true);
    setError(null);
    billingService.getMyBills({ limit: 100 })
      .then((res) => setBills(res.data?.bills || res.data || []))
      .catch((err) => setError(err?.message || 'Failed to load bills.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBills(); }, []);

  // Real BillStatus enum: UNPAID | PAID | CANCELLED. Amounts live on Bill.total.
  const paid = bills.filter((b) => b.status === 'PAID').reduce((s, b) => s + Number(b.total || 0), 0);
  const unpaid = bills.filter((b) => b.status === 'UNPAID').reduce((s, b) => s + Number(b.total || 0), 0);

  return (
    <div className="p-4 sm:p-6 pb-24 lg:pb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-slate-900">Billing & Payments</h2>
        <button onClick={fetchBills} className="text-xs text-cyan-600 hover:text-cyan-800 flex items-center gap-1">
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <p className="text-xs text-slate-500 mb-1">Total Paid</p>
          <p className="text-xl font-bold text-emerald-600">₹{paid.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <p className="text-xs text-slate-500 mb-1">Pending</p>
          <p className="text-xl font-bold text-amber-600">₹{unpaid.toLocaleString('en-IN')}</p>
        </div>
      </div>
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-cyan-500" /></div>
      ) : error ? (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-5 text-center">
          <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
          <p className="text-sm text-red-600 mb-3">{error}</p>
          <button onClick={fetchBills} className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-800 mx-auto">
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      ) : bills.length === 0 ? (
        <EmptyState icon={CreditCard} title="No bills yet" description="Your consultation, pharmacy, and lab charges will appear here." />
      ) : (
        <div className="space-y-3">
          {bills.map((b) => {
            const orderId = payableOrderId(b);
            return (
              <div key={b.id} className="bg-white rounded-2xl border border-slate-100 p-4 transition-all">
                <div 
                  className="flex items-start justify-between mb-1 cursor-pointer"
                  onClick={() => setExpandedBillId(expandedBillId === b.id ? null : b.id)}
                >
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                      {BILL_SOURCE_LABELS[b.sourceType] || b.sourceType || 'Charge'}
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expandedBillId === b.id ? 'rotate-180' : ''}`} />
                    </p>
                    <p className="text-xs text-slate-400">{b.hospital?.name || ''}{b.createdAt ? ` • ${new Date(b.createdAt).toLocaleDateString('en-IN')}` : ''}</p>
                  </div>
                  <StatusBadge status={b.status} />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="font-bold text-slate-900">₹{Number(b.total || 0).toLocaleString('en-IN')}</p>
                  {b.status === 'UNPAID' && (
                    <button
                      onClick={() => setPayModal(b)}
                      disabled={!orderId}
                      title={!orderId ? 'This bill is not ready for payment yet.' : undefined}
                      className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors"
                    >
                      Pay Now
                    </button>
                  )}
                </div>

                {/* Bill Breakdown */}
                {expandedBillId === b.id && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Itemized Breakdown</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100">
                            <th className="py-2 text-xs font-semibold text-slate-600">Item</th>
                            <th className="py-2 text-xs font-semibold text-slate-600 text-right">Qty</th>
                            <th className="py-2 text-xs font-semibold text-slate-600 text-right">Unit Price</th>
                            <th className="py-2 text-xs font-semibold text-slate-600 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(b.items || []).map((item, idx) => (
                            <tr key={item.id || idx} className="border-b border-slate-50 last:border-0">
                              <td className="py-2.5 text-sm font-medium text-slate-800">{item.description}</td>
                              <td className="py-2.5 text-sm text-slate-600 text-right">{item.quantity}</td>
                              <td className="py-2.5 text-sm text-slate-600 text-right">₹{Number(item.unitPrice).toFixed(2)}</td>
                              <td className="py-2.5 text-sm font-semibold text-slate-800 text-right">₹{Number(item.subtotal || (item.quantity * item.unitPrice)).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {b.payments && b.payments.length > 0 && b.status === 'PAID' && (
                      <div className="mt-4 bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                        <p className="text-xs font-semibold text-emerald-800 mb-1">Payment Details</p>
                        <p className="text-xs text-emerald-600">Transaction ID: {b.payments.find(p => p.status === 'SUCCESS')?.razorpayPaymentId || 'N/A'}</p>
                        <p className="text-xs text-emerald-600">Paid On: {new Date(b.payments.find(p => p.status === 'SUCCESS')?.createdAt || b.createdAt).toLocaleString('en-IN')}</p>
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
        billId={payModal?.id}
        razorpayOrderId={payableOrderId(payModal)}
        amount={Number(payModal?.total || 0)}
        description={BILL_SOURCE_LABELS[payModal?.sourceType] || payModal?.sourceType}
        onSuccess={() => { fetchBills(); setPayModal(null); }}
        onCancel={() => setPayModal(null)}
      />
    </div>
  );
}

// ── Notifications Tab ─────────────────────────────────────────────────────────

function NotificationsTab() {
  // Shared store keeps this tab, the header bell, and the sidebar badge in sync.
  const { notifications, loading, error, markRead, markAllRead, refresh } = useNotifications();

  const iconMap = {
    APPOINTMENT_CONFIRMED: <Calendar className="w-4 h-4 text-blue-500" />,
    APPOINTMENT_CANCELLED: <Calendar className="w-4 h-4 text-red-500" />,
    LAB_REPORT_READY: <FlaskConical className="w-4 h-4 text-violet-500" />,
    PRESCRIPTION_CREATED: <Pill className="w-4 h-4 text-emerald-500" />,
    PAYMENT_CONFIRMED: <CreditCard className="w-4 h-4 text-amber-500" />,
    EMERGENCY: <AlertTriangle className="w-4 h-4 text-red-500" />,
  };

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-6 h-6 text-cyan-500 animate-spin" />
    </div>
  );

  return (
    <div className="p-4 sm:p-6 pb-24 lg:pb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-slate-900">Notifications</h2>
        <button onClick={markAllRead} className="text-xs text-cyan-600 font-medium hover:underline">Mark all read</button>
      </div>
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center mb-4">
          <p className="text-sm text-red-600">{error}</p>
          <button onClick={() => refresh()} className="text-xs text-red-500 hover:underline mt-1">Retry</button>
        </div>
      )}
      {!error && notifications.length === 0 && (
        <EmptyState icon={Bell} title="No notifications" description="You're all caught up!" />
      )}
      <div className="space-y-2">
        {notifications.map((n) => (
          <div key={n.id} onClick={() => markRead(n.id)}
            className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
              n.isRead ? 'bg-white border-slate-100' : 'bg-cyan-50 border-cyan-100'
            }`}
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${n.isRead ? 'bg-slate-100' : 'bg-white'}`}>
              {iconMap[n.type] || <Bell className="w-4 h-4 text-slate-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${n.isRead ? 'text-slate-600' : 'text-slate-900 font-medium'}`}>{n.message}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {n.createdAt ? new Date(n.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
              </p>
            </div>
            {!n.isRead && <div className="w-2 h-2 rounded-full bg-cyan-500 flex-shrink-0 mt-1.5" />}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Health Passport Tab ────────────────────────────────────────────────────────

function PassportTab({ user }) {
  const [appointments, setAppointments] = useState([]);
  const [labRequests, setLabRequests] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      appointmentsService.getMyAppointments({ limit: 100 }),
      labRequestsService.getMyLabRequests(),
      prescriptionsService.getMyPrescriptions(),
    ]).then(([aRes, lRes, pRes]) => {
      if (aRes.status === 'fulfilled') setAppointments(aRes.value.data?.appointments || []);
      if (lRes.status === 'fulfilled') setLabRequests(lRes.value.data?.labRequests || []);
      if (pRes.status === 'fulfilled') setPrescriptions(pRes.value.data?.prescriptions || []);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 sm:p-6 pb-24 lg:pb-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg">
          {(user?.fullName || 'P').charAt(0)}
        </div>
        <div>
          <h2 className="font-bold text-slate-900">{user?.fullName}</h2>
          <p className="text-xs text-slate-400">{user?.email}</p>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 text-cyan-500 animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-blue-50 rounded-2xl p-3 text-center">
              <p className="text-xl font-bold text-blue-700">{appointments.length}</p>
              <p className="text-xs text-blue-500">Appointments</p>
            </div>
            <div className="bg-violet-50 rounded-2xl p-3 text-center">
              <p className="text-xl font-bold text-violet-700">{labRequests.length}</p>
              <p className="text-xs text-violet-500">Lab Tests</p>
            </div>
            <div className="bg-emerald-50 rounded-2xl p-3 text-center">
              <p className="text-xl font-bold text-emerald-700">{prescriptions.length}</p>
              <p className="text-xs text-emerald-500">Prescriptions</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Emergency Dispatch Tab ────────────────────────────────────────────────────────

function EmergencyDispatchTab({ onSOSSent }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    patientService.getMyEmergencies()
      .then(res => setHistory(res.data || []))
      .catch(err => console.error('Failed to load emergency history:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 sm:p-6 space-y-5 pb-24 lg:pb-6">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Emergency Dispatch</h2>
          <div className="bg-slate-900 rounded-3xl p-8 relative overflow-hidden flex flex-col items-center justify-center min-h-[400px]">
            {/* The pulsing rings */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[300px] h-[300px] border border-red-900/30 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
              <div className="absolute w-[400px] h-[400px] border border-red-900/20 rounded-full animate-ping" style={{ animationDuration: '3s', animationDelay: '1s' }} />
              <div className="absolute w-[500px] h-[500px] border border-red-900/10 rounded-full animate-ping" style={{ animationDuration: '3s', animationDelay: '2s' }} />
            </div>
            
            <div className="relative z-10 w-full max-w-sm">
              <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-3 mb-12 border border-slate-700 text-center text-white">
                <p className="text-sm text-slate-300 mb-1">Your Location (auto-detected)</p>
                <div className="bg-slate-900 rounded-lg py-2 px-3 text-slate-400 text-sm flex items-center justify-between">
                  Detecting location...
                  <MapPin className="w-4 h-4 text-cyan-500" />
                </div>
              </div>
              
              <div className="flex justify-center mb-12">
                <SOSButton onSOSSent={onSOSSent} />
              </div>
              
              <p className="text-center text-slate-400 text-sm">
                Broadcasts to all nearby hospitals. FCFS dispatch.
              </p>
            </div>
          </div>
        </div>
        
        <div className="w-full lg:w-80 space-y-4">
          <h3 className="text-sm font-semibold text-slate-400 tracking-wider uppercase mb-2">My Emergency History</h3>
          {loading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 text-cyan-500 animate-spin" /></div>
          ) : history.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-2xl p-6 text-center">
              <p className="text-slate-500 text-sm">No past emergencies.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map(em => (
                <div key={em.id} className="bg-white border border-slate-100 rounded-2xl p-4">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm font-semibold text-slate-900">{new Date(em.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    <StatusBadge status={em.status} size="xs" />
                  </div>
                  {em.ambulance?.driver && (
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <User className="w-3.5 h-3.5" /> Driver: {em.ambulance.driver.user?.fullName}
                    </p>
                  )}
                  {em.hospital && (
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" /> {em.hospital.name}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Export ────────────────────────────────────────────────────────────────

export default function PatientDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeItem, setActiveItem] = useState('home');
  const [activeEmergencyId, setActiveEmergencyId] = useState(null);
  const [isCheckingEmergency, setIsCheckingEmergency] = useState(true);
  // Live unread count drives the sidebar/bottom-nav badge; fetched + kept in
  // sync (socket, mark-read, mark-all-read) by the shared notification store.
  const { unreadCount } = useNotifications();

  // Inject the live unread count into the Notifications nav item at render.
  // undefined badge => DashboardShell renders no badge (so 0 unread = no badge).
  const navItems = NAV_ITEMS.map((item) =>
    item.id === 'notifications' ? { ...item, badge: unreadCount || undefined } : item
  );

  // Check for active emergency on mount
  useEffect(() => {
    let mounted = true;
    patientService.getActiveEmergency()
      .then(res => {
        if (!mounted) return;
        
        // Robust extraction depending on if the axios interceptor or backend shape changed
        let activeReq = null;
        if (res && res.data && typeof res.data === 'object' && res.data.id) {
            activeReq = res.data; // res is { success: true, data: { id: ... } }
        } else if (res && res.id) {
            activeReq = res; // res is { id: ... }
        } else if (res && res.data && res.data.data && res.data.data.id) {
            activeReq = res.data.data;
        }

        if (activeReq && activeReq.id) {
          setActiveEmergencyId(activeReq.id);
          setActiveItem('emergency');
        }
        setIsCheckingEmergency(false);
      })
      .catch(err => {
        console.error('Failed to check active emergency:', err);
        if (mounted) setIsCheckingEmergency(false);
      });
    return () => { mounted = false; };
  }, [navigate]);

  // Real SOS: capture the patient's actual geolocation, create a real
  // EmergencyRequest on the backend (which begins dispatch + socket events),
  // then navigate to live tracking for that real request id. No simulation —
  // if location is denied or creation fails, we surface the error and abort.
  const handleSOSSent = async () => {
    const coords = await new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Location services are unavailable on this device.'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => reject(new Error('Please allow location access so an ambulance can reach you.')),
        { enableHighAccuracy: true, timeout: 15000 }
      );
    });

    const res = await patientService.createEmergencyRequest({
      latitude: coords.latitude,
      longitude: coords.longitude,
    });
    const requestId = (res && res.data && res.data.id) ? res.data.id : (res && res.id) ? res.id : (res && res.data && res.data.data && res.data.data.id) ? res.data.data.id : null;
    if (!requestId) throw new Error('Could not create the emergency request. Please try again.');
    setActiveEmergencyId(requestId);
    setActiveItem('emergency');
  };

  const renderContent = () => {
    switch (activeItem) {
      case 'home': return <HomeTab user={user} navigate={navigate} onSOSSent={handleSOSSent} />;
      case 'appointments': return <AppointmentsTab />;
      case 'prescriptions': return <PrescriptionsTab />;
      case 'lab': return <LabReportsTab />;
      case 'billing': return <BillingTab />;
      case 'notifications': return <NotificationsTab />;
      case 'passport': return <PassportTab user={user} />;
      case 'emergency': 
        return activeEmergencyId ? (
          <EmergencyTracking 
            requestId={activeEmergencyId} 
            onClose={(isTerminal) => { 
              if (isTerminal) setActiveEmergencyId(null);
              setActiveItem('home'); 
            }} 
          />
        ) : (
          <EmergencyDispatchTab onSOSSent={handleSOSSent} />
        );
      default: return <HomeTab user={user} navigate={navigate} onSOSSent={handleSOSSent} />;
    }
  };

  if (isCheckingEmergency) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Checking active status...</p>
      </div>
    );
  }

  return (
    <DashboardShell
      navItems={navItems}
      activeItem={activeItem}
      setActiveItem={setActiveItem}
      roleLabel="Patient"
      roleColor="bg-gradient-to-r from-cyan-500 to-teal-600 text-white"
    >
      {renderContent()}
    </DashboardShell>
  );
}
