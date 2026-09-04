import React, { useState, useEffect, useCallback } from "react";
import { mockTodayWorkout } from "../../../data/physicalWellnessMockData.js";

const allExercises = [
  ...mockTodayWorkout.warmUp,
  ...mockTodayWorkout.mainWorkout,
  ...mockTodayWorkout.coolDown,
];

// Map exercise descriptions to icon types
function getExerciseIcon(description = "") {
  const d = description.toLowerCase();
  if (d.includes("cardio") || d.includes("warm-up") || d.includes("cardiovascular") || d.includes("burst"))
    return "cardio";
  if (d.includes("core") || d.includes("stability") || d.includes("oblique") || d.includes("deep"))
    return "core";
  if (d.includes("mobilize") || d.includes("stretch") || d.includes("spinal") || d.includes("release") || d.includes("flexibility"))
    return "stretch";
  return "strength";
}

const exerciseTypeConfig = {
  cardio: {
    bg: "from-orange-400 to-rose-500",
    label: "Cardio",
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
  },
  core: {
    bg: "from-violet-500 to-indigo-600",
    label: "Core",
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/>
      </svg>
    ),
  },
  stretch: {
    bg: "from-teal-400 to-cyan-500",
    label: "Flexibility",
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
        <path d="M12 2a7 7 0 017 7c0 5-7 13-7 13S5 14 5 9a7 7 0 017-7z"/>
      </svg>
    ),
  },
  strength: {
    bg: "from-[#1A3C34] to-[#2D6A5A]",
    label: "Strength",
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
        <path d="M6 4v16M18 4v16M2 9h4M18 9h4M2 15h4M18 15h4M6 9h12M6 15h12"/>
      </svg>
    ),
  },
};

