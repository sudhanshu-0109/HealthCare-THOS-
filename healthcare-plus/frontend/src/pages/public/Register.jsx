/**
 * pages/public/Register.jsx — Fully Responsive Register Page
 * Enhanced UI from new frontend design.
 * All mock/demo code removed — real backend authentication only.
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Heart, Shield, ShieldCheck, Building2, Brain, Dumbbell,
  Eye, EyeOff, Mail, Lock, User, Phone, UserPlus,
  ChevronRight, CheckCircle2, Plus
} from 'lucide-react';
import * as authService from '../../services/auth.service';
import useAuthStore from '../../store/authStore';
import OtpInput from '../../components/auth/OtpInput';
import GoogleLoginButton from '../../components/auth/GoogleLoginButton';

export default function Register() {
  const navigate = useNavigate();
  const { user, token, setAuth } = useAuthStore();

  useEffect(() => {
    if (token && user) navigate('/health-hub', { replace: true });
  }, [token, user, navigate]);

  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [otp, setOtp] = useState('');
  const [resendCooldown, setResendCooldown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [accountExists, setAccountExists] = useState(false);

  useEffect(() => {
    let timer;
    if (step === 2 && resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => { if (prev <= 1) { setCanResend(true); return 0; } return prev - 1; });
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
    if (!agreedToTerms) { setError('Please agree to the Terms of Service and Privacy Policy.'); return; }
    setLoading(true);
    try {
      await authService.register({ fullName: fullName.trim(), email, phone, password, role: 'PATIENT' });
      setStep(2); setResendCooldown(60); setCanResend(false);
    } catch (err) {
      setAccountExists(false);
      if (err.status === 409) { setAccountExists(true); setError('Account already exists. Please login instead.'); }
      else { setError(err.message || 'Registration failed. Please try again.'); }
    } finally { setLoading(false); }
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
      navigate('/health-hub', { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid OTP. Please try again.');
    } finally { setLoading(false); }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    setLoading(true);
    try {
      await authService.resendVerification(email);
      setOtp(''); setResendCooldown(60); setCanResend(false);
      setSuccessMessage(`A new OTP was sent to ${email}`);
    } catch (err) { setError(err.message || 'Failed to resend OTP.'); }
    finally { setLoading(false); }
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

      {/* ── 2. Mobile Hero Header (<lg screens) ────────────────────────────────────── */}
      <div className="lg:hidden w-full relative px-4 pt-5 pb-4 bg-gradient-to-b from-teal-50/60 via-slate-50 to-transparent">
        <div className="absolute top-2 right-2 w-48 h-48 bg-teal-100/50 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-start justify-between gap-3 relative z-10 max-w-lg mx-auto">
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

      {/* ── 3. Main Body ─────────────────────────────────────────────────────────── */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 flex items-center justify-center relative">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative">

          {/* ── Left Side Desktop Hero ── */}
          <div className="hidden lg:flex lg:col-span-6 flex-col justify-center items-start relative order-2 lg:order-1 py-2 px-2 max-w-[560px]">
            <div className="absolute -bottom-8 -left-8 w-96 h-96 bg-teal-100/35 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-2 right-4 text-teal-300/40 pointer-events-none">
              <Plus className="w-5 h-5 stroke-[3]" />
            </div>
            <div className="relative z-10 w-full max-w-[520px]">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-bold shadow-2xs mb-3">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span>Unified Health &amp; Wellness OS</span>
              </div>
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

              {/* Trust badges */}
              <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 mt-8 sm:mt-9 pl-1">
                <div className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-teal-600" /> <span>HIPAA Encrypted</span></div>
                <span className="text-slate-300">•</span>
                <span>24/7 Emergency Ready</span>
                <span className="text-slate-300">•</span>
                <span>ABDM Aligned</span>
              </div>
            </div>
          </div>

          {/* ── Right Side: Register Card ─────────────────────────────────────── */}
          <div className="lg:col-span-6 w-full order-1 lg:order-2 flex justify-center">
            <div className="bg-white rounded-3xl p-5 sm:p-8 shadow-xl border border-slate-200/80 w-full max-w-lg relative z-20">
              
              {step === 2 ? (
                /* ── OTP Verification Step ─────────────────────────────────── */
                <div className="text-center py-4">
                  <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-4 border border-teal-100 shadow-2xs">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">Verify Your Email</h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 mb-6">
                    Enter the 6-digit code sent to <span className="font-semibold text-slate-800">{email}</span>
                  </p>

                  {error && <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm">{error}</div>}
                  {successMessage && <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs sm:text-sm">{successMessage}</div>}

                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <OtpInput value={otp} onChange={setOtp} disabled={loading} error={Boolean(error)} />
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all shadow-md cursor-pointer"
                    >
                      {loading ? 'Verifying…' : 'Verify & Create Account'}
                    </button>
                  </form>
                  <div className="text-center mt-4 space-y-2">
                    {canResend
                      ? <button onClick={handleResendOtp} disabled={loading} className="text-sm text-teal-600 font-semibold hover:underline">Resend OTP</button>
                      : <p className="text-sm text-slate-400">Resend in <span className="font-mono text-slate-700">{resendCooldown}s</span></p>
                    }
                    <div><button onClick={() => setStep(1)} className="text-xs text-slate-500 hover:text-slate-700">← Back to form</button></div>
                  </div>
                </div>
              ) : (
                /* ── Registration Form Step ────────────────────────────────── */
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
                      Patient accounts only
                    </p>
                  </div>

                  {/* Error Alert */}
                  {error && (
                    <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-medium">
                      {error}
                      {accountExists && (
                        <Link to="/login" className="inline-block mt-1.5 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg no-underline">
                          Go to Login
                        </Link>
                      )}
                    </div>
                  )}

                  {/* Form Inputs */}
                  <form onSubmit={handleRegister} className="space-y-3.5">
                    
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

                    <div>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="tel"
                          placeholder="Phone Number (optional)"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all font-medium placeholder-slate-400"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Password (min 8 chars)"
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

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="terms"
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                      />
                      <label htmlFor="terms" className="text-xs text-slate-600 cursor-pointer select-none">
                        I agree to the{' '}
                        <a href="#" className="text-teal-600 font-bold hover:underline">Terms of Service</a>
                        {' '}and{' '}
                        <a href="#" className="text-teal-600 font-bold hover:underline">Privacy Policy</a>
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-teal-700/20 flex items-center justify-center gap-2 cursor-pointer mt-2"
                    >
                      {loading ? 'Creating Account…' : 'Create Account'}
                    </button>
                  </form>

                  <div className="relative my-5">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200/80" />
                    </div>
                    <div className="relative flex justify-center text-xs text-slate-400">
                      <span className="bg-white px-3 font-medium">or continue with</span>
                    </div>
                  </div>

                  <GoogleLoginButton onError={(msg) => setError(msg)} />

                  <div className="mt-5 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                    <span>We respect your privacy and will never share your information.</span>
                  </div>
                </div>
              )}
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
