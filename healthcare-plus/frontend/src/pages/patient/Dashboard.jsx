import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Home, User, Calendar, Pill, FlaskConical, ShoppingBag, CreditCard,
  Bell, AlertTriangle, Heart, Search, Star, MapPin, Clock, Stethoscope,
  Brain, Phone, X, CheckCircle2, Navigation, ChevronRight, Activity,
  FileText, Zap, Plus, Loader2, Save, Filter, RefreshCw
} from 'lucide-react';
import DashboardShell from '../../components/layout/DashboardShell';
import useAuthStore from '../../store/authStore';
import { useGeolocation } from '../../hooks/useGeolocation';
import * as patientService from '../../services/patient.service';
import * as passportService from '../../services/passport.service';
import * as appointmentsService from '../../services/appointments.service';
import * as prescriptionsService from '../../services/prescriptions.service';
import * as labRequestsService from '../../services/labRequests.service';
import UpcomingAppointments from '../../components/dashboard/UpcomingAppointments';
import CurrentQueueWidget from '../../components/dashboard/CurrentQueueWidget';
import PassportSummaryCard from '../../components/passport/PassportSummaryCard';
import AllergyConditionEditor from '../../components/passport/AllergyConditionEditor';
import ConsentManager from '../../components/passport/ConsentManager';
import PatientBillingPage from './Billing';

