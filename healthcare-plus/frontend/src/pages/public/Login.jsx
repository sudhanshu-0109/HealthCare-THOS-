/**
 * pages/public/Login.jsx — New AuthPage UI design + full backend auth logic (Phase 0-2 preserved)
 */

import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Heart, Users, Activity, Building2, FlaskConical, Pill, Truck, Shield,
  Eye, EyeOff, ArrowLeft, CheckCircle2, Lock, Mail, ChevronRight, ChevronDown
} from 'lucide-react';
import * as authService from '../../services/auth.service';
import useAuthStore from '../../store/authStore';
import { ROLE_HOME_ROUTE } from '../../utils/roleRedirect';
import GoogleLoginButton from '../../components/auth/GoogleLoginButton';

const ROLES = [
  { id: 'PATIENT', icon: Users, label: 'Patient', desc: 'Book appointments, track health' },
  { id: 'DOCTOR', icon: Activity, label: 'Doctor', desc: 'Manage patients & consultations' },
  { id: 'HOSPITAL_ADMIN', icon: Building2, label: 'Hospital Admin', desc: 'Oversee hospital operations' },
  { id: 'LAB_STAFF', icon: FlaskConical, label: 'Lab Technician', desc: 'Process tests & upload reports' },
  { id: 'PHARMACIST', icon: Pill, label: 'Pharmacist', desc: 'Manage prescriptions & orders' },
  { id: 'AMBULANCE_DRIVER', icon: Truck, label: 'Ambulance Driver', desc: 'Handle emergency dispatch' },
  { id: 'SUPER_ADMIN', icon: Shield, label: 'Super Admin', desc: 'Platform-wide control' },
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
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const roleMenuRef = useRef(null);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [accountNotFound, setAccountNotFound] = useState(false);

  // Close the role dropdown when clicking outside it.
  // Declared AFTER the state/ref above so roleMenuOpen is initialized before the
  // dependency array is evaluated during render (avoids a TDZ ReferenceError).
  useEffect(() => {
    if (!roleMenuOpen) return;
    const handleClickOutside = (e) => {
      if (roleMenuRef.current && !roleMenuRef.current.contains(e.target)) {
        setRoleMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [roleMenuOpen]);

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
      const targetRoute = redirectUrl || ROLE_HOME_ROUTE[verifiedUser.role] || '/dashboard';
      navigate(targetRoute, { replace: true });
    } catch (err) {
      setAccountNotFound(false);
      if (err.errors?.code === 'ROLE_MISMATCH') {
        setError('Role mismatch — please select the role associated with this account.');
      } else if (err.errors?.accountExists === false) {
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

            {/* Role selection — dropdown (R21). Purely a UI affordance: the selected
                role is never sent to the backend; the server derives role from the
                account. It only labels the submit button and gates the Patient-only
                Google button. */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">I am a</label>
              <div className="relative" ref={roleMenuRef}>
                <button
                  type="button"
                  onClick={() => setRoleMenuOpen((o) => !o)}
                  aria-haspopup="listbox"
                  aria-expanded={roleMenuOpen}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl border-2 border-slate-200 bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 transition-all text-left"
                >
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-white border border-slate-100">
                    <selectedRoleObj.icon className="w-4 h-4 text-slate-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-800">{selectedRoleObj.label}</div>
                    <div className="text-xs text-slate-400 leading-tight mt-0.5 truncate">{selectedRoleObj.desc}</div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${roleMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {roleMenuOpen && (
                  <div
                    role="listbox"
                    className="absolute z-20 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-72 overflow-y-auto"
                  >
                    {ROLES.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        role="option"
                        aria-selected={selectedRole === r.id}
                        onClick={() => { setSelectedRole(r.id); setRoleMenuOpen(false); }}
                        className={`w-full flex items-center gap-3 p-3 text-left transition-colors ${
                          selectedRole === r.id ? 'bg-cyan-50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-slate-50 border border-slate-100">
                          <r.icon className="w-4 h-4 text-slate-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-800">{r.label}</div>
                          <div className="text-xs text-slate-400 leading-tight mt-0.5 truncate">{r.desc}</div>
                        </div>
                        {selectedRole === r.id && <CheckCircle2 className="w-4 h-4 text-cyan-600 flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
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
                <GoogleLoginButton role={selectedRole} onError={(msg) => setError(msg)} />
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
