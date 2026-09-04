import React from "react";
import { computeAvgReadiness } from "../PhysicalHealth.jsx";
import { localDateStr } from "../PhysicalHealth.jsx";
import useAuthStore from "../../../store/authStore.js";

/** Local today string — avoids UTC midnight shift for IST users. */
function todayLocalStr() { return localDateStr(new Date()); }

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getDateLabel() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });
}

// A single readiness metric row
function MetricRow({ label, value, max = 5, color }) {
  const pct = (value / max) * 100;
  const barColor = {
    green: "bg-emerald-500",
    amber: "bg-amber-400",
    red: "bg-rose-500",
    blue: "bg-sky-400",
    violet: "bg-violet-400",
  }[color] || "bg-emerald-500";

  return (
    <div className="flex items-center gap-3">
      <p className="text-xs text-[var(--muted-foreground)] w-20 shrink-0">{label}</p>
      <div className="flex-1 h-1.5 bg-[var(--muted)] rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs font-bold text-[var(--foreground)] w-6 text-right">{value}</p>
    </div>
  );
}

// Determine bar color from score (higher = better for energy/sleep/motivation, lower = better for soreness/pain)
function scoreColor(val, invert = false) {
  const v = invert ? 6 - val : val;
  if (v >= 4) return "green";
  if (v >= 3) return "amber";
  return "red";
}

// Goal-aware workout summary
function goalWorkoutSummary(goal) {
  const map = {
    "Weight Loss": { focus: "Cardio + HIIT Circuit", desc: "High-intensity intervals to maximise calorie burn.", tag: "Fat Burn" },
    "Weight Gain": { focus: "Progressive Strength", desc: "Compound lifts to build lean muscle and mass.", tag: "Muscle Build" },
    "Build Strength": { focus: "Strength & Power", desc: "Heavy compound movements with progressive overload.", tag: "Strength" },
    "General Fitness": { focus: "Balanced Circuit", desc: "Mix of cardio and resistance for overall fitness.", tag: "Balanced" },
    "Improve Stamina": { focus: "Endurance & Cardio", desc: "Sustained aerobic effort to build cardiovascular base.", tag: "Endurance" },
    "Improve Mobility": { focus: "Mobility & Yoga Flow", desc: "Joint-focused movement to improve range of motion.", tag: "Mobility" },
    "Build Healthy Habits": { focus: "Daily Movement", desc: "Light daily activity to build a consistent routine.", tag: "Habit" },
  };
  return map[goal] || map["General Fitness"];
}

