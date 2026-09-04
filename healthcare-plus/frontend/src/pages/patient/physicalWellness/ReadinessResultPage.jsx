import React from "react";

export default function ReadinessResultPage({ todayCheckin, onViewWorkout, onGoToDashboard }) {
  const result = todayCheckin?.result || "ready";
  const score  = todayCheckin?.avgReadiness ?? null;

  const configs = {
    ready: {
      label: "Ready to Train",
      headline: "You're ready for today's planned activity.",
      body: "Your energy and readiness are looking strong. Let's make the most of this session.",
      cta: "View Today's Plan",
      ctaAction: onViewWorkout,
    },
    adjusted: {
      label: "Plan Adjusted",
      headline: "Today's plan has been adapted to match how you're feeling.",
      body: "We've reduced intensity slightly and extended rest periods so you can train comfortably without overloading.",
      cta: "View Adapted Plan",
      ctaAction: onViewWorkout,
    },
    recovery: {
      label: "Recovery Day",
      headline: "Today may be better suited for recovery and light activity.",
      body: "Listening to your body is part of the plan. A recovery day now means a stronger session next time.",
      cta: "Go to Dashboard",
      ctaAction: onGoToDashboard,
    },
  };

  const config = configs[result] || configs.ready;
  const ringColor = result === "ready" ? "var(--accent)" : result === "adjusted" ? "hsl(38 92% 50%)" : "hsl(0 72% 60%)";
  const adjustedDuration = score ? `${Math.max(15, Math.round((score / 10) * 30))} min` : "25 min";
  const adjustedIntensity = score >= 8 ? "Full" : score >= 6 ? "Moderate" : score >= 4 ? "Light" : "Very Light";
  const adjustedRest = score >= 8 ? "30s" : score >= 6 ? "40s" : "60s";

  return (
    <div className="max-w-lg mx-auto px-4 py-12 flex flex-col items-center text-center">
      {/* Score ring */}
      <div className="relative w-28 h-28 mb-6">
        <svg viewBox="0 0 112 112" className="w-28 h-28 -rotate-90">
          <circle cx="56" cy="56" r="46" fill="none" stroke="var(--muted)" strokeWidth="8"/>
          <circle
            cx="56" cy="56" r="46" fill="none"
            stroke={ringColor}
            strokeWidth="8"
            strokeDasharray={`${2 * Math.PI * 46}`}
            strokeDashoffset={`${2 * Math.PI * 46 * (1 - (score ?? 0) / 10)}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1.2s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {score !== null ? (
            <>
              <span className="text-3xl font-bold text-[var(--foreground)]">{score}</span>
              <span className="text-[10px] text-[var(--muted-foreground)]">/10</span>
            </>
          ) : (
            <span className="text-2xl">—</span>
          )}
        </div>
      </div>

      <span className={`text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-5 ${
        result === "ready" ? "bg-[var(--secondary)] text-[var(--accent)]"
        : result === "adjusted" ? "bg-amber-50 text-amber-600"
        : "bg-[var(--muted)] text-[var(--muted-foreground)]"
      }`}>
        {config.label}
      </span>

      <h1 className="font-display text-3xl text-[var(--foreground)] mb-3 max-w-xs">{config.headline}</h1>
      <p className="text-[var(--muted-foreground)] text-sm leading-relaxed mb-8 max-w-xs">{config.body}</p>

      {/* Today's individual scores */}
      {todayCheckin?.scores && (
        <div className="w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 mb-5 text-left shadow-xs">
          <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-4">Today's Scores</p>
          <div className="space-y-2.5">
            {[
              { label: "Energy",     val: todayCheckin.scores.energy,     invert: false },
              { label: "Sleep",      val: todayCheckin.scores.sleep,      invert: false },
              { label: "Soreness",   val: todayCheckin.scores.soreness,   invert: true },
              { label: "Motivation", val: todayCheckin.scores.motivation, invert: false },
            ].map(m => {
              const pct = (m.val / 5) * 100;
              const display = m.invert ? 6 - m.val : m.val;
              const color = display >= 4 ? "bg-emerald-500" : display >= 3 ? "bg-amber-400" : "bg-rose-400";
              return (
                <div key={m.label} className="flex items-center gap-3">
                  <p className="text-xs text-[var(--muted-foreground)] w-20 shrink-0">{m.label}</p>
                  <div className="flex-1 h-1.5 bg-[var(--muted)] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs font-bold text-[var(--foreground)] w-4 text-right">{m.val}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Plan adjustments (only for adjusted result) */}
      {result === "adjusted" && (
        <div className="w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 mb-5 text-left shadow-xs">
          <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-4">Plan Adjustments</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: "Duration",  to: adjustedDuration },
              { label: "Intensity", to: adjustedIntensity },
              { label: "Rest",      to: adjustedRest },
            ].map(adj => (
              <div key={adj.label}>
                <p className="text-xs text-[var(--muted-foreground)] mb-1">{adj.label}</p>
                <p className="text-sm font-bold text-[var(--accent)]">{adj.to}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={config.ctaAction}
        className="w-full max-w-xs bg-[var(--primary)] text-white font-semibold py-4 rounded-2xl text-sm hover:opacity-90 transition cursor-pointer mb-3 shadow-md"
      >
        {config.cta}
      </button>
      <button
        onClick={onGoToDashboard}
        className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition cursor-pointer"
      >
        Go to Dashboard
      </button>
    </div>
  );
}
