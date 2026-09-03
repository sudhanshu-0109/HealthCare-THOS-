/**
 * data/wellnessMockData.js
 *
 * STATIC CONFIGURATION ONLY — not mock/fake dynamic data.
 *
 * This file contains:
 *   - MOODS        : static mood scale definition (enum-like)
 *   - QUICK_RESET  : static UI config for Quick Reset cards (activity types + durations)
 *   - CATEGORIES   : static UI config for Explore categories grid
 *   - ACTIVITY_FILTERS : filter labels for activity history
 *   - CATEGORY_ICONS   : icon name lookup for categories
 *   - QUICK_TOOLS      : companion sidebar tools
 *   - SUGGESTION_CHIPS : companion AI suggestion chips
 *
 * Dynamic data (check-ins, programs, conversations, progress, activity history,
 * mood history, recommendations) is fetched from the API in each page component.
 * localStorage key "mw_activity_log" stores the local session activity history.
 */

// ── Mood scale (static enum — never changes) ─────────────────────────────────
export const MOODS = [
  { id: 'overwhelmed', label: 'Overwhelmed', emoji: '😫', score: 1 },
  { id: 'low',         label: 'Low',         emoji: '😔', score: 2 },
  { id: 'neutral',     label: 'Neutral',     emoji: '😐', score: 3 },
  { id: 'okay',        label: 'Okay',        emoji: '🙂', score: 4 },
  { id: 'good',        label: 'Good',        emoji: '😊', score: 5 },
  { id: 'thriving',    label: 'Thriving',    emoji: '✨', score: 6 },
];

// ── Quick Reset activity cards (static UI config — duration drives timer) ─────
// duration is in MINUTES — this is what gets passed to ActivityPlayer as item.duration
export const QUICK_RESET = [
  { id: 'qr1', title: '4-7-8 Breathing',     durationMin: 4,  type: 'BREATHING',   category: 'Breathwork',  icon: 'air',              bg: 'bg-[#006a67]/8'  },
  { id: 'qr2', title: '2-min Body Scan',      durationMin: 2,  type: 'MINDFULNESS', category: 'Mindfulness', icon: 'self_improvement', bg: 'bg-[#e9efee]'    },
  { id: 'qr3', title: 'Grounding 5-4-3-2-1',  durationMin: 3,  type: 'GROUNDING',   category: 'Anxiety',     icon: 'spa',              bg: 'bg-[#ffdbca]/50' },
  { id: 'qr4', title: 'Mindful Pause',         durationMin: 1,  type: 'MINDFULNESS', category: 'Mindfulness', icon: 'timer',            bg: 'bg-[#7bf6f0]/20' },
  { id: 'qr5', title: 'Shoulder Release',      durationMin: 3,  type: 'MINDFULNESS', category: 'Movement',    icon: 'fitness_center',   bg: 'bg-[#fadfb7]/50' },
];

// ── Explore category grid (static UI config) ──────────────────────────────────
// defaultDurationMin is the default ActivityPlayer duration for that category
export const CATEGORIES = [
  { id: 'c1', label: 'Mindfulness', icon: 'spa',              defaultDurationMin: 10, type: 'MINDFULNESS',       iconBg: 'bg-[#006a67]/10',        iconColor: 'text-[#006a67]'        },
  { id: 'c2', label: 'Breathwork',  icon: 'air',              defaultDurationMin: 4,  type: 'BREATHING',          iconBg: 'bg-[#ffdbca]/60',        iconColor: 'text-[#904c21]'        },
  { id: 'c3', label: 'Sleep',       icon: 'bedtime',          defaultDurationMin: 20, type: 'SLEEP_SOUND',        iconBg: 'bg-[#dee4e2]',           iconColor: 'text-[#3c4948]'        },
  { id: 'c4', label: 'Movement',    icon: 'directions_walk',  defaultDurationMin: 10, type: 'MINDFULNESS',        iconBg: 'bg-[#fadfb7]/60',        iconColor: 'text-[#6f5b3c]'        },
  { id: 'c5', label: 'Journaling',  icon: 'edit_note',        defaultDurationMin: 7,  type: 'GRATITUDE',          iconBg: 'bg-[#7bf6f0]/20',        iconColor: 'text-[#006a67]'        },
  { id: 'c6', label: 'Sound Bath',  icon: 'music_note',       defaultDurationMin: 15, type: 'RELAXATION_MUSIC',   iconBg: 'bg-[#ffdbca]/50',        iconColor: 'text-[#904c21]'        },
  { id: 'c7', label: 'Meditation',  icon: 'self_improvement', defaultDurationMin: 10, type: 'MEDITATION',         iconBg: 'bg-[#006a67]/10',        iconColor: 'text-[#006a67]'        },
  { id: 'c8', label: 'Body Scan',   icon: 'accessibility_new',defaultDurationMin: 10, type: 'MINDFULNESS',        iconBg: 'bg-[#fadfb7]/40',        iconColor: 'text-[#6f5b3c]'        },
];

