/**
 * pages/patient/HealthHub.jsx — Patient Health Hub.
 * Desktop: h-screen overflow-hidden — single page, no scroll.
 * Mobile: scrollable (by design — compact cards need some scroll on small screens).
 * Uses the actual provided images for all three module cards.
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart, Building2, Brain, Dumbbell, MapPin, ChevronDown,
  ArrowRight, Shield, CheckCircle2, AlertCircle,
  FileText, Pill, FlaskConical, Syringe, LogOut, Calendar, Check
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { useAuth } from '../../hooks/useAuth';
import NotificationBell from '../../components/notifications/NotificationBell';
import { getCurrentWeekStreakStatus } from '../../data/wellnessMockData';

// ── Helpers ───────────────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}
function getFirstName(fullName) {
  if (!fullName) return 'there';
  return fullName.split(' ')[0];
}

const AVAILABLE_LOCATIONS = [
  'Vadodara, Gujarat',
  'Ahmedabad, Gujarat',
  'Surat, Gujarat',
  'Mumbai, Maharashtra',
  'Delhi NCR',
  'Bengaluru, Karnataka',
];

// ── Static data ───────────────────────────────────────────────────────────────
const HEALTH_STATS = [
  { emoji: '❤️', value: '72', unit: 'bpm',    label: 'Heart Rate', status: 'Normal',  sc: 'text-green-600' },
  { emoji: '📋', value: '65', unit: 'kg',     label: 'Weight',     status: 'Healthy', sc: 'text-teal-600' },
  { emoji: '🌙', value: '7h 15m', unit: '',   label: 'Sleep',      status: 'Good',    sc: 'text-purple-600' },
  { emoji: '🔥', value: '420', unit: 'kcal',  label: 'Calories',   status: 'Burned',  sc: 'text-orange-500' },
];

const PASSPORT_ITEMS = [
  { icon: FileText,     label: 'Medical Records', sub: 'Secure access' },
  { icon: Pill,         label: 'Prescriptions',   sub: 'All in one place' },
  { icon: FlaskConical, label: 'Lab Reports',     sub: 'Easy to view' },
  { icon: Syringe,      label: 'Immunizations',   sub: 'Up to date' },
];

// ── Module card ───────────────────────────────────────────────────────────────
function ModuleCard({ title, desc, img, iconBg, Icon, ctaText, ctaClasses, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-all group flex flex-col"
    >
      {/* Image area — top on desktop, right on mobile */}
      <div className="relative h-32 sm:h-36 lg:h-28 xl:h-32 w-full overflow-hidden flex-shrink-0">
        <img
          src={img}
          alt={title}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
        />
        {/* Gradient over image bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      </div>

      {/* Content area */}
      <div className="flex-1 p-3.5 flex flex-col justify-between">
        <div>
          <div className={`w-8 h-8 ${iconBg} rounded-xl flex items-center justify-center mb-2`}>
            <Icon className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm mb-1 leading-tight">{title}</h3>
          <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{desc}</p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          className={`mt-3 self-start inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-2 text-xs font-bold transition-colors ${ctaClasses}`}
        >
          {ctaText} <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function HealthHub() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const [selectedLocation, setSelectedLocation] = useState(user?.city || 'Vadodara, Gujarat');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [streakData, setStreakData] = useState(() => getCurrentWeekStreakStatus());
  const profileRef = useRef(null);
  const locationRef = useRef(null);

  const greeting = getGreeting();
  const firstName = getFirstName(user?.fullName);

  const handleLogout = async () => { await logout(); navigate('/', { replace: true }); };
  const handleSOS = () => navigate('/patient/dashboard');

  // Real-time synchronization with Mental Wellness check-ins
  useEffect(() => {
    const handleSync = () => {
      setStreakData(getCurrentWeekStreakStatus());
    };

    window.addEventListener('mw-checkin-updated', handleSync);
    window.addEventListener('storage', handleSync);
    window.addEventListener('focus', handleSync);

    return () => {
      window.removeEventListener('mw-checkin-updated', handleSync);
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('focus', handleSync);
    };
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileDropdown(false);
      }
      if (locationRef.current && !locationRef.current.contains(e.target)) {
        setShowLocationDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    /*
     * Desktop: h-screen overflow-hidden → fits exactly in viewport, no scroll.
     * Mobile: min-h-screen (can scroll if needed on tiny phones).
     */
    <div className="min-h-screen lg:h-screen lg:overflow-hidden flex flex-col bg-slate-50">

      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 bg-white border-b border-slate-100 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-5 py-2.5 flex items-center justify-between gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0 cursor-pointer" onClick={() => navigate('/health-hub')}>
            <div className="w-8 h-8 bg-teal-600 rounded-xl flex items-center justify-center shadow-xs">
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="text-base font-bold text-slate-900 hidden sm:block">
              HealthCare<span className="text-teal-600">+</span>
            </span>
          </div>

          {/* Location Selector */}
          <div className="relative" ref={locationRef}>
            <button
              onClick={() => setShowLocationDropdown(!showLocationDropdown)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 transition-colors cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-teal-600" />
              <span className="truncate max-w-[130px] sm:max-w-[180px]">{selectedLocation}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showLocationDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showLocationDropdown && (
              <div className="absolute left-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Select Your City
                </div>
                {AVAILABLE_LOCATIONS.map((loc) => (
                  <button
                    key={loc}
                    onClick={() => {
                      setSelectedLocation(loc);
                      setShowLocationDropdown(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-teal-50 hover:text-teal-800 transition-colors cursor-pointer ${
                      selectedLocation === loc ? 'font-bold text-teal-700 bg-teal-50/50' : 'text-slate-600'
                    }`}
                  >
                    <span>{loc}</span>
                    {selectedLocation === loc && <Check className="w-3.5 h-3.5 text-teal-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Real Live Notification Bell + Profile Menu */}
          <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
            {/* Live Notification Bell Component */}
            <NotificationBell />

            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer group focus:outline-none"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-700 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-2xs group-hover:ring-2 group-hover:ring-teal-400/40 transition-all">
                  {(user?.fullName || 'P').charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-slate-800 leading-tight">{firstName}</p>
                  <p className="text-[10px] text-slate-400 leading-tight">View Profile</p>
                </div>
                <ChevronDown className={`hidden sm:block w-3.5 h-3.5 text-slate-400 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-2 border-b border-slate-100 mb-1">
                    <p className="text-xs font-bold text-slate-900 truncate">{user?.fullName || 'Patient'}</p>
                    <p className="text-[10px] text-slate-400 truncate">{user?.email || 'patient@example.com'}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 text-[9px] font-bold bg-teal-50 text-teal-700 rounded-md">
                      Patient
                    </span>
                  </div>
                  <button
                    onClick={() => { setShowProfileDropdown(false); navigate('/patient/passport'); }}
                    className="w-full text-left px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Shield className="w-3.5 h-3.5 text-teal-600" />
                    <span>My Health Passport</span>
                  </button>
                  <button
                    onClick={() => { setShowProfileDropdown(false); navigate('/patient/dashboard'); }}
                    className="w-full text-left px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Calendar className="w-3.5 h-3.5 text-cyan-600" />
                    <span>My Appointments</span>
                  </button>
                  <div className="border-t border-slate-100 my-1" />
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer font-medium transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── PAGE BODY — fills remaining height on desktop ──────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-5 py-3 flex flex-col gap-3 h-full">

          {/* ── GREETING + SOS ──────────────────────────────────────────── */}
          <div className="flex items-center justify-between flex-shrink-0">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
                {greeting}, {firstName}! <span>👋</span>
              </h1>
              <p className="text-slate-500 text-xs mt-0.5">Take charge of your health today.</p>
            </div>
            {/* SOS — mobile inline */}
            <button
              onClick={handleSOS}
              className="lg:hidden flex flex-col items-center gap-0.5"
              title="Emergency SOS"
            >
              <div className="w-12 h-12 bg-red-500 hover:bg-red-600 rounded-full shadow-lg shadow-red-200 flex items-center justify-center transition-colors">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <span className="text-[9px] font-bold text-red-500 uppercase">Emergency</span>
            </button>
          </div>

          {/* ── THREE MODULE CARDS ───────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-shrink-0">
            <ModuleCard
              title="Hospital Care"
              desc="Book appointments, consult doctors, view prescriptions, lab reports and more."
              img="/hospital-care.jpg"
              iconBg="bg-teal-50"
              Icon={Building2}
              ctaText="Explore Hospital Care"
              ctaClasses="border-teal-500 text-teal-600 hover:bg-teal-50"
              onClick={() => navigate('/patient/dashboard')}
            />
            <ModuleCard
              title="Mental Wellness"
              desc="Talk to AI, meditate, relax, track mood and take care of your mind."
              img="/mental-wellness.jpg"
              iconBg="bg-purple-50"
              Icon={Brain}
              ctaText="Explore Mental Wellness"
              ctaClasses="border-purple-500 text-purple-600 hover:bg-purple-50"
              onClick={() => navigate('/health-hub/mental-wellness')}
            />
            <ModuleCard
              title="Physical Health"
              desc="Personalized fitness plans, workouts, track progress and stay active."
              img="/physical-health.jpg"
              iconBg="bg-orange-50"
              Icon={Dumbbell}
              ctaText="Explore Physical Health"
              ctaClasses="border-orange-400 text-orange-500 hover:bg-orange-50"
              onClick={() => navigate('/health-hub/physical-health')}
            />
          </div>

          {/* ── HEALTH SUMMARY + STREAK ──────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 flex-shrink-0">

            {/* Health Summary */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3.5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-slate-900 text-sm">Health Summary</h2>
                <button className="flex items-center gap-1 text-xs text-teal-600 font-semibold hover:underline">
                  View Trends <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {HEALTH_STATS.map((s) => (
                  <div key={s.label} className="flex flex-col items-center text-center gap-1">
                    <div className="text-xl leading-none">{s.emoji}</div>
                    <p className="font-extrabold text-slate-900 text-sm leading-tight">
                      {s.value}
                      {s.unit && <span className="text-[10px] text-slate-500 font-semibold ml-0.5">{s.unit}</span>}
                    </p>
                    <p className="text-[10px] text-slate-500 leading-tight">{s.label}</p>
                    <p className={`text-[10px] font-bold ${s.sc} leading-tight`}>{s.status}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Mental Wellness Streak */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3.5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-slate-900 text-sm">Mental Wellness Streak</h2>
                <button
                  onClick={() => navigate('/health-hub/mental-wellness/journey')}
                  className="flex items-center gap-1 text-xs text-teal-600 font-semibold hover:underline cursor-pointer"
                >
                  View Details <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 flex-shrink-0">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-green-50 border border-green-100/80 rounded-xl flex items-center justify-center text-lg sm:text-xl shadow-2xs">🌿</div>
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <p className="text-xl sm:text-2xl font-black text-slate-900 leading-none">
                        {streakData.streak}
                      </p>
                      <p className="text-xs font-bold text-slate-700">Days Streak</p>
                    </div>
                    <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                      {streakData.streak >= 4 ? '🔥 Great going!' : '🌿 Active journey'}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1 sm:flex sm:items-center sm:gap-2 flex-1 max-w-full justify-between pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  {streakData.weekDays.map((d) => (
                    <div key={d.day} className="flex flex-col items-center gap-1">
                      {d.isChecked ? (
                        <div
                          className={`w-6 h-6 sm:w-7 sm:h-7 bg-teal-500 rounded-full flex items-center justify-center shadow-2xs ${
                            d.isToday ? 'ring-2 ring-teal-400 ring-offset-1' : ''
                          }`}
                          title={`${d.day}: Checked In`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                        </div>
                      ) : (
                        <div
                          className={`w-6 h-6 sm:w-7 sm:h-7 border-2 ${
                            d.isToday ? 'border-teal-400 border-dashed bg-teal-50/50' : 'border-slate-200'
                          } rounded-full flex items-center justify-center`}
                          title={`${d.day}: ${d.isToday ? 'Today (Pending)' : 'No check-in'}`}
                        />
                      )}
                      <span className={`text-[9px] font-medium ${d.isToday ? 'text-teal-700 font-bold' : 'text-slate-500'}`}>
                        {d.day}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── HEALTH PASSPORT BANNER ──────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-teal-100 shadow-sm p-3.5 flex-shrink-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Left */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-teal-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-teal-600">Your Health Passport</p>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-xl font-extrabold text-slate-900">80%</span>
                    <span className="text-xs text-slate-500">Complete</span>
                  </div>
                  <div className="w-full max-w-[160px] bg-slate-100 rounded-full h-1.5 mt-1">
                    <div className="bg-teal-500 h-1.5 rounded-full" style={{ width: '80%' }} />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Keep your health records updated and secure.</p>
                </div>
              </div>

              {/* Center: quick access (desktop) */}
              <div className="hidden xl:flex items-center gap-5 flex-shrink-0">
                {PASSPORT_ITEMS.map((item) => (
                  <div key={item.label} className="flex flex-col items-center gap-1 text-center">
                    <div className="w-8 h-8 bg-teal-50 rounded-xl flex items-center justify-center">
                      <item.icon className="w-3.5 h-3.5 text-teal-600" />
                    </div>
                    <p className="text-[10px] font-semibold text-slate-700 leading-tight">{item.label}</p>
                    <p className="text-[9px] text-slate-400">{item.sub}</p>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <button
                onClick={() => navigate('/patient/passport')}
                className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 border-2 border-teal-500 text-teal-600 rounded-xl font-bold text-xs hover:bg-teal-50 transition-colors"
              >
                Complete Now <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* SOS floating button — desktop only */}
      <button
        onClick={handleSOS}
        className="hidden lg:flex fixed bottom-6 right-6 z-50 w-14 h-14 bg-red-500 hover:bg-red-600 rounded-full shadow-xl shadow-red-200 flex-col items-center justify-center transition-colors"
        title="Emergency SOS"
      >
        <AlertCircle className="w-6 h-6 text-white" />
        <span className="text-white text-[8px] font-bold uppercase tracking-wider mt-0.5">SOS</span>
      </button>

    </div>
  );
}
