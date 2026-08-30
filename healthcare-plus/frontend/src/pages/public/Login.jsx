/**
 * Login.jsx — Split-panel, 100dvh, NO SCROLL on mobile or desktop.
 * Left: branding panel with hero image fills full viewport height.
 * Right: compact form card — role grid (4+3) + fields — all fits in viewport.
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Heart, Shield, Building2, Brain, Dumbbell,
  Eye, EyeOff, Mail, Lock, Users, Activity, FlaskConical,
  Pill, Truck, LogIn, ChevronRight
} from 'lucide-react';
import * as authService from '../../services/auth.service';
import useAuthStore from '../../store/authStore';
import { ROLE_HOME_ROUTE } from '../../utils/roleRedirect';
import GoogleLoginButton from '../../components/auth/GoogleLoginButton';

const ROLES = [
  { id: 'PATIENT',          icon: Users,         label: 'Patient' },
  { id: 'DOCTOR',           icon: Activity,      label: 'Doctor' },
  { id: 'HOSPITAL_ADMIN',   icon: Building2,     label: 'Admin' },
  { id: 'LAB_STAFF',        icon: FlaskConical,  label: 'Lab' },
  { id: 'PHARMACIST',       icon: Pill,          label: 'Pharmacist' },
  { id: 'AMBULANCE_DRIVER', icon: Truck,         label: 'Driver' },
  { id: 'SUPER_ADMIN',      icon: Shield,        label: 'Super Admin' },
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
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [accountNotFound, setAccountNotFound] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) { setError('Please enter your email and password.'); return; }
    setLoading(true);
    try {
      const response = await authService.login({ email, password, role: selectedRole });
      const { user: verifiedUser, accessToken } = response.data;
      setAuth({ user: verifiedUser, accessToken });
      const redirectUrl = searchParams.get('redirect');
      navigate(redirectUrl || ROLE_HOME_ROUTE[verifiedUser.role] || '/dashboard', { replace: true });
    } catch (err) {
      setAccountNotFound(false);
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
          to="/register"
          className="inline-flex items-center gap-1 px-3 py-1.5 border border-teal-600 text-teal-600 rounded-lg font-semibold text-xs hover:bg-teal-50 transition-colors no-underline"
        >
          Create Account <ChevronRight className="w-3 h-3" />
        </Link>
      </header>

      {/* ── BODY: two panels ────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* LEFT PANEL — hero image + branding (desktop only) */}
        <div className="hidden lg:flex flex-col relative overflow-hidden flex-1">
          {/* Full-bleed hero image */}
          <img
            src="/hero.png"
            alt="Healthcare+"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          {/* Dark gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-teal-900/80 via-teal-800/60 to-transparent" />

          {/* Content over image */}
          <div className="relative z-10 flex flex-col justify-center h-full px-10 xl:px-14">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-5 w-fit">
              <Shield className="w-3 h-3" /> Secure • Private • Trusted
            </div>
            <h1 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight mb-3">
              Complete<br />Healthcare<br />
              <span className="text-teal-300">Operating System</span>
            </h1>
            <p className="text-white/80 text-sm leading-relaxed mb-6 max-w-xs">
              Hospital care, mental wellness &amp; physical health — all in one intelligent platform.
            </p>

            {/* Three module pills */}
            <div className="flex flex-col gap-2">
              {[
                { icon: Building2, label: 'Hospital Care',   color: 'bg-teal-500/30' },
                { icon: Brain,     label: 'Mental Wellness', color: 'bg-purple-500/30' },
                { icon: Dumbbell,  label: 'Physical Health', color: 'bg-orange-500/30' },
              ].map((m) => (
                <div key={m.label} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl backdrop-blur-sm ${m.color} border border-white/20`}>
                  <m.icon className="w-4 h-4 text-white flex-shrink-0" />
                  <span className="text-white text-xs font-semibold">{m.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL — form (full width mobile, fixed width desktop) */}
        <div className="flex-1 lg:flex-none lg:w-[460px] xl:w-[500px] flex flex-col overflow-y-auto bg-white">
          <div className="flex-1 flex items-center justify-center px-5 sm:px-8 py-4">
            <div className="w-full max-w-sm">

              {/* Mobile hero strip */}
              <div className="lg:hidden mb-4 rounded-2xl overflow-hidden h-28 relative">
                <img src="/hero.png" alt="" className="w-full h-full object-cover object-top" />
                <div className="absolute inset-0 bg-gradient-to-r from-teal-800/70 to-teal-600/40 flex items-center px-4">
                  <div>
                    <p className="text-white font-extrabold text-lg leading-tight">Welcome Back!</p>
                    <p className="text-teal-100 text-xs">Sign in to Healthcare+</p>
                  </div>
                </div>
              </div>

              {/* Form header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center border border-teal-100 flex-shrink-0">
                  <LogIn className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 leading-tight">Welcome Back!</h2>
                  <p className="text-slate-500 text-xs">Sign in to continue to Healthcare+</p>
                </div>
              </div>

              {/* Role selector */}
              <div className="mb-3">
                <p className="text-xs font-bold text-slate-700 mb-2">Select Your Role</p>
                <div className="grid grid-cols-4 gap-1.5 mb-1.5">
                  {ROLES.slice(0, 4).map((role) => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setSelectedRole(role.id)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${
                        selectedRole === role.id
                          ? 'border-teal-500 bg-teal-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <role.icon className={`w-4 h-4 ${selectedRole === role.id ? 'text-teal-600' : 'text-slate-500'}`} />
                      <span className={`text-[9px] font-semibold leading-tight text-center ${selectedRole === role.id ? 'text-teal-700' : 'text-slate-500'}`}>
                        {role.label}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {ROLES.slice(4).map((role) => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setSelectedRole(role.id)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${
                        selectedRole === role.id
                          ? 'border-teal-500 bg-teal-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <role.icon className={`w-4 h-4 ${selectedRole === role.id ? 'text-teal-600' : 'text-slate-500'}`} />
                      <span className={`text-[9px] font-semibold leading-tight text-center ${selectedRole === role.id ? 'text-teal-700' : 'text-slate-500'}`}>
                        {role.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-3 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                  {error}
                  {accountNotFound && (
                    <Link to="/register" className="inline-block mt-1.5 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg no-underline">
                      Create Account
                    </Link>
                  )}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleLogin} className="space-y-2.5">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email" placeholder="Email Address" required
                    className="hc-input py-2.5 text-sm"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'} placeholder="Password" required
                    className="hc-input py-2.5 pr-10 text-sm"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex justify-end">
                  <Link to="/forgot-password" className="text-xs font-semibold text-teal-600 hover:underline no-underline">
                    Forgot Password?
                  </Link>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition-colors">
                  {loading ? 'Signing In…' : 'Sign In'}
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
                <div className="relative flex justify-center"><span className="bg-white px-2 text-xs text-slate-400">or</span></div>
              </div>

              <GoogleLoginButton role={selectedRole} onError={(msg) => setError(msg)} />

              <p className="flex items-center justify-center gap-1 text-[11px] text-slate-400 mt-3">
                <Shield className="w-3 h-3" /> Your data is encrypted and secure.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
