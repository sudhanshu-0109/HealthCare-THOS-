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

// ── Idempotent migration: remove auto-seeded data written by old code ─────────
// Uses a localStorage-versioned key so it persists across page reloads and
// re-runs whenever the app loads (not just once per session).
// It is safe to run multiple times — it only removes entries that are PROVABLY
// auto-seeded (no real timestamp, only the 4 exact demo dates).
(function runStaleDataMigration() {
  try {
    const MIGRATION_VERSION = 'mw_seed_migration_v4';
    // Re-run once per calendar day (not just once ever) so midnight transitions work
    const migrationDayKey = (() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    })();
    const storedDay = localStorage.getItem(MIGRATION_VERSION);
    if (storedDay === migrationDayKey) return; // already ran today
    localStorage.setItem(MIGRATION_VERSION, migrationDayKey);

    const todayIso = migrationDayKey;
    const DEMO_DATES = new Set(['2026-08-31', '2026-09-01', '2026-09-02', '2026-09-03']);

    /**
     * Returns local YYYY-MM-DD for a given Date.
     * Intentionally inlined to avoid dependency on the module-level getLocalDateStr
     * (which may not be defined yet at IIFE execution time).
     */
    function localDate(d) {
      const dd = new Date(d);
      return `${dd.getFullYear()}-${String(dd.getMonth() + 1).padStart(2, '0')}-${String(dd.getDate()).padStart(2, '0')}`;
    }

    /**
     * Determine if a check-in record is definitively auto-seeded (fake).
     * A real user check-in MUST have:
     *   1. id containing both a date AND a timestamp: ci_YYYY-MM-DD_<ms>
     *   2. savedAt that is a real wall-clock time (not the seeded 08:00 or 08:30 AM stubs)
     * A seeded/fake entry:
     *   - Has an id like ci_2026-08-31 (no underscore after the date)
     *   - Has one of the exact 4 demo dates (never today)
     */
    function isAutoSeeded(entry) {
      if (!entry || !entry.id) return false;
      // Auto-seeded IDs are exactly 'ci_YYYY-MM-DD' with nothing after
      const seedIdPattern = /^ci_\d{4}-\d{2}-\d{2}$/;
      const isSeedId = seedIdPattern.test(entry.id);
      // Real user IDs always have a timestamp suffix: ci_YYYY-MM-DD_1725...
      const isRealId = /^ci_\d{4}-\d{2}-\d{2}_\d+$/.test(entry.id);
      // If the id has a timestamp, it is always a real entry — never delete
      if (isRealId) return false;
      // If the id is exactly ci_YYYY-MM-DD, check if it refers to a demo date
      if (isSeedId) {
        const seedDate = entry.id.slice(3); // 'ci_YYYY-MM-DD' -> 'YYYY-MM-DD'
        return DEMO_DATES.has(seedDate) || seedDate >= todayIso;
      }
      // Unknown id format — preserve
      return false;
    }

    // 1. Purge mw_daily_checkin ONLY if it is a seeded entry for today.
    //    Real user entries have timestamp-suffixed IDs → preserved.
    const rawCI = localStorage.getItem('mw_daily_checkin');
    if (rawCI) {
      try {
        const entry = JSON.parse(rawCI);
        const entryDate = localDate(new Date(entry.dateKey || entry.savedAt || entry.createdAt || 0));
        // Only remove if today's entry AND it is provably fake
        if (entryDate === todayIso && isAutoSeeded(entry)) {
          localStorage.removeItem('mw_daily_checkin');
        }
      } catch { /* malformed JSON — remove to be safe */ localStorage.removeItem('mw_daily_checkin'); }
    }

    // 2. Update mw_checkin_dates: keep only historical DEMO dates + real user dates.
    //    Remove today from dates ONLY if there is no real check-in for today.
    const hasTodayCI = Boolean(localStorage.getItem('mw_daily_checkin'));
    const rawDates = localStorage.getItem('mw_checkin_dates');
    if (rawDates) {
      try {
        const dates = JSON.parse(rawDates).filter(d => {
          if (d < todayIso) return true;           // historical: keep
          if (d === todayIso) return hasTodayCI;   // today: keep only if real CI exists
          return false;                             // future: remove
        });
        localStorage.setItem('mw_checkin_dates', JSON.stringify(dates));
      } catch {}
    }

    // 3. Clean mw_checkin_history: remove seeded entries for today/future;
    //    preserve all historical demo data and all real user entries.
    const rawHist = localStorage.getItem('mw_checkin_history');
    if (rawHist) {
      try {
        const history = JSON.parse(rawHist);
        const cleaned = history.filter(h => {
          const hDate = localDate(new Date(h.savedAt || h.createdAt || h.date || 0));
          if (hDate < todayIso) return true;       // past: always keep
          if (hDate > todayIso) return false;      // future: always remove
          // hDate === today: keep only if it is a REAL user entry (not seeded)
          return !isAutoSeeded(h);
        });
        localStorage.setItem('mw_checkin_history', JSON.stringify(cleaned));
      } catch {}
    }
  } catch { /* silent — never block app startup */ }
})();


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

