import React, { useState, useCallback, useMemo } from "react";
import { localDateStr } from "../PhysicalHealth.jsx";
import { isDemoPatient, getUserPwKey } from "../../../data/physicalWellnessMockData.js";

// ─── Storage ──────────────────────────────────────────────────────────
const BASE_SK_DEFS = "pw_habit_defs_v2";
const BASE_SK_LOGS = "pw_habit_logs_v2";

function readJson(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function writeJson(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

/** Today's local YYYY-MM-DD — safe across all timezones. */
function todayStr() { return localDateStr(new Date()); }

// Return last 7 calendar days oldest→newest
function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      date: localDateStr(d),
      label: d.toLocaleDateString("en-US", { weekday: "short" }),
      dayNum: d.getDate(),
      isToday: i === 6,
    };
  });
}

const EMOJI_OPTIONS = ["✅","🥗","💧","😴","🏃","🧘","📚","🥤","🚫","🧴","💊","🍎","🚶","🛌","🎯"];

const DEMO_HABITS = [
  { id: "h1", name: "Clean Diet", emoji: "🥗", createdAt: "2026-09-01" },
  { id: "h2", name: "8hrs Sleep", emoji: "😴", createdAt: "2026-09-01" },
  { id: "h3", name: "Hydration (2.5L)", emoji: "💧", createdAt: "2026-09-01" },
];

