/**
 * pages/patient/WellnessJourney.jsx
 *
 * Mental Wellness — My Journey page.
 * Route: /health-hub/mental-wellness/journey
 *
 * Merges:
 *  - Visual layout from Mentalwellness-frontend/src/pages/MyJourney.tsx
 *    (WellnessOverview, MoodHistory, ProgramJourney, TrendChart (pure SVG),
 *     ActivityHistory with filter chips)
 *  - API wiring: getProgress(), getCheckInHistory(), getPrograms()
 *  - Graceful mock fallback when APIs are unavailable
 *
 * Converted from TSX: Period type, PERIOD_LABELS Record<>, typed function
 * params in buildSvgPath, ActivityHistory typed props all removed.
 * Runtime behavior identical.
 */

import { useState, useEffect } from 'react';
import * as mhService from '../../services/mentalHealth.service';
import {
  MOOD_HISTORY    as MOCK_MOOD_HISTORY,
  TREND_DATA      as MOCK_TREND_DATA,
  ACTIVITY_HISTORY as MOCK_ACTIVITY_HISTORY,
  ACTIVITY_FILTERS,
  PROGRAMS        as MOCK_PROGRAMS,
  CATEGORY_ICONS,
} from '../../data/wellnessMockData';

// ── Constants ─────────────────────────────────────────────────────────────────

const PERIOD_LABELS = {
  week:     'This Week',
  month:    'This Month',
  '3months':'3 Months',
  all:      'All Time',
};

// ── Helper: pure-SVG trend chart path builder ─────────────────────────────────

/**
 * @param {number[]} data
 * @param {number} width
 * @param {number} height
 * @param {number} min
 * @param {number} max
 * @returns {string}
 */
function buildSvgPath(data, width, height, min, max) {
  const n = data.length;
  if (n < 2) return '';
  const xStep = width / (n - 1);
  const range  = max - min;
  return data
    .map((v, i) => {
      const x = (i * xStep).toFixed(1);
      const y = (height - ((v - min) / range) * height).toFixed(1);
      return `${i === 0 ? 'M' : 'L'}${x},${y}`;
    })
    .join(' ');
}

// ── TrendChart sub-component ──────────────────────────────────────────────────

function TrendChart({ trendData }) {
  const data = trendData || MOCK_TREND_DATA;
  const W = 600, H = 160, padX = 8, padY = 12;
  const innerW = W - padX * 2;
  const innerH = H - padY * 2;

  const moodPath   = buildSvgPath(data.mood,   innerW, innerH, 0, 6);
  const energyPath = buildSvgPath(data.energy, innerW, innerH, 0, 10);
  const stressPath = buildSvgPath(data.stress, innerW, innerH, 0, 10);

  const xLabels    = data.labels.filter((_, i) => i % 2 === 0);
  const xPositions = data.labels
    .filter((_, i) => i % 2 === 0)
    .map((_, i) => ((i * 2) / (data.labels.length - 1)) * innerW + padX);

  return (
    <div className="p-5 mw-card rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-[#171d1c]">Wellness Trends</h3>
        <div className="flex items-center gap-4">
          {[
            { label: 'Mood',   color: '#006a67' },
            { label: 'Energy', color: '#ddc39c' },
            { label: 'Stress', color: '#d28151' },
          ].map((l) => (
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
        style={{ height: '160px' }}
        aria-label="Wellness trend chart"
      >
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={padX} y1={padY + innerH * f}
            x2={padX + innerW} y2={padY + innerH * f}
            stroke="#e4e9e8" strokeWidth="1"
          />
        ))}

        <g transform={`translate(${padX}, ${padY})`}>
          {/* Area fills */}
          <path d={`${stressPath} L${innerW},${innerH} L0,${innerH} Z`} fill="#ffdbca" opacity="0.25" />
          <path d={`${energyPath} L${innerW},${innerH} L0,${innerH} Z`} fill="#fadfb7" opacity="0.2"  />
          <path d={`${moodPath}   L${innerW},${innerH} L0,${innerH} Z`} fill="#006a67" opacity="0.08" />
          {/* Lines */}
          <path d={stressPath} fill="none" stroke="#d28151" strokeWidth="2"   strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
          <path d={energyPath} fill="none" stroke="#ddc39c" strokeWidth="2"   strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
          <path d={moodPath}   fill="none" stroke="#006a67" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        {/* X-axis labels */}
        {xLabels.map((label, i) => (
          <text
            key={label}
            x={xPositions[i]}
            y={H - 2}
            textAnchor="middle"
            fontSize="9"
            fill="#6c7a78"
          >
            {label.replace('Aug ', '').replace('Sep ', '')}
          </text>
        ))}
      </svg>
    </div>
  );
}