// ── Activity history filters ──────────────────────────────────────────────────
export const ACTIVITY_FILTERS = ['All', 'Breathwork', 'Meditation', 'Movement', 'Journaling', 'Sleep', 'Mindfulness', 'Anxiety'];

// ── Category → icon name lookup ───────────────────────────────────────────────
export const CATEGORY_ICONS = {
  Breathwork:  'air',
  Meditation:  'self_improvement',
  Movement:    'directions_walk',
  Journaling:  'edit_note',
  Sleep:       'bedtime',
  Mindfulness: 'spa',
  Anxiety:     'spa',
  'Sound Bath':'music_note',
  'Body Scan': 'accessibility_new',
};

// ── Companion sidebar quick tools ─────────────────────────────────────────────
export const QUICK_TOOLS = [
  { id: 't1', label: 'Box Breathing',   icon: 'air',              type: 'BREATHING',   durationMin: 4,  category: 'Breathwork' },
  { id: 't2', label: 'Quick Journal',   icon: 'edit_note',        type: 'GRATITUDE',   durationMin: 7,  category: 'Journaling' },
  { id: 't3', label: 'Meditation',      icon: 'self_improvement', type: 'MEDITATION', durationMin: 10, category: 'Meditation' },
  { id: 't4', label: 'Sleep Wind-down', icon: 'bedtime',          type: 'SLEEP_SOUND', durationMin: 20, category: 'Sleep' },
  { id: 't5', label: 'Body Stretch',    icon: 'fitness_center',   type: 'MINDFULNESS', durationMin: 5,  category: 'Movement' },
  { id: 't6', label: 'Crisis Line',     icon: 'support_agent',    type: null,          durationMin: 0,  category: 'Crisis' },
];

// ── Companion suggestion chips ────────────────────────────────────────────────
export const SUGGESTION_CHIPS = [
  "I'm feeling anxious",
  'Help me sleep tonight',
  'I need a quick reset',
  'How was my week?',
  'Talk about stress',
];

// ── Mood → recommended activity type mapping (fallback) ───────────────────────
export const MOOD_TO_REC = {
  overwhelmed: { type: 'GROUNDING',   title: 'Grounding 5-4-3-2-1', durationMin: 3,  category: 'Anxiety',     icon: 'spa',              intensity: 'Gentle',     description: 'Anchor yourself in the present moment through your senses when everything feels too much.' },
  low:         { type: 'MINDFULNESS', title: 'Gentle Body Scan',    durationMin: 8,  category: 'Mindfulness', icon: 'self_improvement', intensity: 'Gentle',     description: 'Light, compassionate attention to how your body is feeling right now.' },
  neutral:     { type: 'MINDFULNESS', title: 'Mindful Check-In',    durationMin: 5,  category: 'Mindfulness', icon: 'self_improvement', intensity: 'Light',      description: 'A brief guided reflection to tune into how you actually feel and what you need.' },
  okay:        { type: 'BREATHING',   title: 'Focus Breathwork',    durationMin: 4,  category: 'Breathwork',  icon: 'air',              intensity: 'Light',      description: 'Box breathing to sharpen your attention and sustain productive flow.' },
  good:        { type: 'MEDITATION',  title: 'Morning Meditation',  durationMin: 10, category: 'Meditation',  icon: 'self_improvement', intensity: 'Moderate',   description: 'Deepen your positive state and set an intentional, grounded tone for the day.' },
  thriving:    { type: 'GRATITUDE',   title: 'Gratitude Practice',  durationMin: 7,  category: 'Journaling',  icon: 'edit_note',        intensity: 'Reflective', description: "Capture and amplify what is working — build on today's momentum." },
};

