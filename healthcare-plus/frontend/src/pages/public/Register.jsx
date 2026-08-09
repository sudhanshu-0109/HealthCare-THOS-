/**
 * pages/public/Register.jsx — New AuthPage UI + full Phase 0 register/OTP flow (PATIENT only)
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Heart, ArrowLeft, Eye, EyeOff, Lock, Mail, User, ChevronRight, CheckCircle2, Users
} from 'lucide-react';
import * as authService from '../../services/auth.service';
import useAuthStore from '../../store/authStore';
import OtpInput from '../../components/auth/OtpInput';
import GoogleLoginButton from '../../components/auth/GoogleLoginButton';

export default function Register() {
  const navigate = useNavigate();
  const { user, token, setAuth } = useAuthStore();

  useEffect(() => {
    if (token && user) navigate('/dashboard', { replace: true });
  }, [token, user, navigate]);

  const [step, setStep] = useState(1); // 1: form, 2: OTP
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
    setLoading(true);
    try {
      await authService.register({ fullName: fullName.trim(), email, password, role: 'PATIENT' });
      setStep(2);
      setResendCooldown(60);
      setCanResend(false);
    } catch (err) {
      setAccountExists(false);
      if (err.status === 409) {
        setAccountExists(true);
        setError('An account already exists with this email. Please login instead.');
      } else {
        setError(err.message || 'Registration failed. Please try again.');
      }
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
    } catch (err) {
      setError(err.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    setLoading(true);
    try {
      await authService.resendVerification(email);
      setOtp(''); setResendCooldown(60); setCanResend(false);
      setSuccessMessage(`A new OTP has been sent to ${email}`);
    } catch (err) {
      setError(err.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-teal-50/20 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-cyan-100/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-teal-100/40 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-2xl relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 group mb-6">
            <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
            <span className="text-sm text-slate-400 group-hover:text-slate-600 transition-colors">Back to home</span>
          </Link>
          <div className="flex items-center justify-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-slate-900">healthcare<span className="text-cyan-600">+</span></span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-100">
            <Link to="/login" className="flex-1 py-4 text-sm font-semibold capitalize text-center text-slate-500 hover:text-slate-700 no-underline">
              Sign In
            </Link>
            <div className="flex-1 py-4 text-sm font-semibold capitalize text-center text-cyan-600 border-b-2 border-cyan-600 bg-cyan-50/30">
              Create Account
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {step === 2 ? (
              /* OTP Verification Step */
              <div>
                <div className="mb-6">
                  <h2 className="font-bold text-slate-900">Verify Your Email</h2>
                  <p className="text-sm text-slate-500 mt-1">Enter the 6-digit code sent to <span className="font-medium text-slate-700">{email}</span></p>
                </div>
                {error && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
                {successMessage && <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">{successMessage}</div>}
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <OtpInput value={otp} onChange={setOtp} disabled={loading} error={Boolean(error)} />
                  <button type="submit" disabled={loading} className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white rounded-xl font-semibold transition-colors">
                    {loading ? 'Verifying…' : 'Verify & Create Account'}
                  </button>
                </form>
                <div className="text-center mt-4 space-y-2">
                  {canResend ? (
                    <button onClick={handleResendOtp} disabled={loading} className="text-sm text-cyan-600 hover:underline">Resend OTP</button>
                  ) : (
                    <p className="text-sm text-slate-400">Resend in <span className="font-mono text-slate-700">{resendCooldown}s</span></p>
                  )}
                  <div><button onClick={() => setStep(1)} className="text-sm text-slate-500 hover:text-slate-700">← Back to form</button></div>
                </div>
              </div>
            ) : (
              /* Registration Form Step */
              <div>
                {/* Patient role badge */}
                <div className="mb-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium mb-3 border-2 border-cyan-200 bg-cyan-50 text-cyan-700">
                    <Users className="w-4 h-4" /> Patient
                  </div>
                  <h2 className="font-bold text-slate-900">Create your account</h2>
                  <p className="text-sm text-slate-500 mt-1">Fill in your details to get started. Staff accounts are created by hospital admins via invite.</p>
                </div>

                {/* Google OAuth */}
                <GoogleLoginButton onError={(msg) => setError(msg)} />
                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
                  <div className="relative flex justify-center text-xs text-slate-400"><span className="bg-white px-2">or</span></div>
                </div>

                {error && (
                  <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                    {error}
                    {accountExists && (
                      <div className="mt-3">
                        <Link to="/login" className="inline-block px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors">
                          Go to Login
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text" placeholder="John Doe" required
                        className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 transition-all"
                        value={fullName} onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="email" placeholder="you@example.com" required
                        className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 transition-all"
                        value={email} onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'} placeholder="Min. 8 characters" required
                        className="w-full pl-10 pr-10 py-2.5 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 transition-all"
                        value={password} onChange={(e) => setPassword(e.target.value)}
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type={showConfirm ? 'text' : 'password'} placeholder="Repeat password" required
                        className="w-full pl-10 pr-10 py-2.5 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 transition-all"
                        value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit" disabled={loading}
                    className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white rounded-xl font-semibold transition-colors shadow-sm"
                  >
                    {loading ? 'Creating Account…' : 'Create Account & Verify Email'}
                  </button>
                  <p className="text-center text-xs text-slate-400">
                    By signing up, you agree to our{' '}
                    <a href="#" className="text-cyan-600 hover:underline">Terms of Service</a>
                  </p>
                </form>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          Already have an account? <Link to="/login" className="text-cyan-600 hover:underline no-underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
