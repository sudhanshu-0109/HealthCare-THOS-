import React, { useState } from "react";
import { mockWeeklyPlan } from "../../../data/physicalWellnessMockData.js";

const statusConfig = {
  completed: { label: "Completed", cls: "text-[var(--accent)] bg-[var(--secondary)]", dotCls: "bg-[var(--accent)]" },
  today: { label: "Today", cls: "text-white bg-[var(--primary)]", dotCls: "bg-white" },
  upcoming: { label: "Upcoming", cls: "text-[var(--muted-foreground)] bg-[var(--muted)]", dotCls: "bg-[var(--muted-foreground)]" },
  rest: { label: "Rest Day", cls: "text-[var(--muted-foreground)] bg-[var(--muted)]", dotCls: "bg-[var(--muted-foreground)]" },
};

export default function WeeklyPlanPage({ onStartWorkout, onViewReview }) {
  const [expanded, setExpanded] = useState("Wed");

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 lg:px-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-[var(--foreground)]">Weekly Plan</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">Sep 1 – 7</p>
        </div>
        <button onClick={onViewReview} className="text-xs font-medium text-[var(--accent)] bg-[var(--secondary)] px-3 py-1.5 rounded-full cursor-pointer hover:bg-[var(--accent)] hover:text-white transition">
          Weekly Review
        </button>
      </div>

      {/* Desktop: horizontal calendar strip */}
      <div className="hidden lg:grid grid-cols-7 gap-2 mb-8">
        {mockWeeklyPlan.map(day => {
          const cfg = statusConfig[day.status === "rest" ? "rest" : day.status] || statusConfig.upcoming;
          return (
            <div
              key={day.day}
              onClick={() => setExpanded(expanded === day.day ? null : day.day)}
              className={`rounded-2xl p-3 text-center cursor-pointer border transition-all ${
                day.status === "today" ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-sm" : "bg-[var(--card)] border-[var(--border)] hover:border-[var(--accent)] shadow-xs"
              }`}
            >
              <p className={`text-xs font-bold mb-1 ${day.status === "today" ? "text-white/60" : "text-[var(--muted-foreground)]"}`}>{day.day}</p>
              <p className={`text-xs font-bold mb-2 ${day.status === "today" ? "text-white" : "text-[var(--foreground)]"}`}>{day.date.split(" ")[1]}</p>
              <div className={`w-2 h-2 rounded-full mx-auto ${cfg.dotCls}`} />
              <p className={`text-[10px] mt-1 ${day.status === "today" ? "text-white/70" : "text-[var(--muted-foreground)]"}`}>
                {day.type === "rest" ? "Rest" : day.type === "optional" ? "Optional" : `${day.duration}m`}
              </p>
            </div>
          );
        })}
      </div>

      {/* Mobile + expanded detail: vertical list */}
      <div className="space-y-2">
        {mockWeeklyPlan.map(day => {
          const isExpanded = expanded === day.day;
          const cfg = statusConfig[day.status === "rest" ? "rest" : day.status] || statusConfig.upcoming;
          return (
            <div
              key={day.day}
              className={`bg-[var(--card)] rounded-2xl border overflow-hidden transition-all cursor-pointer shadow-xs ${
                day.status === "today" ? "border-[var(--primary)]" : "border-[var(--border)]"
              }`}
              onClick={() => setExpanded(isExpanded ? null : day.day)}
            >
              <div className="flex items-center gap-4 px-4 py-4">
                <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0 ${day.status === "today" ? "bg-[var(--primary)] text-white shadow-xs" : "bg-[var(--muted)]"}`}>
                  <span className="text-[10px] font-bold">{day.day}</span>
                  <span className="text-xs font-bold">{day.date.split(" ")[1]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--foreground)]">{day.focus}</p>
                  {day.duration > 0 && <p className="text-xs text-[var(--muted-foreground)]">{day.duration} min · {day.difficulty}</p>}
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${cfg.cls}`}>{cfg.label}</span>
              </div>
              {isExpanded && day.type !== "rest" && (
                <div className="px-4 pb-4 border-t border-[var(--border)] pt-4">
                  <p className="text-xs text-[var(--muted-foreground)] mb-1">Focus: <span className="font-medium text-[var(--foreground)]">{day.focus}</span></p>
                  {day.duration > 0 && <p className="text-xs text-[var(--muted-foreground)] mb-3">{day.duration} min · {day.difficulty}</p>}
                  {day.status === "today" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onStartWorkout();
                      }}
                      className="w-full bg-[var(--primary)] text-white font-semibold py-3 rounded-xl text-sm hover:opacity-90 transition cursor-pointer shadow-xs"
                    >
                      Start Today's Workout →
                    </button>
                  )}
                  {day.status === "completed" && (
                    <div className="flex items-center gap-2 text-[var(--accent)]">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      <span className="text-xs font-semibold">Completed</span>
                    </div>
                  )}
                  {day.status === "upcoming" && (
                    <p className="text-xs text-[var(--muted-foreground)]">Coming up later this week.</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