/**
 * Multi-factor recommendation algorithm taking mood, energy, stress, and motivation into account.
 * Returns an array of 3 tailored recommendations with reasons.
 * @param {{ mood: string, energy: number, stress: number, motivation: number }} params
 * @returns {Array<{ id: string, type: string, title: string, durationMin: number, category: string, icon: string, intensity: string, description: string, reason: string }>}
 */
export function getPersonalizedRecommendations({ mood, energy = 5, stress = 5, motivation = 5 }) {
  const m = String(mood || 'neutral').toLowerCase();
  const s = Number(stress || 5);
  const e = Number(energy || 5);
  const mot = Number(motivation || 5);

  // 1. High Stress or Overwhelmed (Priority: Parasympathetic down-regulation & sensory grounding)
  if (s >= 7 || m === 'overwhelmed') {
    return [
      {
        id: 'rec_stress_1',
        type: 'BREATHING',
        title: '4-7-8 Breathing Reset',
        durationMin: 4,
        category: 'Breathwork',
        icon: 'air',
        intensity: 'Gentle',
        reason: `Targeted for Stress ${s}/10`,
        description: 'Activates the parasympathetic vagus nerve to rapidly slow heart rate and lower acute tension.',
      },
      {
        id: 'rec_stress_2',
        type: 'GROUNDING',
        title: 'Grounding 5-4-3-2-1',
        durationMin: 3,
        category: 'Anxiety',
        icon: 'spa',
        intensity: 'Gentle',
        reason: 'Sensory Anchor',
        description: 'Anchors awareness into the physical present through sight, touch, and sound to halt stress spirals.',
      },
      {
        id: 'rec_stress_3',
        type: 'MINDFULNESS',
        title: 'Shoulder & Jaw Release',
        durationMin: 5,
        category: 'Movement',
        icon: 'fitness_center',
        intensity: 'Gentle',
        reason: 'Physical Decompression',
        description: 'Releases stored cortisol and muscular tension in your neck, shoulders, and upper back.',
      },
    ];
  }

  // 2. Low Energy + High Stress (Exhausted / Burnout: Needs soothing deep rest)
  if (e <= 4 && s >= 6) {
    return [
      {
        id: 'rec_burnout_1',
        type: 'MINDFULNESS',
        title: 'Restorative Body Scan',
        durationMin: 8,
        category: 'Mindfulness',
        icon: 'self_improvement',
        intensity: 'Gentle',
        reason: `Low Energy (${e}/10) & Stress (${s}/10)`,
        description: 'A deeply resting guided scan to soothe emotional fatigue and replenish drained reserves.',
      },
      {
        id: 'rec_burnout_2',
        type: 'SLEEP_SOUND',
        title: 'Nervous System Wind-down',
        durationMin: 12,
        category: 'Sleep',
        icon: 'bedtime',
        intensity: 'Restorative',
        reason: 'Deep Recovery',
        description: 'Warm soothing frequencies and ambient rain to quiet mental chatter and allow deep relaxation.',
      },
      {
        id: 'rec_burnout_3',
        type: 'MINDFULNESS',
        title: 'Mindful Breathing Pause',
        durationMin: 2,
        category: 'Mindfulness',
        icon: 'timer',
        intensity: 'Light',
        reason: 'Zero-Demand Reset',
        description: 'A brief, effortless 2-minute breath pause that asks nothing of you except comfortable stillness.',
      },
    ];
  }

  // 3. Low Energy + Low/Moderate Stress (Fatigued / Foggy: Needs gentle oxygenation & renewal)
  if (e <= 4 && s <= 5) {
    return [
      {
        id: 'rec_lowe_1',
        type: 'BREATHING',
        title: 'Energizing Breath Awakening',
        durationMin: 4,
        category: 'Breathwork',
        icon: 'air',
        intensity: 'Light',
        reason: `Recharge Low Energy (${e}/10)`,
        description: 'Gentle oxygenating breaths to lift sluggish afternoon fatigue and clear mental fog without strain.',
      },
      {
        id: 'rec_lowe_2',
        type: 'MINDFULNESS',
        title: 'Gentle Morning Stretch',
        durationMin: 5,
        category: 'Movement',
        icon: 'directions_walk',
        intensity: 'Light',
        reason: 'Circulation Boost',
        description: 'Subtle fluid movements to awaken your spine, unfreeze joints, and boost natural vitality.',
      },
      {
        id: 'rec_lowe_3',
        type: 'GRATITUDE',
        title: 'Quiet Reflection & Reset',
        durationMin: 6,
        category: 'Journaling',
        icon: 'edit_note',
        intensity: 'Reflective',
        reason: 'Mindful Clarity',
        description: 'Reflective micro-prompts to regain clarity and reconnect with your personal rhythm.',
      },
    ];
  }

  // 4. Low Mood / Sadness (Needs compassionate support)
  if (m === 'low') {
    return [
      {
        id: 'rec_lowm_1',
        type: 'MEDITATION',
        title: 'Self-Compassion Meditation',
        durationMin: 8,
        category: 'Meditation',
        icon: 'self_improvement',
        intensity: 'Gentle',
        reason: 'Compassionate Care',
        description: 'A gentle, validating guided session offering warmth, space, and kindness to difficult emotions.',
      },
      {
        id: 'rec_lowm_2',
        type: 'MINDFULNESS',
        title: 'Comforting Body Scan',
        durationMin: 7,
        category: 'Mindfulness',
        icon: 'spa',
        intensity: 'Gentle',
        reason: 'Gentle Check-in',
        description: 'Soft somatic attention to ground yourself gently without forcing positive feelings.',
      },
      {
        id: 'rec_lowm_3',
        type: 'BREATHING',
        title: 'Calm Ocean Breath',
        durationMin: 4,
        category: 'Breathwork',
        icon: 'air',
        intensity: 'Gentle',
        reason: 'Emotional Ease',
        description: 'Rhythmic, oceanic breath cycles that create space and steady emotional equilibrium.',
      },
    ];
  }

  // 5. High Energy (Channeling vitality & flow)
  if (e >= 7 && s <= 6) {
    return [
      {
        id: 'rec_highe_1',
        type: 'FOCUS',
        title: 'Focused Flow Session',
        durationMin: 10,
        category: 'Focus',
        icon: 'target',
        intensity: 'Moderate',
        reason: `High Energy (${e}/10)`,
        description: 'Lock into deep, uninterrupted focus and channel your high vitality into meaningful progress.',
      },
      {
        id: 'rec_highe_2',
        type: 'MEDITATION',
        title: 'Clarity & Intention Meditation',
        durationMin: 7,
        category: 'Meditation',
        icon: 'self_improvement',
        intensity: 'Moderate',
        reason: 'Peak Alignment',
        description: 'Structure your day with razor-sharp mental alignment and purposeful intentionality.',
      },
      {
        id: 'rec_highe_3',
        type: 'MINDFULNESS',
        title: 'Dynamic Mindful Movement',
        durationMin: 8,
        category: 'Movement',
        icon: 'directions_walk',
        intensity: 'Active',
        reason: 'Physical Channeling',
        description: 'Active movement flow to ground physical energy and elevate body awareness.',
      },
    ];
  }

  // 6. Good / Thriving Mood
  if (m === 'thriving' || m === 'good') {
    return [
      {
        id: 'rec_thrive_1',
        type: 'GRATITUDE',
        title: 'Gratitude Anchor Practice',
        durationMin: 7,
        category: 'Journaling',
        icon: 'edit_note',
        intensity: 'Reflective',
        reason: 'Amplify Momentum',
        description: 'Capture what is going right today to build resilience and anchor your positive momentum.',
      },
      {
        id: 'rec_thrive_2',
        type: 'MEDITATION',
        title: 'Spacious Presence Meditation',
        durationMin: 10,
        category: 'Meditation',
        icon: 'self_improvement',
        intensity: 'Moderate',
        reason: 'Deepen Joy',
        description: 'An open-awareness practice to expand your state of wellbeing and inner harmony.',
      },
      {
        id: 'rec_thrive_3',
        type: 'RELAXATION_MUSIC',
        title: '432Hz Sound Bath Resonance',
        durationMin: 12,
        category: 'Sound Bath',
        icon: 'music_note',
        intensity: 'Restorative',
        reason: 'Harmonic Alignment',
        description: 'Harmonic tuning frequencies to soak in feeling good and ground your day.',
      },
    ];
  }

  // 7. Balanced / Neutral State (Default)
  return [
    {
      id: 'rec_balanced_1',
      type: 'MINDFULNESS',
      title: 'Mindful Equilibrium Reset',
      durationMin: 5,
      category: 'Mindfulness',
      icon: 'self_improvement',
      intensity: 'Light',
      reason: 'Centered Balance',
      description: 'A brief, centered reflection to harmonize your energy and focus for the rest of the day.',
    },
    {
      id: 'rec_balanced_2',
      type: 'BREATHING',
      title: 'Box Breathing 4-4-4-4',
      durationMin: 4,
      category: 'Breathwork',
      icon: 'air',
      intensity: 'Light',
      reason: 'Mental Clarity',
      description: 'The proven 4-part breath cycle used by athletes and leaders to sharpen mental composure.',
    },
    {
      id: 'rec_balanced_3',
      type: 'GRATITUDE',
      title: 'Daily Intentions Journal',
      durationMin: 6,
      category: 'Journaling',
      icon: 'edit_note',
      intensity: 'Reflective',
      reason: 'Purposeful Focus',
      description: 'Quick thoughtful prompts to define what truly matters today and let go of the rest.',
    },
  ];
}

