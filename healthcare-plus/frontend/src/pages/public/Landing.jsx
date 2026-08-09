import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart, Search, Ambulance, Brain, Shield, Star, ChevronRight,
  Activity, Users, Building2, FlaskConical, Pill, Truck, Menu, X,
  CheckCircle2, ArrowRight, Phone, Mail, MapPin, Zap, Clock, Award
} from 'lucide-react';

const FEATURES = [
  {
    icon: Brain,
    title: 'AI Health Assistant',
    desc: 'Describe your symptoms and get instant specialist recommendations — no diagnosis, just the right direction.',
    color: 'bg-violet-50 text-violet-600',
  },
  {
    icon: Ambulance,
    title: 'Emergency SOS',
    desc: 'One hold-to-trigger SOS dispatches the nearest ambulance and pre-alerts the hospital automatically.',
    color: 'bg-red-50 text-red-600',
  },
  {
    icon: Search,
    title: 'Hospital Search',
    desc: 'Find hospitals by name, specialty, distance, or real-time availability with AI crowd status.',
    color: 'bg-cyan-50 text-cyan-600',
  },
  {
    icon: Activity,
    title: 'Live Queue Tracking',
    desc: 'See your queue number, patients ahead, and estimated wait time — updated in real time.',
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: Shield,
    title: 'Healthcare Passport',
    desc: 'Your complete medical timeline, prescriptions, and lab reports stored securely in one place.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: Heart,
    title: 'Multi-Role Platform',
    desc: 'Dedicated dashboards for Patients, Doctors, Admins, Lab Techs, Pharmacists, and Drivers.',
    color: 'bg-pink-50 text-pink-600',
  },
];

const ROLES = [
  { icon: Users, label: 'Patient', color: 'bg-cyan-600' },
  { icon: Activity, label: 'Doctor', color: 'bg-emerald-600' },
  { icon: Building2, label: 'Hospital Admin', color: 'bg-blue-600' },
  { icon: FlaskConical, label: 'Lab Technician', color: 'bg-violet-600' },
  { icon: Pill, label: 'Pharmacist', color: 'bg-orange-500' },
  { icon: Truck, label: 'Ambulance Driver', color: 'bg-red-600' },
  { icon: Shield, label: 'Super Admin', color: 'bg-slate-700' },
];

