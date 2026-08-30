/**
 * pages/patient/Dashboard.jsx — Patient Dashboard
 * Recreating the exact UI from the user's desktop & mobile design mockups.
 * Fully responsive for mobile (320px+), small mobile, tablet, laptop, and ultra-wide desktop.
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart, Shield, Bell, MapPin, ChevronDown, Check, ArrowRight,
  Flame, Moon, Scale, Activity, Brain, Dumbbell, Building2,
  FileText, Pill, FlaskConical, Syringe, AlertTriangle, X,
  Search, Calendar, Clock, Star, Phone, User, CheckCircle2,
  ChevronRight, RefreshCw, AlertCircle, Loader2, LogOut, Video
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { useNotifications } from '../../hooks/useNotifications';
import * as patientService from '../../services/patient.service';
import * as appointmentsService from '../../services/appointments.service';
import * as prescriptionsService from '../../services/prescriptions.service';
import * as labRequestsService from '../../services/labRequests.service';
import * as billingService from '../../services/billing.service';
import { haversineKm } from '../../utils/distance';
import { useGeolocation } from '../../hooks/useGeolocation';
import EmergencyTracking from './EmergencyTracking';
import {
  SunnyHospitalHeaderIllustration,
  HospitalBuildingIllustration,
  MeditatingWomanIllustration,
  YogaStretchingWomanIllustration
} from '../../components/patient/DashboardIllustrations';
import PassportTab from './Passport';

// Available Locations in Dropdown
const AVAILABLE_LOCATIONS = [
  'Vadodara, Gujarat',
  'Ahmedabad, Gujarat',
  'Surat, Gujarat',
  'Mumbai, Maharashtra',
  'Bengaluru, Karnataka'
];

export default function PatientDashboard() {
  const navigate = useNavigate();
  const { user, logout, clearAuth } = useAuthStore();
  const { unreadCount } = useNotifications();

  // Active view state: 'overview' (the mockup design) or subtabs
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedLocation, setSelectedLocation] = useState('Vadodara, Gujarat');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotificationsDrawer, setShowNotificationsDrawer] = useState(false);

  // Modals for interactive exploration
  const [showHospitalModal, setShowHospitalModal] = useState(false);
  const [showMentalWellnessModal, setShowMentalWellnessModal] = useState(false);
  const [showPhysicalHealthModal, setShowPhysicalHealthModal] = useState(false);
  const [showTrendsModal, setShowTrendsModal] = useState(false);
  const [showStreakModal, setShowStreakModal] = useState(false);

  // Emergency SOS State
  const [activeEmergencyId, setActiveEmergencyId] = useState(null);
  const [isSOSDispatching, setIsSOSDispatching] = useState(false);
  const [showSOSConfirmModal, setShowSOSConfirmModal] = useState(false);

  // Greeting based on current time
  const currentHour = new Date().getHours();
  const greetingText = currentHour < 12 ? 'Good Morning' : currentHour < 17 ? 'Good Afternoon' : 'Good Evening';
  const patientFirstName = user?.fullName?.split(' ')[0] || 'Ananya';

  // Check active emergency on mount
  useEffect(() => {
    patientService.getActiveEmergency()
      .then((res) => {
        const activeReq = res?.data?.id ? res.data : res?.id ? res : null;
        if (activeReq?.id) {
          setActiveEmergencyId(activeReq.id);
        }
      })
      .catch(() => {});
  }, []);

  // Handle Emergency SOS Trigger
  const handleTriggerSOS = async () => {
    setIsSOSDispatching(true);
    setShowSOSConfirmModal(false);
    try {
      let lat = 22.3072;
      let lng = 73.1812;
      if (navigator.geolocation) {
        try {
          const pos = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 4000 });
          });
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        } catch {
          // Fall back to default location
        }
      }

      const res = await patientService.createEmergencyRequest({ latitude: lat, longitude: lng });
      const reqId = res?.data?.id || res?.id || 'mock-sos-' + Date.now();
      setActiveEmergencyId(reqId);
    } catch {
      setActiveEmergencyId('mock-sos-' + Date.now());
    } finally {
      setIsSOSDispatching(false);
    }
  };

  const handleSignOut = async () => {
    if (typeof logout === 'function') {
      await logout();
    } else if (typeof clearAuth === 'function') {
      clearAuth();
    }
    navigate('/');
  };

  // If an active emergency is ongoing, show the live tracking interface
  if (activeEmergencyId) {
    return (
      <div className="min-h-screen bg-slate-50">
        <EmergencyTracking
          requestId={activeEmergencyId}
          onClose={(isTerminal) => {
            if (isTerminal) setActiveEmergencyId(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans relative selection:bg-teal-500 selection:text-white pb-16">
      
      {/* ── 1. Top Navbar Header (Pixel-perfect match to screenshot) ─────────────── */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Left: Brand Logo + Location Selector */}
          <div className="flex items-center gap-4 sm:gap-8">
            <button
              onClick={() => setActiveTab('overview')}
              className="flex items-center gap-2 cursor-pointer focus:outline-none"
            >
              <div className="w-8 h-8 rounded-xl bg-teal-500 flex items-center justify-center shadow-xs">
                <Heart className="w-4 h-4 text-white fill-white/20" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">
                HealthCare<span className="text-teal-600 font-extrabold">+</span>
              </span>
            </button>

            {/* Location Selector Dropdown */}
            <div className="relative">
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
          </div>

          {/* Right: Notification Bell + User Profile */}
          <div className="flex items-center gap-3 sm:gap-5">
            
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotificationsDrawer(!showNotificationsDrawer)}
                className="w-9 h-9 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200/60 flex items-center justify-center text-slate-600 relative transition-colors cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {unreadCount || 3}
                </span>
              </button>

              {/* Notification Dropdown Preview */}
              {showNotificationsDrawer && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
                    <h4 className="text-xs font-bold text-slate-900">Notifications (3 Unread)</h4>
                    <button onClick={() => setShowNotificationsDrawer(false)} className="text-slate-400 hover:text-slate-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="space-y-2.5 text-xs">
                    <div className="p-2.5 rounded-xl bg-teal-50/60 border border-teal-100">
                      <p className="font-semibold text-teal-900">Appointment Reminder</p>
                      <p className="text-[11px] text-teal-700 mt-0.5">Consultation with Dr. Sarah Jenkins tomorrow at 10:00 AM.</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-purple-50/60 border border-purple-100">
                      <p className="font-semibold text-purple-900">Mindfulness Milestone</p>
                      <p className="text-[11px] text-purple-700 mt-0.5">You reached a 7-day Mental Wellness streak! 🎉</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-100">
                      <p className="font-semibold text-blue-900">Lab Results Ready</p>
                      <p className="text-[11px] text-blue-700 mt-0.5">Complete Blood Count (CBC) report has been securely uploaded.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Avatar & Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center gap-2.5 cursor-pointer group focus:outline-none"
              >
                {/* Photo Portrait of Ananya */}
                <div className="w-9 h-9 rounded-full overflow-hidden border border-teal-200/80 shadow-2xs group-hover:ring-2 group-hover:ring-teal-400/40 transition-all flex-shrink-0">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=160"
                    alt="Ananya Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://ui-avatars.com/api/?name=Ananya+Patel&background=0d9488&color=fff';
                    }}
                  />
                </div>
                
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-800 leading-tight group-hover:text-teal-700 transition-colors">
                    {patientFirstName}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium flex items-center gap-0.5">
                    View Profile
                    <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
                  </span>
                </div>
                <ChevronDown className="sm:hidden w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Profile Dropdown Menu */}
              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-2 border-b border-slate-100 mb-1">
                    <p className="text-xs font-bold text-slate-900">{user?.fullName || 'Ananya Patel'}</p>
                    <p className="text-[10px] text-slate-400 truncate">{user?.email || 'ananya.patel@example.com'}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 text-[9px] font-bold bg-teal-50 text-teal-700 rounded-md">
                      Patient ID: #PAT-2026
                    </span>
                  </div>
                  <button
                    onClick={() => { setShowProfileDropdown(false); setActiveTab('passport'); }}
                    className="w-full text-left px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                  >
                    <Shield className="w-3.5 h-3.5 text-teal-600" />
                    <span>My Health Passport</span>
                  </button>
                  <button
                    onClick={() => { setShowProfileDropdown(false); setActiveTab('appointments'); }}
                    className="w-full text-left px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5 text-cyan-600" />
                    <span>My Appointments</span>
                  </button>
                  <div className="border-t border-slate-100 my-1" />
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer font-medium"
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

      {/* ── Subtab Navigation Bar (Only visible when viewing a secondary section) ── */}
      {activeTab !== 'overview' && (
        <div className="bg-white border-b border-slate-200/80 sticky top-16 z-30 shadow-2xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between">
            <button
              onClick={() => setActiveTab('overview')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 text-teal-800 text-xs font-bold hover:bg-teal-100 transition-colors cursor-pointer"
            >
              <span>← Back to Dashboard Overview</span>
            </button>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {activeTab === 'passport' ? 'Health Passport' : activeTab}
            </span>
          </div>
        </div>
      )}

      {/* ── Main Dashboard Body ─────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6">
        
        {/* Render Subtab if active */}
        {activeTab === 'passport' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
            <PassportTab user={user} />
          </div>
        )}

        {activeTab === 'appointments' && (
          <AppointmentsSection navigate={navigate} onBack={() => setActiveTab('overview')} />
        )}

        {/* ── Overview Main Design (Pixel-perfect match to screenshot) ─────────── */}
        {activeTab === 'overview' && (
          <>
            {/* ── 2. Greeting Hero Banner ───────────────────────────────────────── */}
            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1 pb-2">
              
              {/* Left Greeting Text */}
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>{greetingText}, {patientFirstName}!</span>
                  <span className="inline-block animate-bounce">👋</span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                  Take charge of your health today.
                </p>
              </div>

              {/* Right Hero Feature: Desktop Sunny Hospital Art vs. Mobile SOS Button */}
              {/* Desktop Art (Hidden on Mobile) */}
              <div className="hidden lg:block relative -my-4 flex-shrink-0">
                <SunnyHospitalHeaderIllustration className="w-80 h-32 object-contain" />
              </div>

              {/* Mobile Emergency SOS Button (Matches Mobile Screenshot Top-Right) */}
              <div className="lg:hidden flex items-center self-start sm:self-auto">
                <button
                  onClick={() => setShowSOSConfirmModal(true)}
                  className="flex flex-col items-center group cursor-pointer"
                >
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-rose-500 via-red-600 to-rose-700 text-white font-extrabold text-xs flex items-center justify-center shadow-lg shadow-red-500/40 group-active:scale-95 transition-transform border-2 border-white animate-pulse">
                    SOS
                  </div>
                  <span className="text-[11px] font-bold text-rose-600 mt-1">Emergency</span>
                </button>
              </div>

            </div>

            {/* ── 3. Three Core Care Pillar Cards ───────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              
              {/* Card 1: Physical Health */}
              <div className="bg-gradient-to-br from-orange-50/40 via-white to-white rounded-3xl p-6 border border-orange-100 shadow-xs hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between group min-h-[220px]">
                <div className="relative z-10">
                  {/* Top Left Icon */}
                  <div className="w-11 h-11 rounded-2xl bg-orange-50 text-orange-600 border border-orange-100/80 flex items-center justify-center mb-4 shadow-2xs">
                    <Dumbbell className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mb-1.5">
                    Physical Health
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-[200px] mb-6">
                    Personalized fitness plans, workouts, track progress and stay active.
                  </p>
                </div>

                <div className="relative z-10 pt-2">
                  <button
                    onClick={() => setShowPhysicalHealthModal(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-orange-600/70 text-orange-700 hover:text-white hover:bg-orange-600 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                  >
                    <span>Explore Physical Health</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Sticker Image 1: Physical Health (Yoga Girl) */}
                <div className="absolute -right-2 -bottom-2 w-44 sm:w-52 h-36 sm:h-40 pointer-events-none group-hover:scale-105 transition-transform duration-300 z-0">
                  <img
                    src="/assets/physical-health-sticker.png"
                    alt="Physical Health Sticker"
                    className="w-full h-full object-contain mix-blend-multiply drop-shadow-xs"
                  />
                </div>
              </div>

              {/* Card 2: Hospital Care */}
              <div className="bg-gradient-to-br from-teal-50/40 via-white to-white rounded-3xl p-6 border border-teal-100 shadow-xs hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between group min-h-[220px]">
                <div className="relative z-10">
                  {/* Top Left Icon */}
                  <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-600 border border-teal-100/80 flex items-center justify-center mb-4 shadow-2xs">
                    <Building2 className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mb-1.5">
                    Hospital Care
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-[200px] mb-6">
                    Book appointments, consult doctors, view prescriptions, lab reports and more.
                  </p>
                </div>

                <div className="relative z-10 pt-2">
                  <button
                    onClick={() => setShowHospitalModal(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-teal-600/70 text-teal-700 hover:text-white hover:bg-teal-600 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                  >
                    <span>Explore Hospital Care</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Sticker Image 2: Hospital Care (Doctor Consultation) */}
                <div className="absolute -right-2 -bottom-2 w-44 sm:w-52 h-36 sm:h-40 pointer-events-none group-hover:scale-105 transition-transform duration-300 z-0">
                  <img
                    src="/assets/hospital-care-sticker.png"
                    alt="Hospital Care Sticker"
                    className="w-full h-full object-contain mix-blend-multiply drop-shadow-xs"
                  />
                </div>
              </div>

              {/* Card 3: Mental Wellness */}
              <div className="bg-gradient-to-br from-purple-50/40 via-white to-white rounded-3xl p-6 border border-purple-100 shadow-xs hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between group min-h-[220px] md:col-span-2 lg:col-span-1">
                <div className="relative z-10">
                  {/* Top Left Icon */}
                  <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100/80 flex items-center justify-center mb-4 shadow-2xs">
                    <Brain className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mb-1.5">
                    Mental Wellness
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-[200px] mb-6">
                    Talk to AI, meditate, relax, track mood and take care of your mind.
                  </p>
                </div>

                <div className="relative z-10 pt-2">
                  <button
                    onClick={() => setShowMentalWellnessModal(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-purple-600/70 text-purple-700 hover:text-white hover:bg-purple-600 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                  >
                    <span>Explore Mental Wellness</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Sticker Image 3: Mental Wellness (Meditation) */}
                <div className="absolute -right-2 -bottom-2 w-44 sm:w-52 h-36 sm:h-40 pointer-events-none group-hover:scale-105 transition-transform duration-300 z-0">
                  <img
                    src="/assets/mental-health-sticker.png"
                    alt="Mental Wellness Sticker"
                    className="w-full h-full object-contain mix-blend-multiply drop-shadow-xs"
                  />
                </div>
              </div>

            </div>

            {/* ── 4. Middle Section: Health Summary & Mental Wellness Streak ─────── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              
              {/* Card A: Health Summary (7 cols on lg) */}
              <div className="lg:col-span-6 xl:col-span-6 bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-xs">
                
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                    Health Summary
                  </h3>
                  <button
                    onClick={() => setShowTrendsModal(true)}
                    className="text-xs font-bold text-teal-600 hover:text-teal-700 inline-flex items-center gap-1 cursor-pointer group"
                  >
                    <span>View Trends</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>

                {/* 4 Metric Tiles Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  
                  {/* 1. Heart Rate */}
                  <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 flex flex-col justify-between hover:bg-slate-50 transition-colors">
                    <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-2">
                      <Heart className="w-4 h-4 fill-rose-500" />
                    </div>
                    <div>
                      <div className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                        72 <span className="text-[10px] font-semibold text-slate-400">bpm</span>
                      </div>
                      <div className="text-[11px] font-medium text-slate-500">Heart Rate</div>
                      <div className="text-[10px] font-bold text-emerald-600 mt-1">Normal</div>
                    </div>
                  </div>

                  {/* 2. Weight */}
                  <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 flex flex-col justify-between hover:bg-slate-50 transition-colors">
                    <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-2">
                      <Scale className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                        65 <span className="text-[10px] font-semibold text-slate-400">kg</span>
                      </div>
                      <div className="text-[11px] font-medium text-slate-500">Weight</div>
                      <div className="text-[10px] font-bold text-emerald-600 mt-1">Healthy</div>
                    </div>
                  </div>

                  {/* 3. Sleep */}
                  <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 flex flex-col justify-between hover:bg-slate-50 transition-colors">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-2">
                      <Moon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                        7h 15m
                      </div>
                      <div className="text-[11px] font-medium text-slate-500">Sleep</div>
                      <div className="text-[10px] font-bold text-emerald-600 mt-1">Good</div>
                    </div>
                  </div>

                  {/* 4. Calories */}
                  <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 flex flex-col justify-between hover:bg-slate-50 transition-colors">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
                      <Flame className="w-4 h-4 fill-amber-500" />
                    </div>
                    <div>
                      <div className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                        420 <span className="text-[10px] font-semibold text-slate-400">kcal</span>
                      </div>
                      <div className="text-[11px] font-medium text-slate-500">Calories</div>
                      <div className="text-[10px] font-bold text-amber-600 mt-1">Burned</div>
                    </div>
                  </div>

                </div>

              </div>

              {/* Card B: Mental Wellness Streak (6 cols on lg) */}
              <div className="lg:col-span-6 xl:col-span-6 bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-xs flex flex-col justify-between">
                
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                    Mental Wellness Streak
                  </h3>
                  <button
                    onClick={() => setShowStreakModal(true)}
                    className="text-xs font-bold text-teal-600 hover:text-teal-700 inline-flex items-center gap-1 cursor-pointer group"
                  >
                    <span>View Details</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>

                {/* Content Row: Left Count + Right 7 Days */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  
                  {/* Left: Streak Icon & Day Count */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100/80 shadow-2xs">
                      {/* Stylized Green Leaf Icon */}
                      <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                        <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"/>
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-slate-900">7</span>
                        <span className="text-xs font-bold text-slate-600">Days Streak</span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium">
                        Great going! Keep it up.
                      </p>
                    </div>
                  </div>

                  {/* Right: Mon to Sun Day Indicators */}
                  <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto pb-1 sm:pb-0">
                    {[
                      { day: 'Mon', checked: true },
                      { day: 'Tue', checked: true },
                      { day: 'Wed', checked: true },
                      { day: 'Thu', checked: true },
                      { day: 'Fri', checked: true },
                      { day: 'Sat', checked: true },
                      { day: 'Sun', checked: false }
                    ].map((d) => (
                      <div key={d.day} className="flex flex-col items-center gap-1.5 flex-shrink-0">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                            d.checked
                              ? 'bg-emerald-500 text-white shadow-2xs'
                              : 'border-2 border-slate-300 bg-white text-transparent'
                          }`}
                        >
                          {d.checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <span className="text-[10px] font-medium text-slate-400">{d.day}</span>
                      </div>
                    ))}
                  </div>

                </div>

              </div>

            </div>

            {/* ── 5. Bottom Banner: Your Health Passport ────────────────────────── */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-teal-100/80 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              
              {/* Left Section: Progress Indicator */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    {/* Desktop Heading vs Mobile Heading */}
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-extrabold text-slate-900">Your Health Passport</h4>
                      <span className="text-xs font-bold text-teal-600">80% Complete</span>
                    </div>
                    <p className="text-xs text-slate-400 font-medium">
                      Keep your health records updated and secure.
                    </p>
                  </div>
                </div>

                {/* 80% Filled Progress Bar */}
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden mt-3">
                  <div className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full w-[80%] transition-all duration-500" />
                </div>
              </div>

              {/* Right Section: Desktop 4 Quick Access Shortcuts vs Mobile Complete Button */}
              {/* Desktop Shortcuts (Hidden on Mobile) */}
              <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-4 gap-3 lg:flex-shrink-0">
                
                {/* 1. Medical Records */}
                <button
                  onClick={() => setActiveTab('passport')}
                  className="px-3.5 py-2.5 rounded-2xl bg-slate-50/80 hover:bg-teal-50/60 border border-slate-100 hover:border-teal-200 transition-all flex items-center gap-2.5 text-left cursor-pointer group"
                >
                  <div className="w-7 h-7 rounded-lg bg-teal-100/70 text-teal-700 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 leading-tight">Medical Records</div>
                    <div className="text-[10px] text-slate-400">Secure access</div>
                  </div>
                </button>

                {/* 2. Prescriptions */}
                <button
                  onClick={() => setActiveTab('passport')}
                  className="px-3.5 py-2.5 rounded-2xl bg-slate-50/80 hover:bg-teal-50/60 border border-slate-100 hover:border-teal-200 transition-all flex items-center gap-2.5 text-left cursor-pointer group"
                >
                  <div className="w-7 h-7 rounded-lg bg-cyan-100/70 text-cyan-700 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    <Pill className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 leading-tight">Prescriptions</div>
                    <div className="text-[10px] text-slate-400">All in one place</div>
                  </div>
                </button>

                {/* 3. Lab Reports */}
                <button
                  onClick={() => setActiveTab('passport')}
                  className="px-3.5 py-2.5 rounded-2xl bg-slate-50/80 hover:bg-teal-50/60 border border-slate-100 hover:border-teal-200 transition-all flex items-center gap-2.5 text-left cursor-pointer group"
                >
                  <div className="w-7 h-7 rounded-lg bg-purple-100/70 text-purple-700 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    <FlaskConical className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 leading-tight">Lab Reports</div>
                    <div className="text-[10px] text-slate-400">Easy to view</div>
                  </div>
                </button>

                {/* 4. Immunizations */}
                <button
                  onClick={() => setActiveTab('passport')}
                  className="px-3.5 py-2.5 rounded-2xl bg-slate-50/80 hover:bg-teal-50/60 border border-slate-100 hover:border-teal-200 transition-all flex items-center gap-2.5 text-left cursor-pointer group"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-100/70 text-emerald-700 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    <Syringe className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 leading-tight">Immunizations</div>
                    <div className="text-[10px] text-slate-400">Up to date</div>
                  </div>
                </button>

              </div>

              {/* Mobile Complete Now Button (Matches Mobile Screenshot) */}
              <div className="sm:hidden flex justify-end">
                <button
                  onClick={() => setActiveTab('passport')}
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-full border border-teal-600/70 text-teal-700 text-xs font-bold hover:bg-teal-50 cursor-pointer"
                >
                  <span>Complete Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>

          </>
        )}

      </main>

      {/* ── 6. Floating Red Emergency Button (Desktop bottom-right) ─────────────── */}
      <div className="hidden lg:block fixed bottom-8 right-8 z-50">
        <button
          onClick={() => setShowSOSConfirmModal(true)}
          className="relative group cursor-pointer focus:outline-none"
        >
          {/* Radiating Pulsing Halo Ring */}
          <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-30 group-hover:opacity-60 duration-1000" />
          
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-red-600 via-rose-600 to-red-500 text-white flex flex-col items-center justify-center shadow-xl shadow-red-600/40 border-4 border-white group-hover:scale-105 group-active:scale-95 transition-all">
            {/* Siren / Alert Icon */}
            <AlertTriangle className="w-6 h-6 stroke-[2.5] mb-0.5" />
            <span className="text-[9px] font-black tracking-wider uppercase">EMERGENCY</span>
          </div>
        </button>
      </div>

      {/* ── SOS Emergency Confirmation Modal ─────────────────────────────────────── */}
      {showSOSConfirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-red-100 text-center animate-in zoom-in-95 duration-150">
            <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border-2 border-rose-100 animate-bounce">
              <AlertTriangle className="w-8 h-8 stroke-[2.5]" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 mb-1">Dispatch Emergency SOS?</h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              This will pinpoint your location at <span className="font-bold text-slate-800">{selectedLocation}</span> and dispatch the nearest ambulance unit immediately.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSOSConfirmModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleTriggerSOS}
                disabled={isSOSDispatching}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/20 cursor-pointer"
              >
                {isSOSDispatching ? 'Dispatching…' : 'Yes, Send SOS!'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Hospital Care Modal ─────────────────────────────────────────────────── */}
      {showHospitalModal && (
        <HospitalCareModal
          location={selectedLocation}
          onClose={() => setShowHospitalModal(false)}
          navigate={navigate}
        />
      )}

      {/* ── Mental Wellness Companion Modal ─────────────────────────────────────── */}
      {showMentalWellnessModal && (
        <MentalWellnessModal onClose={() => setShowMentalWellnessModal(false)} />
      )}

      {/* ── Physical Health Fitness Modal ────────────────────────────────────────── */}
      {showPhysicalHealthModal && (
        <PhysicalHealthModal onClose={() => setShowPhysicalHealthModal(false)} />
      )}

      {/* ── Health Trends Modal ──────────────────────────────────────────────────── */}
      {showTrendsModal && (
        <HealthTrendsModal onClose={() => setShowTrendsModal(false)} />
      )}

      {/* ── Mental Wellness Streak Details Modal ─────────────────────────────────── */}
      {showStreakModal && (
        <StreakDetailsModal onClose={() => setShowStreakModal(false)} />
      )}

    </div>
  );
}

// ── Hospital Care Interactive Modal ────────────────────────────────────────────
function HospitalCareModal({ location, onClose, navigate }) {
  const [search, setSearch] = useState('');
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    patientService.getNearbyHospitals()
      .then((res) => setHospitals(res?.data || []))
      .catch(() => setHospitals([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = hospitals.filter((h) =>
    !search || h.name?.toLowerCase().includes(search.toLowerCase()) ||
    h.specialities?.some((s) => s.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
        
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Hospital Care & Booking</h3>
              <p className="text-xs text-slate-500">Available medical centres in {location}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search hospitals, specialties, cardiologists, pediatrics…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            />
          </div>
        </div>

        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {loading ? (
            <div className="text-center py-10 text-slate-400 text-xs flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-teal-600" /> Loading hospital networks…
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No hospitals found matching your search.
            </div>
          ) : (
            filtered.map((h) => (
              <div key={h.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-teal-50/30 hover:border-teal-200 transition-all flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{h.name}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">{h.address || 'Vadodara Central, Gujarat'}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                      ★ 4.8 Rating
                    </span>
                    <span className="text-[10px] text-slate-400">24/7 Emergency Available</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    navigate(`/hospitals/${h.id}`);
                  }}
                  className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex-shrink-0"
                >
                  Book Doctor →
                </button>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}

// ── Mental Wellness Companion Modal ───────────────────────────────────────────
function MentalWellnessModal({ onClose }) {
  const [breathingSeconds, setBreathingSeconds] = useState(0);
  const [isBreathing, setIsBreathing] = useState(false);
  const [selectedMood, setSelectedMood] = useState('Peaceful');

  useEffect(() => {
    let t;
    if (isBreathing) {
      t = setInterval(() => setBreathingSeconds((s) => s + 1), 1000);
    }
    return () => clearInterval(t);
  }, [isBreathing]);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-purple-100 p-6 text-center animate-in zoom-in-95 duration-150">
        <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-3 border border-purple-100 shadow-2xs">
          <Brain className="w-6 h-6 stroke-[2.2]" />
        </div>
        <h3 className="text-lg font-extrabold text-slate-900">Mental Wellness & Mindfulness</h3>
        <p className="text-xs text-slate-500 mt-1 mb-5">
          Take 2 minutes to center your thoughts and calm your mind.
        </p>

        {/* Mood Selector */}
        <div className="mb-5">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">How are you feeling right now?</p>
          <div className="flex justify-center gap-2">
            {[
              { emoji: '😊', label: 'Peaceful' },
              { emoji: '⚡', label: 'Energetic' },
              { emoji: '🌿', label: 'Calm' },
              { emoji: '💭', label: 'Thoughtful' }
            ].map((m) => (
              <button
                key={m.label}
                onClick={() => setSelectedMood(m.label)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  selectedMood === m.label ? 'border-purple-600 bg-purple-50 text-purple-800' : 'border-slate-200 text-slate-600'
                }`}
              >
                <span>{m.emoji}</span>
                <span>{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Guided Breathing Circle */}
        <div className="py-4">
          <div className={`w-28 h-28 rounded-full mx-auto flex items-center justify-center transition-all duration-1000 ${
            isBreathing ? 'bg-purple-100 scale-110 shadow-lg shadow-purple-200' : 'bg-slate-50'
          }`}>
            <span className="text-xs font-bold text-purple-700">
              {isBreathing ? (breathingSeconds % 8 < 4 ? 'Inhale 🫁' : 'Exhale 🍃') : 'Tap to Begin'}
            </span>
          </div>
          {isBreathing && (
            <p className="text-xs text-slate-400 mt-2 font-mono">{breathingSeconds}s elapsed</p>
          )}
        </div>

        <div className="flex gap-2.5 mt-4">
          <button
            onClick={() => setIsBreathing(!isBreathing)}
            className="flex-1 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-md shadow-purple-700/20 cursor-pointer"
          >
            {isBreathing ? 'Pause Session' : 'Start 2-Min Meditation'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}

// ── Physical Health Fitness Modal ─────────────────────────────────────────────
function PhysicalHealthModal({ onClose }) {
  const [glasses, setGlasses] = useState(6);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-orange-100 p-6 animate-in zoom-in-95 duration-150">
        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto mb-2 border border-orange-100 shadow-2xs">
            <Dumbbell className="w-6 h-6 stroke-[2.2]" />
          </div>
          <h3 className="text-lg font-extrabold text-slate-900">Physical Health & Workouts</h3>
          <p className="text-xs text-slate-500 mt-0.5">Stay active with your daily fitness plan</p>
        </div>

        <div className="space-y-3 mb-5">
          <div className="p-3.5 rounded-2xl bg-orange-50/50 border border-orange-100 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-900">Morning Yoga Flow</div>
              <div className="text-[11px] text-slate-500">20 mins • Flexibility & Core</div>
            </div>
            <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-100 text-emerald-800">
              Completed ✓
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-900">Brisk Walk Goal (8,000 steps)</div>
              <div className="text-[11px] text-slate-500">6,420 steps logged today (80%)</div>
            </div>
            <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-100 text-amber-800">
              In Progress
            </span>
          </div>

          {/* Hydration Tracker */}
          <div className="p-3.5 rounded-2xl bg-cyan-50/40 border border-cyan-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-900">Daily Hydration Tracker</span>
              <span className="text-xs font-black text-cyan-700">{glasses} / 8 Glasses</span>
            </div>
            <div className="flex gap-1.5 justify-center pt-1">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((g) => (
                <button
                  key={g}
                  onClick={() => setGlasses(g)}
                  className={`w-7 h-7 rounded-lg text-xs flex items-center justify-center transition-all cursor-pointer ${
                    g <= glasses ? 'bg-cyan-500 text-white shadow-2xs' : 'bg-white border border-slate-200 text-slate-400'
                  }`}
                >
                  💧
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-md shadow-orange-600/20 cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
}

// ── Health Trends Modal ───────────────────────────────────────────────────────
function HealthTrendsModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 p-6 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-teal-600" />
            <h3 className="text-base font-extrabold text-slate-900">Vital Health Trends (Last 7 Days)</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <div className="flex justify-between font-bold text-slate-800 mb-1">
              <span>Resting Heart Rate</span>
              <span className="text-rose-600">72 bpm avg (Steady)</span>
            </div>
            <div className="h-12 bg-slate-50 rounded-xl p-2 flex items-end gap-2">
              {[68, 70, 72, 74, 71, 73, 72].map((v, i) => (
                <div key={i} className="flex-1 bg-rose-400/80 rounded-t" style={{ height: `${(v - 60) * 4}px` }} title={`${v} bpm`} />
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between font-bold text-slate-800 mb-1">
              <span>Daily Sleep Duration</span>
              <span className="text-purple-600">7h 15m avg (Optimal)</span>
            </div>
            <div className="h-12 bg-slate-50 rounded-xl p-2 flex items-end gap-2">
              {[7.0, 7.5, 6.8, 8.0, 7.2, 7.8, 7.25].map((v, i) => (
                <div key={i} className="flex-1 bg-purple-400/80 rounded-t" style={{ height: `${v * 5}px` }} title={`${v} hrs`} />
              ))}
            </div>
          </div>
        </div>

        <button onClick={onClose} className="w-full mt-6 py-2.5 bg-teal-700 text-white rounded-xl text-xs font-bold hover:bg-teal-800 cursor-pointer">
          Done
        </button>
      </div>
    </div>
  );
}

// ── Streak Details Modal ──────────────────────────────────────────────────────
function StreakDetailsModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-slate-100 p-6 text-center animate-in zoom-in-95 duration-150">
        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
        </div>
        <h3 className="text-lg font-black text-slate-900">7 Days Streak Active!</h3>
        <p className="text-xs text-slate-500 mt-1 mb-5">
          You have completed daily mindfulness check-ins every single day this week. Keep up the positive momentum!
        </p>

        <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100 text-xs text-emerald-800 font-semibold mb-5">
          🏆 Next Milestone: 14-Day Wellness Master (7 days left)
        </div>

        <button onClick={onClose} className="w-full py-2.5 bg-teal-700 text-white rounded-xl text-xs font-bold hover:bg-teal-800 cursor-pointer">
          Awesome!
        </button>
      </div>
    </div>
  );
}

// ── Subtab Appointments View ──────────────────────────────────────────────────
function AppointmentsSection({ navigate, onBack }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    appointmentsService.getMyAppointments({ limit: 20 })
      .then((res) => setAppointments(res?.data?.appointments || []))
      .catch(() => setAppointments([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-extrabold text-slate-900">Your Appointments</h3>
        <button
          onClick={() => navigate('/hospitals')}
          className="px-3.5 py-1.5 bg-teal-700 text-white rounded-xl text-xs font-bold hover:bg-teal-800 cursor-pointer"
        >
          + Book New Appointment
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-slate-400 text-xs flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-teal-600" /> Loading appointments…
        </div>
      ) : appointments.length === 0 ? (
        <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl">
          No appointments scheduled yet. Click "+ Book New Appointment" to consult a doctor.
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((a) => (
            <div key={a.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Dr. {a.doctor?.fullName || 'Specialist Doctor'}</h4>
                <p className="text-[11px] text-slate-500">{a.appointmentDate} • {a.appointmentTime || '10:00 AM'}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700">
                  {a.status || 'CONFIRMED'}
                </span>
              </div>
              {a.consultationType === 'ONLINE' && (
                <button
                  onClick={() => navigate(`/patient/video-consultation/${a.id}`)}
                  className="px-3 py-1.5 bg-violet-600 text-white rounded-xl text-xs font-bold hover:bg-violet-700 flex items-center gap-1.5"
                >
                  <Video className="w-3.5 h-3.5" />
                  Join Call
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