// ── localStorage helpers ──────────────────────────────────────────────────────
const LOG_KEY      = 'mw_activity_log';
const CHECKIN_KEY  = 'mw_daily_checkin';
const DATES_KEY    = 'mw_checkin_dates';
const PROGRESS_KEY = 'mw_progress_cache';

// ── Check-in persistence & Streak Calculation ─────────────────────────────────

/**
 * Returns local date in YYYY-MM-DD format (avoids UTC timezone shift bugs).
 * @param {Date|number|string} date
 * @returns {string}
 */
export function getLocalDateStr(date = new Date()) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates the current consecutive streak (in days) ending today or yesterday.
 * - If user checked in today: count consecutive days backwards ending today.
 * - If user checked in yesterday (and hasn't checked in today yet): count consecutive days backwards ending yesterday (streak is active and remains intact for today!).
 * - If user missed yesterday: streak is broken and returns 0.
 * @returns {number}
 */
export function calculateStreak() {
  try {
    const rawDates = localStorage.getItem(DATES_KEY);
    const dates = rawDates ? JSON.parse(rawDates) : [];
    
    // Also consider today's active check-in if present
    const todayCI = loadTodayCheckIn();
    const todayStr = getLocalDateStr(new Date());
    
    const dateSet = new Set(dates);
    if (todayCI) {
      dateSet.add(todayStr);
    }
    
    if (dateSet.size === 0) {
      return 0;
    }

    const uniqueSorted = Array.from(dateSet).sort().reverse();
    const yesterdayDate = new Date(Date.now() - 86400000);
    const yesterdayStr = getLocalDateStr(yesterdayDate);

    const latest = uniqueSorted[0];
    
    // Streak is alive ONLY if the most recent check-in was today OR yesterday
    if (latest !== todayStr && latest !== yesterdayStr) {
      return 0; // Streak broken: user missed yesterday
    }

    // Count consecutive days backward starting from latest check-in
    let streak = 1;
    let expected = new Date(latest + 'T12:00:00');

    for (let i = 1; i < uniqueSorted.length; i++) {
      expected.setDate(expected.getDate() - 1);
      const expectedStr = getLocalDateStr(expected);
      if (uniqueSorted[i] === expectedStr) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  } catch {
    return loadTodayCheckIn() ? 1 : 0;
  }
}

/**
 * Save today's check-in to localStorage, updates check-in date history, and calculates streak.
 * The entry is automatically considered stale after midnight.
 * @param {{ mood: string, moodScore: number, energy: number, stressLevel: number, motivation: number }} data
 * @returns {number} The updated streak count
 */
export function saveCheckIn(data) {
  try {
    const now = new Date();
    const todayIso = getLocalDateStr(now);
    const dateKey = now.toDateString();

    localStorage.setItem(CHECKIN_KEY, JSON.stringify({
      ...data,
      savedAt: now.toISOString(),
      dateKey, // e.g. "Wed Sep 02 2026"
    }));

    // Record today's date in streak date history
    const rawDates = localStorage.getItem(DATES_KEY);
    const dates = rawDates ? JSON.parse(rawDates) : [];
    if (!dates.includes(todayIso)) {
      dates.push(todayIso);
      localStorage.setItem(DATES_KEY, JSON.stringify(dates));
    }

    const newStreak = calculateStreak();

    // Immediately cache updated streak and progress
    const existingCache = loadProgressCache() || {};
    saveProgressCache({
      ...existingCache,
      currentStreak: newStreak,
      totalSessions: (existingCache.totalSessions || 0) + 1,
      averageMoodScore: data.moodScore || existingCache.averageMoodScore || 4,
    });

    return newStreak;
  } catch {
    return 1;
  }
}

/**
 * Load today's check-in from localStorage.
 * Returns null if no check-in was saved, or if it was saved on a different day.
 * @returns {{ mood, moodScore, energy, stressLevel, motivation, savedAt } | null}
 */
export function loadTodayCheckIn() {
  try {
    const raw = localStorage.getItem(CHECKIN_KEY);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    // Expire at midnight — compare date strings
    if (entry.dateKey !== new Date().toDateString()) {
      localStorage.removeItem(CHECKIN_KEY);
      return null;
    }
    return entry;
  } catch {
    return null;
  }
}

// ── Progress / streak caching ─────────────────────────────────────────────────

const PROGRESS_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Cache the progress/streak response from the API.
 * @param {{ currentStreak, totalSessions, averageMoodScore, ... }} data
 */
export function saveProgressCache(data) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({
      data,
      savedAt: Date.now(),
    }));
  } catch { /* ignore */ }
}

