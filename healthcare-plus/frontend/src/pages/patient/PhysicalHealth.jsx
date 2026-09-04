/**
 * pages/patient/PhysicalHealth.jsx
 * Physical Wellness master state machine for Healthcare+.
 *
 * Real-time, zero-mock-data architecture:
 * - Check-in history stored in localStorage (keyed by date)
 * - Streak computed from consecutive daily check-ins
 * - All pages receive live state via props — no module-level mock data
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
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
import MondayBiometricsModal from "../../components/physicalWellness/MondayBiometricsModal.jsx";
import { ensureLivePhysicalStreakData, generatePersonalizedDailyPlan, isMondayBiometricsDue } from "../../data/physicalWellnessMockData.js";

// ─── Storage keys ───────────────────────────────────────────────────
const SK_ONBOARDED   = "pw_onboarded_v2";
const SK_PROFILE     = "pw_profile_v2";      // onboarding data
const SK_CHECKINS    = "pw_checkins_v2";     // array of { date, scores, result, avgReadiness }
const SK_WORKOUTS    = "pw_workouts_v2";     // array of { date, completed, feedback }
const SK_HABITS_DEF  = "pw_habit_defs_v2";  // user-defined habits [{ id, name, emoji, createdAt }]
const SK_HABIT_LOGS  = "pw_habit_logs_v2";  // { "2026-09-01": [habitId, ...] }

// ─── Helpers ────────────────────────────────────────────────────────
/**
 * Returns YYYY-MM-DD using LOCAL calendar date (not UTC).
 * Using toISOString().slice(0,10) is wrong for timezones east of UTC (IST = UTC+5:30)
 * because after 6:30 PM local time, toISOString returns the NEXT UTC day.
 */
export function localDateStr(date = new Date()) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Shorthand for today's local date string. */
export function todayStr() {
  return localDateStr(new Date());
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

/** Compute consecutive-day streak from checkin history (preserves streak if checked in yesterday) */
export function computeStreak(checkins = []) {
  if (!checkins || !checkins.length) return 0;
  const today = new Date();
  const hasToday = checkins.some(c => c.date === localDateStr(today));

  let streak = 0;
  // If checked in today, start counting from today (i=0). If not yet, count from yesterday (i=1).
  const startOffset = hasToday ? 0 : 1;

  for (let i = startOffset; i < 60; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const ds = localDateStr(d);
    if (checkins.some(c => c.date === ds)) {
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
    const date = localDateStr(d);
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
  const navigate = useNavigate();

  // ── Persisted profile (from onboarding) ──
  const [profile, setProfile] = useState(() => readJson(SK_PROFILE, null));
  const [isFirstTime, setIsFirstTime] = useState(() => localStorage.getItem(SK_ONBOARDED) !== "true");

  const defaultPage = localStorage.getItem(SK_ONBOARDED) === "true" ? "dashboard" : "entry";

  // ── Page routing synchronized with URL & browser history ──
  const [page, setPage] = useState(() => searchParams.get("page") || defaultPage);

  // Synchronize state on URL searchParams changes or browser Back/Forward (popstate)
  useEffect(() => {
    const urlPage = searchParams.get("page") || defaultPage;
    setPage(urlPage);
  }, [searchParams, defaultPage]);

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const urlPage = params.get("page") || defaultPage;
      setPage(urlPage);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [defaultPage]);

  const go = useCallback((p) => {
    setPage(p);
    setSearchParams(["entry", "dashboard"].includes(p) ? {} : { page: p });
  }, [setSearchParams]);

  const handleBack = useCallback((fallbackPage = "dashboard") => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      go(fallbackPage);
    }
  }, [navigate, go]);

  const [sessionTarget, setSessionTarget] = useState(null); // { exIndex, setNum }

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

  // ── Today's Personalized Plan (re-computed whenever check-in or profile changes) ──
  const todayPlan = useMemo(
    () => generatePersonalizedDailyPlan(todayCheckin, profile, todayStr()),
    [todayCheckin, profile]
  );

  // ── Biometrics Modal ──
  const [biometricsOpen, setBiometricsOpen] = useState(() => isMondayBiometricsDue());

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
            onBack={() => handleBack(isFirstTime ? "entry" : "dashboard")}
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
            workout={todayPlan}
            onStartSession={(targetExIdx, targetSet) => {
              if (typeof targetExIdx === "number") {
                setSessionTarget({ exIndex: targetExIdx, setNum: targetSet || 1 });
              } else {
                setSessionTarget(null);
              }
              go("workout-session");
            }}
            onBack={() => handleBack(isFirstTime ? "entry" : "dashboard")}
          />
        );

      case "workout-session":
        return (
          <WorkoutSessionPage
            workout={todayPlan}
            profile={profile}
            initialExIndex={sessionTarget?.exIndex}
            initialSetNum={sessionTarget?.setNum}
            onComplete={() => {
              setSessionTarget(null);
              go("post-workout");
            }}
            onBack={() => {
              setSessionTarget(null);
              handleBack("today-workout");
            }}
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
            todayCheckin={todayCheckin}
            workouts={workouts}
            onStartWorkout={() => go("today-workout")}
            onUpdateCheckIn={() => go("checkin")}
            onOpenBiometrics={() => setBiometricsOpen(true)}
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

      {/* ── Monday Biometrics Modal ── */}
      <MondayBiometricsModal
        isOpen={biometricsOpen}
        onClose={() => setBiometricsOpen(false)}
        onSaved={() => setBiometricsOpen(false)}
        isManualUpdate={!isMondayBiometricsDue()}
      />
    </div>
  );
}

// ─── Export storage keys for use by child pages ──────────────────────
export { SK_HABITS_DEF, SK_HABIT_LOGS };