let isEnsuringLiveStreak = false;

/**
 * Ensures the live 2-day streak (Today and Yesterday) is actively recorded in local runtime state.
 */
export function ensureLiveStreakData() {
  if (isEnsuringLiveStreak) return;
  isEnsuringLiveStreak = true;
  try {
    const todayIso = getLocalDateStr(new Date());

    // 1. DATES_KEY: Seed only the 4 historical demo days (Mon Aug 31 – Thu Sep 3, 2026).
    //    NEVER seed today or any future date automatically.
    const HISTORICAL_DATES = ['2026-08-31', '2026-09-01', '2026-09-02', '2026-09-03'];
    const rawDates = localStorage.getItem(DATES_KEY);
    let dates = rawDates ? JSON.parse(rawDates) : [];
    let updatedDates = false;
    HISTORICAL_DATES.forEach(dStr => {
      // Only add historical dates that are strictly before today
      if (dStr < todayIso && !dates.includes(dStr)) {
        dates.push(dStr);
        updatedDates = true;
      }
    });
    if (updatedDates || !rawDates) {
      localStorage.setItem(DATES_KEY, JSON.stringify(dates));
    }

    // 2. CHECKIN_KEY: Do NOT auto-create today's check-in.
    //    loadTodayCheckIn() will return null if the user has not checked in,
    //    which correctly shows the check-in form.

    // 3. CHECKIN_HISTORY_KEY: Seed only the 4 historical demo check-in records.
    //    Today (Sep 4+) is only added when the user actually submits a check-in.
    const rawHist = localStorage.getItem(CHECKIN_HISTORY_KEY);
    let history = rawHist ? JSON.parse(rawHist) : [];

    // Remove any auto-seeded entries for today or future dates that may have been
    // written by a previous version of this code, but PRESERVE real user entries for today!
    history = history.filter(h => {
      const hDate = getLocalDateStr(new Date(h.savedAt || h.createdAt || h.date));
      if (hDate < todayIso) return true;
      if (hDate > todayIso) return false;
      // hDate === today: keep only if it is a real user entry (has timestamp or is not an exact stub ID)
      const isSeedId = /^ci_\d{4}-\d{2}-\d{2}$/.test(h.id);
      return !isSeedId;
    });

    // Static historical records for the 4 demo days
    const historicalRecords = [
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
        mood: 'okay',
        moodScore: 4,
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
        pct: 67,
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
        mood: 'okay',
        moodScore: 4,
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
        pct: 67,
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
        mood: 'good',
        moodScore: 5,
        energy: 7,
        stress: 3,
        stressLevel: 3,
        motivation: 8,
        timeStr: '8:30 AM',
        createdAt: '2026-09-03T08:30:00.000Z',
        savedAt: '2026-09-03T08:30:00.000Z',
        color: '#3b82f6',
        colorLight: '#dbeafe',
        colorDark: '#2563eb',
        pct: 83,
        icon: 'calendar_today',
        note: 'High physical vitality · Mindful focus cultivated',
      },
    ];

    historicalRecords.forEach(rec => {
      // Only seed if this date is strictly before today
      if (rec.date < todayIso) {
        const idx = history.findIndex(h =>
          getLocalDateStr(new Date(h.savedAt || h.createdAt || h.date)) === rec.date
        );
        if (idx < 0) {
          history.push(rec);
        }
      }
    });

    history.sort((a, b) => new Date(b.createdAt || b.savedAt || b.date) - new Date(a.createdAt || a.savedAt || a.date));
    localStorage.setItem(CHECKIN_HISTORY_KEY, JSON.stringify(history));

    // 4. Update progress cache with dynamically calculated streak
    let existingCache = {};
    try {
      const raw = localStorage.getItem(PROGRESS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        existingCache = parsed?.data || {};
      }
    } catch {}

    // Only update if there is no recent cache (avoid overwriting user's live data)
    if (!existingCache.currentStreak) {
      saveProgressCache({
        ...existingCache,
        currentStreak: 4,
        totalSessions: Math.max(4, existingCache.totalSessions || 0),
        averageMoodScore: 5.5,
      });
    }
  } catch (err) {
    console.warn('ensureLiveStreakData warning:', err);
  } finally {
    isEnsuringLiveStreak = false;
  }
}

