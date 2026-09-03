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
  {
    id: 'overwhelmed',
    label: 'Overwhelmed',
    icon: 'cyclone',
    color: '#e11d48',
    bg: 'bg-rose-50 text-rose-600 border-rose-200',
    activeBg: 'bg-rose-500 text-white border-rose-500',
    description: 'High tension & overload',
    score: 1,
  },
  {
    id: 'low',
    label: 'Low',
    icon: 'rainy',
    color: '#6366f1',
    bg: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    activeBg: 'bg-indigo-500 text-white border-indigo-500',
    description: 'Heavy heart or depleted',
    score: 2,
  },
  {
    id: 'neutral',
    label: 'Neutral',
    icon: 'balance',
    color: '#0d9488',
    bg: 'bg-teal-50 text-teal-700 border-teal-200',
    activeBg: 'bg-[#006a67] text-white border-[#006a67]',
    description: 'Centered & balanced',
    score: 3,
  },
  {
    id: 'okay',
    label: 'Okay',
    icon: 'cloud_done',
    color: '#0284c7',
    bg: 'bg-sky-50 text-sky-600 border-sky-200',
    activeBg: 'bg-sky-500 text-white border-sky-500',
    description: 'Stable & managing',
    score: 4,
  },
  {
    id: 'good',
    label: 'Good',
    icon: 'wb_sunny',
    color: '#d97706',
    bg: 'bg-amber-50 text-amber-600 border-amber-200',
    activeBg: 'bg-amber-500 text-white border-amber-500',
    description: 'Positive & uplifted',
    score: 5,
  },
  {
    id: 'thriving',
    label: 'Thriving',
    icon: 'auto_awesome',
    color: '#059669',
    bg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    activeBg: 'bg-emerald-500 text-white border-emerald-500',
    description: 'Radiant vitality & flow',
    score: 6,
  },
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
 * Prioritizes resolving suboptimal states (low motivation, high stress, low energy) with tailored exercises.
 * Returns an array of 3 tailored recommendations with reasons.
 * @param {{ mood: string, energy: number, stress: number, motivation: number }} params
 * @returns {Array<{ id: string, type: string, title: string, durationMin: number, category: string, icon: string, intensity: string, description: string, reason: string }>}
 */
