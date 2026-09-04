/**
 * pages/patient/PhysicalHealth.jsx
 * Physical Wellness master state machine for Healthcare+.
 *
 * Real-time, zero-mock-data architecture:
 * - Check-in history stored in localStorage (keyed by date)
 * - Streak computed from consecutive daily check-ins
 * - All pages receive live state via props — no module-level mock data
 */

import React, { useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import PWLayout from "../../components/physicalWellness/PWLayout.jsx";
import "../../components/physicalWellness/physicalWellness.css";

import EntryPage from "./physicalWellness/EntryPage.jsx";
import OnboardingPage from "./physicalWellness/OnboardingPage.jsx";
import PlanGenerationPage from "./physicalWellness/PlanGenerationPage.jsx";
import PlanPreviewPage from "./physicalWellness/PlanPreviewPage.jsx";
import DashboardPage from "./physicalWellness/DashboardPage.jsx";
import CheckInPage from "./physicalWellness/CheckInPage.jsx";
import ReadinessResultPage from "./physicalWellness/ReadinessResultPage.jsx";
import TodayWorkoutPage from "./physicalWellness/TodayWorkoutPage.jsx";
import WorkoutSessionPage from "./physicalWellness/WorkoutSessionPage.jsx";
import PostWorkoutPage from "./physicalWellness/PostWorkoutPage.jsx";
import HabitsPage from "./physicalWellness/HabitsPage.jsx";
import ProgressPage from "./physicalWellness/ProgressPage.jsx";
import WeeklyReviewPage from "./physicalWellness/WeeklyReviewPage.jsx";
import WeeklyPlanPage from "./physicalWellness/WeeklyPlanPage.jsx";
import AssistantPage from "./physicalWellness/AssistantPage.jsx";
import SettingsPage from "./physicalWellness/SettingsPage.jsx";
import WaveformBackground from "../../components/physicalWellness/WaveformBackground.jsx";
import { ensureLivePhysicalStreakData } from "../../data/physicalWellnessMockData.js";

// ─── Storage keys ───────────────────────────────────────────────────
const SK_ONBOARDED   = "pw_onboarded_v2";
const SK_PROFILE     = "pw_profile_v2";      // onboarding data
const SK_CHECKINS    = "pw_checkins_v2";     // array of { date, scores, result, avgReadiness }
const SK_WORKOUTS    = "pw_workouts_v2";     // array of { date, completed, feedback }
const SK_HABITS_DEF  = "pw_habit_defs_v2";  // user-defined habits [{ id, name, emoji, createdAt }]
const SK_HABIT_LOGS  = "pw_habit_logs_v2";  // { "2026-09-01": [habitId, ...] }

// ─── Helpers ────────────────────────────────────────────────────────
export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function readJson(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function writeJson(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

/** Compute avgReadiness out of 10 from raw 1–5 scores */
export function computeAvgReadiness(scores) {
  // energy(1-5) + sleep(1-5) + (6-soreness)(1-5) + (6-pain)(1-5) + motivation(1-5)
  // Inverted soreness & pain so higher = better readiness
  const { energy = 0, sleep = 0, soreness = 3, pain = 3, motivation = 0 } = scores;
  const raw = (energy + sleep + (6 - soreness) + (6 - pain) + motivation) / 5;
  // raw is 1–5, scale to 1–10
  return Math.round(((raw - 1) / 4) * 9 + 1);
}

/** Compute readiness result label */
export function computeResult(scores) {
  const r = computeAvgReadiness(scores);
  if (r >= 8) return "ready";
  if (r >= 5) return "adjusted";
  return "recovery";
}

/** Compute consecutive-day streak from checkin history (up to last 4 days) */
export function computeStreak(checkins) {
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 4; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().slice(0, 10);
    if (checkins.find(c => c.date === ds)) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

/** Get last 4 calendar days (oldest→newest) with their check-in data */
export function getLast4Days(checkins) {
  return Array.from({ length: 4 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (3 - i));
    const date = d.toISOString().slice(0, 10);
    const entry = checkins.find(c => c.date === date) || null;
    return {
      date,
      dayLabel: d.toLocaleDateString("en-US", { weekday: "short" }),
      dateNum: d.getDate(),
      isToday: i === 3,
      entry,
    };
  });
}

const NAV_PAGES = ["dashboard", "weekly-plan", "habits", "progress", "assistant"];

// ─── Main Component ─────────────────────────────────────────────────
export default function PhysicalHealth() {
  const [searchParams, setSearchParams] = useSearchParams();

  // ── Persisted profile (from onboarding) ──
  const [profile, setProfile] = useState(() => readJson(SK_PROFILE, null));
  const [isFirstTime, setIsFirstTime] = useState(() => localStorage.getItem(SK_ONBOARDED) !== "true");

  // ── Page routing ──
  const [page, setPage] = useState(() => {
    const req = searchParams.get("page");
    if (req) return req;
    return localStorage.getItem(SK_ONBOARDED) === "true" ? "dashboard" : "entry";
  });

  const go = useCallback((p) => {
    setPage(p);
    setSearchParams(["entry", "dashboard"].includes(p) ? {} : { page: p });
  }, [setSearchParams]);

  // ── Check-in history ──
  const [checkins, setCheckins] = useState(() => {
    ensureLivePhysicalStreakData();
    return readJson(SK_CHECKINS, []);
  });

  const saveCheckin = useCallback((scores) => {
    const date = todayStr();
    const avgReadiness = computeAvgReadiness(scores);
    const result = computeResult(scores);
    const entry = { date, scores, avgReadiness, result, ts: Date.now() };
    setCheckins(prev => {
      const next = [...prev.filter(c => c.date !== date), entry];
      writeJson(SK_CHECKINS, next);
      window.dispatchEvent(new CustomEvent('pw-checkin-updated'));
      return next;
    });
    return entry;
  }, []);

  // ── Workout history ──
  const [workouts, setWorkouts] = useState(() => readJson(SK_WORKOUTS, []));

  const saveWorkout = useCallback((feedback) => {
    const date = todayStr();
    const entry = { date, completed: true, feedback, ts: Date.now() };
    setWorkouts(prev => {
      const next = [...prev.filter(w => w.date !== date), entry];
      writeJson(SK_WORKOUTS, next);
      window.dispatchEvent(new CustomEvent('pw-checkin-updated'));
      return next;
    });
  }, []);

  // ── Derived values passed to pages ──
  const streak = computeStreak(checkins);
  const last4  = getLast4Days(checkins);
  const todayCheckin = checkins.find(c => c.date === todayStr()) || null;

  const showLayout = NAV_PAGES.includes(page);

  // ─── Page rendering ───────────────────────────────────────────────
  const content = (() => {
    switch (page) {
      case "entry":
        return (
          <EntryPage
            isFirstTime={isFirstTime}
            profile={profile}
            streak={streak}
            todayCheckin={todayCheckin}
            onGetStarted={() => go("onboarding")}
            onStartCheckIn={() => go("checkin")}
            onViewPlan={() => go("weekly-plan")}
            onViewProgress={() => go("progress")}
          />
        );

      case "onboarding":
        return (
          <OnboardingPage
            onComplete={(data) => {
              setProfile(data);
              writeJson(SK_PROFILE, data);
              go("plan-gen");
            }}
          />
        );

      case "plan-gen":
        return <PlanGenerationPage onComplete={() => go("plan-preview")} />;

      case "plan-preview":
        return (
          <PlanPreviewPage
            profile={profile}
            onStart={() => {
              setIsFirstTime(false);
              localStorage.setItem(SK_ONBOARDED, "true");
              go("dashboard");
            }}
          />
        );

      case "dashboard":
        return (
          <DashboardPage
            profile={profile}
            checkins={checkins}
            todayCheckin={todayCheckin}
            streak={streak}
            last4={last4}
            workouts={workouts}
            onStartCheckIn={() => go("checkin")}
            onViewWorkout={() => go("today-workout")}
            onViewPlan={() => go("weekly-plan")}
            onViewProgress={() => go("progress")}
          />
        );

      case "checkin":
        return (
          <CheckInPage
            onComplete={(scores) => {
              saveCheckin(scores);
              go("readiness");
            }}
            onBack={() => go(isFirstTime ? "entry" : "dashboard")}
          />
        );

      case "readiness":
        return (
          <ReadinessResultPage
            todayCheckin={todayCheckin}
            onViewWorkout={() => go("today-workout")}
            onGoToDashboard={() => go("dashboard")}
          />
        );

      case "today-workout":
        return (
          <TodayWorkoutPage
            profile={profile}
            onStartSession={() => go("workout-session")}
            onBack={() => go("dashboard")}
          />
        );

      case "workout-session":
        return (
          <WorkoutSessionPage
            profile={profile}
            onComplete={() => go("post-workout")}
            onBack={() => go("today-workout")}
          />
        );

      case "post-workout":
        return (
          <PostWorkoutPage
            onSave={(feedback) => { saveWorkout(feedback); go("dashboard"); }}
            onGoToDashboard={() => go("dashboard")}
          />
        );

      case "habits":
        return (
          <HabitsPage
            streak={streak}
            last4={last4}
            checkins={checkins}
          />
        );

      case "progress":
        return (
          <ProgressPage
            checkins={checkins}
            workouts={workouts}
            streak={streak}
            profile={profile}
          />
        );

      case "weekly-review":
        return (
          <WeeklyReviewPage
            checkins={checkins}
            workouts={workouts}
            onBack={() => go("weekly-plan")}
            onViewNextWeek={() => go("weekly-plan")}
          />
        );

      case "weekly-plan":
        return (
          <WeeklyPlanPage
            profile={profile}
            workouts={workouts}
            onStartWorkout={() => go("today-workout")}
            onViewReview={() => go("weekly-review")}
          />
        );

      case "assistant":
        return (
          <AssistantPage
            profile={profile}
            checkins={checkins}
            streak={streak}
            workouts={workouts}
            todayCheckin={todayCheckin}
          />
        );

      case "settings":
        return <SettingsPage onBack={() => go("dashboard")} />;

      default:
        return (
          <DashboardPage
            profile={profile}
            checkins={checkins}
            todayCheckin={todayCheckin}
            streak={streak}
            last4={last4}
            workouts={workouts}
            onStartCheckIn={() => go("checkin")}
            onViewWorkout={() => go("today-workout")}
            onViewPlan={() => go("weekly-plan")}
            onViewProgress={() => go("progress")}
          />
        );
    }
  })();

  return (
    <div className="pw-root min-h-screen relative bg-[#f8faf9]">
      {/* ── Fullscreen Biometric Waveform Background across all pages ── */}
      <WaveformBackground />

      {/* ── Content Viewport ── */}
      <div className="relative z-10 w-full h-full min-h-screen bg-transparent">
        {showLayout ? (
          <PWLayout currentPage={page} navigate={go} streak={streak}>
            {content}
          </PWLayout>
        ) : (
          <div className="h-screen overflow-y-auto bg-transparent">{content}</div>
        )}
      </div>
    </div>
  );
}

// ─── Export storage keys for use by child pages ──────────────────────
export { SK_HABITS_DEF, SK_HABIT_LOGS };