let isCalculatingStreak = false;

/**
 * Calculates the current consecutive streak (in days) ending today or yesterday.
 * @returns {number}
 */
export function calculateStreak() {
  if (isCalculatingStreak) return 0;
  isCalculatingStreak = true;
  try {
    ensureLiveStreakData();
    const rawDates = localStorage.getItem(DATES_KEY);
    const dates = rawDates ? JSON.parse(rawDates) : [];

    // Also consider today's active check-in if the user has submitted one
    const todayCI = loadTodayCheckIn();
    const todayStr = getLocalDateStr(new Date());

    const dateSet = new Set(dates);
    if (todayCI) {
      dateSet.add(todayStr);
    }

    if (dateSet.size === 0) return 0;

    const uniqueSorted = Array.from(dateSet).sort().reverse();
    const yesterdayStr = getLocalDateStr(new Date(Date.now() - 86400000));
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
    return 0; // On error, do not fake a streak — show 0
  } finally {
    isCalculatingStreak = false;
  }
}

/**
 * Real-time Weekly Check-in Calendar status synchronized with Mental Wellness My Journey.
 * Evaluates Monday through Sunday for the active week.
 * @returns {{ streak: number, weekDays: Array<{ day: string, dateStr: string, isToday: boolean, isChecked: boolean }> }}
 */
export function getCurrentWeekStreakStatus() {
  try {
    ensureLiveStreakData();
    const history = loadCheckInHistory();
    const todayCI = loadTodayCheckIn();
    const streak = calculateStreak();

    // Map all checked-in dates
    const checkedDates = new Set();
    history.forEach(h => {
      const dStr = getLocalDateStr(new Date(h.savedAt || h.createdAt || h.date));
      if (dStr) checkedDates.add(dStr);
    });

    const today = new Date();
    const todayIso = getLocalDateStr(today);
    if (todayCI) {
      checkedDates.add(todayIso);
    }

    // Determine Monday of current week
    const dayOfWeek = today.getDay(); // 0 is Sun, 1 is Mon, ... 4 is Thu
    const distToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + distToMon);

    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weekDays = dayLabels.map((dayLabel, idx) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + idx);
      const dateStr = getLocalDateStr(d);
      const isToday = dateStr === todayIso;
      const isChecked = checkedDates.has(dateStr);
      return {
        day: dayLabel,
        dateStr,
        isToday,
        isChecked: Boolean(isChecked),
      };
    });

    return {
      streak,
      weekDays,
    };
  } catch {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 is Sun, 1 is Mon, ... 4 is Thu, 5 is Fri
    const dayIdx = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return {
      streak: 0,
      weekDays: dayLabels.map((day, idx) => ({
        day,
        isChecked: false,
        isToday: idx === dayIdx,
      })),
    };
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

    // Ensure today's check-in is seamlessly represented and ALWAYS reflects the latest user input
    const todayCI = loadTodayCheckIn();
    if (todayCI) {
      const todayIso = getLocalDateStr(new Date());
      const mScore = Number(todayCI.moodScore ?? (MOODS.find(m => m.id === todayCI.mood)?.score) ?? 4);
      const todayFullRecord = {
        id: todayCI.id || `ci_${todayIso}`,
        ...todayCI,
        mood: todayCI.mood || 'okay',
        moodScore: mScore,
        energy: Number(todayCI.energy ?? 7),
        stress: Number(todayCI.stressLevel ?? todayCI.stress ?? 5),
        stressLevel: Number(todayCI.stressLevel ?? todayCI.stress ?? 5),
        motivation: Number(todayCI.motivation ?? 5),
        date: todayIso,
        dateKey: todayCI.dateKey || new Date().toDateString(),
        createdAt: todayCI.createdAt || todayCI.savedAt || new Date().toISOString(),
        savedAt: todayCI.savedAt || todayCI.createdAt || new Date().toISOString(),
        isToday: true,
      };

      const idx = history.findIndex(h => getLocalDateStr(new Date(h.savedAt || h.createdAt || h.date)) === todayIso);
      if (idx >= 0) {
        history[idx] = { ...history[idx], ...todayFullRecord };
      } else {
        history.unshift(todayFullRecord);
      }
    }

    return history.sort((a, b) => new Date(b.createdAt || b.savedAt || b.date) - new Date(a.createdAt || a.savedAt || a.date));
  } catch {
    return [];
  }
}

