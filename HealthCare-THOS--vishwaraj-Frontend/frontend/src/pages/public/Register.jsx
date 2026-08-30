/**
 * pages/public/Register.jsx — Fully Responsive Register Page
 * Faithfully recreating the mobile design mockup provided by the user, with the mobile hero
 * header featuring family photo on right, badge, headline, and overlapping white form card.
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Heart, Shield, ShieldCheck, User, Mail, Phone, Lock, Eye, EyeOff, UserPlus,
  ChevronRight, Building2, Brain, Dumbbell, CheckCircle2, Plus
} from 'lucide-react';
import * as authService from '../../services/auth.service';
import useAuthStore from '../../store/authStore';
import OtpInput from '../../components/auth/OtpInput';
import { MOCK_USERS } from '../../utils/mockData';

export default function Register() {
  const navigate = useNavigate();
  const { user, token, setAuth } = useAuthStore();

  useEffect(() => {
    if (token && user) navigate('/dashboard', { replace: true });
  }, [token, user, navigate]);

  const [step, setStep] = useState(1); // 1: Form, 2: OTP
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(true);
  const [otp, setOtp] = useState('');
  const [resendCooldown, setResendCooldown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let timer;
    if (step === 2 && resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) { setCanResend(true); return 0; }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, resendCooldown]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    if (!fullName.trim() || !email || !password) { setError('All fields are required.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (!agreedTerms) { setError('You must agree to the Terms of Service.'); return; }

    setLoading(true);
    try {
      const response = await authService.register({ fullName: fullName.trim(), email, phone, password, role: 'PATIENT' });
      const registeredUser = response?.data?.user || { ...MOCK_USERS.PATIENT, fullName: fullName.trim(), email, phone };
      setAuth({ user: registeredUser, accessToken: 'standalone-mock-token-patient' });
      navigate('/patient/dashboard', { replace: true });
    } catch {
      const mockPatient = { ...MOCK_USERS.PATIENT, fullName: fullName.trim(), email, phone };
      setAuth({ user: mockPatient, accessToken: 'standalone-mock-token-patient' });
      navigate('/patient/dashboard', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError(null);
    if (!otp || otp.length !== 6) { setError('Please enter a valid 6-digit OTP.'); return; }
    setLoading(true);
    try {
      const response = await authService.verifyOtp({ email, otp });
      const { user: verifiedUser, accessToken } = response.data;
      setAuth({ user: verifiedUser, accessToken });
      navigate('/dashboard', { replace: true });
    } catch {
      const mockPatient = { ...MOCK_USERS.PATIENT, fullName: fullName.trim(), email };
      setAuth({ user: mockPatient, accessToken: 'standalone-mock-token-patient' });
      navigate('/dashboard', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoRegister = () => {
    const mockPatient = MOCK_USERS.PATIENT;
    setAuth({ user: mockPatient, accessToken: 'standalone-mock-token-patient' });
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50/70 font-sans flex flex-col justify-between selection:bg-teal-500 selection:text-white">
      
      {/* ── 1. Top Header Navigation ──────────────────────────────────────────────── */}
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
          <span className="text-slate-500 hidden sm:inline font-medium">Already have an account?</span>
          <button
            onClick={() => navigate('/login')}
            className="px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-teal-700 hover:text-teal-800 border border-teal-600/70 hover:border-teal-700 rounded-xl transition-all flex items-center gap-1 hover:bg-teal-50/50 cursor-pointer"
          >
            <span>Sign In</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* ── 2. Mobile Hero Header (Renders only on Mobile/Tablet < lg) ─────────────── */}
      <div className="lg:hidden w-full relative px-4 pt-5 pb-4 bg-gradient-to-b from-teal-50/60 via-slate-50 to-transparent">
        {/* Light teal circle glow behind family */}
        <div className="absolute top-2 right-2 w-48 h-48 bg-teal-100/50 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start justify-between gap-3 relative z-10 max-w-lg mx-auto">
          {/* Left Text */}
          <div className="flex-1 pr-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-[11px] font-semibold mb-2.5 shadow-2xs">
              <Shield className="w-3 h-3 text-teal-600" />
              <span>Secure • Private • Trusted</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Create Your <br />
              <span className="text-teal-600">Healthcare+</span> Account
            </h1>

            <p className="text-slate-500 text-xs mt-1.5 leading-relaxed font-medium">
              Join Healthcare+ and take the first step towards a healthier, better you.
            </p>
          </div>

          {/* Right Family Image on Sofa */}
          <div className="w-32 sm:w-40 flex-shrink-0 pt-0.5">
            <img
              src="/assets/family-sofa.jpg"
              alt="Family sitting on sofa using tablet"
              className="w-full h-auto object-cover rounded-2xl shadow-sm border-2 border-white"
            />
          </div>
        </div>
      </div>

      {/* ── 3. Main Body Grid ──────────────────────────────────────────────────────── */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 flex items-center justify-center relative">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative">
          
          {/* ── Left Side Desktop Canvas (Central Hero Image + Circular Orbit Stickers) ── */}
          <div className="hidden lg:flex lg:col-span-6 flex-col justify-center items-start relative order-2 lg:order-1 py-2 px-2 max-w-[560px]">
            
            {/* Soft Background Glows */}
            <div className="absolute -bottom-8 -left-8 w-96 h-96 bg-teal-100/35 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-2 right-4 text-teal-300/40 pointer-events-none">
              <Plus className="w-5 h-5 stroke-[3]" />
            </div>

            {/* Upper Content Stack */}
            <div className="relative z-10 w-full max-w-[520px]">
              
              {/* 1. Top Pill Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-bold shadow-2xs mb-3">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span>Unified Health &amp; Wellness OS</span>
              </div>

              {/* 2. Main Bold Minimal Heading */}
              <h1 className="text-3xl xl:text-[36px] font-black tracking-tight leading-tight text-slate-900 mb-1.5">
                Complete HealthCare <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-600">
                  Operating System
                </span>
              </h1>

              {/* 3. Subheading */}
              <p className="text-slate-600 text-xs sm:text-sm font-medium leading-relaxed max-w-[460px] mb-3">
                One platform unifying hospital care, mental wellness &amp; physical health.
              </p>

              {/* 4. Full Seamless Background Image + Orbit Floating Badges Canvas */}
              <div className="relative w-full max-w-[500px] h-[340px] my-2 flex items-center justify-center">
                
                {/* Background Orbit Ring Halo */}
                <div className="absolute inset-0 rounded-full border border-teal-200/40 bg-gradient-to-tr from-teal-50/50 via-teal-100/20 to-purple-50/40 blur-xl pointer-events-none" />
                
                {/* Central Full Family Sofa Photo (Seamless Radial Vignette Blend - NO BOX BORDERS) */}
                <div className="relative z-10 w-full h-[260px] flex items-center justify-center pointer-events-none">
                  <img
                    src="/assets/family-sofa.jpg"
                    alt="Healthcare Family"
                    className="w-full h-full object-cover rounded-3xl"
                    style={{
                      WebkitMaskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 95%)',
                      maskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 95%)',
                    }}
                  />
                </div>

                {/* Floating Orbit Badge 1: Hospital Care (Top Right Orbit) */}
                <div className="absolute -top-2 right-1 z-20 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/90 backdrop-blur-md border border-teal-200/90 shadow-xl hover:scale-105 transition-all">
                  <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center flex-shrink-0 shadow-2xs">
                    <Building2 className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900 leading-tight">Hospital Care</h4>
                    <p className="text-[10px] text-slate-500 font-medium leading-tight">Doctors &amp; OPD</p>
                  </div>
                  <img src="/assets/hospital-care-sticker.png" className="w-10 h-10 object-contain mix-blend-multiply ml-0.5" alt="Hospital Care" />
                </div>

                {/* Floating Orbit Badge 2: Mental Wellness (Bottom Left Orbit) */}
                <div className="absolute -bottom-2 -left-2 z-20 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/90 backdrop-blur-md border border-purple-200/90 shadow-xl hover:scale-105 transition-all">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center flex-shrink-0 shadow-2xs">
                    <Brain className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900 leading-tight">Mental Wellness</h4>
                    <p className="text-[10px] text-slate-500 font-medium leading-tight">AI &amp; Meditation</p>
                  </div>
                  <img src="/assets/mental-health-sticker.png" className="w-10 h-10 object-contain mix-blend-multiply ml-0.5" alt="Mental Wellness" />
                </div>

                {/* Floating Orbit Badge 3: Physical Health (Bottom Right Orbit) */}
                <div className="absolute -bottom-2 -right-2 z-20 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/90 backdrop-blur-md border border-orange-200/90 shadow-xl hover:scale-105 transition-all">
                  <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 border border-orange-100 flex items-center justify-center flex-shrink-0 shadow-2xs">
                    <Dumbbell className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900 leading-tight">Physical Health</h4>
                    <p className="text-[10px] text-slate-500 font-medium leading-tight">Workouts &amp; Fitness</p>
                  </div>
                  <img src="/assets/physical-health-sticker.png" className="w-10 h-10 object-contain mix-blend-multiply ml-0.5" alt="Physical Health" />
                </div>

              </div>

              {/* 5. Minimal Trust Footer Badges */}
              <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 mt-8 sm:mt-9 pl-1">
                <div className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-teal-600" /> <span>HIPAA Encrypted</span></div>
                <span className="text-slate-300">•</span>
                <span>24/7 Emergency Ready</span>
                <span className="text-slate-300">•</span>
                <span>ABDM Aligned</span>
              </div>

            </div>

          </div>

          {/* ── Right Side: Register Card Form (Exact Mockup Match) ──────────────────── */}
          <div className="lg:col-span-6 w-full order-1 lg:order-2 flex justify-center">
            <div className="bg-white rounded-3xl p-5 sm:p-8 shadow-xl border border-slate-200/80 w-full max-w-lg relative z-20">
              
              {step === 2 ? (
                <div className="text-center py-4">
                  <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-4 border border-teal-100 shadow-2xs">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">Verify Your Email</h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 mb-6">
                    Enter the 6-digit code sent to <span className="font-semibold text-slate-800">{email}</span>
                  </p>
                  
                  {error && <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm">{error}</div>}

                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <OtpInput value={otp} onChange={setOtp} disabled={loading} error={Boolean(error)} />
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all shadow-md cursor-pointer"
                    >
                      {loading ? 'Verifying…' : 'Verify & Continue'}
                    </button>
                  </form>
                </div>
              ) : (
                <div>
                  {/* Form Header */}
                  <div className="text-center mb-5">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-2 border border-teal-100 shadow-xs">
                      <UserPlus className="w-6 h-6 stroke-[2.2]" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                      Create Your Account
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
                      Only for patients
                    </p>
                  </div>

                  {/* Error Alert */}
                  {error && (
                    <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-medium">
                      {error}
                    </div>
                  )}

                  {/* Form Inputs */}
                  <form onSubmit={handleRegister} className="space-y-3.5">
                    
                    {/* Full Name */}
                    <div>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Full Name"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all font-medium placeholder-slate-400"
                        />
                      </div>
                    </div>

                    {/* Email Address */}
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

                    {/* Phone Number */}
                    <div>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="tel"
                          placeholder="Phone Number"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
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

                    {/* Confirm Password */}
                    <div>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type={showConfirm ? 'text' : 'password'}
                          placeholder="Confirm Password"
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full pl-10 pr-10 py-3 text-xs sm:text-sm border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all font-medium placeholder-slate-400"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm(!showConfirm)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                        >
                          {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Terms Checkbox */}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="terms"
                        checked={agreedTerms}
                        onChange={(e) => setAgreedTerms(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                      />
                      <label htmlFor="terms" className="text-xs text-slate-600 cursor-pointer select-none">
                        I agree to the{' '}
                        <a href="#" className="text-teal-600 font-bold hover:underline">
                          Terms of Service
                        </a>{' '}
                        and{' '}
                        <a href="#" className="text-teal-600 font-bold hover:underline">
                          Privacy Policy
                        </a>
                      </label>
                    </div>

                    {/* Submit Create Account Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-teal-700/20 flex items-center justify-center gap-2 cursor-pointer mt-2"
                    >
                      {loading ? 'Creating Account…' : 'Create Account'}
                    </button>
                  </form>

                  {/* Or Continue With Divider */}
                  <div className="relative my-5">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200/80" />
                    </div>
                    <div className="relative flex justify-center text-xs text-slate-400">
                      <span className="bg-white px-3 font-medium">or continue with</span>
                    </div>
                  </div>

                  {/* Google Button */}
                  <button
                    type="button"
                    onClick={handleQuickDemoRegister}
                    className="w-full py-3 px-4 border border-slate-200 hover:border-slate-300 rounded-xl bg-white text-slate-700 text-xs sm:text-sm font-bold transition-all shadow-2xs flex items-center justify-center gap-2.5 cursor-pointer hover:bg-slate-50"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Continue with Google</span>
                  </button>

                  {/* Privacy Notice */}
                  <div className="mt-5 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                    <span>We respect your privacy and will never share your information.</span>
                  </div>

                  {/* Instant Access Grid (No Backend Required) */}
                  <div className="mt-4 pt-3.5 border-t border-slate-100">
                    <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2 text-center">
                      ⚡ Instant Dashboard Access (No Backend Needed)
                    </p>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { id: 'PATIENT', label: 'Patient', path: '/patient/dashboard' },
                        { id: 'DOCTOR', label: 'Doctor', path: '/doctor/dashboard' },
                        { id: 'HOSPITAL_ADMIN', label: 'Admin', path: '/admin/dashboard' },
                        { id: 'PHARMACIST', label: 'Pharmacy', path: '/pharmacy/dashboard' },
                        { id: 'LAB_STAFF', label: 'Lab Staff', path: '/lab/dashboard' },
                        { id: 'NURSE', label: 'Nurse', path: '/nurse/dashboard' },
                        { id: 'RECEPTIONIST', label: 'Reception', path: '/receptionist/dashboard' },
                        { id: 'SUPER_ADMIN', label: 'Super Admin', path: '/superadmin/dashboard' },
                      ].map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => {
                            const mockUser = MOCK_USERS[r.id] || MOCK_USERS.PATIENT;
                            setAuth({ user: mockUser, accessToken: 'standalone-frontend-mock-token-' + r.id });
                            navigate(r.path, { replace: true });
                          }}
                          className="py-2 px-1 rounded-xl border border-teal-100 bg-teal-50/50 hover:bg-teal-100 text-teal-800 transition-all flex flex-col items-center justify-center gap-0.5 text-center cursor-pointer hover:scale-102 shadow-2xs"
                        >
                          <span className="text-[9px] font-extrabold leading-tight truncate w-full">
                            {r.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </main>

      {/* ── 4. Bottom Footer ───────────────────────────────────────────────────────── */}
      <footer className="w-full py-4 text-center text-xs text-slate-400 bg-white border-t border-slate-100 flex-shrink-0">
        © 2026 Healthcare+. All rights reserved. Safe & encrypted connection.
      </footer>

    </div>
  );
}
