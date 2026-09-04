import React, { useState } from "react";
import { mockTodayWorkout } from "../../../data/physicalWellnessMockData.js";

export default function TodayWorkoutPage({ onStartSession, onBack }) {
  const [activeSection, setActiveSection] = useState("warmup");
  const w = mockTodayWorkout;

  const sections = [
    { id: "warmup", label: `Warm-Up (${w.warmUp.length})`, exercises: w.warmUp },
    { id: "main", label: `Main Workout (${w.mainWorkout.length})`, exercises: w.mainWorkout },
    { id: "cooldown", label: `Cool-Down (${w.coolDown.length})`, exercises: w.coolDown },
  ];

  const currentSectionObj = sections.find(s => s.id === activeSection);
  const activeExercises = currentSectionObj ? currentSectionObj.exercises : [];

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
            { label: `${w.exerciseCount} exercises` },
          ].map(tag => (
            <span key={tag.label} className="flex items-center gap-1.5 text-xs font-medium bg-[var(--card)] border border-[var(--border)] px-3 py-1.5 rounded-full text-[var(--foreground)] shadow-xs">
              {tag.label}
            </span>
          ))}
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex bg-[var(--muted)] rounded-xl p-1 mb-5">
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${activeSection === s.id ? "bg-white text-[var(--foreground)] shadow-sm" : "text-[var(--muted-foreground)]"}`}
          >
            {s.id === "warmup" ? "Warm-Up" : s.id === "main" ? "Main" : "Cool-Down"}
          </button>
        ))}
      </div>

      {/* Exercise list */}
      <div className="space-y-3.5 mb-8">
        {activeExercises.map((ex, i) => (
          <div key={ex.id} className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-xs hover:border-[var(--accent)] transition-all">
            <div className="flex items-start gap-3.5 p-4">
              {/* Exercise GIF Thumbnail in perfect orientation */}
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
                  <h3 className="text-sm font-bold text-[var(--foreground)] truncate">{ex.name}</h3>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {ex.sets && ex.sets > 1 && (
                      <span className="text-[10px] font-semibold text-[var(--foreground)] bg-[var(--muted)] px-2 py-0.5 rounded-md">
                        {ex.sets} sets
                      </span>
                    )}
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                      ⏱ {ex.reps || ex.duration}
                    </span>
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
        ))}
      </div>

      {/* Start button — sticky on mobile */}
      <div className="sticky bottom-4 lg:static">
        <button
          onClick={onStartSession}
          className="w-full bg-[var(--primary)] text-white font-semibold py-4 rounded-2xl text-base hover:opacity-90 transition shadow-lg cursor-pointer"
        >
          Start Workout
        </button>
      </div>
    </div>
  );
}