export default function DashboardPage({
  profile, checkins, todayCheckin, streak, last4 = [], workouts,
  onStartCheckIn, onViewWorkout, onViewPlan, onViewProgress,
}) {
  const { user } = useAuthStore();

  // Name priority: onboarding profile firstName → auth user fullName first word → 'there'
  const name =
    profile?.firstName ||
    profile?.name ||
    user?.fullName?.split(' ')[0] ||
    user?.name?.split(' ')[0] ||
    'there';

  const primaryGoal = profile?.primaryGoal || "General Fitness";
  const workout = goalWorkoutSummary(primaryGoal);
  const commitment = profile?.commitment || "30 min";

  // Avg readiness across last 4 days (only days with check-ins)
  const daysWithCheckins = last4.filter(d => d.entry);
  const avgOf4 = daysWithCheckins.length > 0
    ? Math.round(daysWithCheckins.reduce((s, d) => s + d.entry.avgReadiness, 0) / daysWithCheckins.length)
    : null;

  // Today's readiness label
  const readinessLabel = todayCheckin
    ? todayCheckin.avgReadiness >= 8 ? "Ready to Train"
      : todayCheckin.avgReadiness >= 5 ? "Train with Caution"
      : "Recovery Day"
    : "Check-In Required";

  const readinessColor = todayCheckin
    ? todayCheckin.avgReadiness >= 8 ? "text-emerald-600"
      : todayCheckin.avgReadiness >= 5 ? "text-amber-500"
      : "text-rose-500"
    : "text-[var(--muted-foreground)]";

  // Completed workouts this week (Mon–today)
  const weekStart = (() => {
    const d = new Date();
    // Find Monday of this week using local dates
    const dow = d.getDay(); // 0=Sun
    d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
    return localDateStr(d);
  })();
  const completedThisWeek = workouts.filter(w => w.date >= weekStart && w.completed).length;

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-8 py-8">
      {/* ── Greeting header ── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-sm text-[var(--muted-foreground)] mb-1">{getDateLabel()}</p>
          <h1 className="font-display text-4xl lg:text-5xl text-[var(--foreground)] mb-2">
            {getGreeting()}, {name}.
          </h1>
          <p className="text-[var(--muted-foreground)] text-sm">
            {todayCheckin
              ? `Readiness logged · ${readinessLabel.toLowerCase()}`
              : "Complete your daily check-in to get your plan for today."}
          </p>
        </div>
        {/* Streak badge */}
        <div className="hidden sm:flex items-center gap-2 bg-white border border-[var(--border)] rounded-2xl px-4 py-2.5 shadow-xs shrink-0 ml-6">
          <span className="text-xl">🔥</span>
          <div>
            <p className="text-2xl font-bold text-[var(--foreground)] leading-none">{streak}</p>
            <p className="text-[10px] text-[var(--muted-foreground)] leading-none mt-0.5">day streak</p>
          </div>
        </div>
      </div>

      {/* ── Main two-column card grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* ═══ LEFT CARD — Readiness State ═══ */}
        <div className="bg-white border border-[var(--border)] rounded-3xl overflow-hidden shadow-xs flex flex-col">

          {/* Card header */}
          <div className="px-6 pt-5 pb-4 border-b border-[var(--border)] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[var(--secondary)] flex items-center justify-center shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)]">Daily Readiness</p>
                <p className="text-[10px] text-[var(--muted-foreground)]">
                  {todayCheckin ? `Logged today` : "Awaiting check-in"}
                </p>
              </div>
            </div>
            {streak >= 2 && (
              <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full">
                Active Streak 🔥
              </span>
            )}
          </div>

          {/* PRIMARY STATE — big readiness number */}
          <div className="px-6 py-5 border-b border-[var(--border)]">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] text-[var(--muted-foreground)] font-semibold uppercase tracking-wider">PRIMARY STATE</p>
              {avgOf4 !== null && (
                <span className="text-[10px] font-semibold text-[var(--muted-foreground)] bg-[var(--muted)] px-2 py-0.5 rounded-full">
                  Avg Readiness · {avgOf4}/10
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 mt-3">
              <div className="w-14 h-14 rounded-2xl bg-[var(--primary)] flex items-center justify-center shrink-0 shadow-sm">
                {todayCheckin ? (
                  <span className="text-xl font-bold text-white">{todayCheckin.avgReadiness}</span>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                )}
              </div>
              <div>
                <p className={`text-xl font-bold leading-tight ${readinessColor}`}>{readinessLabel}</p>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                  {todayCheckin
                    ? `Score ${todayCheckin.avgReadiness}/10 · ${workout.tag} plan active`
                    : primaryGoal}
                </p>
              </div>
            </div>
          </div>

          {/* METRICS (only if checked in today) */}
          {todayCheckin ? (
            <div className="px-6 py-4 space-y-3 border-b border-[var(--border)]">
              <MetricRow label="Energy"     value={todayCheckin.scores.energy}     color={scoreColor(todayCheckin.scores.energy)} />
              <MetricRow label="Sleep"      value={todayCheckin.scores.sleep}      color={scoreColor(todayCheckin.scores.sleep)} />
              <MetricRow label="Soreness"   value={todayCheckin.scores.soreness}   color={scoreColor(todayCheckin.scores.soreness, true)} />
              <MetricRow label="Motivation" value={todayCheckin.scores.motivation} color={scoreColor(todayCheckin.scores.motivation)} />
            </div>
          ) : (
            <div className="px-6 py-5 border-b border-[var(--border)]">
              <p className="text-xs text-[var(--muted-foreground)] leading-relaxed text-center">
                No check-in logged yet today. <br />
                Answer 5 quick questions to unlock your readiness score.
              </p>
            </div>
          )}

          {/* LAST 4 DAYS timeline */}
          <div className="px-6 py-4 border-b border-[var(--border)]">
            <p className="text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">
              Last 4 Days
            </p>
            <div className="flex gap-2">
              {last4.map((day) => {
                const r = day.entry?.avgReadiness;
                const isToday = day.isToday;
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-1.5">
                    {/* Score bubble */}
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-bold border-2 transition-all ${
                      isToday && !day.entry
                        ? "border-dashed border-[var(--border)] text-[var(--muted-foreground)] bg-[var(--muted)]"
                        : day.entry
                        ? r >= 8
                          ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                          : r >= 5
                          ? "bg-amber-50 border-amber-300 text-amber-700"
                          : "bg-rose-50 border-rose-300 text-rose-700"
                        : "bg-[var(--muted)] border-[var(--border)] text-[var(--muted-foreground)]"
                    }`}>
                      {day.entry ? r : isToday ? "?" : "–"}
                    </div>
                    <p className={`text-[9px] font-semibold ${isToday ? "text-[var(--accent)]" : "text-[var(--muted-foreground)]"}`}>
                      {isToday ? "Today" : day.dayLabel}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI insight */}
          <div className="px-6 py-3 bg-[var(--secondary)]/40 flex-1">
            <div className="flex items-start gap-2.5">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" className="mt-0.5 shrink-0">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                {todayCheckin?.result === "ready"
                  ? `You're fully ready to train. Your ${workout.tag.toLowerCase()} session is queued and adjusted to your ${primaryGoal.toLowerCase()} goal.`
                  : todayCheckin?.result === "adjusted"
                  ? `Mixed readiness signals detected. Today's ${workout.focus.toLowerCase()} has been scaled back to match your current state.`
                  : todayCheckin?.result === "recovery"
                  ? "Low readiness detected. A light recovery session or rest day is recommended today."
                  : "Complete your check-in to receive a personalised readiness score and workout recommendation."}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-[var(--border)] flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[10px] text-[var(--muted-foreground)]">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
              Private &amp; secure health log
            </div>
            <button
              onClick={onStartCheckIn}
              className="flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)] hover:opacity-75 transition cursor-pointer"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              {todayCheckin ? "Update Check-In" : "Start Check-In"}
            </button>
          </div>
        </div>

        {/* ═══ RIGHT CARD — Goal-Personalized Workout ═══ */}
        <div className="bg-white border border-[var(--border)] rounded-3xl overflow-hidden shadow-xs flex flex-col">

          {/* Header */}
          <div className="px-6 pt-5 pb-4">
            <div className="flex items-center justify-between mb-5">
              <p className="text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-widest">
                Recommended for You
              </p>
              <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${
                todayCheckin?.result === "ready"
                  ? "text-emerald-700 bg-emerald-50 border-emerald-100"
                  : todayCheckin?.result === "adjusted"
                  ? "text-amber-600 bg-amber-50 border-amber-100"
                  : todayCheckin?.result === "recovery"
                  ? "text-rose-600 bg-rose-50 border-rose-100"
                  : "text-[var(--muted-foreground)] bg-[var(--muted)] border-transparent"
              }`}>
                {todayCheckin?.result === "ready" ? "Full Intensity"
                  : todayCheckin?.result === "adjusted" ? "Adjusted Plan"
                  : todayCheckin?.result === "recovery" ? "Recovery Mode"
                  : "Awaiting Check-In"}
              </span>
            </div>

            {/* Workout hero */}
            <div className="flex items-start gap-3 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-[var(--primary)] flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                  {primaryGoal === "Weight Loss" || primaryGoal === "Improve Stamina"
                    ? <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                    : primaryGoal === "Improve Mobility"
                    ? <path d="M12 2a7 7 0 017 7c0 5-7 13-7 13S5 14 5 9a7 7 0 017-7z"/>
                    : <path d="M6 4v16M18 4v16M2 9h4M18 9h4M2 15h4M18 15h4M6 9h12M6 15h12"/>}
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-[var(--foreground)] leading-tight mb-1">{workout.focus}</h2>
                <p className="text-xs text-[var(--muted-foreground)] leading-relaxed max-w-xs">{workout.desc}</p>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {[commitment, workout.tag, primaryGoal, profile?.environment || "Home"].map(tag => (
                <span key={tag} className="text-[10px] font-semibold text-[var(--foreground)] bg-[var(--muted)] px-2.5 py-1 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Weekly structure */}
          <div className="px-6 pb-4 border-t border-[var(--border)] pt-4">
            <p className="text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">
              This Week's Focus
            </p>
            <GoalWeeklyStructure goal={primaryGoal} />
          </div>

          {/* Week progress (real data) */}
          <div className="mx-6 mb-4 bg-[var(--secondary)]/50 rounded-2xl px-4 py-3">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] text-[var(--muted-foreground)] font-semibold uppercase tracking-wider">
                Week Progress
              </p>
              <p className="text-[10px] font-bold text-[var(--accent)]">{completedThisWeek} sessions done</p>
            </div>
            <Last4DayDots last4={last4} workouts={workouts} />
          </div>

          <div className="flex-1" />

          {/* CTA */}
          <div className="px-6 pb-6 space-y-2.5">
            <button
              onClick={onStartCheckIn}
              className="w-full bg-[var(--primary)] text-white font-semibold py-3.5 rounded-2xl text-sm hover:opacity-90 transition cursor-pointer shadow-md"
            >
              {todayCheckin ? `Begin Now · ${commitment}` : "Check In to Start"}
            </button>
            <button
              onClick={onViewWorkout}
              className="w-full text-center text-xs font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition cursor-pointer py-1"
            >
              Preview today's exercises →
            </button>
          </div>
        </div>
      </div>

      {/* ── Bottom: weekly streak + completion (no hydration/steps) ── */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <button
          onClick={onViewProgress}
          className="bg-white border border-[var(--border)] rounded-2xl p-4 text-left shadow-xs hover:border-[var(--accent)] transition cursor-pointer"
        >
          <p className="text-[10px] text-[var(--muted-foreground)] font-medium uppercase tracking-wider mb-1.5">Current Streak</p>
          <p className="text-2xl font-bold text-[var(--foreground)]">
            {streak}<span className="text-sm font-normal text-[var(--muted-foreground)] ml-1.5">days</span>
          </p>
          <div className="mt-2 flex gap-1">
            {last4.map(d => (
              <div key={d.date} className={`flex-1 h-1.5 rounded-full ${d.entry ? "bg-[var(--accent)]" : "bg-[var(--muted)]"}`} />
            ))}
          </div>
        </button>
        <button
          onClick={onViewProgress}
          className="bg-white border border-[var(--border)] rounded-2xl p-4 text-left shadow-xs hover:border-[var(--accent)] transition cursor-pointer"
        >
          <p className="text-[10px] text-[var(--muted-foreground)] font-medium uppercase tracking-wider mb-1.5">Goal</p>
          <p className="text-lg font-bold text-[var(--foreground)] truncate">{primaryGoal}</p>
          <p className="text-xs text-[var(--muted-foreground)] mt-1 truncate">{workout.tag} · {profile?.fitnessLevel || "Intermediate"}</p>
        </button>
      </div>
    </div>
  );
}

// ─── Subcomponents ───────────────────────────────────────────────────

function GoalWeeklyStructure({ goal }) {
  const structures = {
    "Weight Loss":        [{ d: "Mo", t: "HIIT" }, { d: "Tu", t: "Rest" }, { d: "We", t: "Cardio" }, { d: "Th", t: "Circuit" }, { d: "Fr", t: "Cardio" }, { d: "Sa", t: "Active" }, { d: "Su", t: "Rest" }],
    "Weight Gain":        [{ d: "Mo", t: "Push" }, { d: "Tu", t: "Pull" }, { d: "We", t: "Rest" }, { d: "Th", t: "Legs" }, { d: "Fr", t: "Upper" }, { d: "Sa", t: "Rest" }, { d: "Su", t: "Rest" }],
    "Build Strength":     [{ d: "Mo", t: "Squat" }, { d: "Tu", t: "Push" }, { d: "We", t: "Rest" }, { d: "Th", t: "Pull" }, { d: "Fr", t: "Power" }, { d: "Sa", t: "Rest" }, { d: "Su", t: "Rest" }],
    "General Fitness":    [{ d: "Mo", t: "Cardio" }, { d: "Tu", t: "Strength" }, { d: "We", t: "Rest" }, { d: "Th", t: "Core" }, { d: "Fr", t: "Mixed" }, { d: "Sa", t: "Walk" }, { d: "Su", t: "Rest" }],
    "Improve Stamina":    [{ d: "Mo", t: "Run" }, { d: "Tu", t: "Cross" }, { d: "We", t: "Rest" }, { d: "Th", t: "Tempo" }, { d: "Fr", t: "Long" }, { d: "Sa", t: "Easy" }, { d: "Su", t: "Rest" }],
    "Improve Mobility":   [{ d: "Mo", t: "Yoga" }, { d: "Tu", t: "Stretch" }, { d: "We", t: "Flow" }, { d: "Th", t: "Strength" }, { d: "Fr", t: "Yoga" }, { d: "Sa", t: "Walk" }, { d: "Su", t: "Rest" }],
    "Build Healthy Habits":[{ d: "Mo", t: "Walk" }, { d: "Tu", t: "Stretch" }, { d: "We", t: "Walk" }, { d: "Th", t: "Core" }, { d: "Fr", t: "Walk" }, { d: "Sa", t: "Active" }, { d: "Su", t: "Rest" }],
  };
  const plan = structures[goal] || structures["General Fitness"];
  const todayIdx = new Date().getDay(); // 0=Sun, 1=Mon...
  const adjusted = [6, 0, 1, 2, 3, 4, 5]; // map Sun=6, Mon=0...
  const todayMapped = adjusted[todayIdx];

  return (
    <div className="grid grid-cols-7 gap-1">
      {plan.map((item, i) => (
        <div key={item.d} className={`flex flex-col items-center gap-1 rounded-xl py-2 transition-all ${
          i === todayMapped
            ? "bg-[var(--primary)] text-white shadow-xs"
            : "bg-[var(--muted)]"
        }`}>
          <p className={`text-[9px] font-bold ${i === todayMapped ? "text-white/70" : "text-[var(--muted-foreground)]"}`}>{item.d}</p>
          <p className={`text-[8px] font-semibold text-center leading-none px-0.5 ${i === todayMapped ? "text-white" : "text-[var(--foreground)]"}`}>{item.t}</p>
        </div>
      ))}
    </div>
  );
}

function Last4DayDots({ last4, workouts }) {
  const weekStart = (() => {
    const d = new Date();
    const dow = d.getDay();
    d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
    return localDateStr(d);
  })();

  // Build full week Mon–Sun
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    const dayOfWeek = d.getDay(); // 0=Sun
    const diff = i - (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
    d.setDate(d.getDate() + diff);
    const date = localDateStr(d);
    const done = workouts.some(w => w.date === date && w.completed);
    const todayStr = todayLocalStr();
    const isPast = date < todayStr;
    const isToday = date === todayStr;
    return { date, done, isPast, isToday, label: ["Mo","Tu","We","Th","Fr","Sa","Su"][i] };
  });

  return (
    <div className="flex gap-1">
      {week.map(d => (
        <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
          <div className={`w-full h-1.5 rounded-full ${
            d.done ? "bg-[var(--accent)]"
            : d.isToday ? "bg-[var(--accent)] opacity-30 animate-pulse"
            : "bg-[var(--muted)]"
          }`} />
          <span className={`text-[8px] font-medium ${d.isToday ? "text-[var(--accent)]" : "text-[var(--muted-foreground)]"}`}>
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}