export default function HabitsPage({ streak, last4, checkins, user }) {
  const isDemo = isDemoPatient(user);
  const keyDefs = useMemo(() => getUserPwKey(BASE_SK_DEFS, user), [user]);
  const keyLogs = useMemo(() => getUserPwKey(BASE_SK_LOGS, user), [user]);

  // ── Habit definitions ──
  const [habits, setHabits] = useState(() => {
    const stored = readJson(keyDefs, null);
    if (stored !== null) return stored;
    if (isDemo) {
      writeJson(keyDefs, DEMO_HABITS);
      return DEMO_HABITS;
    }
    return [];
  });

  // ── Daily tick logs: { "2026-09-03": [habitId, ...] } ──
  const [logs, setLogs] = useState(() => {
    const stored = readJson(keyLogs, null);
    if (stored !== null) return stored;
    if (isDemo) {
      // Seed last 4 days for Arjun Mehta
      const demoLogs = {};
      const d = new Date();
      for (let i = 1; i <= 4; i++) {
        const past = new Date(d);
        past.setDate(past.getDate() - i);
        demoLogs[localDateStr(past)] = ["h1", "h2", "h3"];
      }
      writeJson(keyLogs, demoLogs);
      return demoLogs;
    }
    return {};
  });

  // ── Add-habit modal ──
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("✅");

  const today = todayStr();
  const days7 = getLast7Days();

  // ── Toggle a habit tick for today ──
  const toggleHabit = useCallback((habitId) => {
    setLogs(prev => {
      const todayLogs = prev[today] || [];
      const next = {
        ...prev,
        [today]: todayLogs.includes(habitId)
          ? todayLogs.filter(id => id !== habitId)
          : [...todayLogs, habitId],
      };
      writeJson(keyLogs, next);
      window.dispatchEvent(new CustomEvent('pw-checkin-updated'));
      return next;
    });
  }, [today, keyLogs]);

  // ── Add new habit ──
  const addHabit = () => {
    const name = newName.trim();
    if (!name) return;
    const habit = { id: Date.now().toString(), name, emoji: newEmoji, createdAt: today };
    setHabits(prev => {
      const next = [...prev, habit];
      writeJson(keyDefs, next);
      return next;
    });
    setNewName("");
    setNewEmoji("✅");
    setShowAdd(false);
  };

  // ── Remove habit ──
  const removeHabit = (habitId) => {
    setHabits(prev => {
      const next = prev.filter(h => h.id !== habitId);
      writeJson(keyDefs, next);
      return next;
    });
    // Also purge from all logs
    setLogs(prev => {
      const next = {};
      Object.entries(prev).forEach(([date, ids]) => {
        const filtered = ids.filter(id => id !== habitId);
        if (filtered.length) next[date] = filtered;
      });
      writeJson(keyLogs, next);
      return next;
    });
  };

  // ── Locked day notice ──
  const [lockedNotice, setLockedNotice] = useState(null);
  const handleLockedDayClick = (dayLabel) => {
    setLockedNotice(`Past days (${dayLabel}) are locked. Habits can only be checked in for today.`);
    setTimeout(() => setLockedNotice(null), 3200);
  };

  // ── Compute consecutive streak for a specific habit ──
  const habitStreak = (habitId) => {
    let count = 0;
    let checkDate = new Date();
    const todayKey = todayStr();
    const isTodayDone = (logs[todayKey] || []).includes(habitId);

    if (!isTodayDone) {
      // If user hasn't ticked today yet, start counting from yesterday
      checkDate.setDate(checkDate.getDate() - 1);
      const yKey = localDateStr(checkDate);
      if (!(logs[yKey] || []).includes(habitId)) return 0;
    }

    for (let i = 0; i < 60; i++) {
      const ds = localDateStr(checkDate);
      if ((logs[ds] || []).includes(habitId)) {
        count++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return count;
  };

  // ── Check-in streak last 7 days for display ──
  const checkinDays7 = days7.map(d => ({
    ...d,
    checkedIn: (checkins || []).some(c => c.date === d.date),
  }));

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 lg:px-8 space-y-5">
      <div>
        <h1 className="font-display text-3xl text-[var(--foreground)]">Habits</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          Build consistency with daily habits you define.
        </p>
      </div>

      {/* ── Locked Notice Banner ── */}
      {lockedNotice && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium px-4 py-2.5 rounded-2xl flex items-center justify-between shadow-xs animate-fadeIn">
          <span>🔒 {lockedNotice}</span>
          <button onClick={() => setLockedNotice(null)} className="text-amber-600 hover:text-amber-900 font-bold ml-2">×</button>
        </div>
      )}

      {/* ── CHECK-IN STREAK CARD ── */}
      <div className="bg-[var(--primary)] rounded-3xl p-5 text-white shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-white/50 uppercase tracking-widest mb-1">Check-In Streak</p>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-bold">{streak}</p>
              <p className="text-sm text-white/60">days</p>
            </div>
          </div>
          <div className="text-4xl">🔥</div>
        </div>

        {/* Last 7 days calendar */}
        <div className="flex gap-1.5">
          {checkinDays7.map(d => (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
              <div className={`w-full aspect-square rounded-xl flex items-center justify-center text-sm font-bold transition-all ${
                d.isToday
                  ? d.checkedIn ? "bg-white text-[var(--primary)] shadow-sm" : "border-2 border-white/30 text-white/50"
                  : d.checkedIn ? "bg-white/90 text-[var(--primary)]" : "bg-white/10 text-white/30"
              }`}>
                {d.checkedIn ? "✓" : d.isToday ? "?" : d.dayNum}
              </div>
              <p className={`text-[9px] font-semibold ${d.isToday ? "text-white" : "text-white/50"}`}>
                {d.label}
              </p>
            </div>
          ))}
        </div>

        <p className="text-xs text-white/40 mt-3">
          Complete your daily check-in to maintain your streak.
        </p>
      </div>

      {/* ── DAILY HABITS ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-[var(--foreground)]">My Daily Habits</p>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              {(logs[today] || []).length}/{habits.length} done today
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)] bg-[var(--secondary)] px-3 py-2 rounded-xl hover:opacity-80 transition cursor-pointer"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Habit
          </button>
        </div>

        {/* Empty state */}
        {habits.length === 0 && (
          <div className="bg-[var(--card)] border border-dashed border-[var(--border)] rounded-3xl p-8 text-center">
            <p className="text-3xl mb-3">🌱</p>
            <p className="text-sm font-semibold text-[var(--foreground)] mb-1">No habits yet</p>
            <p className="text-xs text-[var(--muted-foreground)] mb-4">
              Add daily habits like "Clean Diet", "8hrs Sleep", or "No Sugar" to track them every day.
            </p>
            <button
              onClick={() => setShowAdd(true)}
              className="text-xs font-semibold text-[var(--accent)] bg-[var(--secondary)] px-4 py-2 rounded-xl cursor-pointer hover:opacity-80 transition"
            >
              + Add your first habit
            </button>
          </div>
        )}

        {/* Habit list */}
        <div className="space-y-3">
          {habits.map(habit => {
            const todayDone = (logs[today] || []).includes(habit.id);
            const hStreak = habitStreak(habit.id);

            return (
              <div
                key={habit.id}
                className={`bg-white/95 backdrop-blur-sm border-2 rounded-2xl p-4 shadow-xs transition-all ${
                  todayDone ? "border-emerald-500 shadow-sm" : "border-[var(--border)]"
                }`}
              >
                {/* Main Row */}
                <div className="flex items-center justify-between gap-3 mb-3.5">
                  {/* Left: Emoji + Habit Name + Habit Streak */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <button
                      onClick={() => toggleHabit(habit.id)}
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-2xs border transition-all cursor-pointer ${
                        todayDone
                          ? "bg-emerald-50 border-emerald-300 scale-105"
                          : "bg-[var(--muted)] border-[var(--border)] hover:bg-[var(--secondary)]"
                      }`}
                      title="Tap to toggle today's check-in"
                    >
                      {habit.emoji}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-[var(--foreground)] truncate">
                          {habit.name}
                        </p>
                        {/* Habit Streak Badge */}
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 rounded-full shadow-2xs shrink-0">
                          🔥 {hStreak} {hStreak === 1 ? "day streak" : "days streak"}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">
                        {todayDone ? "✓ Checked in for today" : "Ready for today's check-in"}
                      </p>
                    </div>
                  </div>

                  {/* Right: Dedicated Today Check-in Action + Delete */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleHabit(habit.id)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                        todayDone
                          ? "bg-emerald-600 text-white hover:bg-emerald-700"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100"
                      }`}
                      title="Check in for today only"
                    >
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] border transition-all ${
                        todayDone ? "bg-white text-emerald-700 border-white font-black" : "border-emerald-500 bg-white"
                      }`}>
                        {todayDone ? "✓" : ""}
                      </span>
                      <span>{todayDone ? "Done Today" : "Check In"}</span>
                    </button>

                    <button
                      onClick={() => removeHabit(habit.id)}
                      className="text-[var(--muted-foreground)] hover:text-rose-500 transition cursor-pointer p-1.5 rounded-lg hover:bg-rose-50"
                      title="Remove habit"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                </div>

                {/* 7-Day Timeline: Only today is checkable */}
                <div className="pt-2.5 border-t border-[var(--border)]/70">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                      7-Day Record
                    </span>
                    <span className="text-[10px] text-emerald-700 font-medium">
                      ● Only today can be checked in
                    </span>
                  </div>

                  <div className="grid grid-cols-7 gap-1.5">
                    {days7.map(d => {
                      const isDone = (logs[d.date] || []).includes(habit.id);

                      if (d.isToday) {
                        return (
                          <button
                            key={d.date}
                            onClick={() => toggleHabit(habit.id)}
                            className={`flex flex-col items-center justify-center py-2 rounded-xl border-2 transition-all cursor-pointer shadow-2xs ${
                              todayDone
                                ? "bg-emerald-500 border-emerald-600 text-white"
                                : "bg-emerald-50/90 border-dashed border-emerald-400 text-emerald-700 hover:bg-emerald-100"
                            }`}
                            title="Click to toggle check-in for Today"
                          >
                            <span className="text-xs font-black">{todayDone ? "✓" : "+"}</span>
                            <span className="text-[9px] font-bold mt-0.5">Today</span>
                          </button>
                        );
                      }

                      return (
                        <div
                          key={d.date}
                          onClick={() => handleLockedDayClick(d.label)}
                          className={`flex flex-col items-center justify-center py-2 rounded-xl border cursor-not-allowed select-none transition-all ${
                            isDone
                              ? "bg-emerald-100/70 border-emerald-300 text-emerald-800"
                              : "bg-[var(--muted)]/60 border-transparent text-[var(--muted-foreground)] opacity-60"
                          }`}
                          title={`Past day (${d.label}) is locked. Check-ins are recorded daily.`}
                        >
                          <span className="text-[10px] font-bold">{isDone ? "✓" : "–"}</span>
                          <span className="text-[9px] font-semibold mt-0.5">{d.label[0]}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── ADD HABIT MODAL ── */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="font-display text-2xl text-[var(--foreground)] mb-1">New Habit</h2>
            <p className="text-sm text-[var(--muted-foreground)] mb-5">
              Give it a name and pick an emoji.
            </p>

            {/* Habit name */}
            <input
              type="text"
              placeholder="e.g. Clean Diet, 8hrs Sleep, No Sugar…"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addHabit()}
              autoFocus
              maxLength={40}
              className="w-full bg-[var(--muted)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] mb-4"
            />

            {/* Emoji picker */}
            <p className="text-xs font-semibold text-[var(--muted-foreground)] mb-2">Pick an icon</p>
            <div className="flex flex-wrap gap-2 mb-5">
              {EMOJI_OPTIONS.map(em => (
                <button
                  key={em}
                  onClick={() => setNewEmoji(em)}
                  className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all cursor-pointer ${
                    newEmoji === em
                      ? "bg-[var(--primary)] scale-110 shadow-sm"
                      : "bg-[var(--muted)] hover:bg-[var(--secondary)]"
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => { setShowAdd(false); setNewName(""); }}
                className="flex-1 py-3 border border-[var(--border)] rounded-2xl text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={addHabit}
                disabled={!newName.trim()}
                className="flex-1 py-3 bg-[var(--primary)] text-white rounded-2xl text-sm font-semibold hover:opacity-90 transition disabled:opacity-40 cursor-pointer"
              >
                Add Habit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
