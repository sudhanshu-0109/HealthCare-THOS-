import React, { useState, useEffect } from "react";
import {
  mockTodayWorkout,
  getTodayWorkoutProgress,
  getWorkoutResumePosition,
  resetExerciseProgress,
  resetFullWorkoutProgress,
} from "../../../data/physicalWellnessMockData.js";

export default function TodayWorkoutPage({ workout: workoutProp, onStartSession, onBack }) {
  const [activeSection, setActiveSection] = useState("warmup");
  const [progress, setProgress] = useState(() => getTodayWorkoutProgress());
  const w = workoutProp || mockTodayWorkout;

  useEffect(() => {
    const handleUpdate = () => setProgress(getTodayWorkoutProgress());
    window.addEventListener("pw-workout-progress-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("pw-workout-progress-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const sections = [
    { id: "warmup", label: `Warm-Up (${w.warmUp.length})`, exercises: w.warmUp },
    { id: "main", label: `Main Workout (${w.mainWorkout.length})`, exercises: w.mainWorkout },
    { id: "cooldown", label: `Cool-Down (${w.coolDown.length})`, exercises: w.coolDown },
  ];

  const currentSectionObj = sections.find(s => s.id === activeSection);
  const activeExercises = currentSectionObj ? currentSectionObj.exercises : [];

  const allExercises = [
    ...(w.warmUp || []),
    ...(w.mainWorkout || []),
    ...(w.coolDown || []),
  ];
  const completedTotal = allExercises.filter(e => progress.completedExercises?.[e.id]?.isComplete).length;
  const totalCount = allExercises.length;
  const isAllComplete = totalCount > 0 && completedTotal >= totalCount;
  const resumePos = getWorkoutResumePosition(allExercises);

  const handleStartOrContinue = () => {
    if (isAllComplete) {
      onStartSession?.(0, 1);
    } else {
      onStartSession?.(resumePos.exIndex, resumePos.setNum);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 lg:px-8">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] mb-6 hover:text-[var(--foreground)] transition cursor-pointer">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        Back
      </button>

      {/* Header */}
      <div className="mb-6">
        <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Today's Workout</p>
        <h1 className="font-display text-3xl text-[var(--foreground)] mb-2">{w.title}</h1>
        <p className="text-[var(--muted-foreground)] text-sm mb-4">{w.focus}</p>
        <div className="flex flex-wrap gap-3">
          {[
            { label: `${w.duration} min` },
            { label: w.difficulty },
            { label: `${w.exerciseCount || totalCount} exercises` },
          ].map(tag => (
            <span key={tag.label} className="flex items-center gap-1.5 text-xs font-medium bg-[var(--card)] border border-[var(--border)] px-3 py-1.5 rounded-full text-[var(--foreground)] shadow-xs">
              {tag.label}
            </span>
          ))}
        </div>
      </div>

      {/* Workout Progress Bar (Visible when any progress made) */}
      {completedTotal > 0 && (
        <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 mb-6 shadow-xs animate-fadeIn">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-900 mb-2">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              {isAllComplete ? "All Exercises Completed! 🎉" : "Today's Plan in Progress"}
            </span>
            <span>
              {completedTotal} of {totalCount} completed ({Math.round((completedTotal / totalCount) * 100)}%)
            </span>
          </div>
          <div className="h-2.5 bg-emerald-200/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${(completedTotal / totalCount) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Section tabs */}
      <div className="flex bg-[var(--muted)] rounded-xl p-1 mb-5">
        {sections.map(s => {
          const sectionDoneCount = s.exercises.filter(e => progress.completedExercises?.[e.id]?.isComplete).length;
          return (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${activeSection === s.id ? "bg-white text-[var(--foreground)] shadow-sm" : "text-[var(--muted-foreground)]"}`}
            >
              <span>{s.id === "warmup" ? "Warm-Up" : s.id === "main" ? "Main" : "Cool-Down"}</span>
              {sectionDoneCount > 0 && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-full">
                  {sectionDoneCount}/{s.exercises.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Exercise list */}
      <div className="space-y-3.5 mb-8">
        {activeExercises.map((ex, i) => {
          const exProg = progress.completedExercises?.[ex.id];
          const isDone = Boolean(exProg?.isComplete);
          const setsDone = exProg?.completedSets || 0;
          const targetSets = ex.sets || 1;

          return (
            <div
              key={ex.id}
              className={`bg-[var(--card)] border rounded-2xl overflow-hidden shadow-xs transition-all ${
                isDone
                  ? "border-emerald-300 bg-emerald-50/15"
                  : "border-[var(--border)] hover:border-[var(--accent)]"
              }`}
            >
              <div className="flex items-start gap-3.5 p-4">
                {/* Exercise GIF Thumbnail */}
                <div className="w-18 h-18 sm:w-22 sm:h-22 rounded-xl bg-white border border-[var(--border)] overflow-hidden flex items-center justify-center shrink-0 shadow-2xs relative">
                  {ex.gifUrl ? (
                    <img
                      src={ex.gifUrl}
                      alt={ex.name}
                      className="w-full h-full object-contain p-1 mix-blend-multiply"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <span className="text-base font-bold text-[var(--muted-foreground)]">{i + 1}</span>
                  )}
                  <span className="absolute bottom-1 right-1 text-[9px] font-bold text-[var(--accent)] bg-[var(--secondary)]/90 backdrop-blur-xs px-1.5 py-0.5 rounded-md">
                    #{i + 1}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="text-sm font-bold text-[var(--foreground)] truncate flex items-center gap-1.5">
                      {ex.name}
                      {isDone && (
                        <span className="text-emerald-600 font-bold" title="Completed">
                          ✓
                        </span>
                      )}
                    </h3>

                    {/* Completion / Sets badges */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isDone ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            ✓ Completed ({targetSets}/{targetSets} sets)
                          </span>
                          <button
                            onClick={() => resetExerciseProgress(ex.id)}
                            className="text-[10px] font-semibold text-slate-500 hover:text-amber-700 bg-white border border-slate-200 px-2 py-0.5 rounded-md transition cursor-pointer"
                            title="Reset this exercise to redo it"
                          >
                            ↺ Reset
                          </button>
                        </div>
                      ) : setsDone > 0 ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                            {setsDone}/{targetSets} sets done
                          </span>
                          <button
                            onClick={() => {
                              const globalIdx = allExercises.findIndex(e => e.id === ex.id);
                              onStartSession?.(globalIdx >= 0 ? globalIdx : 0, setsDone + 1);
                            }}
                            className="text-[10px] font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 px-2 py-0.5 rounded-md transition cursor-pointer"
                            title="Resume this exercise at next set"
                          >
                            ▶ Resume Set {setsDone + 1}
                          </button>
                          <button
                            onClick={() => resetExerciseProgress(ex.id)}
                            className="text-[10px] font-semibold text-slate-500 hover:text-amber-700 bg-white border border-slate-200 px-2 py-0.5 rounded-md transition cursor-pointer"
                            title="Reset this exercise"
                          >
                            ↺ Reset
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          {targetSets > 1 && (
                            <span className="text-[10px] font-semibold text-[var(--foreground)] bg-[var(--muted)] px-2 py-0.5 rounded-md">
                              {targetSets} sets
                            </span>
                          )}
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                            ⏱ {ex.reps || ex.duration}
                          </span>
                          <button
                            onClick={() => {
                              const globalIdx = allExercises.findIndex(e => e.id === ex.id);
                              onStartSession?.(globalIdx >= 0 ? globalIdx : 0, 1);
                            }}
                            className="text-[10px] font-semibold text-slate-700 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 border border-slate-200 px-2 py-0.5 rounded-md transition cursor-pointer"
                            title="Start from this exercise"
                          >
                            ▶ Start
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)] leading-relaxed mb-2 line-clamp-2">{ex.description}</p>
                  {ex.rest && ex.rest !== "0s" && (
                    <p className="text-[10px] text-[var(--accent)] font-semibold">Rest between sets: {ex.rest}</p>
                  )}
                </div>
              </div>
              <div className="px-4 pb-3.5 pt-0">
                <p className="text-xs text-[var(--muted-foreground)] leading-relaxed border-t border-[var(--border)] pt-2.5">
                  <span className="font-semibold text-[var(--foreground)]">Form Guide: </span>
                  {ex.instructions}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Start / Continue button — sticky on mobile */}
      <div className="sticky bottom-4 lg:static space-y-2">
        <button
          onClick={handleStartOrContinue}
          className="w-full bg-[var(--primary)] text-white font-semibold py-4 rounded-2xl text-base hover:opacity-90 transition shadow-lg cursor-pointer flex items-center justify-center gap-2"
        >
          {isAllComplete ? (
            <>
              <span>✓ Workout Finished! Review / Redo Session</span>
            </>
          ) : completedTotal > 0 || (resumePos.exIndex > 0 || resumePos.setNum > 1) ? (
            <>
              <span>Continue Workout: Exercise {resumePos.exIndex + 1} of {totalCount} (Set {resumePos.setNum}) →</span>
            </>
          ) : (
            <span>Start Workout</span>
          )}
        </button>

        {completedTotal > 0 && (
          <button
            onClick={() => resetFullWorkoutProgress()}
            className="w-full py-2.5 bg-white border border-[var(--border)] rounded-xl text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
          >
            ↺ Reset All Progress for Today's Workout
          </button>
        )}
      </div>
    </div>
  );
}
