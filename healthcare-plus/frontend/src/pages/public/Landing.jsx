/**
 * pages/public/Landing.jsx — Redesigned public landing page matching the provided desktop + mobile designs.
 * All existing navigation (login, register) preserved. No auth logic changed.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart, Shield, Menu, X, ArrowRight, ChevronRight,
  Building2, Brain, Dumbbell, CheckCircle2, User, Lock,
  Smartphone, TrendingUp
} from 'lucide-react';

// ── Feature data matching the design ──────────────────────────────────────────

const HOSPITAL_FEATURES = [
  'Book Appointments',
  'Consult Doctors',
  'Lab Tests & Reports',
  'Digital Prescriptions',
  'Pharmacy & Medicines',
  'Emergency Support',
  'Healthcare Passport',
];

const WELLNESS_FEATURES = [
  'AI Wellness Companion',
  'Meditation & Breathing',
  'Sleep & Relaxation',
  'Mood Check-ins',
  'Mindfulness Programs',
  'Daily Wellness Plan',
];

const FITNESS_FEATURES = [
  'Personalized Workouts',
  'Exercise Guidance',
  'Daily Fitness Plans',
  'Hydration Tracking',
  'Progress Tracking',
];

const TRUST_ITEMS = [
  { icon: User, title: 'One Account', desc: 'One account to access all healthcare services.' },
  { icon: Lock, title: 'Secure & Private', desc: 'Your data is encrypted and always protected.' },
  { icon: Smartphone, title: 'Seamless & Connected', desc: 'All your health information, connected in one place.' },
  { icon: TrendingUp, title: 'Better Every Day', desc: 'Track progress, build healthy habits, live a better life.' },
];

const NAV_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'About Us', href: '#about' },
  { label: 'Contact', href: '#contact' },
];

// ── Feature check list item ────────────────────────────────────────────────────
function FeatureItem({ text }) {
  return (
    <li className="flex items-center gap-2 text-sm text-slate-600">
      <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
      {text}
    </li>
  );
}

// ── Main Landing component ─────────────────────────────────────────────────────
export default function Landing() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white font-sans" id="home">

      {/* ── NAVBAR ──────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-teal-600 rounded-xl flex items-center justify-center">
                <Heart className="w-5 h-5 text-white fill-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">
                Healthcare<span className="text-teal-600">+</span>
              </span>
            </div>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm font-medium text-slate-600 hover:text-teal-600 transition-colors no-underline"
                  onClick={link.label === 'Home' ? undefined : undefined}
                >
                  {link.label === 'Home' ? (
                    <span className="text-teal-600 border-b-2 border-teal-600 pb-0.5">{link.label}</span>
                  ) : link.label}
                </a>
              ))}
            </div>

            {/* Desktop CTA buttons */}
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => navigate('/login')}
                className="px-5 py-2 text-sm font-semibold text-slate-700 border border-slate-200 rounded-lg hover:border-teal-300 hover:text-teal-600 transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('/register')}
                className="px-5 py-2 text-sm font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors shadow-sm"
              >
                Sign Up
              </button>
            </div>

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-slate-100"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white px-4 py-4 space-y-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="block py-2.5 text-sm font-medium text-slate-600 hover:text-teal-600 no-underline"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="flex gap-3 pt-3 border-t border-slate-100 mt-2">
              <button
                onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}
                className="flex-1 py-2.5 border border-slate-200 rounded-lg text-slate-700 text-sm font-semibold"
              >
                Sign In
              </button>
              <button
                onClick={() => { navigate('/register'); setMobileMenuOpen(false); }}
                className="flex-1 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-semibold"
              >
                Sign Up
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO SECTION ─────────────────────────────────────────────────────── */}
      <section className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-8 py-12 lg:py-20">

            {/* Left: Headline + CTAs */}
            <div className="flex-1 max-w-xl">
              {/* Secure badge */}
              <div className="hc-badge-secure mb-6">
                <Shield className="w-3.5 h-3.5" />
                Your Health, Our Priority
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-extrabold text-slate-900 leading-tight mb-5">
                Complete<br />
                HealthCare<br />
                <span className="text-teal-600">Operating System</span>
              </h1>

              <p className="text-lg font-semibold text-slate-800 mb-3">
                One platform for everything.
              </p>
              <p className="text-base text-slate-500 leading-relaxed mb-8">
                Healthcare+ unifies healthcare, mental wellness and physical
                health into one intelligent platform to simplify care,
                improve outcomes and empower every life.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <button
                  onClick={() => navigate('/register')}
                  className="hc-btn-primary text-base px-8 py-3.5 rounded-xl shadow-lg shadow-teal-200"
                >
                  Get Started <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 border-2 border-slate-200 rounded-xl font-semibold text-slate-700 hover:border-teal-300 hover:text-teal-600 transition-colors text-base"
                >
                  Learn More
                </button>
              </div>

              {/* Trust badges */}
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 bg-teal-100 rounded-full flex items-center justify-center">
                    <Shield className="w-2.5 h-2.5 text-teal-600" />
                  </div>
                  Secure
                </div>
                <span className="text-slate-300">•</span>
                <span>Private</span>
                <span className="text-slate-300">•</span>
                <span>Trusted by thousands</span>
              </div>
            </div>

            {/* Right: Hero visual with floating module cards */}
            <div className="flex-1 relative flex items-center justify-center w-full max-w-lg lg:max-w-none">
              <div className="relative w-full max-w-md lg:max-w-lg mx-auto">
                {/* Hero image — family with tablet */}
                <div className="rounded-3xl overflow-hidden shadow-2xl border border-slate-100">
                  <img
                    src="/hero.png"
                    alt="Family using Healthcare+ platform"
                    className="w-full h-auto object-cover"
                  />
                </div>

                {/* Floating card — Hospital Care (top left) */}
                <div className="absolute -top-4 -left-4 bg-white rounded-2xl shadow-xl p-3 flex flex-col items-center gap-1 w-28 border border-slate-100">
                  <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center overflow-hidden">
                    <img src="/hospital-care.jpg" alt="Hospital" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 text-center leading-tight">Hospital Care</span>
                  <span className="text-[10px] text-slate-500 text-center leading-tight">Book & consult doctors</span>
                </div>

                {/* Floating card — Mental Wellness (top right) */}
                <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl p-3 flex flex-col items-center gap-1 w-28 border border-slate-100">
                  <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center overflow-hidden">
                    <img src="/mental-wellness.jpg" alt="Mental" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 text-center leading-tight">Mental Wellness</span>
                  <span className="text-[10px] text-slate-500 text-center leading-tight">AI support & mindfulness</span>
                </div>

                {/* Floating card — Physical Health (bottom right) */}
                <div className="absolute -bottom-4 -right-4 bg-white rounded-2xl shadow-xl p-3 flex flex-col items-center gap-1 w-28 border border-slate-100">
                  <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center overflow-hidden">
                    <img src="/physical-health.jpg" alt="Fitness" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 text-center leading-tight">Physical Health</span>
                  <span className="text-[10px] text-slate-500 text-center leading-tight">Workouts & fitness</span>
                </div>

                {/* Floating badge — bottom left */}
                <div className="absolute -bottom-4 -left-4 bg-teal-600 rounded-2xl shadow-xl px-3 py-2.5 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-white" />
                  <div>
                    <p className="text-white text-xs font-bold leading-none">One Platform.</p>
                    <p className="text-teal-200 text-[10px] mt-0.5 leading-none">Everything Connected.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES SECTION ──────────────────────────────────────────────────── */}
      <section id="features" className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="text-center mb-12">
            <p className="text-teal-600 text-sm font-semibold uppercase tracking-widest mb-2">
              ONE PLATFORM. TOTAL CARE.
            </p>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-3">
              Everything You Need. One Platform.
            </h2>
            <p className="text-slate-500 max-w-lg mx-auto">
              Healthcare+ brings all your healthcare needs together in one seamless experience.
            </p>
          </div>

          {/* Three feature columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Hospital Care */}
            <div className="bg-white rounded-2xl p-7 border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
              <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center mb-5">
                <Building2 className="w-6 h-6 text-teal-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">Hospital Care</h3>
              <p className="text-sm text-slate-500 mb-5">Complete medical care at your fingertips.</p>
              <ul className="space-y-2.5 mb-6">
                {HOSPITAL_FEATURES.map((f) => <FeatureItem key={f} text={f} />)}
              </ul>
              <button
                onClick={() => navigate('/register')}
                className="w-8 h-8 bg-teal-50 hover:bg-teal-100 rounded-full flex items-center justify-center text-teal-600 transition-colors ml-auto"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Mental Wellness */}
            <div className="bg-white rounded-2xl p-7 border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
              <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center mb-5">
                <Brain className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">Mental Wellness</h3>
              <p className="text-sm text-slate-500 mb-5">AI-powered support for a healthier mind.</p>
              <ul className="space-y-2.5 mb-6">
                {WELLNESS_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-purple-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate('/register')}
                className="w-8 h-8 bg-purple-50 hover:bg-purple-100 rounded-full flex items-center justify-center text-purple-600 transition-colors ml-auto"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Physical Health */}
            <div className="bg-white rounded-2xl p-7 border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
              <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center mb-5">
                <Dumbbell className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">Physical Health</h3>
              <p className="text-sm text-slate-500 mb-5">Personalized plans for a stronger you.</p>
              <ul className="space-y-2.5 mb-6">
                {FITNESS_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-orange-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate('/register')}
                className="w-8 h-8 bg-orange-50 hover:bg-orange-100 rounded-full flex items-center justify-center text-orange-500 transition-colors ml-auto"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-slate-900">How It Works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Create Your Account', desc: 'Sign up as a patient in seconds. One account gives you access to all Healthcare+ services.' },
              { step: '02', title: 'Choose Your Path', desc: 'Access Hospital Care, Mental Wellness, or Physical Health — all from your personal Health Hub.' },
              { step: '03', title: 'Live Healthier', desc: 'Book appointments, track wellness, manage prescriptions, and stay active — all in one place.' },
            ].map((item, i) => (
              <div key={item.step} className="relative text-center">
                {i < 2 && (
                  <div className="hidden md:block absolute top-6 left-[60%] w-[80%] h-px bg-gradient-to-r from-teal-200 to-transparent" />
                )}
                <div className="w-12 h-12 bg-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white font-extrabold text-sm">
                  {item.step}
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ─────────────────────────────────────────────────────────── */}
      <section className="py-12 bg-slate-50 border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {TRUST_ITEMS.map((item) => (
              <div key={item.title} className="flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">{item.title}</p>
                  <p className="text-slate-500 text-xs mt-1 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA SECTION ───────────────────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-br from-teal-600 to-teal-800">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Heart className="w-7 h-7 text-white fill-white" />
          </div>
          <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-4">
            Ready to take charge of your health?
          </h2>
          <p className="text-teal-100 mb-10 text-lg">
            Join thousands of patients already on Healthcare+
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/register')}
              className="inline-flex items-center justify-center gap-2 px-9 py-4 bg-white text-teal-700 rounded-xl font-bold hover:bg-teal-50 transition-colors shadow-lg text-base"
            >
              Get Started Free <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center justify-center gap-2 px-9 py-4 bg-white/10 border border-white/30 text-white rounded-xl font-bold hover:bg-white/20 transition-colors text-base"
            >
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────────── */}
      <footer id="contact" className="bg-slate-900 text-slate-400 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
                  <Heart className="w-4 h-4 text-white fill-white" />
                </div>
                <span className="text-white font-bold text-lg">
                  Healthcare<span className="text-teal-400">+</span>
                </span>
              </div>
              <p className="text-sm leading-relaxed">
                One platform for hospital care, mental wellness, and physical health.
              </p>
            </div>
            <div>
              <h4 className="text-white text-sm font-semibold mb-4">Platform</h4>
              <ul className="space-y-2.5 text-sm">
                {['Hospital Care', 'Mental Wellness', 'Physical Health', 'Emergency SOS'].map((item) => (
                  <li key={item}>
                    <a href="#" className="hover:text-white transition-colors no-underline">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div id="about">
              <h4 className="text-white text-sm font-semibold mb-4">For Users</h4>
              <ul className="space-y-2.5 text-sm">
                {['Patients', 'Doctors', 'Hospital Admins', 'Lab Technicians'].map((item) => (
                  <li key={item}>
                    <a href="#" className="hover:text-white transition-colors no-underline">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white text-sm font-semibold mb-4">Legal</h4>
              <ul className="space-y-2.5 text-sm">
                {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Security'].map((item) => (
                  <li key={item}>
                    <a href="#" className="hover:text-white transition-colors no-underline">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs">© 2026 Healthcare+. All rights reserved.</p>
            <div className="flex gap-6 text-xs">
              <a href="#" className="hover:text-white no-underline">Privacy</a>
              <a href="#" className="hover:text-white no-underline">Terms</a>
              <a href="#" className="hover:text-white no-underline">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