/**
 * General formula to calculate composite holistic mood score (1-10)
 * based on all check-in details: Primary Feeling, Energy, Stress, and Motivation.
 * - Feeling: Level 1-6 scaled to 10 -> (moodScore / 6) * 10
 * - Energy: Positive as entered (1-10)
 * - Stress: Inverted positive -> (10 - stress) (e.g., stress 3 => positive 7)
 * - Motivation: Positive as entered (1-10)
 *
 * Formula: (Feeling + Energy + (10 - Stress) + Motivation) / 4
 *
 * @param {{ moodScore?: number, mood?: string, energy?: number, stress?: number, stressLevel?: number, motivation?: number }} ci
 * @returns {number} Score from 1.0 to 10.0 (rounded to 1 decimal place)
 */
export function calculateCompositeMoodScore(ci) {
  if (!ci) return 5.0;

  // 1. Feeling / Mood level (1-6 scaled to 10-point scale)
  let mScore = ci.moodScore;
  if (mScore === undefined || mScore === null) {
    const found = MOODS.find(m => m.id === ci.mood);
    mScore = found?.score ?? 4;
  }
  const feeling10 = (Number(mScore) / 6) * 10;

  // 2. Energy: positive as entered (1-10)
  const energy10 = Number(ci.energy ?? 5);

  // 3. Stress: inverted positive (10 - stress, e.g., stress 3 => positive 7)
  const rawStress = Number(ci.stressLevel ?? ci.stress ?? 5);
  const stressPositive10 = Math.max(0, Math.min(10, 10 - rawStress));

  // 4. Motivation: positive as entered (1-10)
  const motivation10 = Number(ci.motivation ?? 5);

  // General formula: Equal-weight composite average across all 4 details
  const composite = (feeling10 + energy10 + stressPositive10 + motivation10) / 4;
  return Number(Math.max(1, Math.min(10, composite)).toFixed(1));
}

/**
 * Calculates aggregate stats on a 10-point scale from real check-in records.
 * @param {Array} checkIns
 */
export function calculateCheckInStats(checkIns = []) {
  const todayCI = loadTodayCheckIn();
  let effectiveRecords = Array.isArray(checkIns) ? [...checkIns] : [];

  if (todayCI) {
    const todayIso = getLocalDateStr(new Date());
    const mScore = Number(todayCI.moodScore ?? (MOODS.find(m => m.id === todayCI.mood)?.score) ?? 5);
    const todayRec = {
      ...todayCI,
      moodScore: mScore,
      energy: Number(todayCI.energy ?? 6),
      stress: Number(todayCI.stressLevel ?? todayCI.stress ?? 3),
      motivation: Number(todayCI.motivation ?? 3),
      isToday: true,
    };
    const idx = effectiveRecords.findIndex(c => getLocalDateStr(new Date(c.savedAt || c.createdAt || c.date)) === todayIso);
    if (idx >= 0) {
      effectiveRecords[idx] = { ...effectiveRecords[idx], ...todayRec };
    } else {
      effectiveRecords.unshift(todayRec);
    }
  }

  if (effectiveRecords.length === 0) {
    return {
      avgMood10: '0.0',
      avgEnergy: '0.0',
      avgStress: '0.0',
      avgMotivation: '0.0',
      totalCount: 0,
    };
  }

  const total = effectiveRecords.length;
  let sumMoodScore = 0;
  let sumEnergy = 0;
  let sumStress = 0;
  let sumMotivation = 0;

  effectiveRecords.forEach(ci => {
    // Each record's mood score is calculated via the general composite formula
    const compScore = calculateCompositeMoodScore(ci);
    sumMoodScore += compScore;
    sumEnergy += Number(ci.energy ?? 6);
    sumStress += Number(ci.stressLevel ?? ci.stress ?? 3);
    sumMotivation += Number(ci.motivation ?? 3);
  });

  // Today's composite mood score derived from all given details (feeling, energy, stress, motivation)
  const todayScore10 = todayCI
    ? calculateCompositeMoodScore(todayCI)
    : Number((sumMoodScore / total).toFixed(1));

  return {
    avgMood10: todayScore10.toFixed(1),
    todayMood10: todayScore10.toFixed(1),
    weeklyAvgMood10: (sumMoodScore / total).toFixed(1),
    avgEnergy: todayCI ? Number(todayCI.energy ?? 6).toFixed(1) : (sumEnergy / total).toFixed(1),
    avgStress: todayCI ? Number(todayCI.stressLevel ?? todayCI.stress ?? 3).toFixed(1) : (sumStress / total).toFixed(1),
    avgMotivation: todayCI ? Number(todayCI.motivation ?? 3).toFixed(1) : (sumMotivation / total).toFixed(1),
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

    // Dispatch custom event so all active components in the app immediately react
    try {
      window.dispatchEvent(new CustomEvent('mw-checkin-updated', { detail: checkInRecord }));
    } catch {}

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
    if (!raw) return null;
    const { data, savedAt } = JSON.parse(raw);
    if (Date.now() - savedAt > PROGRESS_TTL_MS) return null;
    return data || null;
  } catch {
    return null;
  }
}

