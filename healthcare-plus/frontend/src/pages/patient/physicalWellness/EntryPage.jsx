import React from "react";
import { mockWeeklyPlan } from "../../../data/physicalWellnessMockData.js";

export default function EntryPage({
  isFirstTime,
  user,
  profile,
  streak = 0,
  onGetStarted,
  onStartCheckIn,
  onViewPlan,
  onViewProgress,
}) {
  if (isFirstTime) {
    return (
      <div className="min-h-full flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[var(--primary)] flex items-center justify-center mb-8 shadow-md">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </div>
          <p className="text-sm font-semibold text-[var(--accent)] tracking-widest uppercase mb-4">Physical Wellness</p>
          <h1 className="font-display text-4xl md:text-5xl text-[var(--foreground)] leading-tight mb-6 max-w-sm">
            Your wellness journey starts here
          </h1>
          <p className="text-[var(--muted-foreground)] text-base max-w-sm leading-relaxed mb-10">
            Build a personalized routine around your goals, lifestyle, and how you feel each day — safely and sustainably.
          </p>
          <button
            onClick={onGetStarted}
            className="w-full max-w-xs bg-[var(--primary)] text-white font-semibold py-4 px-8 rounded-2xl text-base hover:opacity-90 transition-opacity cursor-pointer shadow-md"
          >
            Get Started →
          </button>
          <div className="mt-10 grid grid-cols-3 gap-6 max-w-sm w-full">
            {[
              { label: "Personalized", desc: "Plans tailored to you" },
              { label: "Adaptive", desc: "Adjusts to your daily readiness" },
              { label: "Safe", desc: "Healthcare-first approach" },
            ].map(item => (
              <div key={item.label} className="text-center">
                <p className="text-xs font-semibold text-[var(--foreground)] mb-1">{item.label}</p>
                <p className="text-xs text-[var(--muted-foreground)] leading-snug">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const today = mockWeeklyPlan.find(d => d.status === "today");
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  const name =
    profile?.firstName ||
    profile?.name ||
    user?.fullName?.split(' ')[0] ||
    user?.name?.split(' ')[0] ||
    'there';

  const currentStreak = streak || 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 lg:px-8 lg:py-12">
      {/* Greeting */}
      <div className="mb-8">
        <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide mb-1">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
        </p>
        <h1 className="font-display text-3xl lg:text-4xl text-[var(--foreground)] mb-1">{greeting}, {name}</h1>
        <p className="text-[var(--muted-foreground)] text-sm">
          {currentStreak > 0 ? `${currentStreak}-day streak 🔥 Keep the momentum!` : "Start your streak with today's check-in!"}
        </p>
      </div>

      {/* Streak + weekly progress */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 shadow-xs">
          <p className="text-xs text-[var(--muted-foreground)] mb-1">Current Streak</p>
          <p className="text-3xl font-bold text-[var(--foreground)]">{currentStreak}</p>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">days</p>
        </div>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 shadow-xs">
          <p className="text-xs text-[var(--muted-foreground)] mb-1">This Week</p>
          <p className="text-3xl font-bold text-[var(--foreground)]">
            {mockWeeklyPlan.filter(d => d.status === "completed").length}
            <span className="text-lg font-normal text-[var(--muted-foreground)]">/{mockWeeklyPlan.filter(d => d.type === "workout").length || 3}</span>
          </p>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">workouts done</p>
        </div>
      </div>

      {/* Today's workout preview */}
      <div className="bg-[var(--primary)] rounded-2xl p-5 mb-6 text-white shadow-md">
        <p className="text-xs text-white/60 uppercase tracking-wider mb-2">Today's Workout</p>
        <h2 className="text-xl font-semibold mb-1">{today?.focus || "Daily Movement"}</h2>
        <div className="flex items-center gap-4 mb-5 text-sm text-white/70">
          <span>{today?.duration || 30} min</span>
          <span>·</span>
          <span>{today?.difficulty || "Moderate"}</span>
        </div>
        <button
          onClick={onStartCheckIn}
          className="w-full bg-white text-[var(--primary)] font-semibold py-3 rounded-xl text-sm hover:bg-white/90 transition cursor-pointer shadow-xs"
        >
          Start Today's Check-In
        </button>
      </div>

      {/* Secondary actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onViewPlan}
          className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 text-left hover:border-[var(--accent)] transition cursor-pointer shadow-xs"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-[var(--accent)] mb-2" strokeLinecap="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <p className="text-sm font-semibold text-[var(--foreground)]">View My Plan</p>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Weekly schedule</p>
        </button>
        <button
          onClick={onViewProgress}
          className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 text-left hover:border-[var(--accent)] transition cursor-pointer shadow-xs"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-[var(--accent)] mb-2" strokeLinecap="round">
            <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
          <p className="text-sm font-semibold text-[var(--foreground)]">View Progress</p>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Track your journey</p>
        </button>
      </div>
    </div>
  );
}
