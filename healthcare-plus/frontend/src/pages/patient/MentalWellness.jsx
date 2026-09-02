/**
 * pages/patient/MentalWellness.jsx — Mental Wellness Ecosystem
 *
 * Changes v3:
 *  - Activity cards now open ActivityPlayer (full-screen, animated icon + countdown)
 *  - AI Companion enhanced with typing state, message timestamps, suggested prompts
 *  - Progress section fully renders trend indicators + charts
 *  - API responses correctly unwrapped (.data)
 *  - Consent-gated API calls only fire after consent
 *  - Fully responsive (desktop + mobile)
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Brain, ArrowLeft, Wind, Moon, Music, BookOpen, Star, Target,
  Activity, TrendingUp, Send, Loader2, CheckCircle2, Info,
  Phone, Shield, X, Play, MessageCircle, Flame, BarChart2,
  Clock, AlertCircle, Heart, Sparkles, TrendingDown, Minus,
  Calendar, Zap,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart,
} from 'recharts';
import useAuthStore from '../../store/authStore';
import * as mhService from '../../services/mentalHealth.service';
import ActivityPlayer from '../../components/mentalWellness/ActivityPlayer';

// ── Constants ──────────────────────────────────────────────────────────────────

const MOODS = [
  { value: 5, emoji: '😊', label: 'Great',  sel: 'border-emerald-400 bg-emerald-50 text-emerald-700' },
  { value: 4, emoji: '🙂', label: 'Good',   sel: 'border-blue-400   bg-blue-50   text-blue-700'    },
  { value: 3, emoji: '😐', label: 'Okay',   sel: 'border-amber-400  bg-amber-50  text-amber-700'   },
  { value: 2, emoji: '😔', label: 'Low',    sel: 'border-orange-400 bg-orange-50 text-orange-700'  },
  { value: 1, emoji: '😫', label: 'Rough',  sel: 'border-red-400    bg-red-50    text-red-700'     },
];

const TYPE_META = {
  BREATHING:        { Icon: Wind,       bg: 'bg-sky-100',    text: 'text-sky-700',    label: 'Breathing'   },
  MEDITATION:       { Icon: Brain,      bg: 'bg-purple-100', text: 'text-purple-700', label: 'Meditation'  },
  MINDFULNESS:      { Icon: Sparkles,   bg: 'bg-violet-100', text: 'text-violet-700', label: 'Mindfulness' },
  SLEEP_SOUND:      { Icon: Moon,       bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Sleep Sound' },
  SLEEP_STORY:      { Icon: BookOpen,   bg: 'bg-blue-100',   text: 'text-blue-700',   label: 'Sleep Story' },
  RELAXATION_MUSIC: { Icon: Music,      bg: 'bg-pink-100',   text: 'text-pink-700',   label: 'Music'       },
  GRATITUDE:        { Icon: Star,       bg: 'bg-amber-100',  text: 'text-amber-700',  label: 'Gratitude'   },
  GROUNDING:        { Icon: Target,     bg: 'bg-green-100',  text: 'text-green-700',  label: 'Grounding'   },
  FOCUS:            { Icon: Activity,   bg: 'bg-teal-100',   text: 'text-teal-700',   label: 'Focus'       },
  WELLNESS_PROGRAM: { Icon: TrendingUp, bg: 'bg-emerald-100',text: 'text-emerald-700',label: 'Program'     },
};

const HELPLINES = [
  { name: 'iCall',                number: '9152987821',    desc: 'Free counseling' },
  { name: 'Vandrevala Foundation', number: '1860-2662-345', desc: '24/7 support'   },
  { name: 'AASRA',                number: '9820466627',    desc: 'Crisis support'  },
  { name: 'Emergency',            number: '112',           desc: 'National emergency' },
];

const SUGGESTED_PROMPTS = [
  "I'm feeling overwhelmed today",
  "Help me sleep better",
  "I need help with anxiety",
  "I want to build a mindfulness habit",
  "I'm stressed about work",
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

const CONSENT_ORDER = { NONE: 0, LEVEL_1: 1, LEVEL_2: 2, LEVEL_3: 3 };
function hasConsent(profile, level) {
  if (!profile) return false;
  return CONSENT_ORDER[profile.consentLevel] >= CONSENT_ORDER[level];
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Tab({ id, label, Icon, active, onClick }) {
  return (
    <button onClick={() => onClick(id)}
      className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
        active ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}

function ConsentBanner({ title, description, loading, onGrant }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 flex flex-col items-center text-center">
      <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
        <Shield className="w-7 h-7 text-blue-600" />
      </div>
      <h3 className="text-base font-bold text-slate-800 mb-2">{title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed mb-6 max-w-sm">{description}</p>
      <button onClick={onGrant} disabled={loading}
        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
        Enable & Continue
      </button>
    </div>
  );
}

function ContentCard({ item, onStart }) {
  const meta = TYPE_META[item.type] || TYPE_META.BREATHING;
  const { Icon } = meta;
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-3 flex items-center gap-3 hover:shadow-sm hover:border-blue-100 transition-all group">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.bg} ${meta.text}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate">{item.title}</p>
        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
          <Clock className="w-3 h-3" />
          {item.duration >= 60 ? `${Math.floor(item.duration / 60)}h` : `${item.duration} min`}
        </p>
      </div>
      <button onClick={() => onStart?.(item)}
        className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center flex-shrink-0 transition-colors shadow-sm group-hover:shadow-blue-200"
        aria-label={`Start ${item.title}`}
      >
        <Play className="w-4 h-4 ml-0.5" />
      </button>
    </div>
  );
}

function CrisisPanel({ message, onDismiss, onFindProfessional }) {
  return (
    <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl p-5 text-white">
      <div className="flex items-start gap-3 mb-5">
        <Heart className="w-5 h-5 text-pink-400 flex-shrink-0 mt-0.5 fill-pink-400" />
        <p className="text-sm leading-relaxed text-slate-200">
          {message || "I hear that you're going through something really hard. You're not alone — support is right here."}
        </p>
      </div>
      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">Immediate Support</p>
      <div className="space-y-2 mb-4">
        {HELPLINES.map(h => (
          <button key={h.name}
            onClick={() => { window.location.href = `tel:${h.number.replace(/-/g, '')}`; }}
            className="w-full flex items-center justify-between bg-white/10 hover:bg-white/20 transition-colors rounded-xl px-4 py-2.5"
          >
            <div className="text-left">
              <p className="text-sm font-semibold text-white">{h.name}</p>
              <p className="text-xs text-slate-400">{h.desc}</p>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="text-sm font-bold">{h.number}</span>
              <Phone className="w-3.5 h-3.5" />
            </div>
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={onFindProfessional}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2.5 rounded-xl transition-colors"
        >Find a Professional</button>
        <button onClick={onDismiss}
          className="flex-1 bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-semibold py-2.5 rounded-xl transition-colors"
        >I'm okay for now</button>
      </div>
    </div>
  );
}

// ── Custom Recharts Tooltip ───────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 shadow-lg text-xs">
      <p className="font-semibold text-slate-600 mb-1.5">
        {new Date(label + 'T00:00:00').toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
      </p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2 mb-0.5">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-semibold text-slate-800">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function MentalWellness() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [tab, setTab] = useState('wellness');
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [consentGranting, setConsentGranting] = useState(false);

  // Activity Player
  const [activeActivity, setActiveActivity] = useState(null);

  // Crisis modal
  const [showCrisis, setShowCrisis] = useState(false);

  // Wellness tab
  const [form, setForm] = useState({ mood: null, stress: 5, energy: 3, motivation: 3, sleepHours: '', note: '' });
  const [submitting, setSubmitting] = useState(false);
  const [todaysCI, setTodaysCI] = useState(null);
  const [ciRecs, setCiRecs] = useState([]);
  const [content, setContent] = useState([]);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentLoaded, setContentLoaded] = useState(false);

  // Companion tab
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');
  const [aiSending, setAiSending] = useState(false);
  const [crisisData, setCrisisData] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const msgEndRef = useRef(null);

  // Progress tab
  const [progress, setProgress] = useState(null);
  const [progressLoading, setProgressLoading] = useState(false);
  const [progressLoaded, setProgressLoaded] = useState(false);

  // Derived
  const lvl1 = hasConsent(profile, 'LEVEL_1');
  const lvl2 = hasConsent(profile, 'LEVEL_2');

  // Load profile
  useEffect(() => {
    (async () => {
      try {
        const res = await mhService.getProfile();
        setProfile(res?.data ?? res);
      } catch {
        setProfile({ consentLevel: 'NONE' });
      } finally {
        setProfileLoading(false);
      }
    })();
  }, []);

  // Load content when Level 1 is available
  useEffect(() => {
    if (tab === 'wellness' && lvl1 && !contentLoaded) {
      setContentLoaded(true);
      loadContent();
      loadTodaysCI();
    }
  }, [tab, lvl1, contentLoaded]);

  // Load progress when tab opens
  useEffect(() => {
    if (tab === 'progress' && lvl1 && !progressLoaded) {
      setProgressLoaded(true);
      loadProgress();
    }
  }, [tab, lvl1, progressLoaded]);

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, crisisData, aiSending]);

  const loadTodaysCI = async () => {
    try {
      const res = await mhService.getCheckInHistory(7);
      const data = res?.data ?? res;
      setTodaysCI(data?.todaysCheckIn ?? null);
    } catch {}
  };

  const loadContent = async () => {
    setContentLoading(true);
    try {
      const res = await mhService.getWellnessContent();
      const arr = res?.data ?? res;
      setContent(Array.isArray(arr) ? arr : []);
    } catch {
      setContent([]);
    } finally {
      setContentLoading(false);
    }
  };

  const loadProgress = async () => {
    setProgressLoading(true);
    try {
      const res = await mhService.getProgress();
      setProgress(res?.data ?? res);
    } catch {} finally {
      setProgressLoading(false);
    }
  };

  const grantConsent = async (level) => {
    setConsentGranting(true);
    try {
      await mhService.updateConsent(level);
      const res = await mhService.getProfile();
      setProfile(res?.data ?? res);
      setContentLoaded(false);
      setProgressLoaded(false);
    } catch {} finally {
      setConsentGranting(false);
    }
  };

  const submitCheckIn = async () => {
    if (!form.mood) return;
    setSubmitting(true);
    try {
      const res = await mhService.submitCheckIn({
        mood:       form.mood,
        stress:     form.stress,
        energy:     form.energy,
        motivation: form.motivation,
        sleepHours: form.sleepHours ? parseFloat(form.sleepHours) : undefined,
        note:       form.note || undefined,
      });
      const data = res?.data ?? res;
      setTodaysCI(data.checkIn);
      const recs = data.recommendations ?? [];
      setCiRecs(Array.isArray(recs) ? recs : []);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartActivity = (item) => {
    setActiveActivity(item);
  };

  const handleActivityComplete = async (item) => {
    try {
      await mhService.completeActivity(item.id, { durationSeconds: (item.duration || 5) * 60 });
      // Refresh progress streak
      if (progressLoaded) {
        setProgressLoaded(false);
      }
    } catch {}
  };

  // Companion
  const startConversation = async () => {
    try {
      const res = await mhService.createConversation();
      const conv = res?.data ?? res;
      setConversation(conv);
      setMessages([{
        role: 'assistant',
        content: `Hello! I'm your Healthcare+ Wellness Companion 🌿\n\nI'm here to listen, support, and guide — not to diagnose or replace professional care.\n\nHow are you feeling today?`,
        id: 'welcome',
        ts: new Date(),
      }]);
      setShowSuggestions(true);
    } catch (e) { console.error(e); }
  };

  const sendMessage = async (text) => {
    const msg = (text || inputMsg).trim();
    if (!msg || aiSending || !conversation) return;

    setShowSuggestions(false);
    const userMsg = { role: 'user', content: msg, id: Date.now().toString(), ts: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputMsg('');
    setAiSending(true);
    setCrisisData(null);

    try {
      const res = await mhService.sendMessage(conversation.id, msg);
      const data = res?.data ?? res;
      if (data.type === 'safety_screen') {
        setCrisisData(data);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.reply,
          id: Date.now().toString() + '_a',
          recommendations: data.recommendations ?? [],
          riskLevel: data.riskLevel,
          ts: new Date(),
        }]);
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again.",
        id: Date.now().toString() + '_err',
        isError: true,
        ts: new Date(),
      }]);
    } finally {
      setAiSending(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // Group content
  const byType = Array.isArray(content)
    ? content.reduce((acc, item) => {
        if (!acc[item.type]) acc[item.type] = [];
        acc[item.type].push(item);
        return acc;
      }, {})
    : {};

  const firstName = user?.fullName?.split(' ')[0] || 'there';

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-slate-500 text-sm">Loading your wellness space...</p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* Activity Player (full-screen overlay) */}
      {activeActivity && (
        <ActivityPlayer
          item={activeActivity}
          onClose={() => setActiveActivity(null)}
          onComplete={handleActivityComplete}
        />
      )}

      {/* ── Sticky Header ─────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <button onClick={() => navigate('/health-hub')}
              className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Health Hub</span>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-slate-900 text-sm">Mental Wellness</span>
            </div>
            <button onClick={() => setShowCrisis(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Crisis Help</span>
            </button>
          </div>

          <div className="flex overflow-x-auto -mb-px">
            <Tab id="wellness"  label="Daily Wellness" Icon={Wind}          active={tab==='wellness'}  onClick={setTab} />
            <Tab id="companion" label="AI Companion"   Icon={MessageCircle} active={tab==='companion'} onClick={setTab} />
            <Tab id="progress"  label="Progress"       Icon={BarChart2}     active={tab==='progress'}  onClick={setTab} />
          </div>
        </div>
      </header>

      {/* ── Crisis Modal ───────────────────────────────────────────────────── */}
      {showCrisis && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md">
            <CrisisPanel
              message="If you're in crisis or need immediate support, please reach out."
              onDismiss={() => setShowCrisis(false)}
              onFindProfessional={() => { setShowCrisis(false); navigate('/patient/dashboard'); }}
            />
          </div>
        </div>
      )}

      {/* ── Main ──────────────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-5 pb-20">

        {/* ═════════════════════════════════════════════════════════════════
             TAB 1: DAILY WELLNESS
        ══════════════════════════════════════════════════════════════════ */}
        {tab === 'wellness' && (
          <div className="space-y-4">
            {/* Hero */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-5 text-white">
              <p className="text-blue-200 text-sm">{greeting()}, {firstName}</p>
              <h1 className="text-xl font-bold mt-0.5">How are you today?</h1>
              <p className="text-blue-200 text-sm mt-1">Take a moment to check in with yourself.</p>
            </div>

            {!lvl1 ? (
              <ConsentBanner
                title="Enable Wellness Tracking"
                description="Allow Healthcare+ to track your mood, sleep, and activity data. Your data stays private."
                loading={consentGranting}
                onGrant={() => grantConsent('LEVEL_1')}
              />
            ) : todaysCI ? (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">Today's check-in done!</p>
                    <p className="text-slate-500 text-xs">Come back tomorrow to build your streak.</p>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    { label: 'Mood',   value: MOODS.find(m => m.value === todaysCI.mood)?.emoji || '😐' },
                    { label: 'Stress', value: `${todaysCI.stress}/10` },
                    { label: 'Energy', value: `${todaysCI.energy}/5` },
                    { label: 'Sleep',  value: todaysCI.sleepHours ? `${todaysCI.sleepHours}h` : '—' },
                  ].map(s => (
                    <div key={s.label} className="bg-slate-50 rounded-xl p-2.5">
                      <p className="text-xl">{s.value}</p>
                      <p className="text-slate-500 text-xs">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
                <p className="font-semibold text-slate-800 text-sm">Daily Check-In</p>

                {/* Mood */}
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-2">How's your mood?</p>
                  <div className="flex gap-1.5">
                    {MOODS.map(m => (
                      <button key={m.value} onClick={() => setForm(f => ({ ...f, mood: m.value }))}
                        className={`flex-1 flex flex-col items-center py-2.5 rounded-xl border-2 transition-all text-xs font-medium
                          ${form.mood === m.value ? m.sel + ' ring-2 ring-blue-300 ring-offset-1 scale-105' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'}`}
                      >
                        <span className="text-xl mb-0.5">{m.emoji}</span>
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sliders */}
                {[
                  { field: 'stress', label: 'Stress level', min: 0, max: 10, fmt: v => `${v}/10` },
                  { field: 'energy', label: 'Energy', min: 1, max: 5, fmt: v => `${v}/5` },
                  { field: 'motivation', label: 'Motivation', min: 1, max: 5, fmt: v => `${v}/5` },
                ].map(({ field, label, min, max, fmt }) => (
                  <div key={field}>
                    <div className="flex justify-between mb-1.5">
                      <p className="text-xs font-medium text-slate-500">{label}</p>
                      <span className="text-xs font-bold text-blue-600">{fmt(form[field])}</span>
                    </div>
                    <input type="range" min={min} max={max}
                      value={form[field]}
                      onChange={e => setForm(f => ({ ...f, [field]: parseInt(e.target.value) }))}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>
                ))}

                {/* Sleep */}
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1.5">Sleep last night (hours)</p>
                  <input type="number" min="0" max="12" step="0.5" placeholder="e.g. 7.5"
                    value={form.sleepHours}
                    onChange={e => setForm(f => ({ ...f, sleepHours: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>

                {/* Note */}
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1.5">
                    Anything on your mind? <span className="text-slate-400">(optional)</span>
                  </p>
                  <textarea rows={2} placeholder="Write freely — this is just for you."
                    value={form.note}
                    onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>

                <button onClick={submitCheckIn} disabled={!form.mood || submitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Submit Check-In
                </button>
              </div>
            )}

            {/* Post check-in recommendations */}
            {ciRecs.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                <p className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-500" />
                  Recommended for you right now
                </p>
                <div className="space-y-2">
                  {ciRecs.map(item => <ContentCard key={item.id} item={item} onStart={handleStartActivity} />)}
                </div>
              </div>
            )}

            {/* Content library */}
            {lvl1 && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                <p className="text-sm font-semibold text-slate-800 mb-4">Explore Wellness Content</p>
                {contentLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                  </div>
                ) : content.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-4">No content available.</p>
                ) : (
                  <div className="space-y-5">
                    {Object.entries(TYPE_META).map(([type, meta]) => {
                      const items = byType[type];
                      if (!items?.length) return null;
                      const { Icon } = meta;
                      return (
                        <div key={type}>
                          <div className="flex items-center gap-2 mb-2.5">
                            <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${meta.bg} ${meta.text}`}>
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <p className="text-sm font-semibold text-slate-700">{meta.label}</p>
                            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{items.length}</span>
                          </div>
                          <div className="space-y-1.5 pl-9">
                            {items.slice(0, 3).map(item => (
                              <ContentCard key={item.id} item={item} onStart={handleStartActivity} />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════
             TAB 2: AI COMPANION
        ══════════════════════════════════════════════════════════════════ */}
        {tab === 'companion' && (
          <div className="flex flex-col gap-3">
            {/* Disclosure */}
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-amber-700 text-xs leading-relaxed">
                <strong>AI assistant, not a substitute for professional care.</strong> This companion offers wellness guidance and does not diagnose conditions.
              </p>
            </div>

            {!lvl2 ? (
              <ConsentBanner
                title="Enable AI Wellness Companion"
                description="Allow Healthcare+ to store your wellness conversations to provide personalised guidance. Conversations are private."
                loading={consentGranting}
                onGrant={() => grantConsent('LEVEL_2')}
              />
            ) : !conversation ? (
              /* Start screen */
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 flex flex-col items-center text-center">
                <div className="relative mb-5">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-200">
                    <Brain className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full flex items-center justify-center">
                    <Zap className="w-3 h-3 text-white" />
                  </div>
                </div>
                <h2 className="text-lg font-bold text-slate-800 mb-2">AI Wellness Companion</h2>
                <p className="text-slate-500 text-sm leading-relaxed mb-2 max-w-sm">
                  Powered by Gemini 3.6 Flash. A thoughtful space to explore your feelings, get wellness tips, and find content that helps you feel better.
                </p>
                <p className="text-slate-400 text-xs mb-7">Responds in seconds · Completely private · Always safe</p>

                <button onClick={startConversation}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-7 py-3 rounded-xl transition-colors shadow-lg shadow-blue-100 flex items-center gap-2 text-sm mb-6"
                >
                  <MessageCircle className="w-4 h-4" />
                  Start a Conversation
                </button>

                {/* Example topics */}
                <div className="w-full">
                  <p className="text-xs text-slate-400 font-medium mb-2">People often talk about...</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {SUGGESTED_PROMPTS.map(p => (
                      <span key={p} className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full border border-slate-200">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Chat */
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col">
                {/* Messages */}
                <div className="p-4 space-y-4 overflow-y-auto" style={{ maxHeight: '55vh', minHeight: '300px' }}>
                  {messages.map(msg => (
                    <div key={msg.id} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.role === 'assistant' && (
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                          <Brain className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div className="max-w-[78%] space-y-2">
                        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                          msg.role === 'user'
                            ? 'bg-blue-600 text-white rounded-br-sm shadow-sm'
                            : msg.isError
                              ? 'bg-red-50 text-red-700 border border-red-100 rounded-bl-sm'
                              : 'bg-slate-50 text-slate-800 border border-slate-100 rounded-bl-sm'
                        }`}>
                          {msg.content}
                        </div>
                        {/* Time */}
                        {msg.ts && (
                          <p className={`text-xs text-slate-400 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                            {msg.ts.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                        {/* Recommended activities */}
                        {msg.recommendations?.length > 0 && (
                          <div className="space-y-1.5 mt-1">
                            <p className="text-xs text-slate-400 font-medium">Suggested for you:</p>
                            {msg.recommendations.map(rec => (
                              <ContentCard key={rec.id} item={rec} onStart={handleStartActivity} />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {crisisData && (
                    <CrisisPanel
                      message={crisisData.message}
                      onDismiss={() => { setCrisisData(null); setConversation(null); setMessages([]); }}
                      onFindProfessional={() => navigate('/patient/dashboard')}
                    />
                  )}

                  {aiSending && (
                    <div className="flex gap-2.5 justify-start">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Brain className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-bl-sm px-4 py-3">
                        <div className="flex gap-1 items-center">
                          {[0, 1, 2].map(i => (
                            <div key={i} className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"
                              style={{ animationDelay: `${i * 0.15}s` }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={msgEndRef} />
                </div>

                {/* Suggested prompts (shown after first AI message) */}
                {showSuggestions && messages.length === 1 && !crisisData && (
                  <div className="px-4 pb-2">
                    <p className="text-xs text-slate-400 font-medium mb-2">Try saying...</p>
                    <div className="flex flex-wrap gap-1.5">
                      {SUGGESTED_PROMPTS.slice(0, 3).map(p => (
                        <button key={p}
                          onClick={() => sendMessage(p)}
                          className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full border border-blue-100 transition-colors"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input */}
                {!crisisData && (
                  <div className="border-t border-slate-100 p-3 flex gap-2 items-end">
                    <textarea rows={1}
                      value={inputMsg}
                      onChange={e => setInputMsg(e.target.value)}
                      onKeyDown={handleKey}
                      placeholder="Share how you're feeling..."
                      className="flex-1 resize-none text-sm px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 text-slate-800 max-h-28 overflow-y-auto"
                    />
                    <button onClick={() => sendMessage()}
                      disabled={!inputMsg.trim() || aiSending}
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white transition-colors flex-shrink-0"
                    >
                      {aiSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════
             TAB 3: PROGRESS
        ══════════════════════════════════════════════════════════════════ */}
        {tab === 'progress' && (
          <div className="space-y-4">
            {!lvl1 ? (
              <ConsentBanner
                title="Enable Progress Tracking"
                description="Complete daily check-ins to see your wellness trends and progress insights."
                loading={consentGranting}
                onGrant={() => grantConsent('LEVEL_1')}
              />
            ) : progressLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-7 h-7 text-blue-400 animate-spin" />
              </div>
            ) : !progress || progress.checkInCount === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                  <BarChart2 className="w-8 h-8 text-slate-300" />
                </div>
                <p className="font-semibold text-slate-600 mb-1">No data yet</p>
                <p className="text-slate-400 text-sm mb-5">Complete your first check-in to start tracking your wellness journey.</p>
                <button onClick={() => setTab('wellness')}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-xl text-sm transition-colors"
                >Start Check-In</button>
              </div>
            ) : (
              <>
                {/* Stats cards */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { Icon: Flame,        val: progress.streak,        label: 'Day streak',   color: 'text-orange-500', bg: 'bg-orange-50',  border: 'border-orange-100' },
                    { Icon: Activity,     val: progress.activityCount, label: 'Activities',   color: 'text-blue-500',   bg: 'bg-blue-50',    border: 'border-blue-100'   },
                    { Icon: Calendar,     val: progress.checkInCount,  label: 'Check-ins',    color: 'text-emerald-500',bg: 'bg-emerald-50', border: 'border-emerald-100'},
                  ].map(s => (
                    <div key={s.label} className={`bg-white rounded-2xl border ${s.border} shadow-sm p-4 text-center`}>
                      <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                        <s.Icon className={`w-5 h-5 ${s.color}`} />
                      </div>
                      <p className="text-2xl font-bold text-slate-800">{s.val}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Summary insight */}
                {progress.summaryInsight && (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                    <Brain className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <p className="text-blue-800 text-sm leading-relaxed">{progress.summaryInsight}</p>
                  </div>
                )}

                {/* Recent averages */}
                {progress.recentAvg && (
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                    <p className="text-sm font-semibold text-slate-800 mb-3">Last 7 Days — Averages</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: 'Mood',       val: progress.recentAvg.mood,       out: 5,  color: 'bg-blue-500'   },
                        { label: 'Stress',     val: progress.recentAvg.stress,     out: 10, color: 'bg-orange-500' },
                        { label: 'Energy',     val: progress.recentAvg.energy,     out: 5,  color: 'bg-emerald-500'},
                        { label: 'Sleep (h)',  val: progress.recentAvg.sleep,      out: 12, color: 'bg-indigo-500' },
                      ].map(m => {
                        if (m.val === null || m.val === undefined) return null;
                        const pct = Math.round((m.val / m.out) * 100);
                        return (
                          <div key={m.label} className="bg-slate-50 rounded-xl p-3">
                            <div className="flex justify-between items-center mb-2">
                              <p className="text-xs font-medium text-slate-600">{m.label}</p>
                              <p className="text-xs font-bold text-slate-800">{m.val.toFixed(1)}</p>
                            </div>
                            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div className={`h-full ${m.color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Trend indicators */}
                {progress.trends && (
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                    <p className="text-sm font-semibold text-slate-800 mb-3">Trends vs. Previous Month</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { key: 'mood',   label: 'Mood'   },
                        { key: 'stress', label: 'Stress' },
                        { key: 'energy', label: 'Energy' },
                        { key: 'sleep',  label: 'Sleep'  },
                      ].map(({ key, label }) => {
                        const t = progress.trends[key];
                        if (!t) return null;
                        const dir = t.direction;
                        const cfgs = {
                          improving:         { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', Icon: TrendingUp,   txt: 'Improving'   },
                          concerning:        { color: 'text-red-500',     bg: 'bg-red-50',     border: 'border-red-100',     Icon: TrendingDown, txt: 'Needs care'  },
                          stable:            { color: 'text-slate-500',   bg: 'bg-slate-50',   border: 'border-slate-100',   Icon: Minus,        txt: 'Stable'      },
                          insufficient_data: { color: 'text-slate-400',   bg: 'bg-slate-50',   border: 'border-slate-100',   Icon: Info,         txt: 'More data'   },
                          no_baseline:       { color: 'text-slate-400',   bg: 'bg-slate-50',   border: 'border-slate-100',   Icon: Info,         txt: 'Building...' },
                        };
                        const cfg = cfgs[dir] || cfgs.stable;
                        const TIcon = cfg.Icon;
                        return (
                          <div key={key} className={`${cfg.bg} border ${cfg.border} rounded-xl p-3 flex items-center gap-2`}>
                            <TIcon className={`w-4 h-4 ${cfg.color} flex-shrink-0`} />
                            <div>
                              <p className="text-xs font-semibold text-slate-700">{label}</p>
                              <p className={`text-xs ${cfg.color}`}>{cfg.txt}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Mood & Stress chart */}
                {progress.chartData?.length >= 1 && (
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                    <p className="text-sm font-semibold text-slate-800 mb-1">Mood, Stress & Energy</p>
                    <p className="text-xs text-slate-400 mb-4">Last 7 check-ins</p>
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={progress.chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="gMood" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="gEnergy" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }}
                          tickFormatter={d => new Date(d + 'T00:00:00').toLocaleDateString('en', { weekday: 'short' })}
                        />
                        <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="mood"   stroke="#2563eb" strokeWidth={2} fill="url(#gMood)"   dot={{ r: 3, fill: '#2563eb' }} name="Mood"   />
                        <Area type="monotone" dataKey="energy" stroke="#10b981" strokeWidth={2} fill="url(#gEnergy)" dot={{ r: 3, fill: '#10b981' }} name="Energy" />
                        <Line  type="monotone" dataKey="stress" stroke="#f97316" strokeWidth={2} dot={{ r: 3, fill: '#f97316' }} name="Stress" strokeDasharray="4 2" />
                      </AreaChart>
                    </ResponsiveContainer>
                    <div className="flex gap-4 mt-2 justify-center">
                      {[['#2563eb','Mood'],['#10b981','Energy'],['#f97316','Stress']].map(([c, l]) => (
                        <div key={l} className="flex items-center gap-1.5">
                          <div className="w-3 h-1.5 rounded-full" style={{ background: c }} />
                          <span className="text-xs text-slate-500">{l}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sleep chart */}
                {progress.chartData?.some(d => d.sleep) && (
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                    <p className="text-sm font-semibold text-slate-800 mb-1">Sleep Hours</p>
                    <p className="text-xs text-slate-400 mb-4">Recommended: 7–9 hours</p>
                    <ResponsiveContainer width="100%" height={150}>
                      <AreaChart data={progress.chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="gSleep" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }}
                          tickFormatter={d => new Date(d + 'T00:00:00').toLocaleDateString('en', { weekday: 'short' })}
                        />
                        <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} domain={[0, 12]} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="sleep" stroke="#6366f1" strokeWidth={2.5} fill="url(#gSleep)"
                          dot={{ r: 4, fill: '#6366f1' }} name="Sleep (hrs)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Motivation chart */}
                {progress.chartData?.some(d => d.motivation) && (
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                    <p className="text-sm font-semibold text-slate-800 mb-4">Motivation</p>
                    <ResponsiveContainer width="100%" height={120}>
                      <AreaChart data={progress.chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="gMotiv" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }}
                          tickFormatter={d => new Date(d + 'T00:00:00').toLocaleDateString('en', { weekday: 'short' })}
                        />
                        <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} domain={[0, 5]} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="motivation" stroke="#f59e0b" strokeWidth={2} fill="url(#gMotiv)"
                          dot={{ r: 3, fill: '#f59e0b' }} name="Motivation"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>

      {/* Floating crisis button — mobile only */}
      <div className="fixed bottom-5 right-4 z-30 sm:hidden">
        <button onClick={() => setShowCrisis(true)}
          className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-3 py-2 rounded-full shadow-lg shadow-red-200 transition-all"
        >
          <Phone className="w-3.5 h-3.5" />
          Crisis Help
        </button>
      </div>
    </div>
  );
}
