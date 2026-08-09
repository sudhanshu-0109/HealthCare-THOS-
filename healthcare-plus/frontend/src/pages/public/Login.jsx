/**
 * pages/public/Login.jsx — New AuthPage UI design + full backend auth logic (Phase 0-2 preserved)
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Heart, Users, Activity, Building2, FlaskConical, Pill, Truck, Shield,
  Eye, EyeOff, ArrowLeft, CheckCircle2, Lock, Mail, ChevronRight
} from 'lucide-react';
import * as authService from '../../services/auth.service';
import useAuthStore from '../../store/authStore';
import { ROLE_HOME_ROUTE } from '../../utils/roleRedirect';
import OtpInput from '../../components/auth/OtpInput';
import GoogleLoginButton from '../../components/auth/GoogleLoginButton';

const ROLES = [
  { id: 'PATIENT', icon: Users, label: 'Patient', desc: 'Book appointments, track health', color: 'border-cyan-200 bg-cyan-50 text-cyan-700', activeColor: 'border-cyan-600 bg-cyan-600 text-white' },
  { id: 'DOCTOR', icon: Activity, label: 'Doctor', desc: 'Manage patients & consultations', color: 'border-emerald-200 bg-emerald-50 text-emerald-700', activeColor: 'border-emerald-600 bg-emerald-600 text-white' },
  { id: 'HOSPITAL_ADMIN', icon: Building2, label: 'Hospital Admin', desc: 'Oversee hospital operations', color: 'border-blue-200 bg-blue-50 text-blue-700', activeColor: 'border-blue-600 bg-blue-600 text-white' },
  { id: 'LAB_STAFF', icon: FlaskConical, label: 'Lab Technician', desc: 'Process tests & upload reports', color: 'border-violet-200 bg-violet-50 text-violet-700', activeColor: 'border-violet-600 bg-violet-600 text-white' },
  { id: 'PHARMACIST', icon: Pill, label: 'Pharmacist', desc: 'Manage prescriptions & orders', color: 'border-orange-200 bg-orange-50 text-orange-700', activeColor: 'border-orange-500 bg-orange-500 text-white' },
  { id: 'AMBULANCE_DRIVER', icon: Truck, label: 'Ambulance Driver', desc: 'Handle emergency dispatch', color: 'border-red-200 bg-red-50 text-red-700', activeColor: 'border-red-600 bg-red-600 text-white' },
  { id: 'SUPER_ADMIN', icon: Shield, label: 'Super Admin', desc: 'Platform-wide control', color: 'border-slate-200 bg-slate-50 text-slate-700', activeColor: 'border-slate-700 bg-slate-700 text-white' },
];

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, token, setAuth } = useAuthStore();

  // Redirect if already authenticated
  useEffect(() => {
    if (token && user) {
      const redirectUrl = searchParams.get('redirect');
      const targetRoute = redirectUrl || ROLE_HOME_ROUTE[user.role] || '/dashboard';
      navigate(targetRoute, { replace: true });
    }
  }, [token, user, navigate, searchParams]);

  const [selectedRole, setSelectedRole] = useState('PATIENT');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [accountNotFound, setAccountNotFound] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    if (!email || !password) { setError('Please enter your email and password.'); return; }
    setLoading(true);
    try {
      const response = await authService.login({ email, password });
      const { user: loggedInUser, accessToken } = response.data;
      setAuth({ user: loggedInUser, accessToken });
      const redirectUrl = searchParams.get('redirect');
      const targetRoute = redirectUrl || ROLE_HOME_ROUTE[loggedInUser.role] || '/dashboard';
      navigate(targetRoute, { replace: true });
    } catch (err) {
      setAccountNotFound(false);
      if (err.errors?.accountExists === false) {
        setAccountNotFound(true);
        setError('No account found with this email. Please create an account first.');
      } else {
        setError(err.message || 'Invalid email or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedRoleObj = ROLES.find((r) => r.id === selectedRole);

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
            <div className="flex-1 py-4 text-sm font-semibold capitalize text-center text-cyan-600 border-b-2 border-cyan-600 bg-cyan-50/30">
              Sign In
            </div>
            <Link to="/register" className="flex-1 py-4 text-sm font-semibold capitalize text-center text-slate-500 hover:text-slate-700 no-underline">
              Create Account
            </Link>
          </div>

          <div className="p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="font-bold text-slate-900 mb-1">Welcome back</h2>
              <p className="text-sm text-slate-500">Select your role and sign in to your dashboard</p>
            </div>

            {/* Role selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {ROLES.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedRole(r.id)}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left ${
                    selectedRole === r.id ? r.activeColor : r.color + ' hover:border-opacity-60'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${selectedRole === r.id ? 'bg-white/20' : 'bg-white'}`}>
                    <r.icon className={`w-4 h-4 ${selectedRole === r.id ? 'text-white' : ''}`} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold">{r.label}</div>
                    <div className={`text-xs leading-tight mt-0.5 ${selectedRole === r.id ? 'text-white/80' : 'text-slate-400'}`}>{r.desc}</div>
                  </div>
                  {selectedRole === r.id && <CheckCircle2 className="w-4 h-4 text-white ml-auto flex-shrink-0" />}
                </button>
              ))}
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
                {accountNotFound && (
                  <div className="mt-3">
                    <Link to="/register" className="inline-block px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors">
                      Create Account
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Google OAuth (only for Patient self-registration) */}
            {selectedRole === 'PATIENT' && (
              <>
                <GoogleLoginButton onError={(msg) => setError(msg)} />
                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
                  <div className="relative flex justify-center text-xs text-slate-400"><span className="bg-white px-2">or</span></div>
                </div>
              </>
            )}

            {/* Login form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-10 py-2.5 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-xs text-cyan-600 hover:underline no-underline">Forgot password?</Link>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white rounded-xl font-semibold transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                {loading ? 'Signing In…' : `Sign In as ${selectedRoleObj?.label}`} {!loading && <ChevronRight className="w-4 h-4" />}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          Don&apos;t have an account? <Link to="/register" className="text-cyan-600 hover:underline no-underline">Register</Link>
        </p>
      </div>
    </div>
  );
}
