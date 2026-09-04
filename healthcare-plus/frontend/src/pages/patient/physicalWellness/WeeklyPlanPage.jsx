/**
 * WeeklyPlanPage.jsx — "Plan" navigation page
 * Replaced static weekly planner with Today's Personalized Daily Movement Plan.
 * Exercises dynamically adapt to today's readiness check-in and onboarding profile.
 */

import React, { useState, useMemo, useEffect } from "react";
import { generatePersonalizedDailyPlan, loadBiometricsHistory, getNextMondayDateStr, formatMondayDate, getTodayWorkoutProgress } from "../../../data/physicalWellnessMockData.js";
import { todayStr, localDateStr } from "../PhysicalHealth.jsx";

// ─── Tier colour config ────────────────────────────────────────────────
const TIER_CONFIG = {
  recovery: {
    label: "Recovery Day",
    badge: "🌿 Recovery Mode",
    badgeCls: "bg-rose-50 text-rose-700 border-rose-100",
    bannerCls: "from-rose-50 to-orange-50 border-rose-100",
    accentCls: "text-rose-600",
    barCls: "bg-rose-400",
    emoji: "🌿",
  },
  adjusted: {
    label: "Train with Caution",
    badge: "⚠️ Adjusted Plan",
    badgeCls: "bg-amber-50 text-amber-700 border-amber-100",
    bannerCls: "from-amber-50 to-yellow-50 border-amber-100",
    accentCls: "text-amber-600",
    barCls: "bg-amber-400",
    emoji: "⚠️",
  },
  prime: {
    label: "Ready to Train",
    badge: "⚡ Full Intensity",
    badgeCls: "bg-emerald-50 text-emerald-700 border-emerald-100",
    bannerCls: "from-emerald-50 to-teal-50 border-emerald-100",
    accentCls: "text-emerald-600",
    barCls: "bg-emerald-500",
    emoji: "⚡",
  },
  preview: {
    label: "No Check-in Yet",
    badge: "📋 Baseline Preview",
    badgeCls: "bg-[var(--muted)] text-[var(--muted-foreground)] border-transparent",
    bannerCls: "from-blue-50 to-indigo-50 border-blue-100",
    accentCls: "text-[var(--muted-foreground)]",
    barCls: "bg-[var(--muted-foreground)]",
    emoji: "📋",
  },
};