const CROWD_CONFIG = {
  low: { label: 'Low', dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  moderate: { label: 'Moderate', dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  high: { label: 'High', dot: 'bg-red-500', badge: 'bg-red-50 text-red-700 border-red-200' },
};

const NAV_ITEMS = [
  { id: 'home', icon: Home, label: 'Home', shortLabel: 'Home' },
  { id: 'personal', icon: User, label: 'My Health', shortLabel: 'Health' },
  { id: 'appointments', icon: Calendar, label: 'Appointments', shortLabel: 'Appts' },
  { id: 'prescriptions', icon: Pill, label: 'Prescriptions', shortLabel: 'Rx' },
  { id: 'lab', icon: FlaskConical, label: 'Lab Reports', shortLabel: 'Labs' },
  { id: 'passport', icon: FileText, label: 'Health Passport', shortLabel: 'Passport' },
  { id: 'billing', icon: CreditCard, label: 'Billing & Payments', shortLabel: 'Bills' },
];

const SOS_STATES = { IDLE: 'idle', HOLDING: 'holding', CONFIRM: 'confirm', DISPATCHING: 'dispatching', TRACKING: 'tracking' };

function SOSButton({ onSOSSent }) {
  const [sosState, setSosState] = useState(SOS_STATES.IDLE);
  const [holdProgress, setHoldProgress] = useState(0);
  const progressRef = useRef(null);
  const holdStartRef = useRef(null);

  const startHold = () => {
    if (sosState !== SOS_STATES.IDLE) return;
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

  const confirmSOS = () => {
    setSosState(SOS_STATES.DISPATCHING);
    onSOSSent().then(() => setSosState(SOS_STATES.TRACKING)).catch(() => setSosState(SOS_STATES.IDLE));
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
        <p className="text-sm text-red-500 mb-4">An ambulance will be dispatched to your current location.</p>
        <div className="flex gap-3">
          <button onClick={resetSOS} className="flex-1 py-2.5 rounded-xl border-2 border-red-200 text-red-600 font-semibold text-sm">Cancel</button>
          <button onClick={confirmSOS} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-semibold text-sm">Yes, Send SOS</button>
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

  if (sosState === SOS_STATES.TRACKING) {
    return (
      <div className="bg-red-50 border-2 border-red-500 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
            <span className="font-bold text-red-700 text-sm">Ambulance Dispatched</span>
          </div>
          <button onClick={resetSOS} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
        </div>
        <div className="bg-white rounded-xl p-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <Navigation className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Emergency services notified</div>
              <div className="text-xs text-emerald-600 font-semibold">Help is on the way</div>
            </div>
          </div>
        </div>
        <p className="text-xs text-red-500 text-center">Nearest hospital pre-alerted ✓</p>
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
    </div>
  );
}

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
      setError('Unable to get AI suggestion. Please try again.');
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
        <div className="bg-white border border-violet-100 rounded-xl p-4 mt-2">
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recommended Specialty</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Stethoscope className="w-4 h-4 text-violet-600" />
                <span className="text-base font-bold text-violet-900">{response.recommendedSpecialty}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  response.urgency === 'Critical' ? 'bg-red-100 text-red-700' :
                  response.urgency === 'High' ? 'bg-orange-100 text-orange-700' :
                  'bg-blue-100 text-blue-700'
                }`}>{response.urgency}</span>
              </div>
              <p className="text-sm text-slate-700 mb-3 leading-relaxed">{response.reason}</p>
              
              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <p className="text-[10px] text-slate-400 italic flex-1 mr-4">{response.disclaimer}</p>
                <button
                  onClick={() => onFindDoctors(response.recommendedSpecialty)}
                  className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg transition-colors border border-emerald-200"
                >
                  <Search className="w-3.5 h-3.5" /> Find Doctors
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HomeTab({ user, onTabChange }) {
  const { location, error: geoError } = useGeolocation();
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');
  const [hospitals, setHospitals] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [passportSummary, setPassportSummary] = useState(null);

  const handleSearchHospitals = async (specialty = '') => {
    setSearchLoading(true);
    try {
      const lat = location?.latitude || 12.97;
      const lng = location?.longitude || 77.59;
      const res = await patientService.searchHospitals(lat, lng, 100);
      const rawData = res.data?.data || res.data || [];
      const data = Array.isArray(rawData) ? rawData : [];
      const filtered = specialty
        ? data.filter(h => h.specialities?.some(s => s.toLowerCase().includes(specialty.toLowerCase())))
        : data;
      setHospitals(filtered);
    } catch (err) {
      setHospitals([]);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    handleSearchHospitals(selectedTag === 'All' ? '' : selectedTag);
    passportService.getDashboardSummary()
      .then(res => setPassportSummary(res.data?.data || res.data))
      .catch(() => {});
  }, [location, selectedTag]);

  const handleSOS = async () => {
    if (!location) throw new Error('No location');
    await patientService.createEmergencyRequest({
      latitude: location.latitude,
      longitude: location.longitude,
    });
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 pb-24 lg:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-slate-900">{greeting()} 👋</h1>
          <p className="text-sm text-slate-500 mt-0.5">How are you feeling today, {user?.fullName?.split(' ')[0]}?</p>
        </div>
        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
          <Heart className="w-5 h-5 text-emerald-500" />
        </div>
      </div>

      <CurrentQueueWidget />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <UpcomingAppointments />
        <PassportSummaryCard summary={passportSummary} />
      </div>

      <AIHealthAssistant onFindDoctors={(specialty) => {
        setSelectedTag(specialty);
        handleSearchHospitals(specialty);
        document.getElementById('hospital-search')?.scrollIntoView({ behavior: 'smooth' });
      }} />

      {/* SOS + Quick actions */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-1 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center p-3">
          <SOSButton onSOSSent={handleSOS} />
        </div>
        <div className="col-span-2 grid grid-cols-2 gap-3">
          {[
            { icon: Calendar, label: 'Book Appt.', tab: 'appointments', color: 'bg-cyan-50 text-cyan-600' },
            { icon: Pill, label: 'Refill Rx', tab: 'prescriptions', color: 'bg-emerald-50 text-emerald-600' },
            { icon: FlaskConical, label: 'Lab Results', tab: 'lab', color: 'bg-violet-50 text-violet-600' },
            { icon: Activity, label: 'Health Passport', tab: 'passport', color: 'bg-pink-50 text-pink-600' },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => onTabChange(item.tab)}
              className="bg-white rounded-xl border border-slate-100 shadow-sm p-3 flex flex-col items-center gap-1.5 hover:border-cyan-200 hover:shadow-md transition-all text-left"
            >
              <div className={`w-8 h-8 rounded-lg ${item.color} flex items-center justify-center`}>
                <item.icon className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-slate-700 text-center">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Hospital Search */}
      <div id="hospital-search">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-900">Find Hospitals Near You</h2>
          <span className="text-xs text-slate-400">{hospitals.length} hospitals found</span>
        </div>
        {geoError && <p className="text-xs text-red-500 mb-2">Location access denied — showing default network hospitals.</p>}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, specialty, city…"
            className="w-full pl-10 pr-4 py-3 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-400 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 mb-4 scrollbar-hide">
          {['All', 'General', 'Cardiology', 'Orthopedics', 'Dermatology', 'Neurology', 'Pediatrics'].map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-colors ${
                selectedTag === tag
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-cyan-300 hover:bg-cyan-50'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {searchLoading ? (
          <div className="text-center py-8 text-slate-400">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm">Fetching network hospitals…</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {hospitals.filter(h => !search || h.name?.toLowerCase().includes(search.toLowerCase()) || h.city?.toLowerCase().includes(search.toLowerCase())).length === 0 ? (
              <div className="col-span-2 text-center py-8 text-slate-400 bg-white rounded-2xl border border-slate-100 p-6">
                <MapPin className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-medium text-slate-600">No hospitals found matching filter.</p>
                <button onClick={() => { setSelectedTag('All'); setSearch(''); }} className="mt-2 text-xs font-semibold text-cyan-600 hover:underline">Clear filters</button>
              </div>
            ) : hospitals
              .filter(h => !search || h.name?.toLowerCase().includes(search.toLowerCase()) || h.city?.toLowerCase().includes(search.toLowerCase()))
              .map((h) => (
                <div key={h.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-cyan-200 transition-all overflow-hidden">
                  <div className="h-20 bg-gradient-to-br from-cyan-500 to-teal-600 relative p-3 text-white flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-bold tracking-wider uppercase bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full">
                        {h.city || 'Network Hospital'}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500 text-white shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                        Open
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-slate-900 text-sm mb-1">{h.name}</h3>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-cyan-600" />{h.distance ? `${h.distance.toFixed(1)} km` : h.address}</span>
                      <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />{h.averageRating?.toFixed(1) || '4.8'}</span>
                    </div>
                    {h.specialities?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {h.specialities.slice(0, 3).map((s) => (
                          <span key={s} className="px-2 py-0.5 bg-slate-50 text-slate-600 text-xs rounded-md border border-slate-100">{s}</span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="text-xs text-slate-500 truncate pr-2">{h.contactPhone || 'Available 24/7'}</span>
                      <Link to={`/hospitals/${h.id}`} className="shrink-0 px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs rounded-xl font-bold transition-colors shadow-sm">
                        Book Doctor
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PatientPassportTab() {
  const [passport, setPassport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  const [allergies, setAllergies] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [medications, setMedications] = useState([]);
  const [notes, setNotes] = useState('');

  const fetchPassport = async () => {
    try {
      const res = await passportService.getMyPassport();
      const data = res.data?.data || res.data;
      if (data) {
        setPassport(data);
        setAllergies(data.allergies || []);
        setConditions(data.medicalConditions || []);
        setMedications(data.currentMedications || []);
        setNotes(data.notes || '');
      }
    } catch (err) {
      setError('Failed to load health passport.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPassport(); }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await passportService.updateMyPassport({
        allergies,
        medicalConditions: conditions,
        currentMedications: medications,
        notes,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save passport.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-600" />
        <p className="text-sm">Loading health passport…</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 pb-24 lg:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-slate-900 text-lg flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500" /> My Health Passport
          </h1>
          <p className="text-xs text-slate-500">Manage allergies, conditions, and consent settings</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-slate-800 border-b border-slate-100 pb-3">Medical Summary</h2>
          <AllergyConditionEditor label="Allergies" items={allergies} onChange={setAllergies} placeholder="e.g. Penicillin, Peanuts…" />
          <AllergyConditionEditor label="Medical Conditions" items={conditions} onChange={setConditions} placeholder="e.g. Hypertension, Diabetes…" />
          <AllergyConditionEditor label="Current Medications" items={medications} onChange={setMedications} placeholder="e.g. Atorvastatin 10mg…" />
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">Additional Health Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional health notes or instructions…"
              rows={3}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 transition-all resize-none"
            />
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <ConsentManager consents={passport?.consents || []} onUpdate={fetchPassport} />
          </div>
        </div>
      </div>
    </div>
  );
}

function PatientAppointmentsTab() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await appointmentsService.getMyAppointments();
      const rawData = res.data?.appointments || res.data || [];
      const apptArray = Array.isArray(rawData) ? rawData : rawData.appointments || [];
      setAppointments(apptArray);
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAppointments(); }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SCHEDULED': return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'COMPLETED': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'CANCELLED': return 'bg-red-50 text-red-700 border-red-200';
      case 'IN_QUEUE': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 pb-24 lg:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-slate-900 text-lg">My Appointments</h1>
          <p className="text-xs text-slate-500">Track and manage doctor consultations</p>
        </div>
        <button onClick={fetchAppointments} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-600" />
          <p className="text-sm">Loading appointments…</p>
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 mb-1">No Appointments Scheduled</h3>
          <p className="text-xs text-slate-500 mb-4">Book a consultation with our network of specialists.</p>
          <Link to="/patient/dashboard" className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold transition-colors inline-block no-underline">
            Find Doctors
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((appt) => (
            <div key={appt.id} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:border-cyan-200 transition-all flex flex-col sm:flex-row justify-between gap-4">
              <div className="flex gap-3 items-start">
                <div className="w-10 h-10 bg-cyan-50 rounded-xl flex items-center justify-center text-cyan-600 shrink-0 font-bold">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{appt.doctor?.user?.fullName || 'Doctor Consultation'}</h4>
                  <p className="text-xs text-slate-500">{appt.hospital?.name || appt.doctor?.specialization || 'General Clinic'}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-600">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-400" />{new Date(appt.appointmentDate || appt.createdAt).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-slate-400" />{appt.timeSlot || '09:00 AM'}</span>
                  </div>
                </div>
              </div>
              <div className="flex sm:flex-col justify-between sm:justify-center items-end gap-2 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(appt.status)}`}>
                  {appt.status}
                </span>
                {appt.queueToken && (
                  <span className="text-xs font-bold text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded">
                    Token #{appt.queueToken.tokenNumber}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PatientPrescriptionsTab() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      const res = await prescriptionsService.getMyPrescriptions();
      const rawData = res.data?.prescriptions || res.prescriptions || res.data || [];
      const rxArray = Array.isArray(rawData) ? rawData : rawData.prescriptions || [];
      setPrescriptions(rxArray);
    } catch {
      setPrescriptions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPrescriptions(); }, []);

  const handleAcceptPrescription = async (rx) => {
    try {
      setActionLoading(rx.id);
      await api.post('/pharmacy-orders', {
        prescriptionId: rx.id,
        hospitalId: rx.hospitalId,
      });
      await fetchPrescriptions();
      alert('Prescription accepted! Sent to Pharmacy for preparation.');
    } catch (err) {
      alert(err.message || 'Could not accept prescription.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 pb-24 lg:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-slate-900 text-lg">Prescriptions & Medications</h1>
          <p className="text-xs text-slate-500">Active medical prescriptions issued by your doctors</p>
        </div>
        <button onClick={fetchPrescriptions} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
          <p className="text-sm">Loading prescriptions…</p>
        </div>
      ) : prescriptions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
          <Pill className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 mb-1">No Active Prescriptions</h3>
          <p className="text-xs text-slate-500">Prescriptions prescribed by your doctor during consultations will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {prescriptions.map((rx) => (
            <div key={rx.id} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-3">
              <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Prescription #{rx.id.slice(0, 8)}</h4>
                  <p className="text-xs text-slate-500">Issued on {new Date(rx.createdAt).toLocaleDateString()}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {rx.status || 'Active'}
                </span>
              </div>
              {rx.generalInstructions && (
                <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  Instructions: {rx.generalInstructions}
                </p>
              )}
              {rx.items?.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Medications</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {rx.items.map((item, idx) => (
                      <div key={idx} className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 flex items-start gap-2">
                        <Pill className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-slate-900">{item.medicineName} ({item.dosage})</div>
                          <div className="text-[11px] text-slate-500">{item.frequency} • {item.duration}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                {rx.pharmacyOrder ? (
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Order Status: {rx.pharmacyOrder.status}
                  </span>
                ) : (
                  <button
                    onClick={() => handleAcceptPrescription(rx)}
                    disabled={actionLoading === rx.id}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    {actionLoading === rx.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Pill className="w-3.5 h-3.5" />}
                    Accept & Order Medicines
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PatientLabReportsTab() {
  const [labRequests, setLabRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLabRequests = async () => {
    setLoading(true);
    try {
      const res = await labRequestsService.getMyLabRequests();
      const rawData = res.labRequests || res.data?.labRequests || res.data || [];
      const labArray = Array.isArray(rawData) ? rawData : rawData.labRequests || [];
      setLabRequests(labArray);
    } catch {
      setLabRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLabRequests(); }, []);

  const getPriorityBadge = (p) => {
    switch (p) {
      case 'EMERGENCY': return 'bg-red-50 text-red-700 border-red-200';
      case 'URGENT': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 pb-24 lg:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-slate-900 text-lg">Laboratory Reports</h1>
          <p className="text-xs text-slate-500">Lab test orders and uploaded diagnostic results</p>
        </div>
        <button onClick={fetchLabRequests} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-violet-600" />
          <p className="text-sm">Loading lab reports…</p>
        </div>
      ) : labRequests.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
          <FlaskConical className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 mb-1">No Lab Reports Requested</h3>
          <p className="text-xs text-slate-500">Diagnostic lab test requests ordered by your doctor will be tracked here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {labRequests.map((lab) => (
            <div key={lab.id} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-3">
              <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <FlaskConical className="w-5 h-5 text-violet-600" />
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Lab Request #{lab.id.slice(0, 8)}</h4>
                    <p className="text-xs text-slate-500">{new Date(lab.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getPriorityBadge(lab.priority)}`}>
                    {lab.priority}
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200">
                    {lab.status}
                  </span>
                </div>
              </div>
              {lab.items?.length > 0 && (
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-600">Tests Included:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {lab.items.map((test, i) => (
                      <span key={i} className="px-2.5 py-1 bg-slate-50 border border-slate-100 text-slate-700 text-xs rounded-lg font-medium">
                        {test.testName}
                      </span>
                    ))}
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

export default function PatientDashboard() {
  const { user } = useAuthStore();
  const [activeItem, setActiveItem] = useState('home');

  const renderContent = () => {
    switch (activeItem) {
      case 'home': return <HomeTab user={user} onTabChange={setActiveItem} />;
      case 'personal': return <PatientPassportTab />;
      case 'appointments': return <PatientAppointmentsTab />;
      case 'prescriptions': return <PatientPrescriptionsTab />;
      case 'lab': return <PatientLabReportsTab />;
      case 'passport': return <PatientPassportTab />;
      case 'billing': return <PatientBillingPage />;
      default: return <HomeTab user={user} onTabChange={setActiveItem} />;
    }
  };

  return (
    <DashboardShell
      navItems={NAV_ITEMS}
      activeItem={activeItem}
      setActiveItem={setActiveItem}
      roleLabel="Patient"
      roleColor="bg-cyan-50 text-cyan-700"
    >
      {renderContent()}
    </DashboardShell>
  );
}