/**
 * Load the cached progress. Returns null if stale (> 1 hour) or missing.
 * @returns {{ currentStreak, totalSessions, averageMoodScore } | null}
 */
export function loadProgressCache() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    const streak = calculateStreak();
    if (!raw) {
      return streak > 0 ? { currentStreak: streak } : null;
    }
    const { data, savedAt } = JSON.parse(raw);
    if (Date.now() - savedAt > PROGRESS_TTL_MS) {
      return streak > 0 ? { currentStreak: streak } : null;
    }
    return {
      ...data,
      currentStreak: Math.max(data?.currentStreak || 0, streak),
    };
  } catch {
    const streak = calculateStreak();
    return streak > 0 ? { currentStreak: streak } : null;
  }
}



/**
 * Load this week's activity log from localStorage.
 * Entries older than 7 days are pruned automatically.
 * @returns {Array<{id, title, category, icon, durationMin, startedAt, completedAt, displayTime, displayDate}>}
 */
export function loadActivityLog() {
  try {
    const raw = localStorage.getItem(LOG_KEY);
    if (!raw) return [];
    const entries = JSON.parse(raw);
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000; // 7 days ago
    return entries.filter(e => new Date(e.completedAt).getTime() > cutoff);
  } catch {
    return [];
  }
}

/**
 * Append a completed activity to the localStorage log (keeps last 7 days).
 * @param {{ title: string, category: string, icon: string, durationMin: number, startedAt: string }} entry
 */
