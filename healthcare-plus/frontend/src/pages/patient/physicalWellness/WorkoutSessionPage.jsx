import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  mockTodayWorkout,
  getTodayWorkoutProgress,
  saveWorkoutActivePosition,
  getWorkoutResumePosition,
  markExerciseSetComplete,
  resetExerciseProgress,
  resetFullWorkoutProgress,
  playCompletionChime,
} from "../../../data/physicalWellnessMockData.js";

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
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  core: {
    bg: "from-violet-500 to-indigo-600",
    label: "Core",
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" />
      </svg>
    ),
  },
  stretch: {
    bg: "from-teal-400 to-cyan-500",
    label: "Flexibility",
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
        <path d="M12 2a7 7 0 017 7c0 5-7 13-7 13S5 14 5 9a7 7 0 017-7z" />
      </svg>
    ),
  },
  strength: {
    bg: "from-[#1A3C34] to-[#2D6A5A]",
    label: "Strength",
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
        <path d="M6 4v16M18 4v16M2 9h4M18 9h4M2 15h4M18 15h4M6 9h12M6 15h12" />
      </svg>
    ),
  },
};

// Parse duration string like "30s", "60s", "45s", "30s each side" to number of seconds
function parseDurationSecs(dur) {
  if (!dur) return null;
  const match = String(dur).match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

// Format seconds to mm:ss or just ss
function fmt(s) {
  if (s >= 60) return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  return `${s}s`;
}

// ----- REST SCREEN WITH SET/EXERCISE PROGRESS AND LIVE COUNTDOWN -----
function RestScreen({
  restSecs = 20,
  title = "Set Complete!",
  nextLabel = "Next Set",
  setNum = 1,
  totalSets = 1,
  isBetweenExercises = false,
  onDone,
  onAdd10s,
  onRedoSet,
  onBack,
}) {
  const [remaining, setRemaining] = useState(restSecs);

  useEffect(() => {
    if (remaining <= 0) {
      onDone();
      return;
    }
    const t = setTimeout(() => setRemaining(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, onDone]);

  const pct = Math.min(100, Math.max(0, ((restSecs - remaining) / restSecs) * 100));

  return (
    <div className="min-h-full flex flex-col items-center justify-center px-6 py-8 text-center max-w-md mx-auto animate-fadeIn">
      {/* Set completion badge — Satisfying visual confirmation */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full text-xs font-bold mb-3 shadow-2xs">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>{title}</span>
      </div>

      <h2 className="font-display text-2xl font-bold text-[var(--foreground)] mb-1">
        Rest Period
      </h2>

      {/* Prominent live countdown phrase */}
      <div className="my-4 bg-emerald-50/80 border border-emerald-200/80 px-5 py-2.5 rounded-2xl inline-block shadow-2xs">
        <p className="text-sm font-semibold text-emerald-900">
          Next {isBetweenExercises ? "exercise" : "set"} starts in{" "}
          <span className="font-bold text-lg text-emerald-800 tabular-nums">{remaining}s</span>
        </p>
      </div>

      {/* Circular Countdown Ring */}
      <div className="relative w-38 h-38 mb-6">
        <svg viewBox="0 0 128 128" className="w-38 h-38 -rotate-90">
          <circle cx="64" cy="64" r="54" fill="none" stroke="var(--muted)" strokeWidth="8" />
          <circle
            cx="64"
            cy="64"
            r="54"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="8"
            strokeDasharray={`${2 * Math.PI * 54}`}
            strokeDashoffset={`${2 * Math.PI * 54 * (1 - pct / 100)}`}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-extrabold text-[var(--foreground)] tabular-nums">{remaining}</span>
          <span className="text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">seconds</span>
        </div>
      </div>

      {/* Up Next Preview Box */}
      {nextLabel && (
        <div className="w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl p-3.5 mb-6 text-left shadow-xs flex items-center justify-between">
          <div className="min-w-0 flex-1 pr-2">
            <p className="text-[10px] text-[var(--muted-foreground)] uppercase font-bold tracking-wider mb-0.5">
              {isBetweenExercises ? "Up Next: Exercise" : "Up Next"}
            </p>
            <p className="text-sm font-bold text-[var(--foreground)] truncate">{nextLabel}</p>
          </div>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg shrink-0">
            Get Ready ⚡
          </span>
        </div>
      )}

      {/* Action buttons */}
      <div className="w-full space-y-2.5">
        <button
          onClick={onDone}
          className="w-full py-3.5 bg-[var(--primary)] text-white font-semibold rounded-2xl text-sm hover:opacity-90 transition cursor-pointer shadow-md"
        >
          Start {isBetweenExercises ? "Next Exercise" : `Set ${setNum < totalSets ? setNum + 1 : setNum}`} Now (Skip Rest)
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setRemaining(r => r + 10)}
            className="py-2.5 bg-[var(--card)] border border-[var(--border)] rounded-xl text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--muted)] transition cursor-pointer"
          >
            +10s More Rest
          </button>
          <button
            onClick={onRedoSet}
            className="py-2.5 bg-[var(--card)] border border-[var(--border)] rounded-xl text-xs font-semibold text-amber-700 hover:bg-amber-50 hover:border-amber-200 transition cursor-pointer"
          >
            ↺ Redo {isBetweenExercises ? "Exercise" : `Set ${setNum}`}
          </button>
        </div>

        {onBack && (
          <button
            onClick={onBack}
            className="w-full py-2.5 bg-white border border-[var(--border)] rounded-xl text-xs font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition cursor-pointer"
          >
            ← Pause & Return to Plan
          </button>
        )}
      </div>
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
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
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
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
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

// ----- MAIN WORKOUT SESSION PAGE -----
export default function WorkoutSessionPage({
  workout: workoutProp,
  initialExIndex,
  initialSetNum,
  onComplete,
  onBack,
}) {
  const w = workoutProp || mockTodayWorkout;
  const allExercises = useMemo(() => [
    ...(w.warmUp || []),
    ...(w.mainWorkout || []),
    ...(w.coolDown || []),
  ], [w]);

  const resumePos = useMemo(() => {
    if (typeof initialExIndex === "number" && initialExIndex >= 0 && initialExIndex < allExercises.length) {
      return {
        exIndex: initialExIndex,
        setNum: typeof initialSetNum === "number" ? initialSetNum : 1,
      };
    }
    return getWorkoutResumePosition(allExercises);
  }, [allExercises, initialExIndex, initialSetNum]);

  const [exIdx, setExIdx] = useState(() => resumePos.exIndex);
  const [setNum, setSetNum] = useState(() => resumePos.setNum);
  const [phase, setPhase] = useState("exercise"); // "exercise" | "rest" | "safety"
  const [elapsed, setElapsed] = useState(0);
  const [countdown, setCountdown] = useState(null);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [isSetCompleted, setIsSetCompleted] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Sync state if initial props change
  useEffect(() => {
    if (typeof initialExIndex === "number" && initialExIndex >= 0 && initialExIndex < allExercises.length) {
      setExIdx(initialExIndex);
      setSetNum(typeof initialSetNum === "number" ? initialSetNum : 1);
      setPhase("exercise");
    }
  }, [initialExIndex, initialSetNum, allExercises.length]);

  const currentPosRef = useRef({ exIdx, setNum });
  currentPosRef.current = { exIdx, setNum };

  // Persist current active position whenever exIdx or setNum changes, and upon unmount
  useEffect(() => {
    saveWorkoutActivePosition(exIdx, setNum);
  }, [exIdx, setNum]);

  useEffect(() => {
    return () => {
      if (currentPosRef.current) {
        saveWorkoutActivePosition(currentPosRef.current.exIdx, currentPosRef.current.setNum);
      }
    };
  }, []);

  const [restInfo, setRestInfo] = useState({
    restSecs: 20,
    title: "Set Complete!",
    nextLabel: "",
    setNum: 1,
    totalSets: 1,
    isBetweenExercises: false,
  });

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const ex = allExercises[Math.min(exIdx, allExercises.length - 1)];
  const total = allExercises.length;
  const totalSets = ex?.sets || 1;
  const durSecs = parseDurationSecs(ex?.duration);
  const isTimed = !!durSecs;
  const exType = getExerciseIcon(ex?.description || "");
  const typeConfig = exerciseTypeConfig[exType];

  // Helper toast notification
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Global elapsed workout timer (runs only during active exercise)
  useEffect(() => {
    if (phase !== "exercise") return;
    const t = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  // Per-exercise countdown initialization when exercise/set changes
  useEffect(() => {
    if (phase !== "exercise" || !isTimed) {
      setIsCountingDown(false);
      return;
    }
    setCountdown(durSecs);
    setIsSetCompleted(false);
    setIsCountingDown(true);
  }, [exIdx, setNum, isTimed, durSecs, phase]);

  // Step 2 & 3: When timer reaches 0, FIRST show ZERO + COMPLETED, THEN automatically open REST PAGE!
  const triggerCompletionSequence = useCallback(() => {
    // Stop countdown and mark completed state visually
    setIsCountingDown(false);
    setIsSetCompleted(true);
    setCountdown(0);

    // Auditory reward chime
    playCompletionChime();

    // Mark completed set in storage
    const currentTotalSets = ex?.sets || 1;
    markExerciseSetComplete(ex.id, setNum, currentTotalSets);

    const isCurrentLastSet = setNum >= currentTotalSets;
    const isCurrentLastEx = exIdx >= allExercises.length - 1;

    // Wait 1.4 seconds showing "0s" and "COMPLETED!" so user sees and feels the accomplishment
    const restTimer = setTimeout(() => {
      setIsSetCompleted(false);

      if (!isCurrentLastSet) {
        // More sets remaining in this exercise -> Auto show rest screen
        const nextUpcomingSet = setNum + 1;
        saveWorkoutActivePosition(exIdx, nextUpcomingSet);
        const restDuration = parseDurationSecs(ex?.rest) || 20;
        setRestInfo({
          restSecs: restDuration,
          title: `Set ${setNum} of ${currentTotalSets} Complete! (${setNum}/${currentTotalSets}) ✓`,
          nextLabel: `Set ${nextUpcomingSet} of ${currentTotalSets} • ${ex.name}`,
          setNum,
          totalSets: currentTotalSets,
          isBetweenExercises: false,
        });
        setPhase("rest");
      } else {
        // All sets for this exercise completed
        markExerciseSetComplete(ex.id, currentTotalSets, currentTotalSets);

        if (isCurrentLastEx) {
          // Last exercise of entire workout!
          onCompleteRef.current?.();
        } else {
          // Auto show rest screen before next exercise
          saveWorkoutActivePosition(exIdx + 1, 1);
          const restDuration = parseDurationSecs(ex?.rest) || 20;
          const nextEx = allExercises[exIdx + 1];
          setRestInfo({
            restSecs: restDuration,
            title: `${ex.name} Complete! (${currentTotalSets}/${currentTotalSets} Sets Done) 🎉`,
            nextLabel: `${nextEx?.name} • ${nextEx?.duration || nextEx?.reps || "Target"}`,
            setNum,
            totalSets: currentTotalSets,
            isBetweenExercises: true,
          });
          setPhase("rest");
        }
      }
    }, 1400);

    return () => clearTimeout(restTimer);
  }, [ex, setNum, exIdx, allExercises]);

  // Step 1: Countdown ticker — counts all the way down to 0, NEVER stopping before 0!
  useEffect(() => {
    if (phase !== "exercise" || !isCountingDown || countdown === null || isSetCompleted) return;

    if (countdown === 0) {
      // Reached zero! Trigger completion sequence
      triggerCompletionSequence();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(prev => {
        if (prev === null) return null;
        const nextVal = prev - 1;
        return nextVal >= 0 ? nextVal : 0;
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [phase, isCountingDown, countdown, isSetCompleted, triggerCompletionSequence]);

  // Handle rest completion: automatically starts the next set or exercise
  const handleRestDone = useCallback(() => {
    setIsSetCompleted(false);
    if (!restInfo.isBetweenExercises) {
      // Move to next set of same exercise
      const nextSet = setNum + 1;
      setSetNum(nextSet);
      saveWorkoutActivePosition(exIdx, nextSet);
      setCountdown(durSecs);
      setIsCountingDown(isTimed);
      setPhase("exercise");
    } else {
      // Move to next exercise
      const nextIdx = exIdx + 1;
      if (nextIdx < allExercises.length) {
        setExIdx(nextIdx);
        setSetNum(1);
        saveWorkoutActivePosition(nextIdx, 1);
        const nextEx = allExercises[nextIdx];
        const nextDur = parseDurationSecs(nextEx?.duration);
        setCountdown(nextDur);
        setIsCountingDown(!!nextDur);
        setPhase("exercise");
      } else {
        onCompleteRef.current?.();
      }
    }
  }, [restInfo, setNum, durSecs, isTimed, exIdx, allExercises]);

  // Back navigation handler: persist position and go back to plan
  const handleBack = useCallback(() => {
    saveWorkoutActivePosition(exIdx, setNum);
    onBack?.();
  }, [exIdx, setNum, onBack]);

  // Reset controls
  const handleResetSet = () => {
    setIsSetCompleted(false);
    setCountdown(durSecs);
    setIsCountingDown(isTimed);
    saveWorkoutActivePosition(exIdx, setNum);
    showToast(`Set ${setNum} timer reset to ${durSecs || 0}s`);
  };

  const handleResetExercise = () => {
    setIsSetCompleted(false);
    setSetNum(1);
    setCountdown(durSecs);
    setIsCountingDown(isTimed);
    resetExerciseProgress(ex.id);
    saveWorkoutActivePosition(exIdx, 1);
    showToast(`${ex.name} reset to Set 1`);
  };

  const handleRedoFromRest = () => {
    setIsSetCompleted(false);
    setCountdown(durSecs);
    setIsCountingDown(isTimed);
    setPhase("exercise");
    saveWorkoutActivePosition(exIdx, setNum);
    showToast(`Redoing Set ${setNum}`);
  };

  const handleSkipEx = () => {
    if (exIdx >= allExercises.length - 1) {
      onCompleteRef.current?.();
      return;
    }
    const nextIdx = exIdx + 1;
    setExIdx(nextIdx);
    setSetNum(1);
    saveWorkoutActivePosition(nextIdx, 1);
    setPhase("exercise");
  };

  const handlePrevEx = () => {
    if (exIdx > 0) {
      const prevIdx = exIdx - 1;
      setExIdx(prevIdx);
      setSetNum(1);
      saveWorkoutActivePosition(prevIdx, 1);
      setPhase("exercise");
    }
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
        <RestScreen
          restSecs={restInfo.restSecs || 20}
          title={restInfo.title}
          nextLabel={restInfo.nextLabel}
          setNum={restInfo.setNum}
          totalSets={restInfo.totalSets}
          isBetweenExercises={restInfo.isBetweenExercises}
          onDone={handleRestDone}
          onRedoSet={handleRedoFromRest}
          onBack={handleBack}
        />
      </div>
    );
  }

  // Countdown display: for timed exercises show countdown, else show reps
  const primaryDisplay = isTimed
    ? fmt(countdown ?? durSecs)
    : (ex.reps || "—");
  const primaryLabel = isTimed ? "Target Time" : "Reps";

  return (
    <div className="min-h-full flex flex-col max-w-lg mx-auto relative">
      {/* Toast feedback notice */}
      {toastMessage && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg backdrop-blur-md animate-fadeIn">
          {toastMessage}
        </div>
      )}

      {/* Top bar: back button + progress + elapsed */}
      <div className="px-4 pt-4 pb-2 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-xs font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition cursor-pointer bg-[var(--card)] border border-[var(--border)] px-2.5 py-1 rounded-lg shadow-2xs"
            title="Save progress and return to today's plan"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span>Back to Plan</span>
          </button>
          <span className="text-xs font-mono font-semibold text-[var(--muted-foreground)] bg-[var(--muted)] px-2.5 py-1 rounded-lg">
            ⏱ {fmt(elapsed)}
          </span>
        </div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Exercise {exIdx + 1} of {total}
          </span>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full">
            Set {setNum} of {totalSets}
          </span>
        </div>
        <div className="h-2 bg-[var(--muted)] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-400"
            style={{ width: `${((exIdx) / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Exercise visual demonstration viewport */}
      <div className="px-4 mb-2 shrink-0">
        <div className="relative w-full h-52 sm:h-60 rounded-3xl bg-white border border-[var(--border)] overflow-hidden flex items-center justify-center shadow-xs">
          {ex.gifUrl ? (
            <img
              key={ex.id || ex.name}
              src={ex.gifUrl}
              alt={ex.name}
              className="w-full h-full object-contain p-2 mix-blend-multiply select-none pointer-events-none"
              loading="eager"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                const fallback = e.currentTarget.parentElement?.querySelector('.exercise-fallback');
                if (fallback) fallback.style.display = "flex";
              }}
            />
          ) : null}
          <div
            className={`exercise-fallback w-full h-full bg-gradient-to-br ${typeConfig.bg} flex flex-col items-center justify-center p-6 text-white text-center`}
            style={{ display: ex.gifUrl ? 'none' : 'flex' }}
          >
            <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center mb-3 shadow-xs">
              {typeConfig.icon}
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/70">{typeConfig.label}</p>
          </div>

          {/* Floating badges */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span className="text-[10px] font-bold text-white bg-slate-900/75 backdrop-blur-md px-2.5 py-1 rounded-full uppercase tracking-wider shadow-2xs">
              {typeConfig.label}
            </span>
            {isTimed && (
              <span className="text-[10px] font-bold text-white bg-emerald-600/90 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1 shadow-2xs">
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

        {/* Title & Description */}
        <div className="text-center mt-2.5 mb-1">
          <h2 className="font-display text-2xl font-bold text-[var(--foreground)] leading-tight">{ex.name}</h2>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5 max-w-sm mx-auto leading-relaxed">{ex.description}</p>
        </div>
      </div>

      {/* Exercise metrics & sets */}
      <div className="px-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Set indicator pills: Satisfying visual tracking */}
          {totalSets > 1 ? (
            <div className="flex items-center justify-center gap-2 mb-3 bg-[var(--muted)]/50 py-1.5 px-3 rounded-full w-fit mx-auto">
              {Array.from({ length: totalSets }).map((_, i) => (
                <div
                  key={i}
                  className={`h-2.5 rounded-full transition-all duration-300 flex items-center justify-center text-[8px] font-bold ${
                    i < setNum - 1 || (i === setNum - 1 && isSetCompleted)
                      ? "bg-emerald-500 w-7 text-white"
                      : i === setNum - 1
                      ? "bg-[var(--foreground)] w-9 ring-2 ring-emerald-500/30"
                      : "bg-[var(--muted)] w-5"
                  }`}
                />
              ))}
              <span className="text-xs font-bold text-[var(--foreground)] ml-1">
                Set {setNum} of {totalSets} ({isSetCompleted ? setNum : setNum - 1}/{totalSets} Complete)
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-center mb-3">
              <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-0.5 rounded-full">
                1 Single Set
              </span>
            </div>
          )}

          {/* Primary metric — Countdown or Reps or COMPLETED Celebration */}
          <div className="flex items-center justify-center gap-8 mb-3 min-h-[90px]">
            {isSetCompleted ? (
              <div className="flex flex-col items-center justify-center py-2 animate-fadeIn scale-105 transition-transform">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-1 text-2xl font-extrabold shadow-xs">
                  ✓
                </div>
                <div className="text-3xl font-extrabold text-emerald-700 tracking-tight">
                  COMPLETED!
                </div>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-0.5 rounded-full mt-1">
                  {setNum < totalSets ? `Set ${setNum}/${totalSets} Done` : `All ${totalSets} Sets Finished! 🎉`}
                </span>
              </div>
            ) : (
              <>
                <div className="text-center">
                  {isTimed ? (
                    <div className={`text-6xl font-extrabold tabular-nums transition-colors ${
                      countdown !== null && countdown <= 5 && countdown > 0 && isCountingDown
                        ? "text-rose-500 scale-105"
                        : countdown === 0
                        ? "text-emerald-600"
                        : "text-[var(--foreground)]"
                    }`}>
                      {primaryDisplay}
                    </div>
                  ) : (
                    <div className="text-6xl font-extrabold text-[var(--foreground)]">{primaryDisplay}</div>
                  )}
                  <p className="text-xs text-[var(--muted-foreground)] mt-1 font-semibold uppercase tracking-wider">
                    {isTimed ? (isCountingDown ? "Timer Running" : "Paused") : primaryLabel}
                  </p>
                </div>
                {ex.rest && ex.rest !== "0s" && (
                  <div className="text-center">
                    <div className="text-3xl font-bold text-[var(--muted-foreground)]">{ex.rest}</div>
                    <p className="text-xs text-[var(--muted-foreground)] mt-1 font-semibold uppercase tracking-wider">Rest</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Instructions */}
          <p className="text-xs text-[var(--muted-foreground)] leading-relaxed text-center mb-3 max-w-xs mx-auto">
            {ex.instructions}
          </p>
        </div>

        {/* Controls & Reset Options */}
        <div className="space-y-2 mt-auto pb-4">
          {/* Reset Controls Row — Always accessible */}
          <div className="flex items-center justify-center gap-2 p-1 bg-[var(--muted)]/60 rounded-2xl">
            <button
              type="button"
              onClick={handleResetSet}
              className="flex-1 py-2 px-3 bg-white hover:bg-slate-50 border border-[var(--border)] rounded-xl text-xs font-semibold text-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              title="Reset timer for current set"
            >
              <span>↺ Reset Set</span>
            </button>
            <button
              type="button"
              onClick={handleResetExercise}
              className="flex-1 py-2 px-3 bg-white hover:bg-slate-50 border border-[var(--border)] rounded-xl text-xs font-semibold text-amber-700 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              title="Reset exercise back to Set 1"
            >
              <span>↺ Reset Full Exercise</span>
            </button>
          </div>

          {/* Navigation & Pause/Resume */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handlePrevEx}
              disabled={exIdx === 0}
              className="py-3 bg-[var(--card)] border border-[var(--border)] rounded-2xl text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--muted)] transition disabled:opacity-30 cursor-pointer shadow-xs"
            >
              ← Prev
            </button>
            <button
              onClick={() => setIsCountingDown(v => !v)}
              disabled={isSetCompleted}
              className={`py-3 rounded-2xl text-xs font-semibold transition cursor-pointer shadow-xs border ${
                isCountingDown
                  ? "bg-[var(--foreground)] text-[var(--card)] border-[var(--foreground)]"
                  : "bg-[var(--card)] border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)]"
              }`}
            >
              {isCountingDown ? "⏸ Pause" : "▶ Resume"}
            </button>
            <button
              onClick={handleSkipEx}
              className="py-3 bg-[var(--card)] border border-[var(--border)] rounded-2xl text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--muted)] transition cursor-pointer shadow-xs"
            >
              Skip →
            </button>
          </div>

          {/* Safety button */}
          <button
            onClick={() => setPhase("safety")}
            className="w-full py-2.5 rounded-2xl text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200/70 hover:bg-amber-100 transition cursor-pointer"
          >
            ⚠ Something Feels Wrong
          </button>

          {/* Primary CTA button */}
          <button
            onClick={triggerCompletionSequence}
            disabled={isSetCompleted}
            className={`w-full font-semibold py-3.5 rounded-2xl text-sm transition cursor-pointer shadow-md flex items-center justify-center gap-2 ${
              isSetCompleted
                ? "bg-emerald-600 text-white"
                : "bg-[var(--primary)] text-white hover:opacity-90"
            }`}
          >
            {isSetCompleted ? (
              <span>✓ Set {setNum} Completed! Opening Rest...</span>
            ) : isTimed ? (
              isCountingDown ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>
                    Set {setNum}/{totalSets} in progress ({countdown}s left)
                  </span>
                </>
              ) : (
                <span>Done Set {setNum} of {totalSets} ✓</span>
              )
            ) : (
              <span>Complete Set {setNum} of {totalSets} ✓</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