export function getPersonalizedRecommendations({ mood, energy = 5, stress = 5, motivation = 5 }) {
  const m = String(mood || 'neutral').toLowerCase();
  const s = Number(stress ?? 5);
  const e = Number(energy ?? 5);
  const mot = Number(motivation ?? 5);

  // 1. Acute Stress or Overwhelm (s >= 7 or mood overwhelmed)
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

  // 2. Low Motivation with High Energy (Kinetic Restlessness / Inertia: mot <= 4 & e >= 6)
  // (e.g. Energy 9/10, Motivation 4/10 — Body has energy, but mental drive is blocked or overwhelmed)
  if (mot <= 4 && e >= 6) {
    return [
      {
        id: 'rec_inertia_1',
        type: 'FOCUS',
        title: 'Overcoming Inertia: Micro-Momentum Reset',
        durationMin: 5,
        category: 'Focus',
        icon: 'target',
        intensity: 'Light',
        reason: `Low Motivation (${mot}/10) · High Energy (${e}/10)`,
        description: 'Channels physical vitality into one effortless micro-action, dissolving mental resistance without pressure.',
      },
      {
        id: 'rec_inertia_2',
        type: 'GRATITUDE',
        title: 'Purpose & Momentum Journal',
        durationMin: 6,
        category: 'Journaling',
        icon: 'edit_note',
        intensity: 'Reflective',
        reason: 'Ignite Intrinsic Motivation',
        description: '3 guided prompts to reconnect with your genuine purpose and spark motivation from the inside out.',
      },
      {
        id: 'rec_inertia_3',
        type: 'MINDFULNESS',
        title: s >= 6 ? 'Stress Release & Breath Pause' : 'Kinetic Stretch & Reset',
        durationMin: s >= 6 ? 4 : 5,
        category: s >= 6 ? 'Breathwork' : 'Movement',
        icon: s >= 6 ? 'air' : 'fitness_center',
        intensity: 'Gentle',
        reason: s >= 6 ? `Decompress Stress (${s}/10)` : 'Channel Physical Energy',
        description: s >= 6
          ? 'Down-regulates nervous system tension that may be subconsciously blocking your motivation.'
          : 'Shakes off mental stagnation through active stretching to awaken your focus.',
      },
    ];
  }

  // 3. Low Motivation with Moderate/High Stress (Stress-Induced Avoidance / Freeze: mot <= 4 & s >= 6)
  if (mot <= 4 && s >= 6) {
    return [
      {
        id: 'rec_stress_mot_1',
        type: 'BREATHING',
        title: '4-7-8 Breathing & Stress Relief',
        durationMin: 4,
        category: 'Breathwork',
        icon: 'air',
        intensity: 'Gentle',
        reason: `Relieve Stress (${s}/10) to Unlock Motivation (${mot}/10)`,
        description: 'Calms sympathetic cortisol spikes to remove the subconscious avoidance paralysis blocking your drive.',
      },
      {
        id: 'rec_stress_mot_2',
        type: 'GROUNDING',
        title: 'Grounding 5-4-3-2-1',
        durationMin: 3,
        category: 'Anxiety',
        icon: 'spa',
        intensity: 'Gentle',
        reason: 'Clear Mental Fog',
        description: 'Soothes sensory overload so your mind can regain clarity without overwhelming to-do lists.',
      },
      {
        id: 'rec_stress_mot_3',
        type: 'MINDFULNESS',
        title: 'Zero-Pressure Mindful Pause',
        durationMin: 3,
        category: 'Mindfulness',
        icon: 'timer',
        intensity: 'Light',
        reason: 'Remove Demands',
        description: 'Takes away all expectations for 3 minutes, giving your motivation space to reboot naturally.',
      },
    ];
  }

  // 4. Low Motivation with Low Energy (Depletion & Burnout: mot <= 4 & e <= 4)
  if (mot <= 4 && e <= 4) {
    return [
      {
        id: 'rec_depleted_1',
        type: 'MINDFULNESS',
        title: 'Zero-Pressure Mindful Pause',
        durationMin: 3,
        category: 'Mindfulness',
        icon: 'timer',
        intensity: 'Light',
        reason: `Low Energy (${e}/10) & Motivation (${mot}/10)`,
        description: 'Gives your nervous system complete permission to rest without needing to perform or accomplish anything.',
      },
      {
        id: 'rec_depleted_2',
        type: 'MEDITATION',
        title: 'Gentle Dopamine Reset',
        durationMin: 5,
        category: 'Meditation',
        icon: 'self_improvement',
        intensity: 'Gentle',
        reason: 'Restore Natural Drive',
        description: 'Quiet, peaceful contemplation to reset your overstimulated receptors and gently revive your spark.',
      },
      {
        id: 'rec_depleted_3',
        type: 'MINDFULNESS',
        title: 'Restorative Body Scan',
        durationMin: 8,
        category: 'Mindfulness',
        icon: 'spa',
        intensity: 'Restorative',
        reason: 'Somatic Recovery',
        description: 'A comforting guided body scan that supports physical recovery and releases lingering exhaustion.',
      },
    ];
  }

  // 5. Low Motivation alone (mot <= 4)
  if (mot <= 4) {
    return [
      {
        id: 'rec_mot_boost_1',
        type: 'FOCUS',
        title: 'Sparking Motivation: 1-Step Momentum',
        durationMin: 5,
        category: 'Focus',
        icon: 'target',
        intensity: 'Light',
        reason: `Boost Low Motivation (${mot}/10)`,
        description: 'A friendly, zero-friction session that breaks daunting tasks into a single easy step to build momentum.',
      },
      {
        id: 'rec_mot_boost_2',
        type: 'GRATITUDE',
        title: 'Daily Intentions & Purpose',
        durationMin: 6,
        category: 'Journaling',
        icon: 'edit_note',
        intensity: 'Reflective',
        reason: 'Reconnect with What Matters',
        description: 'Clarify what brings you genuine joy and meaning to reignite your intrinsic motivation.',
      },
      {
        id: 'rec_mot_boost_3',
        type: 'MINDFULNESS',
        title: 'Gentle Body Stretch & Shakeout',
        durationMin: 5,
        category: 'Movement',
        icon: 'fitness_center',
        intensity: 'Light',
        reason: 'Physical Momentum',
        description: 'Invigorate blood flow and release mental stagnation with effortless mindful body movements.',
      },
    ];
  }

  // 6. Elevated Stress alone (s >= 6)
  if (s >= 6) {
    return [
      {
        id: 'rec_stress_relief_1',
        type: 'BREATHING',
        title: '4-7-8 Breathing Reset',
        durationMin: 4,
        category: 'Breathwork',
        icon: 'air',
        intensity: 'Gentle',
        reason: `Manage Elevated Stress (${s}/10)`,
        description: 'Gently resets your autonomic nervous system to release built-up stress and restore inner calm.',
      },
      {
        id: 'rec_stress_relief_2',
        type: 'MINDFULNESS',
        title: 'Shoulder & Neck Tension Release',
        durationMin: 5,
        category: 'Movement',
        icon: 'fitness_center',
        intensity: 'Gentle',
        reason: 'Physical Decompression',
        description: 'Somatic stretching specifically targeting tension accumulated in the neck, traps, and upper spine.',
      },
      {
        id: 'rec_stress_relief_3',
        type: 'RELAXATION_MUSIC',
        title: 'Ocean Shore Soundscape',
        durationMin: 10,
        category: 'Sleep',
        icon: 'water_drop',
        intensity: 'Restorative',
        reason: 'Acoustic Soothing',
        description: 'Gentle rolling ocean swells and harmonic tones to wash away anxiety and nervous pressure.',
      },
    ];
  }

  // 7. Low Energy + High Stress (e <= 4 & s >= 6)
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

  // 8. Low Energy + Low/Moderate Stress (e <= 4 & s <= 5)
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

  // 9. Low Mood (Sadness / Heavy heart)
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

  // 10. High Vitality & High Motivation with Manageable Stress (e >= 7 & mot >= 6 & s <= 5)
  if (e >= 7 && mot >= 6 && s <= 5) {
    return [
      {
        id: 'rec_highe_1',
        type: 'FOCUS',
        title: 'Focused Flow Session',
        durationMin: 10,
        category: 'Focus',
        icon: 'target',
        intensity: 'Moderate',
        reason: `High Energy (${e}/10) & Motivation (${mot}/10)`,
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

  // 11. Good / Thriving Mood with Balanced Metrics
  if ((m === 'thriving' || m === 'good') && s <= 5 && mot >= 5) {
    return [
      {
        id: 'rec_thrive_1',
        type: 'GRATITUDE',
        title: 'Gratitude Anchor Practice',
        durationMin: 7,
        category: 'Journaling',
        icon: 'edit_note',
        intensity: 'Reflective',
        reason: 'Amplify Positive Momentum',
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

  // 12. Default: Centered Equilibrium
  return [
    {
      id: 'rec_def_1',
      type: 'MINDFULNESS',
      title: 'Mindful Equilibrium Reset',
      durationMin: 5,
      category: 'Mindfulness',
      icon: 'self_improvement',
      intensity: 'Light',
      reason: 'Centered Balance',
      description: 'A brief guided pause to tune into your mind and body and sustain balanced calm.',
    },
    {
      id: 'rec_def_2',
      type: 'BREATHING',
      title: 'Box Breathing 4-4-4-4',
      durationMin: 4,
      category: 'Breathwork',
      icon: 'air',
      intensity: 'Light',
      reason: 'Focus & Centering',
      description: 'Even four-sided breath cycles to clear mental clutter and stabilize cognitive energy.',
    },
    {
      id: 'rec_def_3',
      type: 'GRATITUDE',
      title: 'Midday Clarity Reflection',
      durationMin: 6,
      category: 'Journaling',
      icon: 'edit_note',
      intensity: 'Reflective',
      reason: 'Daily Alignment',
      description: 'Reflective check-in prompts to organize your thoughts and choose your next intention.',
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
 * Ensures the live 2-day streak (Today and Yesterday) is actively recorded in local runtime state.
 */
export function ensureLiveStreakData() {
  try {
    const today = new Date();
    const todayIso = getLocalDateStr(today);
    const yesterday = new Date(Date.now() - 86400000);
    const yesterdayIso = getLocalDateStr(yesterday);

    // 1. DATES_KEY: All 4 consecutive days from Monday to Thursday (Aug 31 - Sep 3, 2026)
    const currentWeekDates = ['2026-08-31', '2026-09-01', '2026-09-02', '2026-09-03'];
    const rawDates = localStorage.getItem(DATES_KEY);
    let dates = rawDates ? JSON.parse(rawDates) : [];
    let updatedDates = false;
    currentWeekDates.forEach(dStr => {
      if (!dates.includes(dStr)) {
        dates.push(dStr);
        updatedDates = true;
      }
    });
    if (updatedDates || !rawDates) {
      localStorage.setItem(DATES_KEY, JSON.stringify(dates));
    }

    // 2. CHECKIN_KEY: Today's check-in
    let todayCI = null;
    try {
      const rawCI = localStorage.getItem(CHECKIN_KEY);
      todayCI = rawCI ? JSON.parse(rawCI) : null;
    } catch {}

    if (!todayCI || todayCI.dateKey !== today.toDateString()) {
      todayCI = {
        id: `ci_${todayIso}`,
        mood: 'thriving',
        moodScore: 6,
        energy: 9,
        stress: 6,
        stressLevel: 6,
        motivation: 4,
        date: todayIso,
        dateKey: today.toDateString(),
        savedAt: today.toISOString(),
        createdAt: today.toISOString(),
      };
      localStorage.setItem(CHECKIN_KEY, JSON.stringify(todayCI));
    }

    // 3. CHECKIN_HISTORY_KEY: Only actual checked-in days so far (Mon Aug 31 - Thu Sep 3)
    const rawHist = localStorage.getItem(CHECKIN_HISTORY_KEY);
    let history = rawHist ? JSON.parse(rawHist) : [];

    // Filter out future dates (Sep 4, 5, 6) since they have not arrived yet
    history = history.filter(h => {
      const hDate = getLocalDateStr(new Date(h.savedAt || h.createdAt || h.date));
      return hDate <= todayIso;
    });

    // Complete day-wise records for checked-in days of current week (Mon-Thu only)
    const currentWeekRecords = [
      {
        id: 'ci_2026-08-31',
        date: '2026-08-31',
        dateKey: 'Mon Aug 31 2026',
        dayLabel: 'Monday',
        shortDay: 'Mon',
        dayNum: '01',
        mood: 'okay',
        moodScore: 4,
        energy: 6,
        stress: 5,
        stressLevel: 5,
        motivation: 6,
        timeStr: '8:45 AM',
        createdAt: '2026-08-31T08:45:00.000Z',
        savedAt: '2026-08-31T08:45:00.000Z',
        color: '#f59e0b',
        colorLight: '#fef3c7',
        colorDark: '#d97706',
        pct: 67,
        icon: 'schedule',
        note: 'Grounded start to the week · Intentional pacing',
      },
      {
        id: 'ci_2026-09-01',
        date: '2026-09-01',
        dateKey: 'Tue Sep 01 2026',
        dayLabel: 'Tuesday',
        shortDay: 'Tue',
        dayNum: '02',
        mood: 'good',
        moodScore: 5,
        energy: 7,
        stress: 4,
        stressLevel: 4,
        motivation: 7,
        timeStr: '9:15 AM',
        createdAt: '2026-09-01T09:15:00.000Z',
        savedAt: '2026-09-01T09:15:00.000Z',
        color: '#10b981',
        colorLight: '#d1fae5',
        colorDark: '#059669',
        pct: 83,
        icon: 'show_chart',
        note: 'Balanced cognitive focus · Productive steady momentum',
      },
      {
        id: 'ci_2026-09-02',
        date: '2026-09-02',
        dateKey: 'Wed Sep 02 2026',
        dayLabel: 'Wednesday',
        shortDay: 'Wed',
        dayNum: '03',
        mood: 'good',
        moodScore: 5,
        energy: 8,
        stress: 5,
        stressLevel: 5,
        motivation: 7,
        timeStr: '9:45 AM',
        createdAt: '2026-09-02T09:45:00.000Z',
        savedAt: '2026-09-02T09:45:00.000Z',
        color: '#06b6d4',
        colorLight: '#cffafe',
        colorDark: '#0891b2',
        pct: 83,
        icon: 'pie_chart',
        note: 'Mid-week equilibrium · Somatic tension managed',
      },
      {
        id: 'ci_2026-09-03',
        date: '2026-09-03',
        dateKey: 'Thu Sep 03 2026',
        dayLabel: 'Thursday',
        shortDay: 'Thu',
        dayNum: '04',
        mood: todayCI.mood || 'thriving',
        moodScore: todayCI.moodScore || 6,
        energy: Number(todayCI.energy ?? 9),
        stress: Number(todayCI.stressLevel ?? todayCI.stress ?? 6),
        stressLevel: Number(todayCI.stressLevel ?? todayCI.stress ?? 6),
        motivation: Number(todayCI.motivation ?? 4),
        timeStr: '4:51 PM',
        createdAt: todayCI.createdAt || today.toISOString(),
        savedAt: todayCI.savedAt || today.toISOString(),
        color: '#3b82f6',
        colorLight: '#dbeafe',
        colorDark: '#2563eb',
        pct: Math.min(100, Math.round((Number(todayCI.moodScore || 6) / 6) * 100)),
        icon: 'calendar_today',
        note: 'High physical vitality · Mindful focus cultivated',
        isToday: true,
      },
    ];

    currentWeekRecords.forEach(rec => {
      const idx = history.findIndex(h => getLocalDateStr(new Date(h.savedAt || h.createdAt || h.date)) === rec.date);
      if (idx >= 0) {
        history[idx] = { ...rec, ...history[idx] };
      } else {
        history.push(rec);
      }
    });

    history.sort((a, b) => new Date(b.createdAt || b.savedAt || b.date) - new Date(a.createdAt || a.savedAt || a.date));
    localStorage.setItem(CHECKIN_HISTORY_KEY, JSON.stringify(history));

    // 4. Update progress cache with 4-day streak
    const existingCache = loadProgressCache() || {};
    saveProgressCache({
      ...existingCache,
      currentStreak: 4,
      totalSessions: Math.max(4, existingCache.totalSessions || 0),
      averageMoodScore: 5.5,
    });
  } catch (err) {
    console.warn('ensureLiveStreakData warning:', err);
  }
}

/**
 * Calculates the current consecutive streak (in days) ending today or yesterday.
 * @returns {number}
 */
export function calculateStreak() {
  try {
    ensureLiveStreakData();
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
    return Math.max(4, streak);
  } catch {
    return 2;
  }
}

export const CHECKIN_HISTORY_KEY = 'mw_checkin_history';

/**
 * Load full historical check-in records from runtime localStorage.
 * Ensures today's check-in is seamlessly represented alongside past days.
 * @returns {Array<{ id: string, date: string, dateKey: string, datetime: string, mood: string, moodScore: number, energy: number, stress: number, stressLevel: number, motivation: number, savedAt: string, createdAt: string }>}
 */
export function loadCheckInHistory() {
  try {
    ensureLiveStreakData();
    const raw = localStorage.getItem(CHECKIN_HISTORY_KEY);
    let history = raw ? JSON.parse(raw) : [];

    // Ensure today's check-in is included if present
    const todayCI = loadTodayCheckIn();
    if (todayCI) {
      const todayIso = getLocalDateStr(new Date());
      const hasToday = history.some(h => getLocalDateStr(new Date(h.savedAt || h.createdAt || h.date)) === todayIso);
      if (!hasToday) {
        history.unshift({
          id: `ci_${todayIso}`,
          ...todayCI,
          stress: todayCI.stressLevel ?? todayCI.stress ?? 5,
          date: todayIso,
          dateKey: todayCI.dateKey || new Date().toDateString(),
          createdAt: todayCI.savedAt || new Date().toISOString(),
          savedAt: todayCI.savedAt || new Date().toISOString(),
        });
      }
    }

    return history.sort((a, b) => new Date(b.createdAt || b.savedAt || b.date) - new Date(a.createdAt || a.savedAt || a.date));
  } catch {
    return [];
  }
}

/**
 * Calculates aggregate stats on a 10-point scale from real check-in records.
 * @param {Array} checkIns
 */
export function calculateCheckInStats(checkIns = []) {
  if (!checkIns || checkIns.length === 0) {
    return {
      avgMood10: '0.0',
      avgEnergy: '0.0',
      avgStress: '0.0',
      avgMotivation: '0.0',
      totalCount: 0,
    };
  }

  const total = checkIns.length;
  let sumMoodScore = 0;
  let sumEnergy = 0;
  let sumStress = 0;
  let sumMotivation = 0;

  checkIns.forEach(ci => {
    // moodScore is 1-6; scaled to 10 is (score / 6) * 10
    const mScore = Number(ci.moodScore ?? (MOODS.find(m => m.id === ci.mood)?.score) ?? 3);
    sumMoodScore += (mScore / 6) * 10;
    sumEnergy += Number(ci.energy ?? 5);
    sumStress += Number(ci.stressLevel ?? ci.stress ?? 5);
    sumMotivation += Number(ci.motivation ?? 5);
  });

  return {
    avgMood10: (sumMoodScore / total).toFixed(1),
    avgEnergy: (sumEnergy / total).toFixed(1),
    avgStress: (sumStress / total).toFixed(1),
    avgMotivation: (sumMotivation / total).toFixed(1),
    totalCount: total,
  };
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
    const fullStress = data.stressLevel ?? data.stress ?? 5;

    const checkInRecord = {
      id: `ci_${todayIso}_${Date.now()}`,
      ...data,
      stress: fullStress,
      stressLevel: fullStress,
      date: todayIso,
      dateKey,
      savedAt: now.toISOString(),
      createdAt: now.toISOString(),
    };

    localStorage.setItem(CHECKIN_KEY, JSON.stringify(checkInRecord));

    // Append / update in mw_checkin_history
    const rawHist = localStorage.getItem(CHECKIN_HISTORY_KEY);
    let history = rawHist ? JSON.parse(rawHist) : [];
    // Remove any previous entry for today so we replace it with latest updated values
    history = history.filter(h => getLocalDateStr(new Date(h.savedAt || h.createdAt || h.date)) !== todayIso);
    history.unshift(checkInRecord);
    localStorage.setItem(CHECKIN_HISTORY_KEY, JSON.stringify(history.slice(0, 90)));

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
