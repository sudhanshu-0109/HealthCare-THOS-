/**
 * pages/public/Login.jsx — Fully Responsive Login Page
 * Enhanced UI from new frontend design.
 * All mock/demo login code removed — real backend authentication only.
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Heart, Shield, ShieldCheck, Mail, Lock, Eye, EyeOff, LogIn, ChevronRight,
  User, Activity, Building2, Brain, Dumbbell, FlaskConical, Pill, Truck, CheckCircle2,
  Plus, UserCheck
} from 'lucide-react';
import * as authService from '../../services/auth.service';
import useAuthStore from '../../store/authStore';
import { ROLE_HOME_ROUTE } from '../../utils/roleRedirect';
import GoogleLoginButton from '../../components/auth/GoogleLoginButton';

const ROLES = [
  { id: 'PATIENT', icon: User, label: 'Patient' },
  { id: 'DOCTOR', icon: Activity, label: 'Doctor' },
  { id: 'HOSPITAL_ADMIN', icon: Building2, label: 'Hospital Admin' },
  { id: 'LAB_STAFF', icon: FlaskConical, label: 'Lab Staff' },
  { id: 'PHARMACIST', icon: Pill, label: 'Pharmacist' },
  { id: 'AMBULANCE_DRIVER', icon: Truck, label: 'Ambulance Driver' },
  { id: 'RECEPTIONIST', icon: UserCheck, label: 'Receptionist' },
  { id: 'SUPER_ADMIN', icon: Shield, label: 'Super Admin' },
];

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, token, setAuth } = useAuthStore();

  useEffect(() => {
    if (token && user) {
      const redirectUrl = searchParams.get('redirect');
      navigate(redirectUrl || ROLE_HOME_ROUTE[user.role] || '/dashboard', { replace: true });
    }
  }, [token, user, navigate, searchParams]);

  const [selectedRole, setSelectedRole] = useState('PATIENT');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [accountNotFound, setAccountNotFound] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setAccountNotFound(false);
    if (!email || !password) { setError('Please enter your email and password.'); return; }
    setLoading(true);
    try {
      const response = await authService.login({ email, password, role: selectedRole });
      const { user: verifiedUser, accessToken } = response.data;
      setAuth({ user: verifiedUser, accessToken });
      const redirectUrl = searchParams.get('redirect');
      navigate(redirectUrl || ROLE_HOME_ROUTE[verifiedUser.role] || '/dashboard', { replace: true });
    } catch (err) {
      if (err.errors?.code === 'ROLE_MISMATCH') {
        setError('Role mismatch — please select the correct role for this account.');
      } else if (err.errors?.accountExists === false) {
        setAccountNotFound(true);
        setError('No account found. Please create an account first.');
      } else {
        setError(err.message || 'Invalid email or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 font-sans flex flex-col justify-between selection:bg-teal-500 selection:text-white">
      
      {/* ── 1. Top Header ──────────────────────────────────────────────────────────── */}
      <header className="py-3.5 px-4 sm:px-8 flex items-center justify-between bg-white border-b border-slate-100 flex-shrink-0 z-30 shadow-2xs">
        <Link to="/" className="flex items-center gap-2 no-underline group">
          <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
            <Heart className="w-4 h-4 text-white fill-white/20" />
          </div>
          <span className="text-lg font-bold text-slate-900 tracking-tight">
            Healthcare<span className="text-teal-600 font-extrabold">+</span>
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
          <span className="text-slate-500 hidden sm:inline font-medium">New here?</span>
          <button
            onClick={() => navigate('/register')}
            className="px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-teal-700 hover:text-teal-800 border border-teal-600/70 hover:border-teal-700 rounded-xl transition-all flex items-center gap-1 hover:bg-teal-50/50 cursor-pointer"
          >
            <span>Create Account</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* ── 2. Mobile Hero Header (<lg screens) ────────────────────────────────────── */}
      <div className="lg:hidden w-full relative px-4 pt-5 pb-4 bg-gradient-to-b from-teal-50/60 via-slate-50 to-transparent">
        <div className="absolute top-2 right-2 w-48 h-48 bg-teal-100/50 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start justify-between gap-3 relative z-10 max-w-lg mx-auto">
          {/* Left Text */}
          <div className="flex-1 pr-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-[11px] font-semibold mb-2.5 shadow-2xs">
              <Shield className="w-3 h-3 text-teal-600" />
              <span>Secure • Private • Trusted</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Sign In to Your <br />
              <span className="text-teal-600">Healthcare+</span> Portal
            </h1>

            <p className="text-slate-500 text-xs mt-1.5 leading-relaxed font-medium">
              One unified platform for appointments, consultations, and health records.
            </p>
          </div>

          {/* Right Family Image */}
          <div className="w-32 sm:w-40 flex-shrink-0 pt-0.5">
            <img
              src="/assets/family-sofa.jpg"
              alt="Family sitting on sofa using tablet"
              className="w-full h-auto object-cover rounded-2xl shadow-sm border-2 border-white"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
        </div>
      </div>

      {/* ── 3. Main Page Body ────────────────────────────────────────────────────── */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 flex items-center justify-center relative">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative">
          
          {/* ── Left Side Desktop Hero ── */}
          <div className="hidden lg:flex lg:col-span-6 flex-col justify-center items-start relative order-2 lg:order-1 py-2 px-2 max-w-[560px]">
            
            {/* Soft Background Glows */}
            <div className="absolute -bottom-8 -left-8 w-96 h-96 bg-teal-100/35 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-2 right-4 text-teal-300/40 pointer-events-none">
              <Plus className="w-5 h-5 stroke-[3]" />
            </div>

            <div className="relative z-10 w-full max-w-[520px]">
              
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-bold shadow-2xs mb-3">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span>Unified Health &amp; Wellness OS</span>
              </div>

              {/* Heading */}
              <h1 className="text-3xl xl:text-[36px] font-black tracking-tight leading-tight text-slate-900 mb-1.5">
                Complete HealthCare <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-600">
                  Operating System
                </span>
              </h1>

              <p className="text-slate-600 text-xs sm:text-sm font-medium leading-relaxed max-w-[460px] mb-3">
                One platform unifying hospital care, mental wellness &amp; physical health.
              </p>

                {/* Hero Image with floating badges */}
                <div className="relative w-full max-w-[500px] h-[340px] my-2 flex items-center justify-center">
                  {/* Background Orbit Ring Halo */}
                  <div className="absolute inset-0 rounded-full border border-teal-200/40 bg-gradient-to-tr from-teal-50/50 via-teal-100/20 to-purple-50/40 blur-xl pointer-events-none" />
                  
                  {/* Central Family Sofa Photo */}
                  <div className="relative z-10 w-full h-[260px] flex items-center justify-center pointer-events-none overflow-hidden rounded-3xl">
                    <img
                      src="/assets/family-sofa.jpg"
                      alt="Healthcare Family"
                      className="w-full h-full object-cover object-center rounded-3xl"
                      style={{
                        WebkitMaskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 95%)',
                        maskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 95%)',
                      }}
                    />
                  </div>

                  {/* Floating Badge 1: Hospital Care */}
                  <div className="absolute -top-2 right-1 z-20 flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/95 backdrop-blur-md border border-teal-200/90 shadow-lg hover:scale-105 transition-all">
                    <div className="w-7 h-7 rounded-xl bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center flex-shrink-0 shadow-2xs">
                      <Building2 className="w-3.5 h-3.5 stroke-[2.2]" />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-extrabold text-slate-900 leading-tight">Hospital Care</h4>
                      <p className="text-[9px] text-slate-500 font-medium leading-tight">Doctors &amp; OPD</p>
                    </div>
                    <img src="/assets/hospital-care-sticker.png" className="w-8 h-8 object-contain mix-blend-multiply ml-0.5" alt="Hospital Care" />
                  </div>

                  {/* Floating Badge 2: Mental Wellness */}
                  <div className="absolute -bottom-2 -left-2 z-20 flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/95 backdrop-blur-md border border-purple-200/90 shadow-lg hover:scale-105 transition-all">
                    <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center flex-shrink-0 shadow-2xs">
                      <Brain className="w-3.5 h-3.5 stroke-[2.2]" />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-extrabold text-slate-900 leading-tight">Mental Wellness</h4>
                      <p className="text-[9px] text-slate-500 font-medium leading-tight">AI &amp; Meditation</p>
                    </div>
                    <img src="/assets/mental-health-sticker.png" className="w-8 h-8 object-contain mix-blend-multiply ml-0.5" alt="Mental Wellness" />
                  </div>

                  {/* Floating Badge 3: Physical Health */}
                  <div className="absolute -bottom-2 -right-2 z-20 flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/95 backdrop-blur-md border border-orange-200/90 shadow-lg hover:scale-105 transition-all">
                    <div className="w-7 h-7 rounded-xl bg-orange-50 text-orange-600 border border-orange-100 flex items-center justify-center flex-shrink-0 shadow-2xs">
                      <Dumbbell className="w-3.5 h-3.5 stroke-[2.2]" />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-extrabold text-slate-900 leading-tight">Physical Health</h4>
                      <p className="text-[9px] text-slate-500 font-medium leading-tight">Workouts &amp; Fitness</p>
                    </div>
                    <img src="/assets/physical-health-sticker.png" className="w-8 h-8 object-contain mix-blend-multiply ml-0.5" alt="Physical Health" />
                  </div>
                </div>

              {/* Trust Footer Badges */}
              <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 mt-8 sm:mt-9 pl-1">
                <div className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-teal-600" /> <span>HIPAA Encrypted</span></div>
                <span className="text-slate-300">•</span>
                <span>24/7 Emergency Ready</span>
                <span className="text-slate-300">•</span>
                <span>ABDM Aligned</span>
              </div>
            </div>
          </div>

          {/* ── Right Side: Login Card ─────────────────────────────────────────── */}
          <div className="lg:col-span-6 w-full order-1 lg:order-2 flex justify-center">
            <div className="bg-white rounded-3xl p-5 sm:p-8 shadow-xl border border-slate-200/80 w-full max-w-md relative z-20">
              
              {/* Card Header */}
              <div className="text-center mb-4">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-2 border border-teal-100 shadow-xs">
                  <LogIn className="w-6 h-6 stroke-[2.2]" />
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  Welcome Back!
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Sign in to continue to Healthcare+
                </p>
              </div>

              {/* Role Selection Grid */}
              <div className="mb-4">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Your Role
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {ROLES.map((r) => {
                    const isSelected = selectedRole === r.id;
                    const Icon = r.icon;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setSelectedRole(r.id)}
                        className={`p-2 rounded-xl border transition-all flex flex-col items-center justify-center gap-1 text-center cursor-pointer ${
                          isSelected
                            ? 'border-2 border-teal-600 bg-teal-50/60 text-teal-800 font-bold shadow-2xs'
                            : 'border-slate-200/80 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-teal-600' : 'text-slate-500'}`} />
                        <span className="text-[10px] leading-tight font-medium truncate w-full">
                          {r.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="mb-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {error}
                  {accountNotFound && (
                    <Link to="/register" className="block mt-1.5 text-rose-600 hover:text-rose-800 font-bold underline">
                      Create an account →
                    </Link>
                  )}
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-3.5">
                
                {/* Email */}
                <div>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      placeholder="Email Address"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all font-medium placeholder-slate-400"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 text-xs sm:text-sm border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all font-medium placeholder-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Forgot Password Link */}
                <div className="flex justify-end pt-0">
                  <Link
                    to="/forgot-password"
                    className="text-xs font-bold text-teal-600 hover:text-teal-700 hover:underline no-underline"
                  >
                    Forgot Password?
                  </Link>
                </div>

                {/* Sign In Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-teal-700/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? 'Signing In…' : 'Sign In'}
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200/80" />
                </div>
                <div className="relative flex justify-center text-xs text-slate-400">
                  <span className="bg-white px-3 font-medium">or continue with</span>
                </div>
              </div>

              {/* Google Login */}
              <GoogleLoginButton />

              {/* Privacy Notice */}
              <div className="mt-4 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                <span>Your data is encrypted and secure with us.</span>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* ── 4. Bottom Footer ──────────────────────────────────────────────────────── */}
      <footer className="w-full py-4 text-center text-xs text-slate-400 bg-white border-t border-slate-100 flex-shrink-0">
        © 2026 Healthcare+. All rights reserved. Safe &amp; encrypted connection.
      </footer>

    </div>
  );
}
