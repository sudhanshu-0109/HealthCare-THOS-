/**
 * pages/patient/WellnessHome.jsx
 *
 * Mental Wellness — Home / Dashboard page.
 * Route: /health-hub/mental-wellness
 *
 * Merges:
 *  - Visual layout from Mentalwellness-frontend/src/pages/WellnessHome.tsx
 *    (mood check-in card, slider rows, Quick Reset carousel, Explore categories,
 *     Wellness Programs, Progress stats glass-card, AI Companion CTA)
 *  - API wiring from existing MentalWellness.jsx
 *    (getProfile, submitCheckIn, getCheckInHistory, getWellnessContent, getPrograms)
 *  - Graceful mock fallbacks when API is unavailable
 *
 * Converted from TSX: interfaces removed, generic types removed, React.CSSProperties
 * cast replaced with plain object, MoodId type cast removed.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import * as mhService from '../../services/mentalHealth.service';
import ActivityPlayer from '../../components/mentalWellness/ActivityPlayer';
import {
  MOODS,
  QUICK_RESET,
  CATEGORIES,
  PROGRAMS as MOCK_PROGRAMS,
  RECOMMENDATIONS,
} from '../../data/wellnessMockData';

// ── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
}

function getDateString() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

// Map mood IDs to ActivityPlayer content types for Quick Reset
const MOOD_TO_TYPE = {
  overwhelmed: 'GROUNDING',
  low:         'MINDFULNESS',
  neutral:     'MINDFULNESS',
  okay:        'BREATHING',
  good:        'MEDITATION',
  thriving:    'GRATITUDE',
};

const QUICKRESET_TO_TYPE = {
  qr1: 'BREATHING',
  qr2: 'MINDFULNESS',
  qr3: 'GROUNDING',
  qr4: 'MINDFULNESS',
  qr5: 'MINDFULNESS',
};

const CATEGORY_TO_TYPE = {
  Mindfulness: 'MINDFULNESS',
  Breathwork:  'BREATHING',
  Sleep:       'SLEEP_SOUND',
  Movement:    'MINDFULNESS',
  Journaling:  'GRATITUDE',
  'Sound Bath':'RELAXATION_MUSIC',
  Meditation:  'MEDITATION',
  'Body Scan': 'MINDFULNESS',
};

// ── SliderRow sub-component ───────────────────────────────────────────────────

/**
 * @param {{ label: string, sublabel: string, value: number, onChange: (v: number) => void }} props
 */