// ── WellnessOverview sub-component ────────────────────────────────────────────

function WellnessOverview({ progress }) {
  const streak  = progress?.currentStreak  ?? 21;
  const sessions = progress?.totalSessions ?? 8;
  const avgMood  = progress?.averageMoodScore ? Number(progress.averageMoodScore).toFixed(1) : '3.8';

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
            { value: String(streak),  sub: 'day streak',        icon: '🔥', highlight: true  },
            { value: String(sessions),sub: 'sessions this week', icon: null, highlight: false },
            { value: String(avgMood), sub: 'avg mood score',     icon: null, highlight: false },
          ].map((stat) => (
            <div
              key={stat.sub}
              className={`rounded-xl p-3 text-center ${stat.highlight ? 'bg-[#006a67]/8' : 'bg-[#e9efee]'}`}
            >
              <p className={`font-display font-extrabold text-2xl leading-none ${stat.highlight ? 'text-[#006a67]' : 'text-[#171d1c]'}`}>
                {stat.icon && <span className="mr-0.5">{stat.icon}</span>}
                {stat.value}
              </p>
              <p className="text-[10px] text-[#3c4948] mt-1 leading-tight">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Week Warrior',    icon: '⚡' },
            { label: 'Mindful Explorer',icon: '🧭' },
            { label: '3-Week Streak',   icon: '🌟' },
          ].map((badge) => (
            <span
              key={badge.label}
              className="text-xs font-medium text-[#745f40] bg-[#f7dcb4] px-3 py-1.5 rounded-full flex items-center gap-1.5"
            >
              <span>{badge.icon}</span>
              {badge.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── MoodHistory sub-component ─────────────────────────────────────────────────

function MoodHistory({ moodHistory }) {
  const history = (moodHistory && moodHistory.length > 0) ? moodHistory : MOCK_MOOD_HISTORY;

  return (
    <div className="mw-card rounded-2xl p-5 md:row-span-2 flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-[#006a67] msym-sm">mood</span>
        <h3 className="font-display font-semibold text-[#171d1c]">Mood History</h3>
      </div>

      {/* Mobile: horizontal scroll */}
      <div className="flex gap-2 overflow-x-auto mw-hide-scrollbar -mx-2 px-2 pb-1 md:hidden">
        {history.map((entry) => (
          <div
            key={entry.day}
            className="flex-shrink-0 flex flex-col items-center gap-1.5 bg-[#e9efee] rounded-xl px-3 py-2.5 min-w-[72px]"
          >
            <span className="text-2xl">{entry.emoji}</span>
            <span className="text-[10px] font-semibold text-[#171d1c] font-display">{entry.label}</span>
            <span className="text-[9px] text-[#3c4948]">{entry.date}</span>
          </div>
        ))}
      </div>

      {/* Desktop: vertical list */}
      <div className="hidden md:flex flex-col gap-2 flex-1">
        {history.map((entry, i) => (
          <div
            key={entry.day}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${
              i === 0 ? 'bg-[#006a67]/8 border border-[#006a67]/15' : 'bg-[#e9efee]'
            }`}
          >
            <span className="text-xl">{entry.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#171d1c] font-display">{entry.day}</p>
              <p className="text-[10px] text-[#3c4948]">{entry.date}</p>
            </div>
            <span
              className={`text-[10px] font-bold font-display px-2 py-0.5 rounded-full ${
                i === 0
                  ? 'bg-[#006a67]/15 text-[#006a67]'
                  : 'bg-[#e4e9e8] text-[#3c4948]'
              }`}
            >
              {entry.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── ProgramJourney sub-component ──────────────────────────────────────────────

function ProgramJourney({ programs }) {
  const prog = (programs && programs.length > 0) ? programs[0] : MOCK_PROGRAMS[0];

  return (
    <div className="mw-card rounded-2xl p-5 relative overflow-hidden">
      <div className="absolute inset-0 bg-[#006a67]/3 rounded-2xl" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-[#006a67] msym-sm">route</span>
          <h3 className="font-display font-semibold text-[#171d1c]">Program Journey</h3>
          <span className="ml-auto text-[10px] font-bold bg-[#006a67]/10 text-[#006a67] px-2.5 py-1 rounded-full font-display">
            In Progress
          </span>
        </div>

        <div className="mb-4">
          <div className="flex items-start justify-between mb-1">
            <div>
              <p className="font-display font-bold text-[#171d1c] text-lg leading-tight">{prog.title}</p>
              <p className="text-xs text-[#3c4948] mt-0.5">
                Week {prog.currentWeek} of {prog.weeks} · {prog.sessions?.completed ?? 0} of {prog.sessions?.total ?? 0} sessions
              </p>
            </div>
            <span className="font-display font-extrabold text-[#006a67] text-2xl leading-none">{prog.progress}%</span>
          </div>
          <div className="mt-3 h-2 rounded-full bg-[#e4e9e8] overflow-hidden">
            <div
              className="h-full bg-[#006a67] rounded-full transition-all"
              style={{ width: `${prog.progress}%` }}
            />
          </div>
        </div>

        {/* Week steps */}
        <div className="flex gap-2 mb-4">
          {Array.from({ length: prog.weeks }, (_, i) => (
            <div
              key={i}
              className={`flex-1 h-1.5 rounded-full ${
                i < prog.currentWeek - 1
                  ? 'bg-[#006a67]'
                  : i === prog.currentWeek - 1
                  ? 'bg-[#5bd9d3]'
                  : 'bg-[#e4e9e8]'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-2 bg-[#e9efee] rounded-xl px-3 py-2.5">
          <span className="material-symbols-outlined text-[#006a67] msym-sm">play_circle</span>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-[#3c4948]">Up next · Session {(prog.sessions?.completed ?? 0) + 1}</p>
            <p className="text-sm font-semibold text-[#171d1c] font-display truncate">{prog.nextSession}</p>
          </div>
          <button className="bg-[#006a67] text-white text-xs font-display font-semibold px-3 py-2 rounded-full hover:bg-[#00514f] transition-colors flex-shrink-0">
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ActivityHistory sub-component ─────────────────────────────────────────────

function ActivityHistory({ activityHistory, filter, onFilter }) {
  const history  = (activityHistory && activityHistory.length > 0) ? activityHistory : MOCK_ACTIVITY_HISTORY;
  const filtered = filter === 'All'
    ? history
    : history.filter(a => a.category === filter);

  return (
    <div className="mw-card rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-[#006a67] msym-sm">history</span>
        <h3 className="font-display font-semibold text-[#171d1c]">Activity History</h3>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto mw-hide-scrollbar -mx-1 px-1 pb-3 mb-3 border-b border-[rgba(188,201,200,0.4)]">
        {ACTIVITY_FILTERS.map((f) => (
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

      <div className="space-y-2.5">
        {filtered.map((activity) => {
          const catIcon = CATEGORY_ICONS[activity.category] ?? activity.icon ?? 'self_improvement';
          return (
            <div
              key={activity.id}
              className="flex items-center gap-3.5 p-3.5 rounded-xl bg-[#e9efee] hover:bg-[#e4e9e8] transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-[#006a67]/10 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-[#006a67]" style={{ fontSize: '18px' }}>{catIcon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display font-semibold text-[#171d1c] text-sm truncate">{activity.title}</p>
                <p className="text-xs text-[#3c4948] mt-0.5">{activity.time}</p>
              </div>
              <div className="flex-shrink-0 text-right">
                <span className="text-xs font-bold text-[#006a67] font-display bg-[#006a67]/8 px-2.5 py-1 rounded-full">
                  {activity.duration}
                </span>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-8 text-[#3c4948] text-sm">
            No {filter.toLowerCase()} sessions yet.
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function WellnessJourney() {
  const [period,         setPeriod]         = useState('week');
  const [activityFilter, setActivityFilter] = useState('All');

  // API state with mock fallbacks
  const [progress,        setProgress]        = useState(null);
  const [moodHistory,     setMoodHistory]     = useState([]);
  const [programs,        setPrograms]        = useState([]);
  const [activityHistory, setActivityHistory] = useState([]);
  const [loading,         setLoading]         = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      // Fetch all in parallel; each has its own fallback
      const [progressRes, checkInRes, programsRes] = await Promise.allSettled([
        mhService.getProgress(),
        mhService.getCheckInHistory(30),
        mhService.getPrograms(),
      ]);

      if (progressRes.status === 'fulfilled') {
        const data = progressRes.value?.data ?? progressRes.value;
        if (data) setProgress(data);
      }
      if (checkInRes.status === 'fulfilled') {
        const data = checkInRes.value?.data ?? checkInRes.value;
        const history = Array.isArray(data) ? data : data?.checkIns ?? [];
        // Normalise to MOOD_HISTORY shape
        if (history.length > 0) {
          setMoodHistory(history.slice(0, 7).map((ci, i) => ({
            day:   i === 0 ? 'Today' : i === 1 ? 'Yesterday' : new Date(ci.createdAt || ci.date || '').toLocaleDateString('en-US', { weekday: 'long' }),
            emoji: MOCK_MOOD_HISTORY[Math.min(i, MOCK_MOOD_HISTORY.length - 1)]?.emoji ?? '😊',
            label: ci.mood ?? 'Good',
            score: ci.moodScore ?? 3,
            date:  new Date(ci.createdAt || ci.date || '').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          })));
        }
      }
      if (programsRes.status === 'fulfilled') {
        const data = programsRes.value?.data ?? programsRes.value;
        if (Array.isArray(data) && data.length > 0) setPrograms(data);
      }
      setLoading(false);
    })();
  }, [period]);

  return (
    <div className="max-w-[1280px] mx-auto px-5 md:px-16 py-8 pb-36 md:pb-12">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-3xl md:text-4xl text-[#171d1c] leading-tight">My Journey</h1>
          <p className="text-[#3c4948] mt-1">Your wellness history and progress</p>
        </div>
        <button className="hidden md:flex items-center gap-2 text-sm text-[#3c4948] bg-[#e9efee] px-4 py-2 rounded-full hover:bg-[#e4e9e8] transition-colors font-medium">
          <span className="material-symbols-outlined msym-sm">download</span>
          Export
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
          {[1,2,3].map(i => <div key={i} className="mw-card rounded-2xl h-40" />)}
        </div>
      ) : (
        <>
          {/* Bento grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="md:col-span-2">
              <WellnessOverview progress={progress} />
            </div>
            <div className="md:col-span-1 md:row-span-2">
              <MoodHistory moodHistory={moodHistory} />
            </div>
            <div className="md:col-span-2">
              <ProgramJourney programs={programs} />
            </div>
          </div>

          {/* Trends + Activity History */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TrendChart trendData={null} />
            <ActivityHistory
              activityHistory={activityHistory}
              filter={activityFilter}
              onFilter={setActivityFilter}
            />
          </div>
        </>
      )}
    </div>
  );
}
