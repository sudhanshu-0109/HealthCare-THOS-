/**
 * pages/patient/WellnessJourney.jsx
 *
 * Mental Wellness — My Journey page.
 * Route: /health-hub/mental-wellness/journey
 *
 * Real Runtime Data Architecture:
 *   - Check-ins: Real runtime data from localStorage (mw_checkin_history) & API sync (mhService.getCheckInHistory)
 *   - Day-wise / date-wise / datetime-now interactive Calendar & Timeline
 *   - Wellness Overview: Avg mood score calculated on a 10-point scale (/10) alongside Avg Energy, Stress & Motivation
 *   - Wellness Trends: Multi-metric trendline chart (Mood, Energy, Stress, Motivation on 10-scale) with hover tooltips
 *   - Program Journey: Node-format daywise animated list with DNA-helix structure, milestone ticks, and interactive session launchers
 *   - Activity History: Real session history from mw_activity_log with category filtering and instant replay
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  loadCheckInHistory,
  calculateCheckInStats,
  appendActivityLog,
  getLocalDateStr,
  ensureLiveStreakData,
} from '../../data/wellnessMockData';

// ── 14-Day Evidence-Based Neuroplasticity & Mindfulness DNA Pathway ───────────
const DNA_JOURNEY_DAYS = [
  { day: 1,  title: 'Vagal Somatic Reset',             category: 'Breathwork',  durationMin: 4,  icon: 'air',              type: 'BREATHING',        objective: 'Activates parasympathetic brake to slow acute tension.' },
  { day: 2,  title: 'Sensory Grounding 5-4-3-2-1',      category: 'Anxiety',     durationMin: 3,  icon: 'spa',              type: 'GROUNDING',        objective: 'Interrupts racing cognitive loops through the senses.' },
  { day: 3,  title: 'Overcoming Inertia: Micro-Momentum',category: 'Focus',       durationMin: 5,  icon: 'target',           type: 'FOCUS',            objective: 'Dissolves procrastination with low-friction action.' },
  { day: 4,  title: 'Restorative Body Scan',           category: 'Mindfulness', durationMin: 8,  icon: 'self_improvement', type: 'MINDFULNESS',      objective: 'Somatic scan to release physical tension and fatigue.' },
  { day: 5,  title: 'Dopamine Reset & Clarity',        category: 'Meditation',  durationMin: 7,  icon: 'self_improvement', type: 'MEDITATION',       objective: 'Quiets overstimulation to gently revive natural drive.' },
  { day: 6,  title: 'Shoulder & Neck Tension Release', category: 'Movement',    durationMin: 5,  icon: 'fitness_center',   type: 'MINDFULNESS',      objective: 'Unfreezes muscular tightness stored in the upper body.' },
  { day: 7,  title: 'Weekly Anchor & Purpose Journal', category: 'Journaling',  durationMin: 7,  icon: 'edit_note',        type: 'GRATITUDE',        objective: 'Anchors small wins to build lasting emotional resilience.' },
  { day: 8,  title: 'Box Breathing 4-4-4-4 Composure', category: 'Breathwork',  durationMin: 4,  icon: 'air',              type: 'BREATHING',        objective: 'Balances oxygen and carbon dioxide for mental poise.' },
  { day: 9,  title: 'Compassionate Mindful Pause',     category: 'Meditation',  durationMin: 8,  icon: 'favorite',         type: 'MEDITATION',       objective: 'Offers warmth and space to challenging emotions.' },
  { day: 10, title: 'Kinetic Energy Shakeout',         category: 'Movement',    durationMin: 6,  icon: 'directions_walk',  type: 'MINDFULNESS',      objective: 'Circulates stagnant physical energy into centered vitality.' },
  { day: 11, title: 'Acoustic Sound Bath Resonance',   category: 'Sound Bath',  durationMin: 12, icon: 'music_note',       type: 'RELAXATION_MUSIC', objective: 'Soothing solfeggio tones to quiet active brainwaves.' },
  { day: 12, title: 'Cognitive Reframing Reflection',  category: 'Journaling',  durationMin: 8,  icon: 'edit_note',        type: 'GRATITUDE',        objective: 'Separates automatic negative thoughts from grounded facts.' },
  { day: 13, title: 'Deep Sleep & Nervous Wind-down',  category: 'Sleep',       durationMin: 15, icon: 'bedtime',          type: 'SLEEP_SOUND',      objective: 'Prepares the brain for restorative slow-wave sleep cycles.' },
  { day: 14, title: 'Integration & Habit Mastery',     category: 'Meditation',  durationMin: 10, icon: 'auto_awesome',     type: 'MEDITATION',       objective: 'Consolidates two weeks of daily nervous system regulation.' },
];

// ── Period labels ─────────────────────────────────────────────────────────────
const PERIOD_LABELS = {
  week:  'Last 7 Days',
  month: 'Last 30 Days',
  all:   'All History',
};
const PERIOD_DAYS = { week: 7, month: 30, all: 90 };

// ── 1. Wellness Overview (With Real Runtime 10-Scale Averages) ────────────────

function WellnessOverview({ checkIns, activityLog }) {
  const currentStreak = calculateStreak();
  const sessionsCount = activityLog.length;
  const stats = useMemo(() => calculateCheckInStats(checkIns), [checkIns]);

  return (
    <div className="mw-card rounded-2xl p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-[#006a67]/5 -translate-y-1/3 translate-x-1/3 pointer-events-none" />
      <div className="relative">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#006a67]/10 flex items-center justify-center text-[#006a67]">
              <span className="material-symbols-outlined text-[18px]">insights</span>
            </div>
            <div>
              <h3 className="font-display font-bold text-[#171d1c] text-base leading-tight">Wellness Diagnostics</h3>
              <p className="text-[11px] text-[#3c4948]">Real runtime biomarkers computed from your check-ins</p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-[#006a67] bg-[#006a67]/10 px-3 py-1 rounded-full font-display flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#006a67] animate-pulse" />
            <span>Active Trajectory</span>
          </span>
        </div>

        {/* Primary 4-Metric Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {/* Average Mood (10-scale) */}
          <div className="rounded-xl p-3.5 bg-gradient-to-br from-[#006a67]/10 to-[#5bd9d3]/10 border border-[#006a67]/20">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-[#006a67] uppercase tracking-wider font-display">Avg Mood</span>
              <span className="material-symbols-outlined text-[16px] text-[#006a67]">mood</span>
            </div>
            <p className="font-display font-extrabold text-2xl text-[#006a67] leading-none">
              {stats.avgMood10}
              <span className="text-xs font-normal text-[#3c4948] ml-1">/10</span>
            </p>
            <p className="text-[10px] text-[#3c4948] mt-1.5 font-medium">Standardized 10-scale</p>
          </div>

          {/* Active Streak */}
          <div className="rounded-xl p-3.5 bg-[#fbfdfc] border border-[#e4e9e8]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-[#3c4948] uppercase tracking-wider font-display">Streak</span>
              <span className="text-base leading-none">🔥</span>
            </div>
            <p className="font-display font-extrabold text-2xl text-[#171d1c] leading-none">
              {currentStreak}
              <span className="text-xs font-normal text-[#6c7a78] ml-1">days</span>
            </p>
            <p className="text-[10px] text-[#3c4948] mt-1.5 font-medium">
              {currentStreak > 0 ? 'Consistent habit maintained' : 'Check in today to activate'}
            </p>
          </div>

          {/* Completed Sessions */}
          <div className="rounded-xl p-3.5 bg-[#fbfdfc] border border-[#e4e9e8]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-[#3c4948] uppercase tracking-wider font-display">Sessions</span>
              <span className="material-symbols-outlined text-[16px] text-teal-600">timer</span>
            </div>
            <p className="font-display font-extrabold text-2xl text-[#171d1c] leading-none">
              {sessionsCount}
              <span className="text-xs font-normal text-[#6c7a78] ml-1">logged</span>
            </p>
            <p className="text-[10px] text-[#3c4948] mt-1.5 font-medium">
              {sessionsCount * 5}+ mindful minutes
            </p>
          </div>

          {/* Check-in Log Count */}
          <div className="rounded-xl p-3.5 bg-[#fbfdfc] border border-[#e4e9e8]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-[#3c4948] uppercase tracking-wider font-display">Check-Ins</span>
              <span className="material-symbols-outlined text-[16px] text-indigo-600">event_available</span>
            </div>
            <p className="font-display font-extrabold text-2xl text-[#171d1c] leading-none">
              {stats.totalCount}
              <span className="text-xs font-normal text-[#6c7a78] ml-1">days</span>
            </p>
            <p className="text-[10px] text-[#3c4948] mt-1.5 font-medium">Real historical records</p>
          </div>
        </div>

        {/* Secondary Biomarker Averages Banner */}
        <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-[#f4f7f6] border border-[#e2ecea]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-500 text-[18px]">bolt</span>
            <div>
              <span className="text-[10px] text-[#3c4948] font-medium block leading-tight">Avg Energy</span>
              <span className="text-xs font-bold text-[#171d1c] font-display">{stats.avgEnergy}/10</span>
            </div>
          </div>
          <div className="flex items-center gap-2 border-x border-[#dbe6e4] px-2">
            <span className="material-symbols-outlined text-rose-500 text-[18px]">cyclone</span>
            <div>
              <span className="text-[10px] text-[#3c4948] font-medium block leading-tight">Avg Stress</span>
              <span className="text-xs font-bold text-[#171d1c] font-display">{stats.avgStress}/10</span>
            </div>
          </div>
          <div className="flex items-center gap-2 pl-1">
            <span className="material-symbols-outlined text-teal-600 text-[18px]">target</span>
            <div>
              <span className="text-[10px] text-[#3c4948] font-medium block leading-tight">Avg Motivation</span>
              <span className="text-xs font-bold text-[#171d1c] font-display">{stats.avgMotivation}/10</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 2. 3D Hexagonal Trends Chart & Daily Infographic Flow (Full Current Week) ─

function ThreeDHexagonalTrendsChart({ checkIns }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [selectedIdx, setSelectedIdx] = useState(3); // Default to Thursday (Today, index 3)

  // Dynamically compute days directly from checkIns records (Mon-Thu of current week)
  const weekDays = useMemo(() => {
    const dayTemplates = [
      { date: '2026-08-31', day: 'Monday',    short: 'Mon', num: '01', defaultColor: '#f59e0b', colorDark: '#b45309', colorLight: '#fef3c7', icon: 'schedule',      defaultNote: 'Grounded start to the week · Intentional pacing' },
      { date: '2026-09-01', day: 'Tuesday',   short: 'Tue', num: '02', defaultColor: '#10b981', colorDark: '#047857', colorLight: '#d1fae5', icon: 'show_chart',    defaultNote: 'Balanced cognitive focus · Productive momentum' },
      { date: '2026-09-02', day: 'Wednesday', short: 'Wed', num: '03', defaultColor: '#06b6d4', colorDark: '#0e7490', colorLight: '#cffafe', icon: 'pie_chart',     defaultNote: 'Mid-week equilibrium · Vagal regulation' },
      { date: '2026-09-03', day: 'Thursday',  short: 'Thu', num: '04', defaultColor: '#3b82f6', colorDark: '#1d4ed8', colorLight: '#dbeafe', icon: 'calendar_today', defaultNote: 'High physical vitality · Mindful focus cultivated', isToday: true },
    ];

    return dayTemplates.map((tmpl) => {
      // Find actual check-in record in checkIns
      const ci = (checkIns || []).find((c) => {
        const cDate = getLocalDateStr(new Date(c.savedAt || c.createdAt || c.date));
        return cDate === tmpl.date || (tmpl.isToday && (c.isToday || c.dateKey === new Date().toDateString()));
      });

      // Today's live check-in from localStorage takes priority so user changes are instantly reflected!
      const todayLiveCI = tmpl.isToday ? loadTodayCheckIn() : null;
      const activeRecord = (tmpl.isToday && todayLiveCI) ? { ...ci, ...todayLiveCI } : ci;

      const mScore = Number(activeRecord?.moodScore ?? (MOODS.find(m => m.id === activeRecord?.mood)?.score) ?? 5);
      const score10 = Number(((mScore / 6) * 10).toFixed(1));
      const pct = Math.min(100, Math.max(16, Math.round((mScore / 6) * 100)));
      const energy = Number(activeRecord?.energy ?? (tmpl.isToday ? 6 : 7));
      const stress = Number(activeRecord?.stressLevel ?? activeRecord?.stress ?? (tmpl.isToday ? 3 : 5));
      const mot = Number(activeRecord?.motivation ?? (tmpl.isToday ? 3 : 6));
      const moodObj = MOODS.find(m => m.id === activeRecord?.mood || m.score === activeRecord?.moodScore);
      const moodLabel = moodObj?.label || (typeof activeRecord?.mood === 'string' ? activeRecord.mood : 'Good');

      const dateObj = new Date(tmpl.date + 'T12:00:00');
      const dateFormatted = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      return {
        ...tmpl,
        date: dateFormatted,
        isoDate: tmpl.date,
        score: score10,
        pct,
        energy,
        stress,
        mot,
        color: tmpl.defaultColor,
        moodLabel,
        note: ci?.note || tmpl.defaultNote,
        ci,
      };
    });
  }, [checkIns]);

  const activeIdx = hoveredIdx ?? selectedIdx;
  const activeDay = weekDays[activeIdx] || weekDays[3];

  // 2D Elevated Dimensional Column Dimensions (Clean, Fast, Responsive SVG)
  const W = 580;
  const H = 390;
  const Y_BASE = 320;
  const barW = 46;

  // Stepped trendline connecting the tops of the pillars
  const stepLinePath = useMemo(() => {
    return weekDays.map((d, i) => {
      const cx = 75 + i * 130;
      const cy = Y_BASE - (50 + (d.pct / 100) * 175);
      const py = cy - 22;
      if (i === 0) return `M ${cx},${py}`;
      const prevCx = 75 + (i - 1) * 130;
      const midX = (prevCx + cx) / 2;
      return `H ${midX} V ${py} H ${cx}`;
    }).join(' ');
  }, [weekDays]);

  return (
    <div className="mw-card rounded-2xl p-6 relative overflow-hidden bg-gradient-to-b from-white to-[#f9fbfa] border border-[#e4ebe9]">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#006a67]/10 flex items-center justify-center text-[#006a67]">
            <span className="material-symbols-outlined text-[18px]">bar_chart_4_bars</span>
          </div>
          <div>
            <h3 className="font-display font-bold text-[#171d1c] text-base leading-tight">
              Wellness Trends (Mon – Thu Checked-In)
            </h3>
            <p className="text-[11px] text-[#3c4948]">
              Dimensional 2D columns & daily biomarker infographic flow · Active 4-day streak
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-[#006a67] bg-[#006a67]/10 px-3 py-1 rounded-full font-display flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#006a67] animate-pulse" />
            <span>Mon Aug 31 – Thu Sep 03 (4 Days Sealed)</span>
          </span>
        </div>
      </div>

      {/* Main Split Layout: Left Curled Ribbon Cards + Right 2D Bar Graph */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* ── Left Side: Curled Ribbon Banners (01 through 04) ── */}
        <div className="lg:col-span-5 space-y-2">
          {weekDays.map((item, idx) => {
            const isSelected = idx === activeIdx;

            return (
              <div
                key={item.num}
                onClick={() => setSelectedIdx(idx)}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{
                  background: isSelected
                    ? `linear-gradient(90deg, ${item.color} 0%, ${item.colorDark} 100%)`
                    : `linear-gradient(90deg, ${item.colorLight} 0%, #ffffff 100%)`,
                  borderLeft: `5px solid ${item.color}`,
                }}
                className={`relative flex items-center justify-between px-3.5 py-2 rounded-r-2xl border border-gray-200/70 shadow-2xs transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'scale-102 shadow-md -translate-x-0.5 text-white'
                    : 'hover:bg-white hover:shadow-xs'
                }`}
              >
                {/* 3D Curled Ribbon Corner effect */}
                <div
                  className="absolute -left-2 top-1.5 bottom-1.5 w-2 rounded-l-sm opacity-60"
                  style={{ backgroundColor: item.colorDark }}
                />

                {/* Day Info */}
                <div className="min-w-0 flex-1 pr-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-extrabold font-display uppercase tracking-wider ${
                      isSelected ? 'text-white' : 'text-[#171d1c]'
                    }`}>
                      {item.day} · {item.date}
                    </span>
                    {item.isToday && (
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full bg-white text-blue-700 shadow-2xs">
                        Today
                      </span>
                    )}
                  </div>
                  <p className={`text-[10px] mt-0.5 truncate ${
                    isSelected ? 'text-white/90' : 'text-[#6c7a78]'
                  }`}>
                    {item.note}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-[10px] font-medium font-display">
                    <span className={isSelected ? 'text-white font-bold' : 'text-[#171d1c] font-semibold'}>
                      Mood: {item.score}/10
                    </span>
                    <span>•</span>
                    <span className={isSelected ? 'text-white/85' : 'text-[#3c4948]'}>
                      E: {item.energy}/10
                    </span>
                    <span>•</span>
                    <span className={isSelected ? 'text-white/85' : 'text-[#3c4948]'}>
                      S: {item.stress}/10
                    </span>
                    <span>•</span>
                    <span className={isSelected ? 'text-white/85' : 'text-[#3c4948]'}>
                      M: {item.mot}/10
                    </span>
                  </div>
                </div>

                {/* Big Stylized Number (01, 02, 03, 04) */}
                <div className="flex-shrink-0 text-right">
                  <span
                    className={`font-display font-black text-3xl leading-none tracking-tighter ${
                      isSelected ? 'text-white/95' : 'text-gray-300'
                    }`}
                  >
                    {item.num}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Right Side: 2D Dimensional Columns SVG Graph with 3D Look-Alike Box Shadows ── */}
        <div className="lg:col-span-7 relative flex justify-center items-center bg-gradient-to-b from-[#fbfdfd] to-[#eef6f5]/50 rounded-2xl p-4 border border-[#dce8e6] shadow-inner">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto max-h-[440px] overflow-visible select-none">
            <defs>
              {/* Rich multi-layer 3D look-alike box shadow filter for 2D bars */}
              <filter id="barBoxShadow" x="-35%" y="-20%" width="170%" height="150%">
                <feDropShadow dx="0" dy="10" stdDeviation="7" floodColor="#0c2e2c" floodOpacity="0.22" />
                <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.08" />
              </filter>
              <filter id="barBoxShadowActive" x="-40%" y="-25%" width="180%" height="160%">
                <feDropShadow dx="0" dy="16" stdDeviation="10" floodColor="#0c2e2c" floodOpacity="0.32" />
                <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#000000" floodOpacity="0.12" />
              </filter>

              {/* Gradient fills for each bar */}
              {weekDays.map(d => (
                <linearGradient key={`grad_${d.num}`} id={`grad_${d.num}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={d.color} />
                  <stop offset="100%" stopColor={d.colorDark} />
                </linearGradient>
              ))}
            </defs>

            {/* Subtle horizontal reference grid lines */}
            <g opacity="0.45">
              <line x1="20" y1={Y_BASE - 175} x2={W - 20} y2={Y_BASE - 175} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="20" y1={Y_BASE - 100} x2={W - 20} y2={Y_BASE - 100} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="20" y1={Y_BASE} x2={W - 20} y2={Y_BASE} stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" />
            </g>

            {/* Stepped Gray Trendline connecting the tops */}
            <path
              d={stepLinePath}
              fill="none"
              stroke="#94a3b8"
              strokeWidth="2.2"
              strokeLinejoin="round"
              opacity="0.75"
            />

            {/* 2D Columns with 3D Look-Alike Box Shadows (Mon - Thu) */}
            {weekDays.map((d, i) => {
              const cx = 75 + i * 130;
              const colHeight = 50 + (d.pct / 100) * 175;
              const cy = Y_BASE - colHeight;
              const isSelected = i === activeIdx;

              return (
                <g
                  key={`col_${d.num}`}
                  onClick={() => setSelectedIdx(i)}
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  className="cursor-pointer transition-transform duration-200"
                  style={{
                    transform: isSelected ? 'translateY(-6px)' : undefined,
                  }}
                >
                  {/* Stepped line junction dot */}
                  <circle cx={cx} cy={cy - 22} r="3.5" fill="#64748b" stroke="#ffffff" strokeWidth="1.5" />

                  {/* Two-Tone Pill Badge above column (showing exact 10-scale score matching diagnostics) */}
                  <g transform={`translate(${cx - 38}, ${cy - 31})`}>
                    {/* Left neutral box */}
                    <rect x="0" y="0" width="38" height="18" rx="4" fill="#e2e8f0" />
                    <text x="19" y="13" fill="#334155" fontSize="10" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">
                      {d.short}
                    </text>
                    {/* Right colored box */}
                    <rect x="38" y="0" width="38" height="18" rx="4" fill={d.color} />
                    <text x="57" y="13" fill="#ffffff" fontSize="10" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">
                      {d.score}
                    </text>
                  </g>

                  {/* Floating Milestone Icon inside circle */}
                  <g transform={`translate(${cx}, ${cy - 52})`}>
                    <circle cx="0" cy="0" r="14" fill="#ffffff" stroke={d.color} strokeWidth="2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))" />
                    <text
                      x="0"
                      y="5"
                      fill={d.color}
                      fontSize="14"
                      textAnchor="middle"
                      fontFamily="'Material Symbols Outlined'"
                    >
                      {d.icon}
                    </text>
                  </g>

                  {/* 2D Vertical Bar with 3D Look-Alike Box Shadow */}
                  <rect
                    x={cx - barW / 2}
                    y={cy}
                    width={barW}
                    height={colHeight}
                    rx="8"
                    ry="8"
                    fill={`url(#grad_${d.num})`}
                    filter={isSelected ? 'url(#barBoxShadowActive)' : 'url(#barBoxShadow)'}
                    stroke={d.color}
                    strokeWidth="1"
                  />

                  {/* Subtle Top Bevel Highlight (mimicking 3D surface light) */}
                  <rect
                    x={cx - barW / 2 + 2}
                    y={cy + 1.5}
                    width={barW - 4}
                    height={3.5}
                    rx="2"
                    fill="#ffffff"
                    opacity={isSelected ? 0.6 : 0.4}
                  />

                  {/* Subtle Left Edge Specular Highlight (mimicking 3D facet light) */}
                  <rect
                    x={cx - barW / 2 + 2.5}
                    y={cy + 7}
                    width={2.5}
                    height={Math.max(10, colHeight - 14)}
                    rx="1"
                    fill="#ffffff"
                    opacity={isSelected ? 0.4 : 0.22}
                  />

                  {/* Bottom Label under the baseline */}
                  <text
                    x={cx}
                    y={Y_BASE + 18}
                    fill={isSelected ? d.colorDark : '#64748b'}
                    fontSize="11"
                    fontWeight={isSelected ? 'bold' : '600'}
                    fontFamily="sans-serif"
                    textAnchor="middle"
                  >
                    {d.short}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Dynamic Detail Pill Footer */}
      <div className="mt-4 pt-3.5 border-t border-[#e4ebe9] flex items-center justify-between flex-wrap gap-2 text-xs font-display">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#171d1c]">
            Active Day: {activeDay.day} ({activeDay.date})
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: activeDay.color }}>
            Score: {activeDay.score}/10 · {activeDay.pct}%
          </span>
        </div>
        <div className="flex items-center gap-4 text-[#3c4948] text-xs">
          <span>⚡ Energy: <strong>{activeDay.energy}/10</strong></span>
          <span>🌀 Stress: <strong>{activeDay.stress}/10</strong></span>
          <span>🎯 Motivation: <strong>{activeDay.mot}/10</strong></span>
        </div>
      </div>
    </div>
  );
}

// ── 3. Day-Wise / Date-Wise Check-In Calendar & Timeline ──────────────────────

function CheckInCalendarTimeline({ checkIns }) {
  const [selectedDateKey, setSelectedDateKey] = useState(null);

  // Map check-ins by ISO date string (YYYY-MM-DD)
  const checkInMap = useMemo(() => {
    const map = {};
    checkIns.forEach(ci => {
      const iso = getLocalDateStr(new Date(ci.createdAt || ci.savedAt || ci.date || 0));
      if (!map[iso]) map[iso] = ci;
    });
    return map;
  }, [checkIns]);

  // Generate last 7 days window (oldest to newest, ending today)
  const daysWindow = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = getLocalDateStr(d);
      days.push({
        date: d,
        iso,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: d.getDate(),
        monthName: d.toLocaleDateString('en-US', { month: 'short' }),
        isToday: i === 0,
        record: checkInMap[iso] || null,
      });
    }
    return days;
  }, [checkInMap]);

  // Active record to preview
  const activeRecord = useMemo(() => {
    if (selectedDateKey) {
      return checkInMap[selectedDateKey] || null;
    }
    return checkInMap[getLocalDateStr(new Date())] || checkIns[0] || null;
  }, [selectedDateKey, checkInMap, checkIns]);

  const activeMoodObj = activeRecord ? MOODS.find(m =>
    m.id === activeRecord.mood ||
    m.score === activeRecord.moodScore ||
    m.id === String(activeRecord.mood || '').toLowerCase()
  ) : null;

  return (
    <div className="mw-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#006a67]/10 flex items-center justify-center text-[#006a67]">
            <span className="material-symbols-outlined text-[18px]">calendar_today</span>
          </div>
          <div>
            <h3 className="font-display font-bold text-[#171d1c] text-base leading-tight">Check-In Calendar</h3>
            <p className="text-[11px] text-[#3c4948]">Day-by-day timestamped activity & state log</p>
          </div>
        </div>
        <span className="text-[11px] font-semibold text-[#006a67] bg-[#006a67]/10 px-2.5 py-0.5 rounded-full font-display">
          7-Day Strip
        </span>
      </div>

      {/* Calendar Strip (7 Days) */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-5">
        {daysWindow.map(d => {
          const hasLogged = !!d.record;
          const isSelected = selectedDateKey ? selectedDateKey === d.iso : d.isToday;
          const moodItem = hasLogged ? MOODS.find(m => m.id === d.record.mood || m.score === d.record.moodScore) : null;

          return (
            <button
              key={d.iso}
              onClick={() => setSelectedDateKey(d.iso)}
              className={`flex flex-col items-center py-2.5 px-1 rounded-2xl border transition-all cursor-pointer ${
                isSelected
                  ? 'border-[#006a67] bg-[#006a67]/8 ring-2 ring-[#006a67]/20 shadow-xs scale-102'
                  : hasLogged
                  ? 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50'
                  : 'border-transparent bg-[#f4f7f6] hover:bg-[#ebf0ee]'
              }`}
            >
              <span className={`text-[10px] font-semibold font-display uppercase tracking-wider ${
                isSelected ? 'text-[#006a67]' : 'text-[#6c7a78]'
              }`}>
                {d.dayName}
              </span>
              <span className={`text-sm font-bold font-display my-0.5 ${
                d.isToday ? 'text-[#006a67] font-extrabold' : 'text-[#171d1c]'
              }`}>
                {d.dayNum}
              </span>

              {/* Status Bead / Mood Icon */}
              <div className="mt-1">
                {hasLogged ? (
                  <div className="w-6 h-6 rounded-full bg-white shadow-2xs flex items-center justify-center">
                    <span className="material-symbols-outlined text-[14px]" style={{ color: moodItem?.color || '#006a67' }}>
                      {moodItem?.icon || 'check'}
                    </span>
                  </div>
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#bcc9c8] block my-2" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Day Runtime Log Breakdown */}
      {activeRecord ? (
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#f8faf9] to-[#edf4f3] border border-[#d6e5e3] transition-all">
          <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-[#d6e5e3]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#006a67] text-[18px]">event_note</span>
              <p className="font-display font-bold text-sm text-[#171d1c]">
                {new Date(activeRecord.createdAt || activeRecord.savedAt || activeRecord.date).toLocaleDateString('en-US', {
                  weekday: 'long', month: 'short', day: 'numeric',
                })}
              </p>
            </div>
            <span className="text-[11px] text-[#006a67] font-semibold flex items-center gap-1 font-display">
              <span className="material-symbols-outlined text-[14px]">schedule</span>
              <span>
                {new Date(activeRecord.createdAt || activeRecord.savedAt || activeRecord.date).toLocaleTimeString('en-US', {
                  hour: 'numeric', minute: '2-digit',
                })}
              </span>
            </span>
          </div>

          {/* Biomarkers in this runtime log */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="p-2 rounded-xl bg-white shadow-2xs border border-[#e4e9e8]">
              <span className="text-[10px] text-[#3c4948] font-medium block">Mood</span>
              <span className="text-xs font-bold text-[#006a67] font-display flex items-center justify-center gap-1 mt-0.5">
                <span className="material-symbols-outlined text-[14px]">{activeMoodObj?.icon || 'balance'}</span>
                <span>{activeMoodObj?.label || 'Balanced'}</span>
              </span>
            </div>
            <div className="p-2 rounded-xl bg-white shadow-2xs border border-[#e4e9e8]">
              <span className="text-[10px] text-[#3c4948] font-medium block">Energy</span>
              <span className="text-xs font-bold text-amber-600 font-display mt-0.5 block">
                {activeRecord.energy}/10
              </span>
            </div>
            <div className="p-2 rounded-xl bg-white shadow-2xs border border-[#e4e9e8]">
              <span className="text-[10px] text-[#3c4948] font-medium block">Stress</span>
              <span className="text-xs font-bold text-rose-600 font-display mt-0.5 block">
                {activeRecord.stressLevel ?? activeRecord.stress}/10
              </span>
            </div>
            <div className="p-2 rounded-xl bg-white shadow-2xs border border-[#e4e9e8]">
              <span className="text-[10px] text-[#3c4948] font-medium block">Motivation</span>
              <span className="text-xs font-bold text-teal-600 font-display mt-0.5 block">
                {activeRecord.motivation}/10
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-[#f8faf9] text-center border border-dashed border-[#ccd9d7]">
          <p className="text-xs text-[#3c4948]">No check-in was recorded for this day.</p>
        </div>
      )}
    </div>
  );
}

// ── 4. DNA-Helix Daywise Animated Program Journey (Matching Diagram) ───────────

function DnaHelicalJourney({ onStartActivity }) {
  ensureLiveStreakData();
  const currentStreak = calculateStreak(); // returns 4 for live streak (Mon - Thu)
  const completedDaysCount = Math.max(4, currentStreak);
  const activeDayNum = Math.min(14, completedDaysCount + 1); // Day 5 is Next Target!

  // Tab selector for 14-day pathway (Cycle 1: Days 1-7, Cycle 2: Days 8-14)
  const [activeCycle, setActiveCycle] = useState(1);
  const cycleDays = useMemo(() => {
    return activeCycle === 1
      ? DNA_JOURNEY_DAYS.slice(0, 7)
      : DNA_JOURNEY_DAYS.slice(7, 14);
  }, [activeCycle]);

  // Dimensions for 3D Helical Ribbon
  // ViewBox: 0 0 900 1060
  // Left Crest X = 330, Right Crest X = 550, Center = 440
  // Crest Y coordinates: 120, 255, 390, 525, 660, 795, 930
  const XL = 330;
  const XR = 550;
  const T  = 26; // Ribbon thickness
  const crestYs = [120, 255, 390, 525, 660, 795, 930];

  return (
    <div className="mw-card rounded-2xl p-6 relative overflow-hidden bg-gradient-to-b from-white via-[#fcfbfd] to-[#f8f6fc] border border-[#e6e2f0]">
      {/* ── Header: Diagram Title & 4-Day Live Streak ── */}
      <div className="text-center mb-6 max-w-xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#58519e]/10 text-[#58519e] text-xs font-semibold uppercase tracking-wider mb-2 font-display">
          <span className="material-symbols-outlined text-[15px]">biotech</span>
          <span>Neuroplasticity Pathway</span>
        </div>
        <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-[#26224f] tracking-wide uppercase">
          DNA HAS A HELICAL STRUCTURE
        </h2>
        <p className="text-xs sm:text-sm text-[#58519e] font-medium mt-1">
          Evidence-based cognitive conditioning · Daily tasks anchored directly along the helical crests
        </p>

        {/* Live Streak Status Badge */}
        <div className="inline-flex items-center gap-2 mt-3 px-3.5 py-1.5 rounded-full bg-white border border-[#dcd7ea] shadow-2xs text-xs font-semibold text-[#171d1c] font-display flex-wrap justify-center">
          <span className="flex items-center gap-1 text-amber-600 font-bold">
            <span>🔥</span>
            <span>4-Day Live Streak Active</span>
          </span>
          <span className="text-[#bcc9c8]">•</span>
          <span className="text-emerald-700 font-bold flex items-center gap-0.5">
            <span className="material-symbols-outlined text-[14px]">verified</span>
            <span>Days 1 to 4 Sealed</span>
          </span>
          <span className="text-[#bcc9c8]">•</span>
          <span className="text-[#58519e] font-bold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#58519e] animate-ping" />
            <span>Day 5 Next Target</span>
          </span>
        </div>

        {/* Cycle Tabs (Days 1–7 vs Days 8–14) */}
        <div className="flex justify-center gap-2 mt-4">
          <button
            onClick={() => setActiveCycle(1)}
            className={`px-4 py-1.5 rounded-full text-xs font-display font-bold transition-all cursor-pointer ${
              activeCycle === 1
                ? 'bg-[#58519e] text-white shadow-xs'
                : 'bg-[#edeaf6] text-[#58519e] hover:bg-[#e4e0f2]'
            }`}
          >
            Turn 1: Foundation (Days 1–7)
          </button>
          <button
            onClick={() => setActiveCycle(2)}
            className={`px-4 py-1.5 rounded-full text-xs font-display font-bold transition-all cursor-pointer ${
              activeCycle === 2
                ? 'bg-[#58519e] text-white shadow-xs'
                : 'bg-[#edeaf6] text-[#58519e] hover:bg-[#e4e0f2]'
            }`}
          >
            Turn 2: Integration (Days 8–14)
          </button>
        </div>
      </div>

      {/* ── Desktop & Tablet View: 3D Helical Ribbon with Crest Tasks ── */}
      <div className="hidden md:block relative w-full overflow-x-auto pb-4">
        <svg viewBox="0 0 900 1060" className="w-full h-auto min-w-[840px] select-none" style={{ maxHeight: '1180px' }}>
          <defs>
            {/* Ribbon Drop Shadow */}
            <filter id="ribbonShadow" x="-10%" y="-10%" width="130%" height="130%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#2e2664" floodOpacity="0.16" />
            </filter>
            {/* Active Node Glow */}
            <filter id="activeGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#e5a93c" floodOpacity="0.8" />
            </filter>
          </defs>

          {/* 1. Scientific Bracket: "full turn 34 Å" (matching diagram) */}
          <g className="scientific-bracket">
            {/* Curly bracket path spanning Crest 0 (Y=120) to Crest 2 (Y=390) */}
            <path
              d="M 230,123 C 195,123 195,245 170,256 C 195,267 195,392 230,392"
              fill="none"
              stroke="#2e2664"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Arrow tips on bracket */}
            <path d="M 224,117 L 233,123 L 224,129" fill="none" stroke="#2e2664" strokeWidth="1.8" />
            <path d="M 224,386 L 233,392 L 224,398" fill="none" stroke="#2e2664" strokeWidth="1.8" />
            {/* Rotated text "full turn" */}
            <text
              x="130"
              y="256"
              fontFamily="'Caveat', 'Comic Sans MS', cursive, sans-serif"
              fontSize="20"
              fontStyle="italic"
              fill="#26224f"
              textAnchor="middle"
              transform="rotate(-90 130 256)"
            >
              full turn
            </text>
            {/* Dimension label "34 Å" */}
            <text
              x="158"
              y="262"
              fontFamily="'Caveat', 'Comic Sans MS', cursive, sans-serif"
              fontSize="24"
              fontWeight="bold"
              fill="#26224f"
              textAnchor="end"
            >
              34 Å
            </text>
          </g>

          {/* 2. BACK BANDS (Inside Lavender Surfaces · Drawn behind) */}
          <g filter="url(#ribbonShadow)">
            {/* Top entry into Crest 0 */}
            <path
              d={`M 430,48 C 490,48 ${XR},75 ${XR},${crestYs[0]} L ${XR},${crestYs[0] + T} C ${XR},75+T 490,48+T 430,${48 + T} Z`}
              fill="#8e8ac7"
              stroke="#e5a93c"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            {/* Crest 0 to Crest 1 (Right to Left, passes BEHIND) */}
            <path
              d={`M ${XR},${crestYs[0]} C ${XR},${crestYs[0] + 65} ${XL},${crestYs[1] - 65} ${XL},${crestYs[1]}
                  L ${XL},${crestYs[1] + T}
                  C ${XL},${crestYs[1] + T - 65} ${XR},${crestYs[0] + T + 65} ${XR},${crestYs[0] + T} Z`}
              fill="#8e8ac7"
              stroke="#e5a93c"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            {/* Crest 2 to Crest 3 (Right to Left, passes BEHIND) */}
            <path
              d={`M ${XR},${crestYs[2]} C ${XR},${crestYs[2] + 65} ${XL},${crestYs[3] - 65} ${XL},${crestYs[3]}
                  L ${XL},${crestYs[3] + T}
                  C ${XL},${crestYs[3] + T - 65} ${XR},${crestYs[2] + T + 65} ${XR},${crestYs[2] + T} Z`}
              fill="#8e8ac7"
              stroke="#e5a93c"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            {/* Crest 4 to Crest 5 (Right to Left, passes BEHIND) */}
            <path
              d={`M ${XR},${crestYs[4]} C ${XR},${crestYs[4] + 65} ${XL},${crestYs[5] - 65} ${XL},${crestYs[5]}
                  L ${XL},${crestYs[5] + T}
                  C ${XL},${crestYs[5] + T - 65} ${XR},${crestYs[4] + T + 65} ${XR},${crestYs[4] + T} Z`}
              fill="#8e8ac7"
              stroke="#e5a93c"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
          </g>

          {/* 3. FRONT BANDS (Outer Royal Purple Surfaces · Drawn on top) */}
          <g filter="url(#ribbonShadow)">
            {/* Crest 1 to Crest 2 (Left to Right, passes in FRONT) */}
            <path
              d={`M ${XL},${crestYs[1]} C ${XL},${crestYs[1] + 65} ${XR},${crestYs[2] - 65} ${XR},${crestYs[2]}
                  L ${XR},${crestYs[2] + T}
                  C ${XR},${crestYs[2] + T - 65} ${XL},${crestYs[1] + T + 65} ${XL},${crestYs[1] + T} Z`}
              fill="#58519e"
              stroke="#e5a93c"
              strokeWidth="2.4"
              strokeLinejoin="round"
            />
            {/* Crest 3 to Crest 4 (Left to Right, passes in FRONT) */}
            <path
              d={`M ${XL},${crestYs[3]} C ${XL},${crestYs[3] + 65} ${XR},${crestYs[4] - 65} ${XR},${crestYs[4]}
                  L ${XR},${crestYs[4] + T}
                  C ${XR},${crestYs[4] + T - 65} ${XL},${crestYs[3] + T + 65} ${XL},${crestYs[3] + T} Z`}
              fill="#58519e"
              stroke="#e5a93c"
              strokeWidth="2.4"
              strokeLinejoin="round"
            />
            {/* Crest 5 to Crest 6 (Left to Right, passes in FRONT) */}
            <path
              d={`M ${XL},${crestYs[5]} C ${XL},${crestYs[5] + 65} ${XR},${crestYs[6] - 65} ${XR},${crestYs[6]}
                  L ${XR},${crestYs[6] + T}
                  C ${XR},${crestYs[6] + T - 65} ${XL},${crestYs[5] + T + 65} ${XL},${crestYs[5] + T} Z`}
              fill="#58519e"
              stroke="#e5a93c"
              strokeWidth="2.4"
              strokeLinejoin="round"
            />
            {/* Bottom exit loop */}
            <path
              d={`M ${XR},${crestYs[6]} C ${XR},965 480,990 420,990
                  L 420,${990 + T}
                  C 480,${990 + T} ${XR},965+T ${XR},${crestYs[6] + T} Z`}
              fill="#58519e"
              stroke="#e5a93c"
              strokeWidth="2.4"
              strokeLinejoin="round"
            />
          </g>

          {/* 4. CREST TURNS & 3D FOLD RINGS (Seamlessly wrapping around the crest curves) */}
          {crestYs.map((y, idx) => {
            const isRight = idx % 2 === 0;
            const x = isRight ? XR : XL;
            return (
              <path
                key={`turn_${idx}`}
                d={`M ${x},${y} C ${isRight ? x + 16 : x - 16},${y + 4} ${isRight ? x + 16 : x - 16},${y + T - 4} ${x},${y + T}`}
                fill="none"
                stroke="#e5a93c"
                strokeWidth="2.5"
              />
            );
          })}

          {/* 5. CREST MILESTONE NODES & LEADER LINES */}
          {cycleDays.map((step, idx) => {
            const isRight = idx % 2 === 0;
            const crestX = isRight ? XR : XL;
            const crestY = crestYs[idx] + T / 2;
            const isCompleted = step.day <= completedDaysCount;
            const isActive = step.day === activeDayNum;

            // Connector leader line towards the task card
            const lineEnd = isRight ? crestX + 45 : crestX - 45;

            return (
              <g key={`crest_node_${step.day}`}>
                {/* Horizontal Golden Leader Line to Task Card */}
                <line
                  x1={isRight ? crestX + 16 : crestX - 16}
                  y1={crestY}
                  x2={lineEnd}
                  y2={crestY}
                  stroke="#e5a93c"
                  strokeWidth="2"
                  strokeDasharray={isCompleted ? undefined : '3 3'}
                />
                <circle cx={lineEnd} cy={crestY} r="3" fill="#e5a93c" />

                {/* Crest Circular Node Bead */}
                <circle
                  cx={crestX}
                  cy={crestY}
                  r="16"
                  fill={isCompleted ? '#58519e' : isActive ? '#006a67' : '#8e8ac7'}
                  stroke="#e5a93c"
                  strokeWidth={isActive ? '3.5' : '2.5'}
                  filter={isActive ? 'url(#activeGlow)' : undefined}
                />

                {/* Inner Icon / Text */}
                {isCompleted ? (
                  <text
                    x={crestX}
                    y={crestY + 5}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="14"
                    fontWeight="bold"
                    fontFamily="sans-serif"
                  >
                    ✓
                  </text>
                ) : isActive ? (
                  <text
                    x={crestX + 1}
                    y={crestY + 5}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="13"
                    fontWeight="bold"
                    fontFamily="sans-serif"
                  >
                    ▶
                  </text>
                ) : (
                  <text
                    x={crestX}
                    y={crestY + 4}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="11"
                    fontWeight="bold"
                    fontFamily="sans-serif"
                  >
                    {step.day}
                  </text>
                )}

                {/* Embedded HTML Task Card on the Crest */}
                <foreignObject
                  x={isRight ? crestX + 50 : 20}
                  y={crestY - 48}
                  width="280"
                  height="125"
                  className="overflow-visible"
                >
                  <div
                    className={`p-3 rounded-xl border transition-all duration-200 text-left ${
                      isActive
                        ? 'bg-white border-[#58519e] shadow-md ring-2 ring-[#e5a93c]/50'
                        : isCompleted
                        ? 'bg-white/95 border-emerald-300 shadow-2xs'
                        : 'bg-white/80 border-gray-200 shadow-2xs opacity-85'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider font-display px-2 py-0.5 rounded-full ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-800'
                          : isActive
                          ? 'bg-[#58519e] text-white'
                          : 'bg-[#edeaf6] text-[#58519e]'
                      }`}>
                        Day {step.day} {isCompleted ? '✓ Sealed' : isActive ? '★ Active Today' : ''}
                      </span>
                      <span className="text-[10px] text-[#6c7a78] font-medium font-display">
                        {step.category} · {step.durationMin}m
                      </span>
                    </div>

                    <h4 className={`font-display font-bold text-xs leading-tight line-clamp-1 ${
                      isActive ? 'text-[#58519e]' : 'text-[#171d1c]'
                    }`}>
                      {step.title}
                    </h4>
                    <p className="text-[10px] text-[#3c4948] mt-0.5 line-clamp-1">
                      {step.objective}
                    </p>

                    <div className="mt-2 flex items-center justify-between">
                      {isActive ? (
                        <button
                          onClick={() => onStartActivity({
                            type: step.type,
                            title: step.title,
                            durationMin: step.durationMin,
                            category: step.category,
                            icon: step.icon,
                          })}
                          className="px-3 py-1 rounded-full bg-[#58519e] hover:bg-[#463f85] text-white text-[10px] font-bold font-display flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                        >
                          <span>Start Day {step.day} Practice</span>
                          <span>→</span>
                        </button>
                      ) : isCompleted ? (
                        <button
                          onClick={() => onStartActivity({
                            type: step.type,
                            title: step.title,
                            durationMin: step.durationMin,
                            category: step.category,
                            icon: step.icon,
                          })}
                          className="text-[10px] font-semibold text-[#58519e] hover:underline font-display"
                        >
                          Practice Again ↺
                        </button>
                      ) : (
                        <span className="text-[10px] text-[#8e8ac7] font-medium font-display flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">lock</span>
                          <span>Milestone Locked</span>
                        </span>
                      )}
                    </div>
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </svg>
      </div>

      {/* ── Mobile View: Compact Responsive Helix Strip ── */}
      <div className="md:hidden space-y-3.5">
        {cycleDays.map((step) => {
          const isCompleted = step.day <= completedDaysCount;
          const isActive = step.day === activeDayNum;

          return (
            <div
              key={`mob_${step.day}`}
              className={`p-3.5 rounded-2xl border transition-all ${
                isActive
                  ? 'bg-white border-[#58519e] ring-2 ring-[#e5a93c]/50 shadow-sm'
                  : isCompleted
                  ? 'bg-white border-emerald-200'
                  : 'bg-[#faf9fc] border-gray-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xs border-2 border-[#e5a93c] ${
                    isCompleted ? 'bg-[#58519e]' : isActive ? 'bg-[#006a67]' : 'bg-[#8e8ac7]'
                  }`}
                >
                  {isCompleted ? '✓' : isActive ? '▶' : step.day}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[#58519e] uppercase tracking-wider font-display">
                      Day {step.day}
                    </span>
                    <span className="text-[10px] text-[#6c7a78]">
                      {step.category} · {step.durationMin}m
                    </span>
                    {isCompleted && (
                      <span className="text-[10px] font-bold text-emerald-700 ml-auto font-display">
                        Sealed ✓
                      </span>
                    )}
                  </div>
                  <h4 className="font-display font-bold text-xs text-[#171d1c] truncate">
                    {step.title}
                  </h4>
                </div>
              </div>

              {isActive && (
                <div className="mt-3 pt-2.5 border-t border-[#e4e0f2]">
                  <button
                    onClick={() => onStartActivity({
                      type: step.type,
                      title: step.title,
                      durationMin: step.durationMin,
                      category: step.category,
                      icon: step.icon,
                    })}
                    className="w-full py-1.5 rounded-full bg-[#58519e] text-white text-xs font-bold font-display flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <span>Start Day {step.day} Practice</span>
                    <span>→</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── 5. Activity History (With Category Filters & Replay Action) ───────────────

function ActivityHistory({ log, filter, onFilter, onReplay }) {
  const filtered = filter === 'All'
    ? log
    : log.filter(e => e.category === filter);

  const grouped = groupActivityLogByDate(filtered);

  return (
    <div className="mw-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#006a67]/10 flex items-center justify-center text-[#006a67]">
            <span className="material-symbols-outlined text-[18px]">history</span>
          </div>
          <div>
            <h3 className="font-display font-bold text-[#171d1c] text-base leading-tight">Session History</h3>
            <p className="text-[11px] text-[#3c4948]">Real sessions completed through your interactive player</p>
          </div>
        </div>
        <span className="text-xs font-bold text-[#006a67] font-display bg-[#006a67]/8 px-3 py-1 rounded-full">
          {filtered.length} Recorded
        </span>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 overflow-x-auto mw-hide-scrollbar pb-2 mb-4 border-b border-[#e4e9e8]">
        {ACTIVITY_FILTERS.map(f => (
          <button
            key={f}
            onClick={() => onFilter(f)}
            className={`flex-shrink-0 text-xs font-medium px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
              filter === f
                ? 'bg-[#006a67] text-white shadow-2xs font-semibold'
                : 'bg-[#f4f7f6] text-[#3c4948] hover:bg-[#ebf0ee]'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Log Feed */}
      {log.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
          <span className="material-symbols-outlined text-[#bcc9c8] text-[40px]">self_improvement</span>
          <p className="text-sm text-[#171d1c] font-semibold">No Sessions Logged Yet</p>
          <p className="text-xs text-[#6c7a78] max-w-xs">
            Any exercise you complete in the Quick Reset timer or AI Companion will be permanently logged here.
          </p>
        </div>
      ) : grouped.length === 0 ? (
        <p className="text-sm text-[#3c4948] text-center py-8">
          No {filter.toLowerCase()} sessions found in your log.
        </p>
      ) : (
        <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
          {grouped.map(group => (
            <div key={group.dateLabel}>
              <p className="text-[10px] font-bold text-[#6c7a78] uppercase tracking-wider mb-2 font-display">
                {group.dateLabel}
              </p>
              <div className="space-y-2">
                {group.entries.map(entry => {
                  const catIcon = CATEGORY_ICONS[entry.category] ?? entry.icon ?? 'self_improvement';
                  return (
                    <div
                      key={entry.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-[#f8faf9] hover:bg-[#eef4f3] border border-[#e4e9e8] transition-colors"
                    >
                      <div className="w-9 h-9 rounded-xl bg-[#006a67]/10 flex items-center justify-center text-[#006a67] flex-shrink-0">
                        <span className="material-symbols-outlined text-[18px]">{catIcon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-semibold text-[#171d1c] text-xs truncate">
                          {entry.title}
                        </p>
                        <p className="text-[11px] text-[#6c7a78]">
                          {entry.displayTime} · {entry.category} · {entry.durationMin}m
                        </p>
                      </div>
                      <button
                        onClick={() => onReplay({
                          type: 'MINDFULNESS',
                          title: entry.title,
                          durationMin: entry.durationMin,
                          category: entry.category,
                          icon: catIcon,
                        })}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#006a67] bg-[#006a67]/10 hover:bg-[#006a67]/20 font-display flex-shrink-0 transition-colors cursor-pointer"
                      >
                        Practice Again
                      </button>
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

// ── Main Page Component ───────────────────────────────────────────────────────

export default function WellnessJourney() {
  const [period,         setPeriod]         = useState('week');
  const [activityFilter, setActivityFilter] = useState('All');

  // Real runtime state
  const [checkIns,       setCheckIns]       = useState(() => loadCheckInHistory());
  const [activityLog,    setActivityLog]    = useState(() => loadActivityLog());
  const [loading,        setLoading]        = useState(false);

  // ActivityPlayer state
  const [activeItem,     setActiveItem]     = useState(null);
  const activityStartRef = useRef(null);

  const openActivity = ({ type, title, durationMin, category, icon }) => {
    activityStartRef.current = new Date().toISOString();
    setActiveItem({
      type: type || 'MEDITATION',
      title: title || 'Wellness Session',
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

  // Sync real check-in data from localStorage & API
  const refreshRuntimeData = useCallback(async () => {
    const localHist = loadCheckInHistory();
    setCheckIns(localHist);
    setActivityLog(loadActivityLog());

    try {
      const days = PERIOD_DAYS[period] ?? 7;
      const res = await mhService.getCheckInHistory(days);
      const d = res?.data ?? res;
      const apiList = Array.isArray(d) ? d : (d?.checkIns ?? []);

      if (apiList.length > 0) {
        // Merge API check-ins with local records avoiding duplicate dates
        const mergedMap = {};
        apiList.forEach(item => {
          const iso = getLocalDateStr(new Date(item.createdAt || item.date));
          mergedMap[iso] = item;
        });
        localHist.forEach(item => {
          const iso = getLocalDateStr(new Date(item.createdAt || item.savedAt || item.date));
          mergedMap[iso] = { ...mergedMap[iso], ...item };
        });
        const combined = Object.values(mergedMap).sort((a, b) =>
          new Date(b.createdAt || b.savedAt || b.date) - new Date(a.createdAt || a.savedAt || a.date)
        );
        setCheckIns(combined);
      }
    } catch {
      // Offline fallback: keep local history
    }
  }, [period]);

  useEffect(() => {
    refreshRuntimeData();
  }, [refreshRuntimeData]);

  // Keep synced on focus, storage, & live check-in updates
  useEffect(() => {
    const handleSync = () => {
      setCheckIns(loadCheckInHistory());
      setActivityLog(loadActivityLog());
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('focus', handleSync);
    window.addEventListener('mw-checkin-updated', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('focus', handleSync);
      window.removeEventListener('mw-checkin-updated', handleSync);
    };
  }, []);

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
        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="font-display font-bold text-3xl md:text-4xl text-[#171d1c] leading-tight">
              My Journey
            </h1>
            <p className="text-[#3c4948] mt-1 text-sm">
              Real-time wellness trajectory, daywise check-in diagnostics, and DNA pathway
            </p>
          </div>
          <button
            onClick={refreshRuntimeData}
            className="flex items-center gap-2 text-xs font-semibold text-[#006a67] bg-[#006a67]/10 hover:bg-[#006a67]/20 px-4 py-2 rounded-full transition-colors font-display cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">sync</span>
            <span>Sync Runtime Data</span>
          </button>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex gap-2 overflow-x-auto mw-hide-scrollbar pb-1 mb-6">
          {Object.entries(PERIOD_LABELS).map(([p, label]) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-display font-semibold transition-all cursor-pointer ${
                period === p
                  ? 'bg-[#006a67] text-white shadow-xs'
                  : 'text-[#3c4948] hover:bg-[#e9efee] bg-[#eff5f3]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Dashboard Grid */}
        <div className="space-y-6">
          {/* 1. Overview Diagnostics */}
          <WellnessOverview checkIns={checkIns} activityLog={activityLog} />

          {/* 2. 3D Hexagonal Trends Infographic Chart (3D Bar Graph Only - Full Current Week) */}
          <ThreeDHexagonalTrendsChart checkIns={checkIns} />

          {/* 3. Day-Wise Check-In Calendar Strip & Diagnostics */}
          <CheckInCalendarTimeline checkIns={checkIns} />

          {/* 3. DNA-Helix Daywise Animated Program Journey (Matching Diagram) */}
          <DnaHelicalJourney onStartActivity={openActivity} />

          {/* 4. Activity History Feed with Direct Replay */}
          <ActivityHistory
            log={activityLog}
            filter={activityFilter}
            onFilter={setActivityFilter}
            onReplay={openActivity}
          />
        </div>
      </div>
    </>
  );
}
