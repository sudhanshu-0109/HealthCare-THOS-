import React from "react";
import { mockWeeklyPlan } from "../../../data/physicalWellnessMockData.js";

const statusColors = {
  workout: "bg-[var(--primary)] text-white",
  recovery: "bg-[var(--secondary)] text-[var(--primary)]",
  rest: "bg-[var(--muted)] text-[var(--muted-foreground)]",
  optional: "bg-[var(--secondary)] text-[var(--accent)]",
};

export default function PlanPreviewPage({ onStart }) {
  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="mb-2">
        <div className="inline-flex items-center gap-1.5 bg-[var(--secondary)] text-[var(--accent)] text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Your plan is ready
        </div>
        <h1 className="font-display text-3xl text-[var(--foreground)] mb-1">Home Strength & Stamina</h1>
        <p className="text-[var(--muted-foreground)] text-sm">Week 1 of your personalized wellness journey</p>
      </div>

      {/* Plan stats */}
      <div className="grid grid-cols-2 gap-3 my-6">
        {[
          { label: "Primary Goal", value: "General Fitness" },
          { label: "Fitness Level", value: "Intermediate" },
          { label: "Weekly Workouts", value: "3 sessions" },
          { label: "Session Duration", value: "~30 min" },
        ].map(stat => (
          <div key={stat.label} className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 shadow-xs">
            <p className="text-xs text-[var(--muted-foreground)] mb-1">{stat.label}</p>
            <p className="text-sm font-semibold text-[var(--foreground)]">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Weekly schedule */}
      <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">Your Week</p>
      <div className="space-y-2 mb-8">
        {mockWeeklyPlan.map((day) => (
          <div key={day.day} className={`flex items-center justify-between px-4 py-3.5 rounded-2xl border ${day.status === "today" ? "border-[var(--primary)] bg-[var(--secondary)]" : "border-[var(--border)] bg-[var(--card)]"} shadow-xs`}>
            <div className="flex items-center gap-3">
              <div className="w-8 text-center">
                <p className={`text-xs font-bold ${day.status === "today" ? "text-[var(--primary)]" : "text-[var(--muted-foreground)]"}`}>{day.day}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--foreground)]">{day.focus}</p>
                {day.duration > 0 && <p className="text-xs text-[var(--muted-foreground)]">{day.duration} min · {day.difficulty}</p>}
              </div>
            </div>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[day.type] || "bg-[var(--muted)] text-[var(--muted-foreground)]"}`}>
              {day.type === "workout" ? "Workout" : day.type === "recovery" ? "Recovery" : day.type === "optional" ? "Optional" : "Rest"}
            </span>
          </div>
        ))}
      </div>

      <button
        onClick={onStart}
        className="w-full bg-[var(--primary)] text-white font-semibold py-4 rounded-2xl text-base hover:opacity-90 transition cursor-pointer shadow-md"
      >
        Start My Journey
      </button>
    </div>
  );
}
