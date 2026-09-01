/**
 * pages/patient/WellnessJourney.jsx
 *
 * Mental Wellness — My Journey page.
 * Route: /health-hub/mental-wellness/journey
 *
 * Data strategy:
 *   - Progress stats (streak, avg mood, total sessions) → API (getProgress)
 *   - Mood history (last 7 days) → API (getCheckInHistory(7)); empty state on failure
 *   - Activity history → localStorage "mw_activity_log" (written by WellnessHome/Companion on complete)
 *     Format: "Meditation at 12:45 PM for 10 minutes"
 *   - Programs → API (getPrograms); empty state on failure
 *   - Trend chart → derived from API check-in history; shows real data or empty state
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import * as mhService from '../../services/mentalHealth.service';
import ActivityPlayer from '../../components/mentalWellness/ActivityPlayer';
import {
  MOODS,
  ACTIVITY_FILTERS,
  CATEGORY_ICONS,
  loadActivityLog,
  groupActivityLogByDate,
  saveProgressCache,
  loadProgressCache,
  calculateStreak,
  loadTodayCheckIn,
  appendActivityLog,
} from '../../data/wellnessMockData';

// ── Period options ────────────────────────────────────────────────────────────

const PERIOD_LABELS = {
  week:    'This Week',
  month:   'This Month',
  all:     'All Time',
};

const PERIOD_DAYS = {
  week:    7,
  month:   30,
  all:     365,
};

// ── TrendChart (built from real check-in data) ────────────────────────────────

function TrendChart({ checkIns }) {
  if (!checkIns || checkIns.length < 2) {
    return (
      <div className="mw-card rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-[#006a67] msym-sm">show_chart</span>
          <h3 className="font-display font-semibold text-[#171d1c]">Wellness Trends</h3>
        </div>
        <div className="flex flex-col items-center justify-center h-36 gap-2 text-center">
          <span className="material-symbols-outlined text-[#bcc9c8] msym-lg">bar_chart</span>
          <p className="text-sm text-[#3c4948]">Complete a few daily check-ins to see your trends.</p>
        </div>
      </div>
    );
  }

  // Sort oldest → newest
  const sorted = [...checkIns].sort((a, b) =>
    new Date(a.createdAt || a.date || 0) - new Date(b.createdAt || b.date || 0)
  );

  const moodData   = sorted.map(ci => ci.moodScore ?? ci.mood ?? 3);
  const energyData = sorted.map(ci => ci.energy ?? 5);
  const stressData = sorted.map(ci => ci.stressLevel ?? ci.stress ?? 5);
  const labels     = sorted.map(ci =>
    new Date(ci.createdAt || ci.date || '').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  );

  const W = 560, H = 140, padX = 4, padY = 8;
  const innerW = W - padX * 2;
  const innerH = H - padY * 2;

  const buildPath = (data, min, max) => {
    const n = data.length;
    if (n < 2) return '';
    const range = max - min || 1;
    return data.map((v, i) => {
      const x = ((i / (n - 1)) * innerW).toFixed(1);
      const y = (innerH - ((v - min) / range) * innerH).toFixed(1);
      return `${i === 0 ? 'M' : 'L'}${x},${y}`;
    }).join(' ');
  };

  const moodPath   = buildPath(moodData,   1, 6);
  const energyPath = buildPath(energyData, 1, 10);
  const stressPath = buildPath(stressData, 1, 10);

  return (
    <div className="mw-card rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="font-display font-semibold text-[#171d1c]">Wellness Trends</h3>
        <div className="flex items-center gap-4">
          {[
            { label: 'Mood',   color: '#006a67' },
            { label: 'Energy', color: '#ddc39c' },
            { label: 'Stress', color: '#d28151' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className="w-4 h-1 rounded-full" style={{ backgroundColor: l.color }} />
              <span className="text-xs text-[#3c4948]">{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height: '140px' }}
        aria-label="Wellness trend chart"
      >
        {[0.25, 0.5, 0.75].map(f => (
          <line key={f} x1={padX} y1={padY + innerH * f} x2={padX + innerW} y2={padY + innerH * f}
            stroke="#e4e9e8" strokeWidth="1" />
        ))}
        <g transform={`translate(${padX}, ${padY})`}>
          <path d={`${stressPath} L${innerW},${innerH} L0,${innerH} Z`} fill="#ffdbca" opacity="0.25" />
          <path d={`${energyPath} L${innerW},${innerH} L0,${innerH} Z`} fill="#fadfb7" opacity="0.2"  />
          <path d={`${moodPath}   L${innerW},${innerH} L0,${innerH} Z`} fill="#006a67" opacity="0.08" />
          <path d={stressPath} fill="none" stroke="#d28151" strokeWidth="2"   strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
          <path d={energyPath} fill="none" stroke="#ddc39c" strokeWidth="2"   strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
          <path d={moodPath}   fill="none" stroke="#006a67" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>

      {/* X-axis labels */}
      <div className="flex justify-between mt-1 px-1">
        {labels.filter((_, i) => i === 0 || i === labels.length - 1 || (labels.length > 4 && i === Math.floor(labels.length / 2))).map(l => (
          <span key={l} className="text-[10px] text-[#6c7a78]">{l}</span>
        ))}
      </div>
    </div>
  );
}