const STATS = [
  { value: '500+', label: 'Partner Hospitals' },
  { value: '50K+', label: 'Active Patients' },
  { value: '10K+', label: 'Doctors' },
  { value: '99.9%', label: 'Uptime' },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Register & Choose Role',
    desc: 'Create your account and select your role — patient, doctor, or staff — to unlock your personalized dashboard.',
  },
  {
    step: '02',
    title: 'Access Your Dashboard',
    desc: 'Every role gets a purpose-built workspace with exactly the tools and data they need.',
  },
  {
    step: '03',
    title: 'Connected Healthcare',
    desc: 'Book appointments, receive prescriptions, process labs, and manage emergencies — all in one ecosystem.',
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-lg flex items-center justify-center">
                <Heart className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-slate-900">healthcare<span className="text-cyan-600">+</span></span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-slate-600 hover:text-cyan-600 transition-colors text-sm">Features</a>
              <a href="#how-it-works" className="text-slate-600 hover:text-cyan-600 transition-colors text-sm">How It Works</a>
              <a href="#roles" className="text-slate-600 hover:text-cyan-600 transition-colors text-sm">Roles</a>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-2 text-sm text-slate-700 hover:text-cyan-600 transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('/register')}
                className="px-4 py-2 text-sm bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors shadow-sm"
              >
                Get Started
              </button>
            </div>

            <button
              className="md:hidden p-2 rounded-lg hover:bg-slate-100"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white px-4 py-4 space-y-3">
            <a href="#features" className="block text-slate-600 py-2">Features</a>
            <a href="#how-it-works" className="block text-slate-600 py-2">How It Works</a>
            <a href="#roles" className="block text-slate-600 py-2">Roles</a>
            <div className="flex gap-3 pt-2">
              <button onClick={() => navigate('/login')} className="flex-1 py-2 border border-slate-200 rounded-lg text-slate-700 text-sm">Sign In</button>
              <button onClick={() => navigate('/register')} className="flex-1 py-2 bg-cyan-600 text-white rounded-lg text-sm">Get Started</button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="pt-24 pb-20 lg:pt-36 lg:pb-28 bg-gradient-to-br from-slate-900 via-cyan-900 to-teal-900 overflow-hidden relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 -left-20 w-80 h-80 bg-teal-400/10 rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-400/20 rounded-full px-4 py-1.5 mb-6">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-cyan-300 text-xs">AI-Powered Healthcare Network</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Healthcare, Reimagined<br />
              <span className="bg-gradient-to-r from-cyan-400 to-teal-300 bg-clip-text text-transparent">
                for Everyone
              </span>
            </h1>
            <p className="text-lg text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
              Connect patients, doctors, hospitals, and emergency services on one intelligent platform.
              AI-guided care, real-time queues, and instant emergency dispatch.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/register')}
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-cyan-500 hover:bg-cyan-400 text-white rounded-xl font-semibold transition-all shadow-lg shadow-cyan-500/25 hover:shadow-cyan-400/30"
              >
                Start for Free <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl font-semibold transition-all"
              >
                Sign In
              </button>
            </div>
          </div>

          {/* Stats bar */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {STATS.map((s) => (
              <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-white">{s.value}</div>
                <div className="text-xs text-slate-400 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-cyan-600 text-sm font-semibold uppercase tracking-widest">Platform Features</span>
            <h2 className="mt-3 text-3xl lg:text-4xl font-bold text-slate-900">Everything healthcare needs</h2>
            <p className="mt-4 text-slate-500 max-w-xl mx-auto">From AI triage to emergency dispatch, every feature is built to make healthcare faster, smarter, and more accessible.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="group p-6 rounded-2xl border border-slate-100 hover:border-cyan-200 hover:shadow-lg hover:shadow-cyan-50 transition-all cursor-default">
                <div className={`w-11 h-11 rounded-xl ${f.color} flex items-center justify-center mb-4`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-cyan-600 text-sm font-semibold uppercase tracking-widest">Simple Process</span>
            <h2 className="mt-3 text-3xl lg:text-4xl font-bold text-slate-900">How it works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((item, i) => (
              <div key={item.step} className="relative">
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-1/2 w-full h-px bg-gradient-to-r from-cyan-200 to-transparent" />
                )}
                <div className="bg-white rounded-2xl p-7 border border-slate-100 shadow-sm relative">
                  <div className="text-4xl font-black text-cyan-100 mb-4">{item.step}</div>
                  <h3 className="font-semibold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section id="roles" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-cyan-600 text-sm font-semibold uppercase tracking-widest">For Every Role</span>
            <h2 className="mt-3 text-3xl lg:text-4xl font-bold text-slate-900">Tailored for your work</h2>
            <p className="mt-4 text-slate-500 max-w-xl mx-auto">Select your role to jump directly into your dedicated dashboard experience.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
            {ROLES.map((r) => (
              <button
                key={r.label}
                onClick={() => navigate('/login')}
                className="group flex flex-col items-center gap-3 p-5 rounded-2xl border border-slate-100 hover:border-cyan-200 hover:shadow-md transition-all"
              >
                <div className={`w-12 h-12 ${r.color} rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform`}>
                  <r.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-medium text-slate-700 text-center leading-tight">{r.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-cyan-600 to-teal-700">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Heart className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Ready to transform healthcare delivery?</h2>
          <p className="text-cyan-100 mb-8 text-lg">Join 500+ hospitals and 50,000+ patients already on healthcare+</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/register')}
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-cyan-700 rounded-xl font-semibold hover:bg-cyan-50 transition-colors shadow-lg"
            >
              Get Started Free <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white/10 border border-white/30 text-white rounded-xl font-semibold hover:bg-white/20 transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-lg flex items-center justify-center">
                  <Heart className="w-4 h-4 text-white" />
                </div>
                <span className="text-white font-bold">healthcare<span className="text-cyan-400">+</span></span>
              </div>
              <p className="text-sm leading-relaxed">Connecting care teams and patients through intelligent technology.</p>
            </div>
            <div>
              <h4 className="text-white text-sm font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm">
                {['Features', 'Security', 'Integrations'].map((item) => (
                  <li key={item}><a href="#" className="hover:text-white transition-colors">{item}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white text-sm font-semibold mb-4">For Roles</h4>
              <ul className="space-y-2 text-sm">
                {['Patients', 'Doctors', 'Hospital Admins', 'Lab Technicians'].map((item) => (
                  <li key={item}><a href="#" className="hover:text-white transition-colors">{item}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white text-sm font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /><span>+1 (800) HEALTH+</span></li>
                <li className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /><span>hello@healthcareplus.io</span></li>
                <li className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /><span>Global Network</span></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 pt-8 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs">© 2026 healthcare+. All rights reserved.</p>
            <div className="flex gap-6 text-xs">
              <a href="#" className="hover:text-white">Privacy</a>
              <a href="#" className="hover:text-white">Terms</a>
              <a href="#" className="hover:text-white">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
