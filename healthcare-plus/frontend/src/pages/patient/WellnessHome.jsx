/**
 * pages/patient/WellnessHome.jsx
 *
 * Mental Wellness — Home / Dashboard page.
 * Route: /health-hub/mental-wellness
 *
 * Data strategy:
 *   - Programs, recommendations, progress streak → fetched from API; empty state shown on failure
 *   - Mood check-in → submitted to API; today's check-in status cached in state
 *   - Quick Reset / Categories → static config from wellnessMockData.js (not mock data, real UI config)
 *   - Activity history → localStorage (mw_activity_log), appended on ActivityPlayer complete
 *
 * ActivityPlayer fix:
 *   - Uses prop name `item` (what ActivityPlayer expects) with `duration` in MINUTES
 *   - Each Quick Reset card drives its own timer via `durationMin` from the static config
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import * as mhService from '../../services/mentalHealth.service';
import ActivityPlayer from '../../components/mentalWellness/ActivityPlayer';
import {
  MOODS,
  QUICK_RESET,
  CATEGORIES,
  CATEGORY_ICONS,
  getPersonalizedRecommendations,
  appendActivityLog,
  saveCheckIn,
  loadTodayCheckIn,
  saveProgressCache,
  loadProgressCache,
  calculateStreak,
  loadActivityLog,
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
    weekday: 'long', month: 'long', day: 'numeric',
  });
}

// ── SliderRow sub-component ───────────────────────────────────────────────────

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
  const navigate  = useNavigate();
  const { user }  = useAuthStore();
  const firstName = user?.fullName?.split(' ')[0] || 'there';

  // ── Check-in state — initialised from localStorage so it survives refresh ──
  const [selectedMood, setSelectedMood] = useState(() => loadTodayCheckIn()?.mood    ?? null);
  const [energy,       setEnergy]       = useState(() => loadTodayCheckIn()?.energy  ?? 5);
  const [stress,       setStress]       = useState(() => loadTodayCheckIn()?.stressLevel ?? 7);
  const [motivation,   setMotivation]   = useState(() => loadTodayCheckIn()?.motivation  ?? 5);
  const [checkedIn,    setCheckedIn]    = useState(() => loadTodayCheckIn() !== null);
  const [submitting,   setSubmitting]   = useState(false);

  // ── Programs from API ───────────────────────────────────────────────────
  const [programs,        setPrograms]        = useState([]);
  const [programsLoading, setProgramsLoading] = useState(true);

  // ── Streak — initialised from calculateStreak and cache ─────────────────
  const [streak, setStreak] = useState(() => calculateStreak() || loadProgressCache()?.currentStreak || 0);

  // ── Activity player ─────────────────────────────────────────────────────
  // `activeItem` is the object passed directly to ActivityPlayer as `item`
  // item.duration MUST be in MINUTES (ActivityPlayer multiplies by 60 internally)
  const [activeItem, setActiveItem] = useState(null);
  const activityStartRef = useRef(null); // ISO string of when player was opened
  const [recIndex, setRecIndex] = useState(0);

  // ── Sync check-in state with API on mount ──────────────────────────────
  // localStorage is already loaded as initial state (survives refresh).
  // This effect only UPGRADES state if the API has a more recent entry.
  useEffect(() => {
    if (checkedIn) return; // already know we checked in — skip API call
    (async () => {
      try {
        const res  = await mhService.getCheckInHistory(1);
        const data = res?.data ?? res;
        const history = Array.isArray(data) ? data : (data?.checkIns ?? []);
        if (history.length > 0) {
          const latest    = history[0];
          const todayStr  = new Date().toDateString();
          const latestStr = new Date(latest.createdAt || latest.date || '').toDateString();
          if (latestStr === todayStr) {
            setCheckedIn(true);
            const found = MOODS.find(m => m.score === latest.moodScore || m.id === latest.mood);
            if (found) setSelectedMood(found.id);
            // Also persist to localStorage in case it wasn't saved locally before
            saveCheckIn({
              mood:        found?.id ?? latest.mood,
              moodScore:   latest.moodScore,
              energy:      latest.energy ?? energy,
              stress:      latest.stressLevel ?? latest.stress ?? stress,
              stressLevel: latest.stressLevel ?? latest.stress ?? stress,
              motivation:  latest.motivation ?? motivation,
            });
          }
        }
      } catch {
        // API unavailable — localStorage state is authoritative
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch programs on mount ─────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setProgramsLoading(true);
      try {
        const res  = await mhService.getPrograms();
        const data = res?.data ?? res;
        if (Array.isArray(data) && data.length > 0) setPrograms(data);
        // else: leave programs = [] → show empty state
      } catch {
        // show empty state
      } finally {
        setProgramsLoading(false);
      }
    })();
  }, []);

  // ── Fetch progress/streak (cache → API) ────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res  = await mhService.getProgress();
        const data = res?.data ?? res;
        if (data) {
          const localStreak = calculateStreak();
          const effectiveStreak = Math.max(Number(data.currentStreak || 0), localStreak);
          setStreak(effectiveStreak);
          saveProgressCache({
            ...data,
            currentStreak: effectiveStreak,
          });
        }
      } catch {
        setStreak(calculateStreak());
      }
    })();
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleCheckIn = async () => {
    if (!selectedMood) return;
    setSubmitting(true);

    const payload = {
      mood:        selectedMood,
      moodScore:   MOODS.find(m => m.id === selectedMood)?.score ?? 3,
      energy,
      stress,
      stressLevel: stress,
      motivation,
    };

    // ① Persist locally FIRST & update streak immediately — guarantees check-in survives refresh
    const updatedStreak = saveCheckIn(payload);
    setStreak(updatedStreak || 1);
    setCheckedIn(true);  // optimistic UI — don't wait for API
    setSubmitting(false);

    // ② Fire-and-forget to API (no await at UI level)
    mhService.submitCheckIn(payload).catch(() => {
      // Already saved locally — silently ignore API failure
    });
  };

  /**
   * Open ActivityPlayer for an activity.
   * @param {{ type: string, title: string, durationMin: number, category: string, icon: string }} opts
   */
  const openActivity = ({ type, title, durationMin, category, icon }) => {
    activityStartRef.current = new Date().toISOString();
    setActiveItem({
      type,
      title,
      // ActivityPlayer reads item.duration in MINUTES and multiplies by 60 internally
      duration: durationMin,
      description: `${durationMin} min · ${category}`,
    });
  };

  /**
   * Called by ActivityPlayer when the timer reaches zero.
   * Logs the completed session to localStorage with format:
   *   "Meditation at 12:45 for 10 minutes"
   */
  const handleActivityComplete = (completedItem) => {
    setActiveItem(null);
    if (!completedItem) return;

    const cat  = completedItem.description?.split(' · ')[1] ?? 'Mindfulness';
    const icon = CATEGORY_ICONS[cat] ?? 'self_improvement';

    appendActivityLog({
      title:       completedItem.title,
      category:    cat,
      icon,
      durationMin: completedItem.duration, // minutes (as passed in)
      startedAt:   activityStartRef.current ?? new Date().toISOString(),
    });

    // Also try to submit to the API (fire-and-forget)
    mhService.completeActivity?.('local', {
      title:    completedItem.title,
      duration: completedItem.duration,
    }).catch(() => {});
  };

  // ── Derived dynamic recommendations based on mood, energy, stress, motivation ──
  const recommendations = useMemo(() => {
    return getPersonalizedRecommendations({
      mood: selectedMood || loadTodayCheckIn()?.mood || 'neutral',
      energy,
      stress,
      motivation,
    });
  }, [selectedMood, energy, stress, motivation]);

  const rec = recommendations[recIndex % recommendations.length] || recommendations[0];
  const currentMood = MOODS.find(m => m.id === selectedMood);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      {/* ActivityPlayer overlay — prop name MUST be `item`, duration in MINUTES */}
      {activeItem && (
        <ActivityPlayer
          item={activeItem}
          onClose={() => setActiveItem(null)}
          onComplete={handleActivityComplete}
        />
      )}

      <div className="max-w-[1280px] mx-auto px-5 md:px-16 py-8 pb-36 md:pb-12">

        {/* ── Welcome header ───────────────────────────────────────── */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[#3c4948] mb-1">{getDateString()}</p>
              <h1 className="font-display font-bold text-3xl md:text-4xl text-[#171d1c] leading-tight">
                {getGreeting()}, {firstName}.
              </h1>
              <p className="text-[#3c4948] mt-1.5 text-base">
                {checkedIn
                  ? `Feeling ${currentMood?.label.toLowerCase() ?? 'good'} today — here is what might help.`
                  : "Let's start with how you're feeling right now."}
              </p>
            </div>

            {/* Streak pill — only shown once loaded */}
            {streak !== null && (
              <div className="mw-glass-card mw-soft-shadow rounded-2xl px-4 py-3 flex items-center gap-2.5 flex-shrink-0 hidden sm:flex">
                <span className="text-xl">🔥</span>
                <div>
                  <p className="font-display font-bold text-lg text-[#171d1c] leading-none">{streak}</p>
                  <p className="text-xs text-[#3c4948]">day streak</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Check-in + Recommendation ────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">

          {/* Check-in card */}
          <div className="mw-card p-6 flex flex-col justify-between">
            {checkedIn ? (
              <div className="flex flex-col justify-between h-full min-h-[360px]">
                {/* 1. Header Bar */}
                <div>
                  <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[#e4e9e8]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[18px]">verified</span>
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-[#171d1c] text-sm leading-tight">Daily State Logged</h3>
                        <p className="text-[11px] text-[#3c4948]">Synchronized with your personal profile</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1 font-display">
                      <span>Active Streak</span>
                      <span>🔥</span>
                    </span>
                  </div>

                  {/* 2. Primary Mood Showcase Card */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#006a67]/8 to-[#5bd9d3]/10 border border-[#006a67]/15 mb-4 flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-[#006a67] text-white flex items-center justify-center shadow-sm flex-shrink-0">
                      <span className="material-symbols-outlined text-[24px]">
                        {currentMood?.icon || 'balance'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#006a67] font-display">Primary State</span>
                        <span className="text-[10px] text-[#3c4948]">· Level {currentMood?.score || 3}/6</span>
                      </div>
                      <h4 className="font-display font-bold text-base text-[#171d1c] truncate">
                        {currentMood?.label || 'Neutral'}
                      </h4>
                      <p className="text-xs text-[#3c4948] truncate">
                        {currentMood?.description || 'Centered equilibrium and steady perspective'}
                      </p>
                    </div>
                  </div>

                  {/* 3. Biomarkers / Metrics Matrix */}
                  <div className="grid grid-cols-3 gap-2.5 mb-4">
                    {/* Energy Metric */}
                    <div className="p-3 rounded-xl bg-[#f8faf9] border border-[#e4e9e8] flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-medium text-[#3c4948]">Energy</span>
                        <span className="material-symbols-outlined text-[16px] text-amber-500">bolt</span>
                      </div>
                      <p className="font-display font-bold text-sm text-[#171d1c] mb-1.5">
                        {energy}<span className="text-[11px] font-normal text-[#6c7a78]">/10</span>
                      </p>
                      <div className="w-full bg-[#e4e9e8] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-amber-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(10, energy * 10))}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-[#3c4948] mt-1 font-medium">
                        {energy >= 7 ? 'High Vitality' : energy <= 3 ? 'Depleted' : 'Balanced'}
                      </span>
                    </div>

                    {/* Stress Metric */}
                    <div className="p-3 rounded-xl bg-[#f8faf9] border border-[#e4e9e8] flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-medium text-[#3c4948]">Stress</span>
                        <span className="material-symbols-outlined text-[16px] text-rose-500">cyclone</span>
                      </div>
                      <p className="font-display font-bold text-sm text-[#171d1c] mb-1.5">
                        {stress}<span className="text-[11px] font-normal text-[#6c7a78]">/10</span>
                      </p>
                      <div className="w-full bg-[#e4e9e8] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-rose-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(10, stress * 10))}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-[#3c4948] mt-1 font-medium">
                        {stress >= 7 ? 'Elevated' : stress <= 3 ? 'Relaxed' : 'Moderate'}
                      </span>
                    </div>

                    {/* Motivation Metric */}
                    <div className="p-3 rounded-xl bg-[#f8faf9] border border-[#e4e9e8] flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-medium text-[#3c4948]">Motivation</span>
                        <span className="material-symbols-outlined text-[16px] text-teal-600">target</span>
                      </div>
                      <p className="font-display font-bold text-sm text-[#171d1c] mb-1.5">
                        {motivation}<span className="text-[11px] font-normal text-[#6c7a78]">/10</span>
                      </p>
                      <div className="w-full bg-[#e4e9e8] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-teal-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(10, motivation * 10))}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-[#3c4948] mt-1 font-medium">
                        {motivation >= 7 ? 'Driven' : motivation <= 3 ? 'Rest Mode' : 'Steady'}
                      </span>
                    </div>
                  </div>

                  {/* 4. Adaptive Clinical Insight Notice */}
                  <div className="p-3 rounded-xl bg-[#eef7f6] border border-[#d3ebe8] flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-[#006a67] text-[18px] mt-0.5 flex-shrink-0">
                      tips_and_updates
                    </span>
                    <p className="text-xs text-[#204a48] leading-relaxed">
                      {stress >= 7
                        ? `Elevated tension (${stress}/10) detected. We prioritized vagal breathwork and somatic release on the right to decompress your body.`
                        : (motivation <= 4 && energy >= 6)
                        ? `High physical energy (${energy}/10) with low motivation (${motivation}/10) detected. We tailored your recommendations to break inertia with an effortless micro-step rather than demanding big tasks.`
                        : (motivation <= 4 && stress >= 6)
                        ? `Low motivation (${motivation}/10) paired with elevated stress (${stress}/10) detected. We prioritized tension relief first to remove the subconscious paralysis blocking your drive.`
                        : (motivation <= 4 && energy <= 4)
                        ? `Both energy (${energy}/10) and motivation (${motivation}/10) are depleted today. We selected zero-demand restorative care so you can recharge without pressure.`
                        : motivation <= 4
                        ? `Lower motivation (${motivation}/10) detected. We selected low-barrier momentum sessions to spark your drive without overwhelm.`
                        : stress >= 6
                        ? `Elevated stress (${stress}/10) detected. We prioritized parasympathetic down-regulation on the right to restore inner ease.`
                        : energy <= 4
                        ? `Low energy reserves (${energy}/10) detected. Prioritize gentle restorative pauses over high demands today.`
                        : energy >= 7 && motivation >= 6 && stress <= 5
                        ? `High vitality (${energy}/10) and steady motivation (${motivation}/10)! Prime window for deep creative focus and intentional progress.`
                        : 'Your daily state has been recorded. Personal recommendations on the right are aligned with your balance.'}
                    </p>
                  </div>
                </div>

                {/* 5. Footer Update Action */}
                <div className="pt-4 border-t border-[#e4e9e8] flex items-center justify-between gap-3 mt-4">
                  <span className="text-[11px] text-[#6c7a78] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">lock</span>
                    <span>Private & encrypted health log</span>
                  </span>
                  <button
                    onClick={() => setCheckedIn(false)}
                    className="px-3.5 py-1.5 rounded-xl border border-[#c2d6d4] hover:bg-[#eef7f6] text-[#006a67] font-semibold text-xs flex items-center gap-1.5 transition-colors font-display cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[15px]">edit_note</span>
                    <span>Update Check-in</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-xl bg-[#006a67]/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#006a67] msym-sm">mood</span>
                  </div>
                  <div>
                    <h2 className="font-display font-semibold text-[#171d1c] text-base leading-tight">Daily Check-In</h2>
                    <p className="text-xs text-[#3c4948]">Select your current emotional state</p>
                  </div>
                </div>

                {/* Mood picker with modern vector icons */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-6">
                  {MOODS.map((mood) => {
                    const isSelected = selectedMood === mood.id;
                    return (
                      <button
                        key={mood.id}
                        type="button"
                        onClick={() => setSelectedMood(mood.id)}
                        className={`group flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl transition-all duration-200 border cursor-pointer ${
                          isSelected
                            ? `${mood.activeBg} shadow-md scale-105 ring-2 ring-offset-1 ring-[#006a67]/30`
                            : `${mood.bg} hover:scale-102 hover:shadow-xs border-transparent`
                        }`}
                        aria-label={mood.label}
                        aria-pressed={isSelected}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                          isSelected ? 'bg-white/20' : 'bg-white/80 shadow-xs'
                        }`}>
                          <span className="material-symbols-outlined text-[22px]">
                            {mood.icon}
                          </span>
                        </div>
                        <span className={`text-[10px] font-bold leading-tight font-display tracking-tight text-center ${
                          isSelected ? 'text-white' : 'text-[#171d1c]'
                        }`}>
                          {mood.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Sliders */}
                <div className="space-y-4">
                  <SliderRow label="Energy"     sublabel="how alive do you feel?"     value={energy}     onChange={setEnergy}     />
                  <SliderRow label="Stress"     sublabel="what's your tension level?" value={stress}     onChange={setStress}     />
                  <SliderRow label="Motivation" sublabel="ready to engage?"           value={motivation} onChange={setMotivation} />
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
                  Complete your check-in to receive a personalised recommendation.
                </p>
              </div>
            ) : (
              <>
                <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-[#006a67]/5 pointer-events-none" />
                <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full bg-[#ffdbca]/40 pointer-events-none" />

                <div className="relative flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <p className="text-[10px] font-bold text-[#006a67] uppercase tracking-widest font-display">
                        Recommended for you
                      </p>
                      {rec.reason && (
                        <span className="text-[11px] font-semibold text-[#006a67] bg-[#006a67]/10 px-2.5 py-0.5 rounded-full font-display">
                          {rec.reason}
                        </span>
                      )}
                    </div>

                    <div className="flex items-start gap-4 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-[#006a67]/10 flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-[#006a67]">{rec.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display font-bold text-[#171d1c] text-xl leading-tight">{rec.title}</h3>
                        <p className="text-sm text-[#3c4948] mt-1 leading-relaxed">{rec.description}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {[`${rec.durationMin} min`, rec.category, rec.intensity].map((tag) => (
                        <span key={tag} className="text-xs font-medium text-[#3c4948] bg-[#e9efee] px-3 py-1.5 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Mini alternative option selector pills */}
                    <div className="mb-4">
                      <p className="text-[11px] text-[#3c4948] font-medium mb-1.5">Tailored options for your state:</p>
                      <div className="grid grid-cols-3 gap-2">
                        {recommendations.map((item, idx) => {
                          const isActive = (recIndex % recommendations.length) === idx;
                          return (
                            <button
                              key={item.id}
                              onClick={() => setRecIndex(idx)}
                              className={`text-left p-2 rounded-xl transition-all border text-xs flex flex-col justify-between ${
                                isActive
                                  ? 'border-[#006a67] bg-[#006a67]/10 shadow-xs'
                                  : 'border-[#e4e9e8] bg-white/70 hover:bg-[#e9efee]'
                              }`}
                            >
                              <span className="font-display font-semibold text-[#171d1c] truncate">{item.title}</span>
                              <span className="text-[10px] text-[#3c4948] mt-0.5">{item.durationMin}m · {item.category}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div>
                    <button
                      onClick={() => openActivity({
                        type:        rec.type,
                        title:       rec.title,
                        durationMin: rec.durationMin,
                        category:    rec.category,
                        icon:        rec.icon,
                      })}
                      className="w-full mw-btn-primary"
                    >
                      Begin Now · {rec.durationMin} min
                    </button>
                    <button
                      onClick={() => setRecIndex((prev) => (prev + 1) % recommendations.length)}
                      className="w-full mt-2 text-[#006a67] text-sm font-medium py-1.5 hover:underline font-display flex items-center justify-center gap-1"
                    >
                      <span>Show other options</span>
                      <span className="text-xs text-[#3c4948]">({(recIndex % recommendations.length) + 1} of {recommendations.length})</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Quick Reset ──────────────────────────────────────────── */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-[#171d1c] text-xl">Quick Reset</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto mw-hide-scrollbar -mx-5 md:mx-0 px-5 md:px-0 pb-1">
            {QUICK_RESET.map((item) => (
              <button
                key={item.id}
                onClick={() => openActivity({
                  type:        item.type,
                  title:       item.title,
                  durationMin: item.durationMin,
                  category:    item.category,
                  icon:        item.icon,
                })}
                className="mw-card flex-shrink-0 w-[70vw] sm:w-56 p-4 text-left hover:border-[#006a67]/30 hover:-translate-y-0.5 transition-all duration-200 rounded-2xl active:scale-[0.97]"
              >
                <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center mb-3`}>
                  <span className="material-symbols-outlined text-[#006a67]">{item.icon}</span>
                </div>
                <p className="font-display font-semibold text-[#171d1c] text-sm leading-tight mb-1">{item.title}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-[#3c4948]">{item.durationMin} min</span>
                  <span className="w-1 h-1 rounded-full bg-[#bcc9c8]" />
                  <span className="text-xs text-[#3c4948]">{item.category}</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ── Explore Categories ───────────────────────────────────── */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-[#171d1c] text-xl">Explore</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => openActivity({
                  type:        cat.type,
                  title:       cat.label,
                  durationMin: cat.defaultDurationMin,
                  category:    cat.label,
                  icon:        cat.icon,
                })}
                className="mw-card flex flex-col items-center gap-2 py-4 px-2 hover:border-[#006a67]/30 hover:-translate-y-0.5 transition-all duration-200 rounded-2xl active:scale-[0.97] text-center"
              >
                <div className={`w-10 h-10 rounded-xl ${cat.iconBg} flex items-center justify-center`}>
                  <span className={`material-symbols-outlined msym-sm ${cat.iconColor}`}>{cat.icon}</span>
                </div>
                <span className="font-display font-semibold text-[#171d1c] text-xs leading-tight">{cat.label}</span>
                <span className="text-[10px] text-[#3c4948]">{cat.defaultDurationMin} min</span>
              </button>
            ))}
          </div>
        </section>

        {/* ── Wellness Programs (API-driven) ───────────────────────── */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-[#171d1c] text-xl">Your Programs</h2>
          </div>

          {programsLoading ? (
            <div className="flex gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="mw-card flex-shrink-0 w-[78vw] sm:w-72 md:flex-1 p-5 rounded-2xl animate-pulse h-40" />
              ))}
            </div>
          ) : programs.length === 0 ? (
            <div className="mw-card rounded-2xl p-8 text-center">
              <span className="material-symbols-outlined text-[#6c7a78] msym-lg mb-2 block">route</span>
              <p className="text-[#3c4948] text-sm mb-4">No active programs yet.</p>
              <button
                onClick={() => navigate('/health-hub/mental-wellness/journey')}
                className="mw-btn-outline text-xs"
              >
                Browse programs in My Journey
              </button>
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto mw-hide-scrollbar -mx-5 md:mx-0 px-5 md:px-0 pb-1 md:grid md:grid-cols-3">
              {programs.map((prog, idx) => (
                <div
                  key={prog.id ?? idx}
                  className="mw-card flex-shrink-0 w-[78vw] sm:w-72 md:w-auto p-5 rounded-2xl relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-[#006a67]/3 rounded-2xl" />
                  <div className="relative">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-display font-bold text-[#171d1c] text-base leading-tight">
                          {prog.title ?? prog.name ?? 'Program'}
                        </h3>
                        <p className="text-xs text-[#3c4948] mt-0.5">{prog.subtitle ?? prog.durationWeeks ? `${prog.durationWeeks}-week program` : ''}</p>
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full font-display flex-shrink-0 bg-[#006a67]/10 text-[#006a67]">
                        {prog.status ?? 'Active'}
                      </span>
                    </div>

                    <p className="text-sm text-[#3c4948] mb-4 leading-relaxed line-clamp-2">
                      {prog.description ?? ''}
                    </p>

                    {prog.progressPercent != null && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-[#3c4948]">Progress</span>
                          <span className="text-xs font-bold text-[#006a67] font-display">{prog.progressPercent}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[#e4e9e8] overflow-hidden">
                          <div
                            className="h-full bg-[#006a67] rounded-full transition-all"
                            style={{ width: `${prog.progressPercent}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {prog.nextSession && (
                      <div className="flex items-center gap-2 mb-4">
                        <span className="material-symbols-outlined text-[#006a67] msym-sm">play_circle</span>
                        <span className="text-xs text-[#3c4948] truncate">Next: {prog.nextSession}</span>
                      </div>
                    )}

                    <button
                      onClick={() => openActivity({
                        type:        'MEDITATION',
                        title:       prog.nextSession ?? prog.title ?? 'Session',
                        durationMin: 20,
                        category:    'Meditation',
                        icon:        'self_improvement',
                      })}
                      className="w-full mw-btn-outline text-xs"
                    >
                      {prog.progressPercent === 0 ? 'Start Program' : 'Continue · 20 min'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Progress stats + Companion CTA ──────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Progress glass-card */}
          <div className="mw-glass-card rounded-2xl p-5 mw-soft-shadow">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-[#006a67] msym-sm filled">insights</span>
              <h3 className="font-display font-semibold text-[#171d1c] text-base">This Week</h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="font-display font-bold text-2xl text-[#171d1c] leading-none">
                  {streak !== null && streak > 0 ? streak : (checkedIn ? 1 : 0)}
                </p>
                <p className="text-xs text-[#3c4948] mt-1">day streak</p>
              </div>
              <div className="text-center">
                <p className="font-display font-bold text-2xl text-[#171d1c] leading-none">
                  {loadActivityLog().length}
                </p>
                <p className="text-xs text-[#3c4948] mt-1">sessions</p>
              </div>
              <div className="text-center">
                <p className="font-display font-bold text-2xl text-[#171d1c] leading-none">
                  {checkedIn && currentMood?.score ? Number(currentMood.score).toFixed(1) : (loadProgressCache()?.averageMoodScore ? Number(loadProgressCache().averageMoodScore).toFixed(1) : '–')}
                </p>
                <p className="text-xs text-[#3c4948] mt-1">avg mood</p>
              </div>
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
                Get personalised guidance, work through what is on your mind, or just check in.
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
