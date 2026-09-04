import React from "react";
import { mockWeeklyReview } from "../../../data/physicalWellnessMockData.js";

export default function WeeklyReviewPage({ onBack, onViewNextWeek }) {
  const r = mockWeeklyReview;

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] mb-6 hover:text-[var(--foreground)] transition cursor-pointer">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        Back
      </button>

      <h1 className="font-display text-3xl text-[var(--foreground)] mb-1">Weekly Review</h1>
      <p className="text-sm text-[var(--muted-foreground)] mb-8">Aug 28 – Sep 3</p>

      {/* This week summary */}
      <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">This Week</p>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[
          { label: "Workouts Completed", value: `${r.completed}/${r.target}` },
          { label: "Completion Rate", value: `${r.completionPct}%` },
          { label: "Avg Workout Feeling", value: r.avgFeedback },
          { label: "Consistent Days", value: `${r.consistency}/7` },
          { label: "Recovery Days", value: `${r.recoveryDays} days` },
        ].map(s => (
          <div key={s.label} className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 shadow-xs">
            <p className="text-xs text-[var(--muted-foreground)] mb-1">{s.label}</p>
            <p className="text-lg font-bold text-[var(--foreground)]">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Next week plan adjustments */}
      <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">Next Week Adjustments</p>
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 mb-6 shadow-xs">
        <p className="text-sm text-[var(--muted-foreground)] mb-4">Based on this week's performance, your plan for next week remains consistent.</p>
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { label: "Duration", from: r.nextWeekAdjustments.duration.from + " min", to: r.nextWeekAdjustments.duration.to + " min", changed: r.nextWeekAdjustments.duration.from !== r.nextWeekAdjustments.duration.to },
            { label: "Intensity", from: r.nextWeekAdjustments.intensity.from, to: r.nextWeekAdjustments.intensity.to, changed: r.nextWeekAdjustments.intensity.from !== r.nextWeekAdjustments.intensity.to },
            { label: "Rest", from: r.nextWeekAdjustments.rest.from, to: r.nextWeekAdjustments.rest.to, changed: r.nextWeekAdjustments.rest.from !== r.nextWeekAdjustments.rest.to },
          ].map(adj => (
            <div key={adj.label}>
              <p className="text-xs text-[var(--muted-foreground)] mb-2">{adj.label}</p>
              <p className={`text-sm ${adj.changed ? "line-through text-[var(--muted-foreground)]" : "font-semibold text-[var(--foreground)]"}`}>{adj.from}</p>
              {adj.changed && (
                <>
                  <svg className="w-3 h-3 mx-auto my-1 text-[var(--muted-foreground)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
                  <p className="text-sm font-semibold text-[var(--accent)]">{adj.to}</p>
                </>
              )}
              {!adj.changed && <p className="text-xs text-[var(--accent)] mt-1">No change</p>}
            </div>
          ))}
        </div>
      </div>

      <button onClick={onViewNextWeek} className="w-full bg-[var(--primary)] text-white font-semibold py-4 rounded-2xl text-sm hover:opacity-90 transition cursor-pointer shadow-md">
        View Next Week's Plan
      </button>
    </div>
  );
}