export function appendActivityLog(entry) {
  try {
    const existing = loadActivityLog();
    const now = new Date();
    const newEntry = {
      id:          `act_${Date.now()}`,
      title:       entry.title,
      category:    entry.category,
      icon:        entry.icon,
      durationMin: entry.durationMin,
      startedAt:   entry.startedAt,
      completedAt: now.toISOString(),
      /** "Meditation at 12:45 for 5 minutes" */
      displayTime: new Date(entry.startedAt).toLocaleTimeString('en-US', {
        hour: 'numeric', minute: '2-digit', hour12: true,
      }),
      displayDate: now.toLocaleDateString('en-US', {
        month: 'short', day: 'numeric',
      }),
    };
    const updated = [newEntry, ...existing].slice(0, 100); // keep max 100 entries
    localStorage.setItem(LOG_KEY, JSON.stringify(updated));
    return newEntry;
  } catch {
    return null;
  }
}

/**
 * Group activity log by date label ('Today', 'Yesterday', 'Mon Aug 30', …).
 * @param {Array} log
 * @returns {Array<{dateLabel: string, entries: Array}>}
 */
export function groupActivityLogByDate(log) {
  const today     = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  const groups    = {};

  for (const entry of log) {
    const d    = new Date(entry.completedAt);
    const key  = d.toDateString();
    let label;
    if      (key === today)     label = 'Today';
    else if (key === yesterday) label = 'Yesterday';
    else label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    if (!groups[key]) groups[key] = { dateLabel: label, entries: [] };
    groups[key].entries.push(entry);
  }

  return Object.values(groups);
}