// ─── Exercise card ─────────────────────────────────────────────────────
function ExerciseCard({ ex, index, progress }) {
  const [expanded, setExpanded] = useState(false);
  const isDone = Boolean(progress?.completedExercises?.[ex.id]?.isComplete);
  const setsDone = progress?.completedExercises?.[ex.id]?.completedSets || 0;
  const targetSets = ex.sets || 1;

  return (
    <div className={`border rounded-2xl overflow-hidden shadow-xs transition-all ${
      isDone ? "bg-emerald-50/15 border-emerald-300" : "bg-white border-[var(--border)] hover:border-[var(--accent)]"
    }`}>
      <div className="flex items-start gap-3.5 p-4 cursor-pointer" onClick={() => setExpanded(e => !e)}>
        {/* GIF thumbnail */}
        <div className="w-16 h-16 rounded-xl bg-white border border-[var(--border)] overflow-hidden flex items-center justify-center shrink-0 shadow-2xs relative">
          {ex.gifUrl ? (
            <img
              src={ex.gifUrl}
              alt={ex.name}
              className="w-full h-full object-contain p-1 mix-blend-multiply"
              loading="lazy"
              onError={e => { e.currentTarget.style.display = "none"; }}
            />
          ) : (
            <span className="text-base font-bold text-[var(--muted-foreground)]">{index + 1}</span>
          )}
          <span className="absolute bottom-1 right-1 text-[9px] font-bold text-[var(--accent)] bg-[var(--secondary)]/90 px-1.5 py-0.5 rounded-md">
            #{index + 1}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="text-sm font-bold text-[var(--foreground)] truncate flex items-center gap-1.5">
              {ex.name}
              {isDone && <span className="text-emerald-600 font-bold">✓</span>}
            </h3>
            <div className="flex items-center gap-1.5 shrink-0">
              {isDone ? (
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  ✓ Completed ({targetSets}/{targetSets} sets)
                </span>
              ) : setsDone > 0 ? (
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                  {setsDone}/{targetSets} sets done
                </span>
              ) : (
                <>
                  {ex.sets && ex.sets > 1 && (
                    <span className="text-[10px] font-semibold text-[var(--foreground)] bg-[var(--muted)] px-2 py-0.5 rounded-md">
                      {ex.sets} sets
                    </span>
                  )}
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    ⏱ {ex.reps || ex.duration}
                  </span>
                </>
              )}
            </div>
          </div>
          <p className="text-xs text-[var(--muted-foreground)] leading-relaxed line-clamp-2">{ex.description}</p>
          {ex.rest && ex.rest !== "0s" && (
            <p className="text-[10px] text-[var(--accent)] font-semibold mt-1">Rest: {ex.rest}</p>
          )}
        </div>

        {/* Expand chevron */}
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="2"
          className={`transition-transform shrink-0 mt-1 ${expanded ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      {/* Form guide expansion */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-[var(--border)] pt-3">
          <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
            <span className="font-semibold text-[var(--foreground)]">Form Guide: </span>
            {ex.instructions}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Section tab content ───────────────────────────────────────────────
function WorkoutSections({ warmUp, mainWorkout, coolDown, progress }) {
  const [tab, setTab] = useState("warmup");
  const tabs = [
    { id: "warmup", label: `Warm-Up`, exercises: warmUp },
    { id: "main", label: `Main`, exercises: mainWorkout },
    { id: "cooldown", label: `Cool-Down`, exercises: coolDown },
  ];
  const current = tabs.find(t => t.id === tab);

  return (
    <div>
      <div className="flex bg-[var(--muted)] rounded-xl p-1 mb-4">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${tab === t.id ? "bg-white text-[var(--foreground)] shadow-sm" : "text-[var(--muted-foreground)]"}`}
          >
            {t.label} <span className="opacity-60">({t.exercises.length})</span>
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {current?.exercises.map((ex, i) => (
          <ExerciseCard key={ex.id} ex={ex} index={i} progress={progress} />
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────
export default function WeeklyPlanPage({
  profile,
  todayCheckin,
  onStartWorkout,
  onUpdateCheckIn,
  onOpenBiometrics,
  workouts = [],
}) {
  // Generate personalised plan from live data
  const plan = useMemo(
    () => generatePersonalizedDailyPlan(todayCheckin, profile, todayStr()),
    [todayCheckin, profile]
  );

  const tierCfg = TIER_CONFIG[plan.tier] || TIER_CONFIG.preview;

  // Format today's date header
  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "short", day: "numeric", year: "numeric",
  });

  // Biometrics
  const biometrics = useMemo(() => loadBiometricsHistory(), []);
  const latest = biometrics[0];
  const nextMondayStr = getNextMondayDateStr();
  const nextMondayLabel = formatMondayDate(nextMondayStr);

  // Did user already complete workout today?
  const todayDateStr = todayStr();
  const completedToday = workouts.some(w => w.date === todayDateStr && w.completed);

  // Live workout progress state
  const [progress, setProgress] = useState(() => getTodayWorkoutProgress(todayDateStr));

  useEffect(() => {
    const handleUpdate = () => setProgress(getTodayWorkoutProgress(todayDateStr));
    window.addEventListener("pw-workout-progress-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("pw-workout-progress-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [todayDateStr]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 lg:px-8 space-y-5">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
            Personalized · Daily Plan
          </p>
          <h1 className="font-display text-3xl text-[var(--foreground)]">Today's Plan</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">{todayLabel}</p>
        </div>
        {/* Readiness badge */}
        <span className={`text-[10px] font-semibold px-3 py-1.5 rounded-full border ${tierCfg.badgeCls}`}>
          {tierCfg.badge}
        </span>
      </div>

      {/* ── Readiness Adaptation Banner ── */}
      <div className={`bg-gradient-to-r ${tierCfg.bannerCls} border rounded-2xl p-4`}>
        <div className="flex items-start gap-3">
          <div className="text-2xl mt-0.5">{tierCfg.emoji}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--foreground)] mb-1">
              {tierCfg.label}
              {plan.score ? ` · ${plan.score}/10` : ""}
            </p>
            <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
              {plan.adaptationNote}
            </p>
            {todayCheckin && (
              <div className="flex items-center gap-3 mt-2.5 flex-wrap">
                {[
                  { label: "Energy", val: todayCheckin.scores?.energy },
                  { label: "Sleep", val: todayCheckin.scores?.sleep },
                  { label: "Soreness", val: todayCheckin.scores?.soreness, invert: true },
                  { label: "Motivation", val: todayCheckin.scores?.motivation },
                ].filter(m => m.val != null).map(m => (
                  <div key={m.label} className="flex items-center gap-1.5">
                    <span className="text-[10px] text-[var(--muted-foreground)]">{m.label}</span>
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(dot => (
                        <div
                          key={dot}
                          className={`w-1.5 h-1.5 rounded-full ${
                            (m.invert ? 6 - m.val : m.val) >= dot
                              ? tierCfg.barCls
                              : "bg-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                    <span className={`text-[10px] font-bold ${tierCfg.accentCls}`}>{m.val}/5</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {onUpdateCheckIn && (
          <button
            onClick={onUpdateCheckIn}
            className={`mt-3 ml-8 text-xs font-semibold ${tierCfg.accentCls} hover:opacity-75 transition cursor-pointer underline underline-offset-2`}
          >
            {todayCheckin ? "Update Check-In →" : "Log Today's Check-In →"}
          </button>
        )}
      </div>

      {/* ── Workout Info Card ── */}
      <div className="bg-white border border-[var(--border)] rounded-3xl shadow-xs overflow-hidden">
        <div className="px-5 pt-5 pb-4 border-b border-[var(--border)]">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h2 className="font-display text-xl text-[var(--foreground)] leading-tight mb-1">{plan.title}</h2>
              <p className="text-xs text-[var(--muted-foreground)] leading-relaxed max-w-sm">{plan.focus}</p>
            </div>
            {completedToday && (
              <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full shrink-0">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span className="text-[10px] font-semibold">Completed</span>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: `${plan.duration} min` },
              { label: plan.difficulty },
              { label: `${plan.exerciseCount} exercises` },
              { label: plan.goal },
            ].map(t => (
              <span key={t.label} className="text-[10px] font-semibold text-[var(--foreground)] bg-[var(--muted)] px-2.5 py-1 rounded-full">
                {t.label}
              </span>
            ))}
          </div>
        </div>

        {/* Exercises */}
        <div className="px-5 pt-4 pb-5">
          <WorkoutSections
            warmUp={plan.warmUp}
            mainWorkout={plan.mainWorkout}
            coolDown={plan.coolDown}
            progress={progress}
          />
        </div>

        {/* Start workout CTA */}
        <div className="px-5 pb-5 space-y-2.5">
          <button
            onClick={onStartWorkout}
            className="w-full bg-[var(--primary)] text-white font-semibold py-4 rounded-2xl text-sm hover:opacity-90 transition shadow-md cursor-pointer"
          >
            {completedToday ? "Redo Today's Workout →" : "Start Today's Workout →"}
          </button>
          {!todayCheckin && onUpdateCheckIn && (
            <button
              onClick={onUpdateCheckIn}
              className="w-full text-center text-xs font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition cursor-pointer py-1"
            >
              Log check-in for a personalised plan
            </button>
          )}
        </div>
      </div>

      {/* ── Biometrics Status Card ── */}
      <div className="bg-white border border-[var(--border)] rounded-3xl shadow-xs p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-[var(--foreground)]">Body Metrics</p>
            <p className="text-xs text-[var(--muted-foreground)]">Weekly Monday tracking</p>
          </div>
          <button
            onClick={onOpenBiometrics}
            className="text-xs font-semibold text-[var(--accent)] bg-[var(--secondary)] px-3 py-1.5 rounded-full cursor-pointer hover:opacity-80 transition"
          >
            {latest ? "Update" : "Log Metrics"}
          </button>
        </div>

        {latest ? (
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: "Weight",
                value: `${latest.weight} ${latest.weightUnit}`,
                sub: latest.date,
              },
              {
                label: "Height",
                value: `${latest.height} ${latest.heightUnit}`,
                sub: "on record",
              },
              {
                label: "BMI",
                value: latest.bmi ? `${latest.bmi}` : "—",
                sub: latest.category || "",
                color: latest.bmi
                  ? latest.bmi < 18.5 ? "text-sky-600"
                    : latest.bmi < 25 ? "text-emerald-600"
                    : latest.bmi < 30 ? "text-amber-600"
                    : "text-rose-600"
                  : "text-[var(--muted-foreground)]",
              },
            ].map(m => (
              <div key={m.label} className="bg-[var(--muted)] rounded-xl p-3 text-center">
                <p className="text-[10px] text-[var(--muted-foreground)] mb-0.5">{m.label}</p>
                <p className={`text-base font-bold ${m.color || "text-[var(--foreground)]"}`}>{m.value}</p>
                <p className="text-[9px] text-[var(--muted-foreground)] mt-0.5 truncate">{m.sub}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-[var(--muted-foreground)]">No metrics logged yet.</p>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">Log your weight and height to track BMI over time.</p>
          </div>
        )}

        <div className="mt-3 flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <p className="text-[10px] text-blue-600 font-medium">
            Next weekly update due: <span className="font-bold">{nextMondayLabel}</span>
          </p>
        </div>
      </div>

    </div>
  );
}
