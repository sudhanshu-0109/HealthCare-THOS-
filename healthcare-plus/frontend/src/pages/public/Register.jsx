/**
 * Register.jsx — Split-panel, 100dvh, NO SCROLL on mobile or desktop.
 * Left: hero image with overlay + branding (desktop).
 * Right: compact form — fits in viewport without any page scrolling.
 * All auth logic preserved. Post-auth redirect → /health-hub.
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Heart, Shield, Building2, Brain, Dumbbell,
  Eye, EyeOff, Mail, Lock, User, Phone, UserPlus,
  ChevronRight, CheckCircle2
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
      await authService.register({ fullName: fullName.trim(), email, password, role: 'PATIENT' });
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
    /* Full viewport, no overflow */
    <div className="h-dvh overflow-hidden flex flex-col bg-white">

      {/* ── COMPACT HEADER ──────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-100 bg-white z-10">
        <Link to="/" className="flex items-center gap-2 no-underline">
          <div className="w-8 h-8 bg-teal-600 rounded-xl flex items-center justify-center">
            <Heart className="w-4 h-4 text-white fill-white" />
          </div>
          <span className="text-base font-bold text-slate-900">
            Healthcare<span className="text-teal-600">+</span>
          </span>
        </Link>
        <Link
          to="/login"
          className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-800 text-slate-800 rounded-lg font-semibold text-xs hover:bg-slate-50 transition-colors no-underline"
        >
          Sign In <ChevronRight className="w-3 h-3" />
        </Link>
      </header>

      {/* ── BODY: two panels ────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* LEFT PANEL — hero image + module pills (desktop only) */}
        <div className="hidden lg:flex flex-col relative overflow-hidden flex-1">
          <img
            src="/hero.png"
            alt="Healthcare+"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-teal-900/80 via-teal-800/60 to-transparent" />

          <div className="relative z-10 flex flex-col justify-center h-full px-10 xl:px-14">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-5 w-fit">
              <Shield className="w-3 h-3" /> Secure • Private • Trusted
            </div>
            <h1 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight mb-3">
              Join<br />Healthcare<span className="text-teal-300">+</span><br />
              <span className="text-teal-300">Today</span>
            </h1>
            <p className="text-white/80 text-sm leading-relaxed mb-6 max-w-xs">
              One account for hospital care, mental wellness &amp; physical health. Free for patients.
            </p>
            <div className="flex flex-col gap-2">
              {[
                { icon: Building2, label: 'Hospital Care — Book, consult, track', color: 'bg-teal-500/30' },
                { icon: Brain,     label: 'Mental Wellness — AI support & mindfulness', color: 'bg-purple-500/30' },
                { icon: Dumbbell,  label: 'Physical Health — Workouts & fitness', color: 'bg-orange-500/30' },
                { icon: Shield,    label: 'Secure & Private — Data encrypted', color: 'bg-white/20' },
              ].map((m) => (
                <div key={m.label} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl backdrop-blur-sm ${m.color} border border-white/20`}>
                  <m.icon className="w-4 h-4 text-white flex-shrink-0" />
                  <span className="text-white text-xs font-medium">{m.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL — form */}
        <div className="flex-1 lg:flex-none lg:w-[460px] xl:w-[500px] flex flex-col overflow-y-auto bg-white">
          <div className="flex-1 flex items-center justify-center px-5 sm:px-8 py-3">
            <div className="w-full max-w-sm">

              {step === 2 ? (
                /* ── OTP Step ───────────────────────────────────────────── */
                <div>
                  {/* Mobile hero strip */}
                  <div className="lg:hidden mb-4 rounded-2xl overflow-hidden h-24 relative">
                    <img src="/hero.png" alt="" className="w-full h-full object-cover object-top" />
                    <div className="absolute inset-0 bg-teal-800/60 flex items-center px-4">
                      <p className="text-white font-extrabold text-base">Verify Your Email</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center border border-teal-100 flex-shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-extrabold text-slate-900 leading-tight">Verify Your Email</h2>
                      <p className="text-slate-500 text-xs">6-digit code sent to <span className="font-semibold">{email}</span></p>
                    </div>
                  </div>

                  {error && <div className="mb-3 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">{error}</div>}
                  {successMessage && <div className="mb-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs">{successMessage}</div>}

                  <form onSubmit={handleVerifyOtp} className="space-y-3">
                    <OtpInput value={otp} onChange={setOtp} disabled={loading} error={Boolean(error)} />
                    <button type="submit" disabled={loading}
                      className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition-colors">
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
                /* ── Registration Form Step ─────────────────────────────── */
                <div>
                  {/* Mobile hero strip */}
                  <div className="lg:hidden mb-3 rounded-2xl overflow-hidden h-20 relative">
                    <img src="/hero.png" alt="" className="w-full h-full object-cover object-top" />
                    <div className="absolute inset-0 bg-gradient-to-r from-teal-800/70 to-teal-600/40 flex items-center px-4">
                      <div>
                        <p className="text-white font-extrabold text-sm leading-tight">Create Your Account</p>
                        <p className="text-teal-100 text-xs">Free for patients</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center border border-teal-100 flex-shrink-0">
                      <UserPlus className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-extrabold text-slate-900 leading-tight">Create Account</h2>
                      <p className="text-slate-500 text-xs">For patients only</p>
                    </div>
                  </div>

                  {error && (
                    <div className="mb-3 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                      {error}
                      {accountExists && (
                        <Link to="/login" className="inline-block mt-1.5 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg no-underline">
                          Go to Login
                        </Link>
                      )}
                    </div>
                  )}

                  <form onSubmit={handleRegister} className="space-y-2">
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="text" placeholder="Full Name" required className="hc-input py-2.5 text-sm"
                        value={fullName} onChange={(e) => setFullName(e.target.value)} />
                    </div>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="email" placeholder="Email Address" required className="hc-input py-2.5 text-sm"
                        value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="tel" placeholder="Phone Number" className="hc-input py-2.5 text-sm"
                        value={phone} onChange={(e) => setPhone(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type={showPassword ? 'text' : 'password'} placeholder="Password" required
                          className="hc-input py-2.5 pr-9 text-sm"
                          value={password} onChange={(e) => setPassword(e.target.value)} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type={showConfirm ? 'text' : 'password'} placeholder="Confirm" required
                          className="hc-input py-2.5 pr-9 text-sm"
                          value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                        <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                          {showConfirm ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <label className="flex items-start gap-2 cursor-pointer">
                      <input type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)}
                        className="mt-0.5 w-3.5 h-3.5 accent-teal-600" />
                      <span className="text-[11px] text-slate-500 leading-relaxed">
                        I agree to the <a href="#" className="text-teal-600 font-semibold no-underline hover:underline">Terms</a> &amp; <a href="#" className="text-teal-600 font-semibold no-underline hover:underline">Privacy Policy</a>
                      </span>
                    </label>

                    <button type="submit" disabled={loading}
                      className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition-colors">
                      {loading ? 'Creating Account…' : 'Create Account'}
                    </button>
                  </form>

                  <div className="relative my-2.5">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
                    <div className="relative flex justify-center"><span className="bg-white px-2 text-xs text-slate-400">or</span></div>
                  </div>

                  <GoogleLoginButton onError={(msg) => setError(msg)} />

                  <p className="flex items-center justify-center gap-1 text-[11px] text-slate-400 mt-2.5">
                    <Shield className="w-3 h-3" /> We respect your privacy and never share your data.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