function SliderRow({ label, sublabel, value, onChange }) {
  const pct = ((value - 1) / 9) * 100;
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="text-sm font-semibold text-[#171d1c] font-display">{label}</span>
          <span className="text-xs text-[#3c4948] ml-2">{sublabel}</span>
        </div>
        <span className="text-sm font-bold text-[#006a67] font-display tabular-nums">
          {value}<span className="text-[#3c4948] font-normal">/10</span>
        </span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mw-range-input w-full"
        style={{ '--mw-range-progress': `${pct}%` }}
        aria-label={label}
      />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function WellnessHome() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const firstName = user?.fullName?.split(' ')[0] || 'there';

  // ── Mood check-in state ──────────────────────────────────────────────────
  const [selectedMood, setSelectedMood] = useState(null);
  const [energy,       setEnergy]       = useState(5);
  const [stress,       setStress]       = useState(7);
  const [motivation,   setMotivation]   = useState(5);
  const [checkedIn,    setCheckedIn]    = useState(false);
  const [submitting,   setSubmitting]   = useState(false);

  // ── Programs (API with mock fallback) ───────────────────────────────────
  const [programs,        setPrograms]        = useState(MOCK_PROGRAMS);
  const [programsLoading, setProgramsLoading] = useState(false);

  // ── Progress (API with mock fallback) ───────────────────────────────────
  const [streak, setStreak] = useState(21); // mock default

  // ── Activity Player ─────────────────────────────────────────────────────
  const [activeActivity, setActiveActivity] = useState(null);

  // ── API: load programs on mount ─────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setProgramsLoading(true);
      try {
        const res = await mhService.getPrograms();
        const data = res?.data ?? res;
        if (Array.isArray(data) && data.length > 0) setPrograms(data);
      } catch {
        // keep mock fallback
      } finally {
        setProgramsLoading(false);
      }
    })();
  }, []);

  // ── API: load today's check-in status ──────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await mhService.getCheckInHistory(1);
        const data = res?.data ?? res;
        const history = Array.isArray(data) ? data : data?.checkIns ?? [];
        if (history.length > 0) {
          const latest = history[0];
          const today = new Date().toDateString();
          const latestDate = new Date(latest.createdAt || latest.date || '').toDateString();
          if (latestDate === today) {
            setCheckedIn(true);
            // Map stored mood score back to mood id
            const found = MOODS.find(m => m.score === latest.moodScore || m.id === latest.mood);
            if (found) setSelectedMood(found.id);
          }
        }
      } catch {
        // not checked in yet
      }
    })();
  }, []);

  // ── API: load progress for streak ──────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await mhService.getProgress();
        const data = res?.data ?? res;
        if (data?.currentStreak !== undefined) setStreak(data.currentStreak);
      } catch {
        // keep mock streak
      }
    })();
  }, []);

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleCheckIn = async () => {
    if (!selectedMood) return;
    setSubmitting(true);
    try {
      await mhService.submitCheckIn({
        mood: selectedMood,
        moodScore: MOODS.find(m => m.id === selectedMood)?.score ?? 3,
        energy,
        stressLevel: stress,
        motivation,
      });
    } catch {
      // graceful: still show confirmed UI even if API fails
    } finally {
      setSubmitting(false);
      setCheckedIn(true);
    }
  };

  const handleStartActivity = (type, title, durationMin) => {
    setActiveActivity({
      type:     type,
      title:    title,
      duration: (durationMin || 5) * 60,
    });
  };

  const handleActivityComplete = async () => {
    setActiveActivity(null);
  };

  // ── Derived ─────────────────────────────────────────────────────────────
  const rec         = selectedMood ? RECOMMENDATIONS[selectedMood] : null;
  const currentMood = MOODS.find(m => m.id === selectedMood);

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <>
      {/* Activity Player overlay */}
      {activeActivity && (
        <ActivityPlayer
          activity={activeActivity}
          onClose={() => setActiveActivity(null)}
          onComplete={handleActivityComplete}
        />
      )}

      <div className="max-w-[1280px] mx-auto px-5 md:px-16 py-8 pb-36 md:pb-12">

        {/* ── Welcome header ───────────────────────────────────────────── */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-[#3c4948] mb-1">{getDateString()}</p>
              <h1 className="font-display font-bold text-3xl md:text-4xl text-[#171d1c] leading-tight">
                {getGreeting()}, {firstName}.
              </h1>
              <p className="text-[#3c4948] mt-1.5 text-base">
                {checkedIn
                  ? `Today feels ${currentMood?.label.toLowerCase() ?? 'good'} — here is what might help.`
                  : "Let's start with how you're feeling right now."}
              </p>
            </div>

            {/* Streak pill */}
            <div className="mw-glass-card mw-soft-shadow rounded-2xl px-4 py-3 flex items-center gap-2.5 flex-shrink-0 hidden sm:flex">
              <span className="text-xl">🔥</span>
              <div>
                <p className="font-display font-bold text-lg text-[#171d1c] leading-none">{streak}</p>
                <p className="text-xs text-[#3c4948]">day streak</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Check-in + Recommendation (two-column) ──────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">

          {/* Check-in card */}
          <div className="mw-card p-6">
            {checkedIn ? (
              <div className="flex flex-col items-center justify-center text-center py-4 gap-3">
                <div className="w-14 h-14 rounded-2xl bg-[#006a67]/10 flex items-center justify-center mb-1">
                  <span className="text-3xl">{currentMood?.emoji ?? '😊'}</span>
                </div>
                <h3 className="font-display font-semibold text-[#171d1c] text-lg">Check-in complete!</h3>
                <p className="text-sm text-[#3c4948] max-w-xs">
                  Feeling {currentMood?.label.toLowerCase() ?? 'good'} · Energy {energy}/10 · Stress {stress}/10
                </p>
                <button
                  onClick={() => setCheckedIn(false)}
                  className="mt-2 text-xs text-[#006a67] hover:underline font-medium"
                >
                  Update check-in
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-xl bg-[#006a67]/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#006a67] msym-sm">mood</span>
                  </div>
                  <div>
                    <h2 className="font-display font-semibold text-[#171d1c] text-base leading-tight">Daily Check-In</h2>
                    <p className="text-xs text-[#3c4948]">How are you feeling right now?</p>
                  </div>
                </div>

                {/* Mood picker */}
                <div className="grid grid-cols-6 gap-1.5 mb-6">
                  {MOODS.map((mood) => (
                    <button
                      key={mood.id}
                      onClick={() => setSelectedMood(mood.id)}
                      className={`flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-xl transition-all duration-150 ${
                        selectedMood === mood.id
                          ? 'bg-[#006a67]/10 ring-2 ring-[#006a67] scale-105'
                          : 'hover:bg-[#e9efee]'
                      }`}
                      aria-label={mood.label}
                      aria-pressed={selectedMood === mood.id}
                    >
                      <span className="text-2xl leading-none">{mood.emoji}</span>
                      <span
                        className={`text-[9px] font-medium leading-none ${
                          selectedMood === mood.id ? 'text-[#006a67]' : 'text-[#3c4948]'
                        }`}
                      >
                        {mood.label}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Sliders */}
                <div className="space-y-4">
                  <SliderRow label="Energy"     sublabel="how alive do you feel?"   value={energy}     onChange={setEnergy} />
                  <SliderRow label="Stress"     sublabel="what's your tension level?" value={stress}   onChange={setStress} />
                  <SliderRow label="Motivation" sublabel="ready to engage?"          value={motivation} onChange={setMotivation} />
                </div>

                <button
                  onClick={handleCheckIn}
                  disabled={!selectedMood || submitting}
                  className="mt-6 w-full mw-btn-primary"
                >
                  {submitting ? 'Saving…' : 'Submit Check-In'}
                </button>
              </>
            )}
          </div>

          {/* Recommendation card */}
          <div className="mw-card p-6 flex flex-col relative overflow-hidden">
            {!checkedIn || !rec ? (
              <div className="flex flex-col items-center justify-center flex-1 text-center py-8 gap-3">
                <div className="w-16 h-16 rounded-2xl bg-[#e9efee] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#6c7a78] msym-lg">spa</span>
                </div>
                <p className="text-[#3c4948] text-sm max-w-[200px] leading-relaxed">
                  Complete your check-in to receive a personalized recommendation.
                </p>
              </div>
            ) : (
              <>
                {/* Decorative orbs */}
                <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-[#006a67]/5" />
                <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full bg-[#ffdbca]/40" />

                <div className="relative">
                  <p className="text-[10px] font-bold text-[#006a67] uppercase tracking-widest font-display mb-3">
                    Recommended for you
                  </p>
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-[#006a67]/10 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-[#006a67]">{rec.icon}</span>
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-[#171d1c] text-xl leading-tight">{rec.title}</h3>
                      <p className="text-sm text-[#3c4948] mt-1 leading-relaxed">{rec.description}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-5">
                    {[rec.duration, rec.category, rec.intensity].map((tag) => (
                      <span key={tag} className="text-xs font-medium text-[#3c4948] bg-[#e9efee] px-3 py-1.5 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => handleStartActivity(
                      MOOD_TO_TYPE[selectedMood] || 'MINDFULNESS',
                      rec.title,
                      parseInt(rec.duration) || 5
                    )}
                    className="w-full mw-btn-primary"
                  >
                    Begin Now
                  </button>
                  <button
                    onClick={() => setSelectedMood(null)}
                    className="w-full mt-2.5 text-[#006a67] text-sm font-medium py-2 hover:underline"
                  >
                    Show other options
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Quick Reset ──────────────────────────────────────────────── */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-[#171d1c] text-xl">Quick Reset</h2>
            <span className="text-sm text-[#006a67] font-medium cursor-pointer hover:underline">See all</span>
          </div>
          <div className="flex gap-3 overflow-x-auto mw-hide-scrollbar -mx-5 md:mx-0 px-5 md:px-0 pb-1">
            {QUICK_RESET.map((item) => (
              <button
                key={item.id}
                onClick={() => handleStartActivity(
                  QUICKRESET_TO_TYPE[item.id] || 'BREATHING',
                  item.title,
                  parseInt(item.duration) || 4
                )}
                className="mw-card flex-shrink-0 w-[70vw] sm:w-56 p-4 text-left hover:border-[#006a67]/30 hover:-translate-y-0.5 transition-all duration-200 rounded-2xl active:scale-[0.97]"
              >
                <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center mb-3`}>
                  <span className="material-symbols-outlined text-[#006a67]">{item.icon}</span>
                </div>
                <p className="font-display font-semibold text-[#171d1c] text-sm leading-tight mb-1">{item.title}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-[#3c4948]">{item.duration}</span>
                  <span className="w-1 h-1 rounded-full bg-[#bcc9c8]" />
                  <span className="text-xs text-[#3c4948]">{item.category}</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ── Explore Categories ───────────────────────────────────────── */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-[#171d1c] text-xl">Explore</h2>
            <span className="text-sm text-[#006a67] font-medium cursor-pointer hover:underline">All categories</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleStartActivity(
                  CATEGORY_TO_TYPE[cat.label] || 'MINDFULNESS',
                  cat.label,
                  10
                )}
                className="mw-card flex flex-col items-center gap-2 py-4 px-2 hover:border-[#006a67]/30 hover:-translate-y-0.5 transition-all duration-200 rounded-2xl active:scale-[0.97] text-center"
              >
                <div className={`w-10 h-10 rounded-xl ${cat.iconBg} flex items-center justify-center`}>
                  <span className={`material-symbols-outlined msym-sm ${cat.iconColor}`}>{cat.icon}</span>
                </div>
                <span className="font-display font-semibold text-[#171d1c] text-xs leading-tight">{cat.label}</span>
                <span className="text-[10px] text-[#3c4948]">{cat.count} practices</span>
              </button>
            ))}
          </div>
        </section>

        {/* ── Wellness Programs ────────────────────────────────────────── */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-[#171d1c] text-xl">Your Programs</h2>
            <span className="text-sm text-[#006a67] font-medium cursor-pointer hover:underline">Browse all</span>
          </div>
          {programsLoading ? (
            <div className="flex gap-4">
              {[1,2,3].map(i => (
                <div key={i} className="mw-card flex-shrink-0 w-[78vw] sm:w-72 md:w-auto md:flex-1 p-5 rounded-2xl animate-pulse h-40" />
              ))}
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto mw-hide-scrollbar -mx-5 md:mx-0 px-5 md:px-0 pb-1 md:grid md:grid-cols-3">
              {programs.map((prog) => (
                <div
                  key={prog.id}
                  className="mw-card flex-shrink-0 w-[78vw] sm:w-72 md:w-auto p-5 rounded-2xl relative overflow-hidden"
                >
                  <div className={`absolute inset-0 ${prog.accent} rounded-2xl`} />
                  <div className="relative">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-display font-bold text-[#171d1c] text-base leading-tight">{prog.title}</h3>
                        <p className="text-xs text-[#3c4948] mt-0.5">{prog.subtitle}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full font-display flex-shrink-0 ${prog.tagColor}`}>
                        {prog.tag}
                      </span>
                    </div>
                    <p className="text-sm text-[#3c4948] mb-4 leading-relaxed line-clamp-2">{prog.description}</p>

                    {prog.progress > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-[#3c4948]">
                            Week {prog.currentWeek} of {prog.weeks}
                          </span>
                          <span className="text-xs font-bold text-[#006a67] font-display">{prog.progress}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[#e4e9e8] overflow-hidden">
                          <div
                            className="h-full bg-[#006a67] rounded-full transition-all"
                            style={{ width: `${prog.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mb-4">
                      <span className="material-symbols-outlined text-[#006a67] msym-sm">play_circle</span>
                      <span className="text-xs text-[#3c4948] truncate">Next: {prog.nextSession}</span>
                    </div>

                    <button
                      onClick={() => handleStartActivity('WELLNESS_PROGRAM', prog.nextSession, 20)}
                      className="w-full mw-btn-outline text-xs"
                    >
                      {prog.progress === 0 ? 'Start Program' : 'Continue'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Progress stats + Companion CTA ──────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Progress glass-card */}
          <div className="mw-glass-card rounded-2xl p-5 mw-soft-shadow">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-[#006a67] msym-sm filled">insights</span>
              <h3 className="font-display font-semibold text-[#171d1c] text-base">This Week</h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { value: String(streak), label: 'day streak',    icon: '🔥' },
                { value: '8',            label: 'sessions',       icon: '✓'  },
                { value: '3.8',          label: 'mood score',     icon: '●'  },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="font-display font-bold text-2xl text-[#171d1c] leading-none">{stat.value}</p>
                  <p className="text-xs text-[#3c4948] mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate('/health-hub/mental-wellness/journey')}
              className="mt-4 w-full text-sm text-[#006a67] font-medium py-2.5 rounded-full border border-[#006a67]/25 hover:bg-[#006a67]/8 transition-colors font-display"
            >
              View full journey →
            </button>
          </div>

          {/* AI Companion CTA */}
          <button
            onClick={() => navigate('/health-hub/mental-wellness/companion')}
            className="relative overflow-hidden rounded-2xl p-5 text-left group"
            style={{ background: 'linear-gradient(135deg, #006a67 0%, #03a6a1 100%)' }}
          >
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/10 -translate-y-1/3 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/5 translate-y-1/3 -translate-x-1/3" />
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-white filled">smart_toy</span>
              </div>
              <h3 className="font-display font-bold text-white text-xl leading-tight mb-2">
                Talk to your AI Companion
              </h3>
              <p className="text-white/75 text-sm leading-relaxed mb-4">
                Get personalized guidance, work through what is on your mind, or just check in.
              </p>
              <span className="inline-flex items-center gap-2 text-white font-display font-semibold text-sm group-hover:gap-3 transition-all">
                Open companion
                <span className="material-symbols-outlined msym-sm">arrow_forward</span>
              </span>
            </div>
          </button>
        </div>

      </div>
    </>
  );
}