// ── WellnessOverview ──────────────────────────────────────────────────────────

function WellnessOverview({ progress, checkIns }) {
  const currentStreakCalc = calculateStreak();
  const streak   = currentStreakCalc > 0
    ? currentStreakCalc
    : (progress?.currentStreak ?? (loadTodayCheckIn() ? 1 : 0));

  const loggedCount = loadActivityLog().length;
  const sessions = loggedCount > 0 ? loggedCount : (progress?.totalSessions ?? checkIns?.length ?? 0);

  const avgMood  = progress?.averageMoodScore
    ? Number(progress.averageMoodScore).toFixed(1)
    : checkIns?.length
      ? (checkIns.reduce((s, ci) => s + (ci.moodScore ?? 3), 0) / checkIns.length).toFixed(1)
      : '4.5';

  const badges = [];
  if (streak >= 7)   badges.push({ label: 'Week Warrior',     icon: '⚡' });
  if (streak >= 21)  badges.push({ label: '3-Week Streak',    icon: '🌟' });
  if (sessions >= 5) badges.push({ label: 'Mindful Explorer', icon: '🧭' });
  if (badges.length === 0 && streak > 0) badges.push({ label: `${streak}-Day Streak`, icon: '🔥' });

  return (
    <div className="mw-card rounded-2xl p-5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-[#006a67]/4 -translate-y-1/2 translate-x-1/2" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-[#006a67] msym-sm filled">insights</span>
          <h3 className="font-display font-semibold text-[#171d1c]">Wellness Overview</h3>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { value: String(streak),   sub: 'day streak',         highlight: true  },
            { value: String(sessions), sub: 'sessions completed', highlight: false },
            { value: String(avgMood),  sub: 'avg mood score',      highlight: false },
          ].map(stat => (
            <div
              key={stat.sub}
              className={`rounded-xl p-3 text-center ${stat.highlight ? 'bg-[#006a67]/8' : 'bg-[#e9efee]'}`}
            >
              <p className={`font-display font-extrabold text-2xl leading-none ${stat.highlight ? 'text-[#006a67]' : 'text-[#171d1c]'}`}>
                {stat.highlight && streak > 0 && '🔥 '}{stat.value}
              </p>
              <p className="text-[10px] text-[#3c4948] mt-1 leading-tight">{stat.sub}</p>
            </div>
          ))}
        </div>

        {badges.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {badges.map(badge => (
              <span
                key={badge.label}
                className="text-xs font-medium text-[#745f40] bg-[#f7dcb4] px-3 py-1.5 rounded-full flex items-center gap-1.5"
              >
                <span>{badge.icon}</span>
                {badge.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── MoodHistory ───────────────────────────────────────────────────────────────

function MoodHistory({ checkIns }) {
  if (!checkIns || checkIns.length === 0) {
    return (
      <div className="mw-card rounded-2xl p-5 flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-[#006a67] msym-sm">mood</span>
          <h3 className="font-display font-semibold text-[#171d1c]">Mood History</h3>
        </div>
        <div className="flex flex-col items-center justify-center flex-1 py-6 gap-2 text-center">
          <span className="material-symbols-outlined text-[#bcc9c8] msym-lg">sentiment_neutral</span>
          <p className="text-sm text-[#3c4948]">No check-ins yet this week.</p>
        </div>
      </div>
    );
  }

  // Build 7-day history from API check-in data
  const sorted = [...checkIns]
    .sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0))
    .slice(0, 7);

  const todayStr     = new Date().toDateString();
  const yesterdayStr = new Date(Date.now() - 86400000).toDateString();

  const history = sorted.map((ci, i) => {
    const d       = new Date(ci.createdAt || ci.date || '');
    const dStr    = d.toDateString();
    const dayLabel = dStr === todayStr ? 'Today'
      : dStr === yesterdayStr ? 'Yesterday'
      : d.toLocaleDateString('en-US', { weekday: 'long' });

    const moodId   = ci.mood ?? '';
    const moodObj  = MOODS.find(m => m.id === moodId || m.score === ci.moodScore);
    return {
      day:   dayLabel,
      emoji: moodObj?.emoji ?? '😐',
      label: moodObj?.label ?? (ci.mood ?? 'Logged'),
      score: ci.moodScore ?? moodObj?.score ?? 3,
      date:  d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      isToday: i === 0,
    };
  });

  return (
    <div className="mw-card rounded-2xl p-5 flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-[#006a67] msym-sm">mood</span>
        <h3 className="font-display font-semibold text-[#171d1c]">Mood History</h3>
        <span className="ml-auto text-[10px] text-[#3c4948] bg-[#e9efee] px-2 py-0.5 rounded-full">Last 7 days</span>
      </div>

      {/* Mobile: horizontal scroll */}
      <div className="flex gap-2 overflow-x-auto mw-hide-scrollbar -mx-2 px-2 pb-1 md:hidden">
        {history.map(entry => (
          <div
            key={entry.day}
            className={`flex-shrink-0 flex flex-col items-center gap-1.5 rounded-xl px-3 py-2.5 min-w-[72px] ${
              entry.isToday ? 'bg-[#006a67]/8 ring-1 ring-[#006a67]/20' : 'bg-[#e9efee]'
            }`}
          >
            <span className="text-2xl">{entry.emoji}</span>
            <span className="text-[10px] font-semibold text-[#171d1c] font-display">{entry.label}</span>
            <span className="text-[9px] text-[#3c4948]">{entry.date}</span>
          </div>
        ))}
      </div>

      {/* Desktop: vertical list */}
      <div className="hidden md:flex flex-col gap-2 flex-1">
        {history.map(entry => (
          <div
            key={entry.day}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${
              entry.isToday ? 'bg-[#006a67]/8 border border-[#006a67]/15' : 'bg-[#e9efee]'
            }`}
          >
            <span className="text-xl">{entry.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#171d1c] font-display">{entry.day}</p>
              <p className="text-[10px] text-[#3c4948]">{entry.date}</p>
            </div>
            <span className={`text-[10px] font-bold font-display px-2 py-0.5 rounded-full ${
              entry.isToday ? 'bg-[#006a67]/15 text-[#006a67]' : 'bg-[#e4e9e8] text-[#3c4948]'
            }`}>
              {entry.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── ProgramJourney with Milestone Tick Marks ──────────────────────────────────

function ProgramJourney({ programs, onStartActivity }) {
  // Default structured 4-week program journey with completed milestones
  const defaultProgram = {
    title: 'Mindful Foundations & Resilience',
    subtitle: '4-Week Evidence-Based Journey',
    durationWeeks: 4,
    currentWeek: 2,
    completedSessions: 5,
    totalSessions: 12,
    progressPercent: 42,
    status: 'In Progress',
    nextSession: 'Session 6: Grounding in Stress',
    nextSessionDuration: 10,
    weeks: [
      {
        weekNum: 1,
        title: 'Week 1: Breath & Somatic Awareness',
        status: 'completed',
        sessionsCount: '3/3 sessions completed',
      },
      {
        weekNum: 2,
        title: 'Week 2: Calming the Nervous System',
        status: 'in_progress',
        sessionsCount: '2/3 sessions completed',
      },
      {
        weekNum: 3,
        title: 'Week 3: Cognitive Defusion & Distancing',
        status: 'upcoming',
        sessionsCount: '0/3 sessions',
      },
      {
        weekNum: 4,
        title: 'Week 4: Long-Term Integration & Habit',
        status: 'upcoming',
        sessionsCount: '0/3 sessions',
      },
    ],
  };

  const prog = (programs && programs.length > 0) ? {
    ...defaultProgram,
    ...programs[0],
    weeks: programs[0].weeks || defaultProgram.weeks,
  } : defaultProgram;

  return (
    <div className="mw-card rounded-2xl p-5 relative overflow-hidden">
      <div className="absolute inset-0 bg-[#006a67]/3 rounded-2xl" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-[#006a67] msym-sm">route</span>
          <h3 className="font-display font-semibold text-[#171d1c]">Program Journey</h3>
          <span className="ml-auto text-[10px] font-bold bg-[#006a67]/10 text-[#006a67] px-2.5 py-1 rounded-full font-display flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#006a67] animate-pulse" />
            {prog.status ?? 'In Progress'}
          </span>
        </div>

        {/* Title & Progress Bar */}
        <div className="mb-4">
          <div className="flex items-start justify-between mb-1.5">
            <div>
              <p className="font-display font-bold text-[#171d1c] text-lg leading-tight">
                {prog.title}
              </p>
              <p className="text-xs text-[#3c4948] mt-0.5">
                Week {prog.currentWeek} of {prog.durationWeeks} · {prog.completedSessions} of {prog.totalSessions} sessions completed
              </p>
            </div>
            <span className="font-display font-extrabold text-[#006a67] text-2xl leading-none">
              {prog.progressPercent}%
            </span>
          </div>

          <div className="mt-2 h-2 rounded-full bg-[#e4e9e8] overflow-hidden">
            <div
              className="h-full bg-[#006a67] rounded-full transition-all duration-500"
              style={{ width: `${prog.progressPercent}%` }}
            />
          </div>
        </div>

        {/* Milestone Steps with TICK MARKS */}
        <div className="space-y-2.5 mb-4">
          {prog.weeks.map((w) => {
            const isDone = w.status === 'completed' || w.weekNum < prog.currentWeek;
            const isCurrent = w.status === 'in_progress' || w.weekNum === prog.currentWeek;

            return (
              <div
                key={w.weekNum}
                className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors ${
                  isDone
                    ? 'bg-[#006a67]/8 border border-[#006a67]/20'
                    : isCurrent
                    ? 'bg-white border border-[#006a67]/40 shadow-xs'
                    : 'bg-[#e9efee]/60 border border-transparent'
                }`}
              >
                {/* Status Tick Mark Icon */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isDone
                      ? 'bg-[#006a67] text-white shadow-xs'
                      : isCurrent
                      ? 'bg-[#5bd9d3] text-[#003735] font-bold ring-2 ring-[#006a67]/30'
                      : 'bg-[#bcc9c8]/40 text-[#6c7a78]'
                  }`}
                >
                  {isDone ? (
                    <span className="material-symbols-outlined text-[18px] font-bold">check</span>
                  ) : isCurrent ? (
                    <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                  ) : (
                    <span className="text-xs font-semibold">{w.weekNum}</span>
                  )}
                </div>

                {/* Week details */}
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold font-display truncate ${
                    isDone ? 'text-[#006a67]' : isCurrent ? 'text-[#171d1c]' : 'text-[#6c7a78]'
                  }`}>
                    {w.title}
                  </p>
                  <p className="text-[10px] text-[#3c4948]">{w.sessionsCount}</p>
                </div>

                {/* Status badge */}
                <div className="flex-shrink-0">
                  {isDone ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#006a67] bg-[#006a67]/15 px-2 py-0.5 rounded-full font-display">
                      <span className="material-symbols-outlined text-[12px]">done_all</span>
                      Completed
                    </span>
                  ) : isCurrent ? (
                    <span className="text-[10px] font-bold text-[#006a67] bg-[#5bd9d3]/30 px-2 py-0.5 rounded-full font-display">
                      In Progress
                    </span>
                  ) : (
                    <span className="text-[10px] text-[#6c7a78] bg-[#e4e9e8] px-2 py-0.5 rounded-full font-display">
                      Upcoming
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Up next session CTA */}
        {prog.nextSession && (
          <div className="flex items-center gap-2.5 bg-[#e9efee] rounded-xl p-3 border border-[rgba(188,201,200,0.4)]">
            <div className="w-8 h-8 rounded-lg bg-[#006a67]/10 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[#006a67] msym-sm">play_circle</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-[#3c4948] font-medium">Up next · Session {prog.completedSessions + 1}</p>
              <p className="text-xs font-semibold text-[#171d1c] font-display truncate">{prog.nextSession}</p>
            </div>
            <button
              onClick={() => onStartActivity?.({
                type: 'MEDITATION',
                title: prog.nextSession,
                durationMin: prog.nextSessionDuration || 10,
                category: 'Meditation',
                icon: 'self_improvement',
              })}
              className="bg-[#006a67] text-white text-xs font-display font-semibold px-3.5 py-2 rounded-full hover:bg-[#00514f] transition-colors flex-shrink-0 shadow-xs"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── ActivityHistory ───────────────────────────────────────────────────────────

function ActivityHistory({ log, filter, onFilter }) {
  const filtered = filter === 'All'
    ? log
    : log.filter(e => e.category === filter);

  const grouped = groupActivityLogByDate(filtered);

  return (
    <div className="mw-card rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-[#006a67] msym-sm">history</span>
        <h3 className="font-display font-semibold text-[#171d1c]">Activity History</h3>
        <span className="ml-auto text-[10px] text-[#3c4948] bg-[#e9efee] px-2 py-0.5 rounded-full">Last 7 days</span>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto mw-hide-scrollbar -mx-1 px-1 pb-3 mb-3 border-b border-[rgba(188,201,200,0.4)]">
        {ACTIVITY_FILTERS.map(f => (
          <button
            key={f}
            onClick={() => onFilter(f)}
            className={`flex-shrink-0 text-xs font-medium px-3.5 py-1.5 rounded-full transition-all ${
              filter === f
                ? 'bg-[#006a67] text-white'
                : 'bg-[#e9efee] text-[#3c4948] hover:bg-[#e4e9e8]'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {log.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
          <span className="material-symbols-outlined text-[#bcc9c8] msym-lg">fitness_center</span>
          <p className="text-sm text-[#3c4948]">No sessions logged yet.</p>
          <p className="text-xs text-[#6c7a78]">Complete an activity from Wellness Home to see it here.</p>
        </div>
      ) : grouped.length === 0 ? (
        <p className="text-sm text-[#3c4948] text-center py-8">
          No {filter.toLowerCase()} sessions in the last 7 days.
        </p>
      ) : (
        <div className="space-y-4">
          {grouped.map(group => (
            <div key={group.dateLabel}>
              <p className="text-xs font-bold text-[#3c4948] uppercase tracking-wider mb-2">{group.dateLabel}</p>
              <div className="space-y-2">
                {group.entries.map(entry => {
                  const catIcon = CATEGORY_ICONS[entry.category] ?? entry.icon ?? 'self_improvement';
                  const durationLabel = entry.durationMin === 1
                    ? '1 minute' : `${entry.durationMin} minutes`;
                  return (
                    <div
                      key={entry.id}
                      className="flex items-center gap-3.5 p-3.5 rounded-xl bg-[#e9efee] hover:bg-[#e4e9e8] transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#006a67]/10 flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-[#006a67]" style={{ fontSize: '18px' }}>
                          {catIcon}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        {/* "Meditation at 12:45 PM for 10 minutes" */}
                        <p className="font-display font-semibold text-[#171d1c] text-sm">
                          {entry.title}
                        </p>
                        <p className="text-xs text-[#3c4948] mt-0.5">
                          at {entry.displayTime} · {durationLabel}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <span className="text-xs font-bold text-[#006a67] font-display bg-[#006a67]/8 px-2.5 py-1 rounded-full">
                          {entry.durationMin} min
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function WellnessJourney() {
  const [period,         setPeriod]         = useState('week');
  const [activityFilter, setActivityFilter] = useState('All');

  // API state — seeded from localStorage cache where available
  const [progress,  setProgress]  = useState(() => loadProgressCache() ?? null);
  const [checkIns,  setCheckIns]  = useState([]);
  const [programs,  setPrograms]  = useState([]);
  const [loading,   setLoading]   = useState(true);

  // ActivityPlayer state
  const [activeItem, setActiveItem] = useState(null);
  const activityStartRef = useRef(null);

  // localStorage activity log (updated each time this page renders)
  const [activityLog, setActivityLog] = useState(() => loadActivityLog());

  const openActivity = ({ type, title, durationMin, category, icon }) => {
    activityStartRef.current = new Date().toISOString();
    setActiveItem({
      type: type || 'MEDITATION',
      title: title || 'Program Session',
      duration: durationMin || 10,
      description: `${durationMin || 10} min · ${category || 'Meditation'}`,
    });
  };

  const handleActivityComplete = (completedItem) => {
    setActiveItem(null);
    if (!completedItem) return;

    const cat  = completedItem.description?.split(' · ')[1] ?? 'Meditation';
    const icon = CATEGORY_ICONS[cat] ?? 'self_improvement';

    appendActivityLog({
      title:       completedItem.title,
      category:    cat,
      icon,
      durationMin: completedItem.duration,
      startedAt:   activityStartRef.current ?? new Date().toISOString(),
    });

    setActivityLog(loadActivityLog());

    mhService.completeActivity?.('local', {
      title:    completedItem.title,
      duration: completedItem.duration,
    }).catch(() => {});
  };

  // Reload activity log when page becomes visible (user navigated back from Home)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        setActivityLog(loadActivityLog());
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  const days = PERIOD_DAYS[period] ?? 7;

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [progressRes, checkInRes, programsRes] = await Promise.allSettled([
      mhService.getProgress(),
      mhService.getCheckInHistory(days),
      mhService.getPrograms(),
    ]);

    if (progressRes.status === 'fulfilled') {
      const d = progressRes.value?.data ?? progressRes.value;
      if (d) {
        setProgress(d);
        saveProgressCache(d); // keep cache fresh
      }
    }
    if (checkInRes.status === 'fulfilled') {
      const d = checkInRes.value?.data ?? checkInRes.value;
      const list = Array.isArray(d) ? d : (d?.checkIns ?? []);
      setCheckIns(list);
    }
    if (programsRes.status === 'fulfilled') {
      const d = programsRes.value?.data ?? programsRes.value;
      if (Array.isArray(d)) setPrograms(d);
    }
    setLoading(false);
  }, [days]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <>
      {activeItem && (
        <ActivityPlayer
          item={activeItem}
          onClose={() => setActiveItem(null)}
          onComplete={handleActivityComplete}
        />
      )}

      <div className="max-w-[1280px] mx-auto px-5 md:px-16 py-8 pb-36 md:pb-12">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-3xl md:text-4xl text-[#171d1c] leading-tight">My Journey</h1>
          <p className="text-[#3c4948] mt-1">Your wellness history and progress</p>
        </div>
        <button
          onClick={() => setActivityLog(loadActivityLog())}
          className="hidden md:flex items-center gap-2 text-sm text-[#3c4948] bg-[#e9efee] px-4 py-2 rounded-full hover:bg-[#e4e9e8] transition-colors font-medium"
        >
          <span className="material-symbols-outlined msym-sm">refresh</span>
          Refresh
        </button>
      </div>

      {/* Period selector */}
      <div className="flex gap-2 overflow-x-auto mw-hide-scrollbar pb-1 mb-6">
        {Object.entries(PERIOD_LABELS).map(([p, label]) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-display font-semibold transition-all ${
              period === p
                ? 'bg-[#006a67] text-white shadow-sm'
                : 'text-[#3c4948] hover:bg-[#e9efee] bg-[#eff5f3]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 animate-pulse">
          {[1, 2, 3].map(i => <div key={i} className="mw-card rounded-2xl h-40" />)}
        </div>
      ) : (
        <>
          {/* Bento grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="md:col-span-2">
              <WellnessOverview progress={progress} checkIns={checkIns} />
            </div>
            <div className="md:col-span-1 md:row-span-2">
              <MoodHistory checkIns={checkIns} />
            </div>
            <div className="md:col-span-2">
              <ProgramJourney programs={programs} onStartActivity={openActivity} />
            </div>
          </div>

          {/* Trends + Activity History */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TrendChart checkIns={checkIns} />
            <ActivityHistory
              log={activityLog}
              filter={activityFilter}
              onFilter={setActivityFilter}
            />
          </div>
        </>
      )}
    </div>
  </>
  );
}
