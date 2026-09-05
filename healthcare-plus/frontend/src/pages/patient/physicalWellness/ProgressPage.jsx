import React, { useState, useEffect, useRef, useMemo } from "react";
import { computeAvgReadiness, localDateStr } from "../PhysicalHealth.jsx";
import {
  loadBiometricsHistory,
  loadAssessmentHistory,
  formatMondayDate,
} from "../../../data/physicalWellnessMockData.js";

// ─── Dimensional 2D Readiness Chart (Mental Wellness Graphical Representation) ───
function ReadinessDimensionalChart({ days = [] }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [selectedIdx, setSelectedIdx] = useState(null);

  // Filter for days that have check-in entries
  const checkedInDays = useMemo(() => {
    return days.filter(d => d.entry).map((d, idx) => {
      const entry = d.entry;
      const score = entry.avgReadiness ?? 8;
      const pct = Math.min(100, Math.max(20, Math.round((score / 10) * 100)));
      const energy = entry.scores?.energy ?? 4;
      const sleep = entry.scores?.sleep ?? 4;
      const soreness = entry.scores?.soreness ?? 2;
      const pain = entry.scores?.pain ?? 1;
      const motivation = entry.scores?.motivation ?? 4;
      const result = entry.result ?? "ready";

      // Curated color schemes matching Mental Wellness
      let color = "#10b981";
      let colorDark = "#047857";
      let colorLight = "#d1fae5";
      if (score >= 9) {
        color = "#10b981"; colorDark = "#047857"; colorLight = "#d1fae5";
      } else if (score >= 7.5) {
        color = "#06b6d4"; colorDark = "#0e7490"; colorLight = "#cffafe";
      } else if (score >= 5) {
        color = "#f59e0b"; colorDark = "#b45309"; colorLight = "#fef3c7";
      } else {
        color = "#f43f5e"; colorDark = "#be123c"; colorLight = "#ffe4e6";
      }

      const note = result === "ready"
        ? "Optimal physical readiness · Cleared for full load"
        : result === "adjusted"
        ? "Calibrated for joint safety & active recovery"
        : "Light recovery & mobility focus";

      const numStr = String(idx + 1).padStart(2, "0");

      return {
        ...d,
        num: numStr,
        score,
        pct,
        energy,
        sleep,
        soreness,
        pain,
        motivation,
        result,
        note,
        color,
        colorDark,
        colorLight,
        icon: score >= 8 ? "⚡" : score >= 6 ? "💪" : "🌿",
      };
    });
  }, [days]);

  // Set default selected index to latest day
  useEffect(() => {
    if (checkedInDays.length > 0 && selectedIdx === null) {
      setSelectedIdx(checkedInDays.length - 1);
    }
  }, [checkedInDays, selectedIdx]);

  if (!checkedInDays.length) {
    return <EmptyChart label="Check in daily to see your dimensional readiness trend" />;
  }

  const activeIdx = hoveredIdx ?? selectedIdx ?? (checkedInDays.length - 1);

  // SVG layout dimensions
  const W = 580;
  const H = 340;
  const Y_BASE = 270;
  const barW = Math.min(46, Math.max(34, Math.floor(220 / checkedInDays.length)));
  const xPadding = 70;
  const availableWidth = W - xPadding * 2;
  const xStep = checkedInDays.length > 1 ? availableWidth / (checkedInDays.length - 1) : 0;

  // Stepped trendline connecting tops of pillars
  const stepLinePath = checkedInDays.map((d, i) => {
    const cx = checkedInDays.length === 1 ? W / 2 : xPadding + i * xStep;
    const colH = 45 + (d.pct / 100) * 155;
    const cy = Y_BASE - colH;
    const py = cy - 22;
    if (i === 0) return `M ${cx},${py}`;
    const prevCx = xPadding + (i - 1) * xStep;
    const midX = (prevCx + cx) / 2;
    return `H ${midX} V ${py} H ${cx}`;
  }).join(" ");

  return (
    <div className="space-y-4">
      {/* ── Dimensional 2D Columns SVG Graph with Box Shadows ── */}
      <div className="relative flex justify-center items-center bg-gradient-to-b from-white to-[#f4f8f6] rounded-2xl p-4 border border-[#dce8e4] shadow-inner">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto max-h-[360px] overflow-visible select-none">
          <defs>
            <filter id="pwBarBoxShadow" x="-35%" y="-20%" width="170%" height="150%">
              <feDropShadow dx="0" dy="10" stdDeviation="7" floodColor="#0c2e2c" floodOpacity="0.20" />
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.08" />
            </filter>
            <filter id="pwBarBoxShadowActive" x="-40%" y="-25%" width="180%" height="160%">
              <feDropShadow dx="0" dy="16" stdDeviation="10" floodColor="#0c2e2c" floodOpacity="0.30" />
              <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#000000" floodOpacity="0.12" />
            </filter>

            {checkedInDays.map((d, idx) => (
              <linearGradient key={`pwGrad_${idx}`} id={`pwGrad_${idx}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={d.color} />
                <stop offset="100%" stopColor={d.colorDark} />
              </linearGradient>
            ))}
          </defs>

          {/* Reference horizontal guidelines */}
          <g opacity="0.45">
            <line x1="20" y1={Y_BASE - 155} x2={W - 20} y2={Y_BASE - 155} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3 3" />
            <text x="24" y={Y_BASE - 159} fontSize="8" fill="#94a3b8" fontWeight="bold">10 / OPTIMAL</text>
            <line x1="20" y1={Y_BASE - 95} x2={W - 20} y2={Y_BASE - 95} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" />
            <text x="24" y={Y_BASE - 99} fontSize="8" fill="#94a3b8" fontWeight="bold">7.5 / READY</text>
            <line x1="20" y1={Y_BASE - 45} x2={W - 20} y2={Y_BASE - 45} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="20" y1={Y_BASE} x2={W - 20} y2={Y_BASE} stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" />
          </g>

          {/* Stepped Gray Trendline */}
          <path
            d={stepLinePath}
            fill="none"
            stroke="#94a3b8"
            strokeWidth="2.2"
            strokeLinejoin="round"
            opacity="0.75"
          />

          {/* 2D Columns */}
          {checkedInDays.map((d, i) => {
            const cx = checkedInDays.length === 1 ? W / 2 : xPadding + i * xStep;
            const colH = 45 + (d.pct / 100) * 155;
            const cy = Y_BASE - colH;
            const isSelected = i === activeIdx;

            return (
              <g
                key={`pwCol_${d.date}`}
                onClick={() => setSelectedIdx(i)}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer transition-transform duration-200"
                style={{
                  transform: isSelected ? "translateY(-6px)" : undefined,
                }}
              >
                {/* Stepped line junction dot */}
                <circle cx={cx} cy={cy - 22} r="3.5" fill="#64748b" stroke="#ffffff" strokeWidth="1.5" />

                {/* Two-Tone Pill Badge above column */}
                <g transform={`translate(${cx - 36}, ${cy - 31})`}>
                  <rect x="0" y="0" width="36" height="18" rx="4" fill="#e2e8f0" />
                  <text x="18" y="13" fill="#334155" fontSize="10" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">
                    {d.label}
                  </text>
                  <rect x="36" y="0" width="36" height="18" rx="4" fill={d.color} />
                  <text x="54" y="13" fill="#ffffff" fontSize="10" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">
                    {d.score}
                  </text>
                </g>

                {/* Floating Milestone Icon circle */}
                <g transform={`translate(${cx}, ${cy - 50})`}>
                  <circle cx="0" cy="0" r="13" fill="#ffffff" stroke={d.color} strokeWidth="2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))" />
                  <text x="0" y="4.5" fontSize="11" textAnchor="middle">
                    {d.icon}
                  </text>
                </g>

                {/* Main 2D Column */}
                <rect
                  x={cx - barW / 2}
                  y={cy}
                  width={barW}
                  height={colH}
                  rx="7"
                  fill={`url(#pwGrad_${i})`}
                  filter={isSelected ? "url(#pwBarBoxShadowActive)" : "url(#pwBarBoxShadow)"}
                />

                {/* Column highlight sheen */}
                <rect
                  x={cx - barW / 2 + 3}
                  y={cy + 3}
                  width={Math.max(4, barW * 0.25)}
                  height={Math.max(10, colH - 6)}
                  rx="3"
                  fill="#ffffff"
                  opacity="0.25"
                />

                {/* Label under base */}
                <text x={cx} y={Y_BASE + 20} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#334155">
                  {d.label}
                </text>
                <text x={cx} y={Y_BASE + 33} textAnchor="middle" fontSize="9" fill="#64748b">
                  {d.shortDate}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* ── Curled Ribbon Daily Breakdown Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
        {checkedInDays.map((item, idx) => {
          const isSelected = idx === activeIdx;

          return (
            <div
              key={item.num}
              onClick={() => setSelectedIdx(idx)}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{
                background: isSelected
                  ? `linear-gradient(90deg, ${item.color} 0%, ${item.colorDark} 100%)`
                  : `linear-gradient(90deg, ${item.colorLight} 0%, #ffffff 100%)`,
                borderLeft: `5px solid ${item.color}`,
              }}
              className={`relative flex items-center justify-between px-3.5 py-2.5 rounded-r-2xl border border-gray-200/70 shadow-2xs transition-all duration-200 cursor-pointer ${
                isSelected
                  ? "scale-101 shadow-md text-white"
                  : "hover:bg-white hover:shadow-xs"
              }`}
            >
              {/* Day info */}
              <div className="min-w-0 flex-1 pr-2">
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-extrabold uppercase tracking-wider ${
                    isSelected ? "text-white" : "text-[#171d1c]"
                  }`}>
                    {item.label} · {item.shortDate}
                  </span>
                  {idx === checkedInDays.length - 1 && (
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-white text-emerald-700 shadow-2xs">
                      Latest
                    </span>
                  )}
                </div>
                <p className={`text-[10px] mt-0.5 truncate ${
                  isSelected ? "text-white/90" : "text-[#6c7a78]"
                }`}>
                  {item.note}
                </p>
                <div className="flex items-center gap-1.5 mt-1 text-[10px] font-medium">
                  <span className={isSelected ? "text-white font-bold" : "text-[#171d1c] font-semibold"}>
                    Readiness: {item.score}/10
                  </span>
                  <span>•</span>
                  <span className={isSelected ? "text-white/85" : "text-[#3c4948]"}>
                    Energy: {item.energy}/5
                  </span>
                  <span>•</span>
                  <span className={isSelected ? "text-white/85" : "text-[#3c4948]"}>
                    Soreness: {item.soreness}/5
                  </span>
                  <span>•</span>
                  <span className={isSelected ? "text-white/85" : "text-[#3c4948]"}>
                    Motivation: {item.motivation}/5
                  </span>
                </div>
              </div>

              {/* Big Stylized Number (01, 02, 03, 04) */}
              <div className="shrink-0 text-right">
                <span
                  className={`font-black text-2xl leading-none tracking-tighter ${
                    isSelected ? "text-white/95" : "text-gray-300"
                  }`}
                >
                  {item.num}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LineChart({ data }) {
  if (!data || data.length === 0) {
    return <EmptyChart label="Log your daily check-in to see energy trends" />;
  }

  if (data.length === 1) {
    const d = data[0];
    const pct = Math.min(100, Math.max(10, Math.round((d.value / 10) * 100)));
    const energyLevelText = d.value >= 8 ? "Peak Vitality" : d.value >= 6 ? "High Energy" : d.value >= 4 ? "Moderate Energy" : "Low Energy";
    const energyBadgeCls = d.value >= 8
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : d.value >= 5
      ? "bg-cyan-50 text-cyan-700 border-cyan-200"
      : "bg-amber-50 text-amber-700 border-amber-200";

    return (
      <div className="w-full py-1">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[var(--foreground)]">{d.label} (Latest)</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${energyBadgeCls}`}>
              {energyLevelText}
            </span>
          </div>
          <span className="text-sm font-extrabold text-[var(--accent)]">{d.value}/10</span>
        </div>

        {/* Dynamic vitality progress bar with gradient */}
        <div className="h-3 w-full bg-[var(--muted)] rounded-full overflow-hidden p-0.5 border border-[var(--border)]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-teal-400 via-[var(--accent)] to-emerald-500 transition-all duration-700 shadow-2xs"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="flex items-center justify-between mt-2 text-[10px] text-[var(--muted-foreground)]">
          <span>Scale: 0 (Exhausted) to 10 (Peak Energy)</span>
          <span className="font-medium text-[var(--accent)]">✓ 1 check-in logged · Slope trend expands on next check-in</span>
        </div>
      </div>
    );
  }

  const values = data.map(d => d.value);
  const min = Math.max(0, Math.min(...values) - 1);
  const max = Math.min(10, Math.max(...values) + 1);
  const range = max - min || 1;
  const W = 300, H = 80;
  const toX = i => (i / (data.length - 1)) * (W - 24) + 12;
  const toY = v => H - ((v - min) / range) * (H - 24) - 12;
  const pathD = data.map((d, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(d.value).toFixed(1)}`).join(" ");
  const areaD = `${pathD} L${toX(data.length - 1).toFixed(1)},${H} L${toX(0).toFixed(1)},${H} Z`;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H + 4}`} className="w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="pgGrad" x1="0" x2="0" y1="0" x2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.25"/>
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.01"/>
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#pgGrad)"/>
        <path d={pathD} fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round"/>
        {data.map((d, i) => (
          <g key={i}>
            <circle cx={toX(i)} cy={toY(d.value)} r="3.5" fill="white" stroke="var(--accent)" strokeWidth="2"/>
            <text x={toX(i)} y={toY(d.value) - 6} textAnchor="middle" fontSize="8" fontWeight="bold" fill="var(--foreground)">
              {d.value}
            </text>
          </g>
        ))}
      </svg>
      <div className="flex justify-between mt-1 px-1">
        {data.map((d, i) => (
          <span key={i} className="text-[9px] text-[var(--muted-foreground)] font-medium">{d.label}</span>
        ))}
      </div>
    </div>
  );
}

function EmptyChart({ label }) {
  return (
    <div className="h-16 flex items-center justify-center border border-dashed border-[var(--border)] rounded-xl">
      <p className="text-xs text-[var(--muted-foreground)] text-center px-4">{label}</p>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────
export default function ProgressPage({
  checkins = [],
  workouts = [],
  streak = 0,
  profile,
  user = null,
  onOpenWeeklyAssessment,
}) {
  const [period, setPeriod] = useState("week");

  // Biometrics history from localStorage scoped to user (reactive)
  const [biometrics, setBiometrics] = useState(() => loadBiometricsHistory(user));

  // Preserved assessment versions history (reactive)
  const [assessmentHistory, setAssessmentHistory] = useState(() => loadAssessmentHistory(user));

  useEffect(() => {
    setBiometrics(loadBiometricsHistory(user));
    setAssessmentHistory(loadAssessmentHistory(user));
    const handleUpdate = () => {
      setBiometrics(loadBiometricsHistory(user));
      setAssessmentHistory(loadAssessmentHistory(user));
    };
    window.addEventListener("pw-biometrics-updated", handleUpdate);
    window.addEventListener("pw-checkin-updated", handleUpdate);
    window.addEventListener("pw-assessment-updated", handleUpdate);
    window.addEventListener("pw-profile-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("pw-biometrics-updated", handleUpdate);
      window.removeEventListener("pw-checkin-updated", handleUpdate);
      window.removeEventListener("pw-assessment-updated", handleUpdate);
      window.removeEventListener("pw-profile-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [user]);

  // Build last N days from real check-ins
  const nDays = period === "week" ? 7 : 28;
  const days = Array.from({ length: nDays }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (nDays - 1 - i));
    const date = localDateStr(d);
    const entry = checkins.find(c => c.date === date);
    return {
      date,
      label: d.toLocaleDateString("en-US", { weekday: "short" }),
      shortDate: `${d.getDate()}/${d.getMonth() + 1}`,
      entry,
    };
  });

  // Readiness over time (only days with check-ins)
  const readinessTrend = days
    .filter(d => d.entry)
    .map(d => ({ label: d.label, value: d.entry.avgReadiness }));

  // Per-metric trends
  const energyTrend = days.filter(d => d.entry).map(d => ({ label: d.label, value: d.entry.scores.energy * 2 }));

  // Stats
  const totalCheckins = checkins.length;
  const totalWorkoutsDone = workouts.filter(w => w.completed).length;
  const avgReadiness = checkins.length
    ? Math.round(checkins.reduce((s, c) => s + c.avgReadiness, 0) / checkins.length)
    : null;
  const periodCheckins = days.filter(d => d.entry).length;
  const periodWorkouts = days.filter(d => workouts.some(w => w.date === d.date && w.completed)).length;

  // Workout completion bar (this week: each day)
  const workoutDays = days.map(d => ({
    ...d,
    done: workouts.some(w => w.date === d.date && w.completed),
  }));

  return (
    <div className="relative min-h-screen">
      {/* ── Content (above canvas) ── */}
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8 lg:px-8 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="font-display text-3xl text-[var(--foreground)]">Progress</h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              {period === "week" ? "Last 7 days of real data." : "Last 4 weeks of real data."}
            </p>
          </div>
          <div className="flex bg-white/80 backdrop-blur-sm border border-[var(--border)] rounded-xl p-1 shadow-xs">
            {["week", "month"].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition capitalize cursor-pointer ${
                  period === p ? "bg-[var(--primary)] text-white shadow-sm" : "text-[var(--muted-foreground)]"
                }`}
              >
                {p === "week" ? "7 Days" : "28 Days"}
              </button>
            ))}
          </div>
        </div>

        {/* ── Key Stats ── */}
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              label: "Avg Readiness",
              value: avgReadiness ? `${avgReadiness}/10` : "—",
              sub: totalCheckins ? `${totalCheckins} check-ins total` : "No check-ins yet",
              color: avgReadiness ? avgReadiness >= 8 ? "text-emerald-600" : avgReadiness >= 5 ? "text-amber-500" : "text-rose-500" : "text-[var(--muted-foreground)]",
            },
            {
              label: "Current Streak",
              value: `${streak}`,
              sub: "consecutive days",
              color: streak >= 5 ? "text-emerald-600" : streak >= 2 ? "text-amber-500" : "text-[var(--foreground)]",
            },
            {
              label: `Check-Ins (${period === "week" ? "7d" : "28d"})`,
              value: `${periodCheckins}`,
              sub: `of ${nDays} days logged`,
              color: "text-[var(--foreground)]",
            },
            {
              label: `Workouts Done`,
              value: `${totalWorkoutsDone}`,
              sub: "sessions completed",
              color: "text-[var(--foreground)]",
            },
          ].map(s => (
            <div key={s.label} className="bg-white/80 backdrop-blur-sm border border-[var(--border)] rounded-2xl p-4 shadow-xs">
              <p className="text-xs text-[var(--muted-foreground)] mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Readiness Trend ── */}
        <div className="bg-white/80 backdrop-blur-sm border border-[var(--border)] rounded-3xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">Readiness Score</p>
              <p className="text-xs text-[var(--muted-foreground)]">Daily avg out of 10</p>
            </div>
            {avgReadiness && (
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                avgReadiness >= 8 ? "text-emerald-700 bg-emerald-50" : avgReadiness >= 5 ? "text-amber-600 bg-amber-50" : "text-rose-600 bg-rose-50"
              }`}>
                avg {avgReadiness}/10
              </span>
            )}
          </div>
          <ReadinessDimensionalChart days={days} />
        </div>

        {/* ── Energy Trend ── */}
        <div className="bg-white/80 backdrop-blur-sm border border-[var(--border)] rounded-3xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">Energy Level Trend</p>
              <p className="text-xs text-[var(--muted-foreground)]">Scaled out of 10 from real check-ins</p>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
              ⚡ Physical Vitality
            </span>
          </div>
          <LineChart data={energyTrend} />
        </div>

        {/* ── Workout Consistency ── */}
        <div className="bg-white/80 backdrop-blur-sm border border-[var(--border)] rounded-3xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">Workout Consistency</p>
              <p className="text-xs text-[var(--muted-foreground)]">Sessions completed</p>
            </div>
            <span className="text-xs font-bold text-[var(--accent)]">{periodWorkouts}/{nDays} days</span>
          </div>
          {workoutDays.length > 0 ? (
            <div>
              <div className="flex items-end gap-1.5" style={{ height: "64px" }}>
                {workoutDays.slice(period === "week" ? -7 : -14).map((d) => (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div className="w-full flex flex-col justify-end rounded-md overflow-hidden bg-[var(--muted)]" style={{ height: "48px" }}>
                      {d.done ? (
                        <div className="w-full bg-[var(--accent)] rounded-md transition-all duration-300 shadow-2xs" style={{ height: "100%" }} />
                      ) : (
                        <div className="w-full h-1.5 bg-[var(--border)]/70 rounded-full mb-1 mx-auto" style={{ width: "55%" }} />
                      )}
                    </div>
                    <span className={`text-[9px] ${d.done ? "text-[var(--accent)] font-bold" : "text-[var(--muted-foreground)] font-medium"}`}>
                      {d.label}
                    </span>
                    {/* Tooltip on hover */}
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:flex px-2 py-0.5 rounded bg-slate-800 text-white text-[9px] whitespace-nowrap z-20 shadow-sm pointer-events-none">
                      {d.label} ({d.shortDate}): {d.done ? "Session Completed ✓" : "Rest / Incomplete"}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[var(--border)]/60 text-[10px] text-[var(--muted-foreground)]">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-2 h-2 rounded-full bg-[var(--accent)] inline-block" />
                  Completed Session
                </span>
                <span>
                  {periodWorkouts === 0
                    ? "Log daily check-in or workout to build consistency"
                    : `${periodWorkouts} session${periodWorkouts > 1 ? "s" : ""} on track this ${period === "week" ? "week" : "period"}`}
                </span>
              </div>
            </div>
          ) : (
            <EmptyChart label="Complete your daily log or workout to see consistency data" />
          )}
        </div>

        {/* ── Weight & BMI Trend (real biometrics data) ── */}
        <div className="bg-white/80 backdrop-blur-sm border border-[var(--border)] rounded-3xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">Weight & BMI History</p>
              <p className="text-xs text-[var(--muted-foreground)]">Logged each Monday · Real data</p>
            </div>
            <span className="text-xs font-semibold text-[var(--accent)] bg-[var(--secondary)] border border-[var(--border)] px-2.5 py-1 rounded-full">
              ⚖️ {biometrics.length} entries
            </span>
          </div>
          {biometrics.length === 0 ? (
            <EmptyChart label="Log your body metrics from the Plan page to track weight & BMI over time" />
          ) : (
            <div className="space-y-2.5">
              {biometrics.slice(0, 5).map((entry, i) => {
                const bmiColor = entry.bmi
                  ? entry.bmi < 18.5 ? "text-sky-600 bg-sky-50"
                    : entry.bmi < 25 ? "text-emerald-600 bg-emerald-50"
                    : entry.bmi < 30 ? "text-amber-600 bg-amber-50"
                    : "text-rose-600 bg-rose-50"
                  : "text-[var(--muted-foreground)] bg-[var(--muted)]";
                return (
                  <div key={entry.date} className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
                    i === 0 ? "bg-[var(--secondary)] border-[var(--accent)]/20" : "bg-[var(--muted)] border-transparent"
                  }`}>
                    <div>
                      <p className="text-xs font-semibold text-[var(--foreground)]">
                        {new Date(entry.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                        {i === 0 && <span className="ml-2 text-[10px] text-[var(--accent)] font-bold">LATEST</span>}
                      </p>
                      <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                        {entry.weight} {entry.weightUnit} · {entry.height} {entry.heightUnit}
                        {entry.note ? ` · ${entry.note}` : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-base font-bold ${bmiColor.split(" ")[0]}`}>{entry.bmi ?? "—"}</p>
                      <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${bmiColor}`}>
                        {entry.category || "BMI"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Weekly Journey & Assessment History (Preserved Versions) ── */}
        <div className="bg-white/80 backdrop-blur-sm border border-[var(--border)] rounded-3xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">Weekly Journey & Assessment History</p>
              <p className="text-xs text-[var(--muted-foreground)]">
                Versioned records preserved each Monday · Strict equipment context
              </p>
            </div>
            {onOpenWeeklyAssessment && (
              <button
                onClick={onOpenWeeklyAssessment}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
              >
                <span>+ Log Monday Journey</span>
              </button>
            )}
          </div>

          {assessmentHistory.length === 0 ? (
            <EmptyChart label="No weekly journey updates logged yet. Your next update will be preserved as Version 1." />
          ) : (
            <div className="space-y-3">
              {assessmentHistory.map((item, idx) => {
                const isLatest = idx === 0;
                const eqList = Array.isArray(item.equipment) ? item.equipment : ["No Equipment"];
                const isNoEq = eqList.includes("No Equipment");

                return (
                  <div
                    key={item.id || idx}
                    className={`p-4 rounded-2xl border transition-all ${
                      isLatest
                        ? "bg-gradient-to-br from-emerald-50/70 to-teal-50/40 border-emerald-300 shadow-xs"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          isLatest
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "bg-gray-100 text-gray-700"
                        }`}>
                          Version {item.version || (assessmentHistory.length - idx)}
                          {isLatest && " • Active"}
                        </span>
                        <span className="text-xs font-semibold text-gray-700">
                          Week of {item.weekStartDate ? formatMondayDate(item.weekStartDate) : "Weekly Cycle"}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-gray-900">
                          {item.weight} {item.weightUnit} · BMI {item.bmi || "—"}
                        </span>
                        {item.bmiCategory && (
                          <span className="ml-1.5 text-[10px] font-semibold text-emerald-800 bg-emerald-100/80 px-2 py-0.2 rounded-md">
                            {item.bmiCategory}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Equipment badges */}
                    <div className="flex items-center gap-2 flex-wrap mt-2">
                      <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
                        Equipment Context:
                      </span>
                      {eqList.map((eq) => (
                        <span
                          key={eq}
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            isNoEq
                              ? "bg-amber-50 text-amber-900 border border-amber-200"
                              : "bg-teal-50 text-teal-800 border border-teal-200"
                          }`}
                        >
                          {eq === "No Equipment" ? "🤸 No Equipment (Bodyweight Only)" : `🏋️ ${eq}`}
                        </span>
                      ))}
                    </div>

                    {/* Goals & Frequency */}
                    <div className="mt-2 text-xs text-gray-600 flex items-center gap-3 flex-wrap">
                      <span>🎯 <strong>Goal:</strong> {item.primaryGoal || "General Fitness"}</span>
                      <span>🔄 <strong>Freq:</strong> {item.exerciseFrequency || "4-5 days/week"}</span>
                      <span>⏱️ <strong>Time:</strong> {item.commitment || "30 min"}</span>
                    </div>

                    {/* Progress Notes */}
                    {item.progressNotes && (
                      <p className="mt-2 text-xs text-gray-500 italic bg-white/60 p-2 rounded-xl border border-gray-100">
                        "{item.progressNotes}"
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Goal & Profile context ── */}
        {profile && (
          <div className="bg-white/80 backdrop-blur-sm border border-[var(--border)] rounded-3xl p-5 shadow-xs">
            <p className="text-sm font-semibold text-[var(--foreground)] mb-4">Your Profile</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Primary Goal", value: profile.primaryGoal || "—" },
                { label: "Fitness Level", value: profile.fitnessLevel || "—" },
                { label: "Commitment", value: profile.commitment || "—" },
                { label: "Environment", value: profile.environment || "—" },
              ].map(item => (
                <div key={item.label} className="bg-[var(--muted)] rounded-xl p-3">
                  <p className="text-[10px] text-[var(--muted-foreground)] mb-0.5">{item.label}</p>
                  <p className="text-sm font-semibold text-[var(--foreground)] truncate">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