// Parse duration string like "30s", "60s", "45s" to number of seconds
function parseDurationSecs(dur) {
  if (!dur) return null;
  const match = dur.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

// Format seconds to mm:ss or just ss
function fmt(s) {
  if (s >= 60) return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  return `${s}s`;
}

// ----- REST SCREEN -----
function RestScreen({ restSecs, onDone }) {
  const [remaining, setRemaining] = useState(restSecs);

  useEffect(() => {
    if (remaining <= 0) { onDone(); return; }
    const t = setTimeout(() => setRemaining(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, onDone]);

  const pct = ((restSecs - remaining) / restSecs) * 100;

  return (
    <div className="min-h-full flex flex-col items-center justify-center px-6 text-center">
      <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-widest mb-6">Rest Period</p>
      <div className="relative w-32 h-32 mb-8">
        <svg viewBox="0 0 128 128" className="w-32 h-32 -rotate-90">
          <circle cx="64" cy="64" r="56" fill="none" stroke="var(--muted)" strokeWidth="8"/>
          <circle
            cx="64" cy="64" r="56" fill="none"
            stroke="var(--accent)" strokeWidth="8"
            strokeDasharray={`${2 * Math.PI * 56}`}
            strokeDashoffset={`${2 * Math.PI * 56 * (1 - pct / 100)}`}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-[var(--foreground)]">{remaining}</span>
          <span className="text-xs text-[var(--muted-foreground)]">seconds</span>
        </div>
      </div>
      <p className="text-[var(--muted-foreground)] text-sm mb-8">Take a breath, shake it out 💪</p>
      <button
        onClick={onDone}
        className="px-8 py-3 bg-[var(--card)] border border-[var(--border)] rounded-2xl text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--muted)] transition cursor-pointer shadow-xs"
      >
        Skip Rest
      </button>
    </div>
  );
}

// ----- SAFETY SCREEN -----
function SafetyScreen({ onEnd, onResume }) {
  const [selected, setSelected] = useState(null);

  if (selected) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center px-6 py-12 max-w-sm mx-auto">
        <div className="w-16 h-16 rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center mb-6">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <h2 className="font-display text-2xl text-[var(--foreground)] mb-2 text-center">Please stop the workout.</h2>
        <p className="text-sm text-[var(--muted-foreground)] text-center mb-2 leading-relaxed">
          You selected: <span className="font-medium text-[var(--foreground)]">{selected}</span>
        </p>
        <p className="text-xs text-[var(--muted-foreground)] text-center mb-8 leading-relaxed">
          If symptoms persist or worsen, consult a healthcare professional before resuming any physical activity.
        </p>
        <div className="w-full space-y-3">
          <button onClick={onEnd} className="w-full bg-[var(--primary)] text-white font-semibold py-4 rounded-2xl text-sm hover:opacity-90 transition cursor-pointer shadow-md">
            End Workout
          </button>
          <button onClick={onResume} className="w-full border border-[var(--border)] text-[var(--foreground)] font-medium py-4 rounded-2xl text-sm hover:bg-[var(--muted)] transition cursor-pointer">
            Resume with Caution
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full flex flex-col items-center justify-center px-6 py-12 max-w-sm mx-auto">
      <div className="w-16 h-16 rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center mb-6">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </div>
      <h2 className="font-display text-2xl text-[var(--foreground)] mb-2 text-center">Let's pause here.</h2>
      <p className="text-sm text-[var(--muted-foreground)] text-center mb-8">What's happening? Select anything that applies.</p>
      <div className="w-full space-y-2">
        {["I'm experiencing pain", "I feel dizzy", "I have chest discomfort", "Something else feels wrong"].map(opt => (
          <button
            key={opt}
            onClick={() => setSelected(opt)}
            className="w-full text-left bg-[var(--card)] border border-[var(--border)] hover:border-amber-300 px-4 py-4 rounded-xl text-sm font-medium text-[var(--foreground)] transition cursor-pointer shadow-xs"
          >
            {opt}
          </button>
        ))}
        <button onClick={onResume} className="w-full mt-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition cursor-pointer py-3">
          Go back to workout
        </button>
      </div>
    </div>
  );
}

// ----- MAIN SESSION SCREEN -----
export default function WorkoutSessionPage({ onComplete, onBack }) {
  const [exIdx, setExIdx] = useState(0);
  const [setNum, setSetNum] = useState(1);
  const [phase, setPhase] = useState("exercise"); // "exercise" | "rest" | "safety"
  const [elapsed, setElapsed] = useState(0);
  const [countdown, setCountdown] = useState(null);
  const [isCountingDown, setIsCountingDown] = useState(false);

  const ex = allExercises[exIdx];
  const next = allExercises[exIdx + 1];
  const total = allExercises.length;
  const totalSets = ex.sets || 1;
  const isLastSet = setNum >= totalSets;
  const isLastEx = exIdx >= total - 1;
  const restSecs = parseDurationSecs(ex.rest);
  const durSecs = parseDurationSecs(ex.duration);
  const isTimed = !!durSecs;
  const exType = getExerciseIcon(ex.description);
  const typeConfig = exerciseTypeConfig[exType];

  // Global elapsed timer (pauses during rest and safety)
  useEffect(() => {
    if (phase !== "exercise") return;
    const t = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  // Per-exercise countdown for timed exercises
  useEffect(() => {
    if (phase !== "exercise" || !isTimed) { setIsCountingDown(false); return; }
    setCountdown(durSecs);
    setIsCountingDown(true);
  }, [exIdx, setNum, isTimed, durSecs, phase]);

  useEffect(() => {
    if (!isCountingDown || countdown === null) return;
    if (countdown <= 0) { setIsCountingDown(false); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, isCountingDown]);

  const handleCompleteSet = useCallback(() => {
    if (!isLastSet) {
      // More sets to go — show rest timer if applicable
      if (restSecs && restSecs > 0) {
        setPhase("rest");
      } else {
        setSetNum(s => s + 1);
        setCountdown(durSecs);
        setIsCountingDown(isTimed);
      }
    } else {
      // Last set done — move to next exercise (or finish)
      if (isLastEx) {
        onComplete();
      } else {
        setExIdx(i => i + 1);
        setSetNum(1);
      }
    }
  }, [isLastSet, isLastEx, restSecs, durSecs, isTimed, onComplete]);

  const handleRestDone = useCallback(() => {
    setSetNum(s => s + 1);
    setCountdown(durSecs);
    setIsCountingDown(isTimed);
    setPhase("exercise");
  }, [durSecs, isTimed]);

  const handleSkipEx = () => {
    if (isLastEx) { onComplete(); return; }
    setExIdx(i => i + 1);
    setSetNum(1);
    setPhase("exercise");
  };
  const handlePrevEx = () => {
    if (exIdx > 0) { setExIdx(i => i - 1); setSetNum(1); setPhase("exercise"); }
  };

  if (phase === "safety") {
    return (
      <div className="pw-root min-h-screen">
        <SafetyScreen onEnd={onBack} onResume={() => setPhase("exercise")} />
      </div>
    );
  }

  if (phase === "rest") {
    return (
      <div className="min-h-full">
        <RestScreen restSecs={restSecs || 30} onDone={handleRestDone} />
      </div>
    );
  }

  // Countdown display: for timed exercises show countdown, else show reps
  const primaryDisplay = isTimed
    ? (isCountingDown ? fmt(countdown ?? durSecs) : fmt(durSecs))
    : (ex.reps || "—");
  const primaryLabel = isTimed ? "Time" : "Reps";

  return (
    <div className="min-h-full flex flex-col max-w-lg mx-auto">
      {/* Top bar: progress + elapsed */}
      <div className="px-4 pt-5 pb-3 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-[var(--muted-foreground)]">
            Exercise {exIdx + 1} of {total}
          </span>
          <span className="text-xs font-mono font-semibold text-[var(--muted-foreground)] bg-[var(--muted)] px-2 py-0.5 rounded-md">
            {fmt(elapsed)}
          </span>
        </div>
        <div className="h-1.5 bg-[var(--muted)] rounded-full">
          <div
            className="h-full bg-[var(--accent)] rounded-full transition-all duration-400"
            style={{ width: `${((exIdx) / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Exercise visual demonstration viewport in perfect orientation */}
      <div className="px-4 mb-3 shrink-0">
        <div className="relative w-full h-56 sm:h-64 rounded-3xl bg-white border border-[var(--border)] overflow-hidden flex items-center justify-center shadow-sm">
          {ex.gifUrl ? (
            <img
              src={ex.gifUrl}
              alt={ex.name}
              className="w-full h-full object-contain p-2 mix-blend-multiply select-none pointer-events-none"
              loading="eager"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${typeConfig.bg} flex flex-col items-center justify-center p-6 text-white text-center`}>
              <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center mb-3 shadow-xs">
                {typeConfig.icon}
              </div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/70">{typeConfig.label}</p>
            </div>
          )}

          {/* Floating badges */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span className="text-[10px] font-bold text-white bg-slate-900/75 backdrop-blur-md px-2.5 py-1 rounded-full uppercase tracking-wider shadow-2xs">
              {typeConfig.label}
            </span>
            {isTimed && (
              <span className="text-[10px] font-bold text-white bg-amber-600/85 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1 shadow-2xs">
                ⏱ {durSecs}s Target
              </span>
            )}
          </div>

          <div className="absolute top-3 right-3">
            <span className="text-[10px] font-bold text-[var(--foreground)] bg-white/90 backdrop-blur-md border border-[var(--border)] px-2.5 py-1 rounded-full shadow-2xs">
              #{exIdx + 1} of {total}
            </span>
          </div>
        </div>

        {/* Title & Description below GIF */}
        <div className="text-center mt-3 mb-1">
          <h2 className="font-display text-2xl text-[var(--foreground)] leading-tight">{ex.name}</h2>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5 max-w-sm mx-auto leading-relaxed">{ex.description}</p>
        </div>
      </div>

      {/* Exercise metrics */}
      <div className="px-4 flex-1 flex flex-col">
        {/* Set counter (only if > 1 set) */}
        {totalSets > 1 && (
          <div className="flex items-center justify-center gap-2 mb-4">
            {Array.from({ length: totalSets }).map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i < setNum - 1
                    ? "bg-[var(--accent)] w-8"
                    : i === setNum - 1
                    ? "bg-[var(--foreground)] w-10"
                    : "bg-[var(--muted)] w-6"
                }`}
              />
            ))}
            <span className="text-xs font-semibold text-[var(--muted-foreground)] ml-1">
              Set {setNum} of {totalSets}
            </span>
          </div>
        )}

        {/* Primary metric — big countdown or reps */}
        <div className="flex items-center justify-center gap-8 mb-4">
          <div className="text-center">
            {isTimed ? (
              <div className={`text-6xl font-bold tabular-nums transition-colors ${
                countdown !== null && countdown <= 5 && isCountingDown
                  ? "text-rose-500"
                  : "text-[var(--foreground)]"
              }`}>
                {primaryDisplay}
              </div>
            ) : (
              <div className="text-6xl font-bold text-[var(--foreground)]">{primaryDisplay}</div>
            )}
            <p className="text-xs text-[var(--muted-foreground)] mt-1 font-medium uppercase tracking-wider">{primaryLabel}</p>
          </div>
          {ex.rest && ex.rest !== "0s" && (
            <div className="text-center">
              <div className="text-3xl font-bold text-[var(--muted-foreground)]">{ex.rest}</div>
              <p className="text-xs text-[var(--muted-foreground)] mt-1 font-medium uppercase tracking-wider">Rest</p>
            </div>
          )}
        </div>

        {/* Instructions */}
        <p className="text-sm text-[var(--muted-foreground)] leading-relaxed text-center mb-5 max-w-xs mx-auto">
          {ex.instructions}
        </p>

        {/* Next exercise preview */}
        {next && (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl px-4 py-3 flex items-center gap-3 mb-5 shadow-xs">
            <p className="text-xs text-[var(--muted-foreground)] shrink-0 font-medium">Up next</p>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--foreground)] truncate">{next.name}</p>
            </div>
            <p className="text-xs text-[var(--muted-foreground)] shrink-0">{next.reps || next.duration}</p>
          </div>
        )}

        {/* Controls */}
        <div className="space-y-2 mt-auto pb-4">
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handlePrevEx}
              disabled={exIdx === 0}
              className="py-3.5 bg-[var(--card)] border border-[var(--border)] rounded-2xl text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--muted)] transition disabled:opacity-30 cursor-pointer shadow-xs"
            >
              ← Prev
            </button>
            <button
              onClick={() => setIsCountingDown(v => !v)}
              className={`py-3.5 rounded-2xl text-sm font-semibold transition cursor-pointer shadow-xs border ${
                isCountingDown
                  ? "bg-[var(--foreground)] text-[var(--card)] border-[var(--foreground)]"
                  : "bg-[var(--card)] border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)]"
              }`}
            >
              {isCountingDown ? "⏸ Pause" : "▶ Resume"}
            </button>
            <button
              onClick={handleSkipEx}
              className="py-3.5 bg-[var(--card)] border border-[var(--border)] rounded-2xl text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--muted)] transition cursor-pointer shadow-xs"
            >
              Skip →
            </button>
          </div>

          {/* Safety button */}
          <button
            onClick={() => setPhase("safety")}
            className="w-full py-3 rounded-2xl text-sm font-medium text-amber-600 bg-amber-50 border border-amber-100 hover:bg-amber-100 transition cursor-pointer"
          >
            ⚠ Something Feels Wrong
          </button>

          {/* Primary CTA */}
          <button
            onClick={handleCompleteSet}
            className="w-full bg-[var(--primary)] text-white font-semibold py-4 rounded-2xl text-base hover:opacity-90 transition cursor-pointer shadow-md"
          >
            {totalSets > 1
              ? isLastSet
                ? isLastEx ? "Complete Workout ✓" : "Done — Next Exercise"
                : `Complete Set ${setNum}`
              : isLastEx
              ? "Complete Workout ✓"
              : "Next Exercise →"}
          </button>
        </div>
      </div>
    </div>
  );
}
