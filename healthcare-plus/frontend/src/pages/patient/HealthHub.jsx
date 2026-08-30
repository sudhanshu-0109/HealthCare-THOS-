/**
 * pages/patient/HealthHub.jsx — Patient Health Hub.
 * Desktop: h-screen overflow-hidden — single page, no scroll.
 * Mobile: scrollable (by design — compact cards need some scroll on small screens).
 * Uses the actual provided images for all three module cards.
 */

import { useNavigate } from 'react-router-dom';
import {
  Heart, Building2, Brain, Dumbbell, Bell, MapPin, ChevronDown,
  ArrowRight, Shield, CheckCircle2, AlertCircle,
  FileText, Pill, FlaskConical, Syringe
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { useAuth } from '../../hooks/useAuth';

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

// ── Static data ───────────────────────────────────────────────────────────────
const HEALTH_STATS = [
  { emoji: '❤️', value: '72', unit: 'bpm',    label: 'Heart Rate', status: 'Normal',  sc: 'text-green-600' },
  { emoji: '📋', value: '65', unit: 'kg',     label: 'Weight',     status: 'Healthy', sc: 'text-teal-600' },
  { emoji: '🌙', value: '7h 15m', unit: '',   label: 'Sleep',      status: 'Good',    sc: 'text-purple-600' },
  { emoji: '🔥', value: '420', unit: 'kcal',  label: 'Calories',   status: 'Burned',  sc: 'text-orange-500' },
];

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const STREAK_DONE = [true, true, true, true, true, true, false];

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

  const greeting = getGreeting();
  const firstName = getFirstName(user?.fullName);

  const handleLogout = async () => { await logout(); navigate('/', { replace: true }); };
  const handleSOS = () => navigate('/patient/dashboard');

  return (
    /*
     * Desktop: h-screen overflow-hidden → fits exactly in viewport, no scroll.
     * Mobile: min-h-screen (can scroll if needed on tiny phones).
     */
    <div className="min-h-screen lg:h-screen lg:overflow-hidden flex flex-col bg-slate-50">

      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 bg-white border-b border-slate-100 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-5 py-3 flex items-center justify-between gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-teal-600 rounded-xl flex items-center justify-center">
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="text-base font-bold text-slate-900 hidden sm:block">
              HealthCare<span className="text-teal-600">+</span>
            </span>
          </div>

          {/* Location */}
          <button className="flex items-center gap-1 text-slate-600 hover:text-teal-600 transition-colors">
            <MapPin className="w-3.5 h-3.5 text-teal-600" />
            <span className="text-xs font-medium truncate max-w-[140px]">{user?.city || 'Vadodara, Gujarat'}</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {/* Right */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button className="relative p-1.5">
              <Bell className="w-4 h-4 text-slate-600" />
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full text-white text-[8px] font-bold flex items-center justify-center">3</span>
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 hover:opacity-80 transition-opacity" title="Logout">
              <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                {(user?.fullName || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-slate-800 leading-tight">{firstName}</p>
                <p className="text-[10px] text-slate-400 leading-tight">View Profile</p>
              </div>
              <ChevronDown className="hidden sm:block w-3.5 h-3.5 text-slate-400" />
            </button>
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
                <button className="flex items-center gap-1 text-xs text-teal-600 font-semibold hover:underline">
                  View Details <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-xl">🌿</div>
                  <div>
                    <p className="text-2xl font-extrabold text-slate-900 leading-none">7</p>
                    <p className="text-[10px] font-semibold text-slate-600 mt-0.5">Days Streak</p>
                    <p className="text-[10px] text-slate-400 italic">Great going!</p>
                  </div>
                </div>
                <div className="flex-1 flex items-center justify-between">
                  {DAYS.map((day, i) => (
                    <div key={day} className="flex flex-col items-center gap-1">
                      {STREAK_DONE[i] ? (
                        <div className="w-7 h-7 bg-teal-500 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 border-2 border-slate-200 rounded-full" />
                      )}
                      <span className="text-[9px] text-slate-500 font-medium">{day}</span>
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