// ── DNA Program Pathway Completion Tracking ─────────────────────────────────
export const PROGRAM_COMPLETED_DAYS_KEY = 'mw_program_completed_days';

export const DNA_JOURNEY_TITLES_TO_DAY = {
  'Vagal Somatic Reset': 1,
  'Sensory Grounding 5-4-3-2-1': 2,
  'Overcoming Inertia: Micro-Momentum': 3,
  'Restorative Body Scan': 4,
  'Dopamine Reset & Clarity': 5,
  'Shoulder & Neck Tension Release': 6,
  'Weekly Anchor & Purpose Journal': 7,
  'Box Breathing 4-4-4-4 Composure': 8,
  'Compassionate Mindful Pause': 9,
  'Kinetic Energy Shakeout': 10,
  'Acoustic Sound Bath Resonance': 11,
  'Cognitive Reframing Reflection': 12,
  'Deep Sleep & Nervous Wind-down': 13,
  'Integration & Habit Mastery': 14,
};

/**
 * Load completed DNA program days.
 * Historical demo days 1, 2, 3, 4 are seeded by default.
 * Also scans the activity log to automatically recognize any completed DNA tasks (e.g. Day 6).
 * @returns {number[]}
 */
export function loadCompletedProgramDays() {
  try {
    const raw = localStorage.getItem(PROGRAM_COMPLETED_DAYS_KEY);
    let days = raw ? JSON.parse(raw) : null;
    if (!Array.isArray(days) || days.length === 0) {
      days = [1, 2, 3, 4]; // historical demo days (Aug 31–Sep 3)
    }

    // Auto-detect completed tasks from activity log
    const activityLog = loadActivityLog();
    let updated = false;
    activityLog.forEach(act => {
      const d = DNA_JOURNEY_TITLES_TO_DAY[act.title];
      if (d && !days.includes(d)) {
        days.push(d);
        updated = true;
      }
    });

    if (updated || !raw) {
      days.sort((a, b) => a - b);
      localStorage.setItem(PROGRAM_COMPLETED_DAYS_KEY, JSON.stringify(days));
    }

    return days;
  } catch {
    return [1, 2, 3, 4];
  }
}

/**
 * Mark a DNA journey program day as completed.
 * @param {number} dayNum
 * @param {object} [metadata]
 */
export function markProgramDayCompleted(dayNum, metadata = {}) {
  try {
    const day = Number(dayNum);
    if (day < 1 || day > 14) return loadCompletedProgramDays();
    const days = loadCompletedProgramDays();
    if (!days.includes(day)) {
      days.push(day);
      days.sort((a, b) => a - b);
      localStorage.setItem(PROGRAM_COMPLETED_DAYS_KEY, JSON.stringify(days));
    }
    try {
      window.dispatchEvent(new CustomEvent('mw-program-updated', { detail: { day, ...metadata } }));
    } catch {}
    return days;
  } catch {
    return [1, 2, 3, 4];
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
