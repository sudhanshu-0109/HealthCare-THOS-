/**
 * data/physicalWellnessMockData.js
 * Source: frontend_Physical/src/data/mockData.ts
 * Converted to ES module JavaScript for Healthcare+ frontend.
 */

import useAuthStore from "../store/authStore.js";

/**
 * Returns true if the user is Arjun Mehta (the only allowed demo patient).
 * All other patients (Sudhanshu Ranjan, new patients, Google auth, etc.) return false.
 * @param {object} [user]
 * @returns {boolean}
 */
export function isDemoPatient(user) {
  const u = user || useAuthStore.getState().user;
  if (!u) return false;
  const email = (u.email || '').toLowerCase().trim();
  const name = (u.fullName || u.name || '').toLowerCase().trim();
  const id = String(u.id || '');
  return (
    email === 'dummy2@healthcareplus.dev' ||
    name === 'arjun mehta' ||
    id === 'ea60e4c2-aaea-450e-81b8-0e52eb10c21f'
  );
}

/**
 * Generates a storage key scoped to the authenticated user ID.
 * @param {string} baseKey
 * @param {object} [user]
 * @returns {string}
 */
export function getUserPwKey(baseKey, user) {
  const u = user || useAuthStore.getState().user;
  const uid = u?.id || u?._id;
  if (!uid) return `${baseKey}_anon`;
  return `${baseKey}_${uid}`;
}

// ── Immediate Purge of Legacy Global Unscoped Storage ──────────────────────────
try {
  const LEGACY_PW_KEYS = [
    'pw_onboarded_v2',
    'pw_onboarded',
    'pw_profile_v2',
    'pw_profile',
    'pw_checkins_v2',
    'pw_checkins',
    'pw_workouts_v2',
    'pw_workouts',
    'pw_habit_defs_v2',
    'pw_habit_defs',
    'pw_habit_logs_v2',
    'pw_habit_logs',
    'pw_biometrics_history_v2',
    'pw_biometrics',
    'pw_today_workout_progress_v2',
  ];
  LEGACY_PW_KEYS.forEach(k => localStorage.removeItem(k));
} catch { /* silent */ }

export const mockUser = {
  name: "Arjun",
  age: 28,
  height: { cm: 175, ft: 5, inches: 9 },
  weight: { kg: 72, lb: 158 },
  fitnessLevel: "Intermediate",
  activityLevel: "Moderate",
  goals: { primary: "General Fitness", secondary: "Improve Stamina" },
  environment: "Home",
  equipment: ["Dumbbells", "Resistance Bands"],
  considerations: [],
  commitmentMinutes: 30,
  streak: 4,
  planName: "Home Strength & Stamina",
};

/**
 * Generates a weekly plan for the current calendar week.
 * Dates are computed dynamically from the actual Monday of this week.
 * Status is derived from real check-in data — never hardcoded.
 * @param {Array} [checkins] - Optional array of check-in objects with .date (YYYY-MM-DD)
 */
export function generateWeeklyPlan(checkins = []) {
  const today = new Date();
  const dow = today.getDay(); // 0=Sun
  const distToMon = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(today);
  monday.setDate(today.getDate() + distToMon);

  const checkedDates = new Set(checkins.map(c => c.date).filter(Boolean));

  const workoutFocuses = [
    { day: 'Mon', type: 'workout',  focus: 'Upper Body Strength', duration: 30, difficulty: 'Moderate' },
    { day: 'Tue', type: 'recovery', focus: 'Mobility & Stretch',  duration: 20, difficulty: 'Light'    },
    { day: 'Wed', type: 'workout',  focus: 'Core & Cardio',       duration: 30, difficulty: 'Moderate' },
    { day: 'Thu', type: 'rest',     focus: 'Rest Day',            duration: 0,  difficulty: '—'        },
    { day: 'Fri', type: 'workout',  focus: 'Lower Body Strength', duration: 35, difficulty: 'Moderate' },
    { day: 'Sat', type: 'optional', focus: 'Optional Walk',       duration: 20, difficulty: 'Light'    },
    { day: 'Sun', type: 'rest',     focus: 'Rest Day',            duration: 0,  difficulty: '—'        },
  ];

  const todayIso = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  return workoutFocuses.map((template, idx) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + idx);
    const dateIso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const dateLabel = `${d.toLocaleDateString('en-US', { month: 'short' })} ${d.getDate()}`;

    let status;
    if (dateIso < todayIso) {
      status = checkedDates.has(dateIso) ? 'completed' : 'missed';
    } else if (dateIso === todayIso) {
      status = 'today';
    } else {
      status = 'upcoming';
    }

    return {
      ...template,
      date: dateLabel,
      dateIso,
      status,
    };
  });
}

// Static fallback for components that can't call generateWeeklyPlan dynamically
// These are intentionally empty so no hardcoded dates exist in the initial bundle
export const mockWeeklyPlan = [];

export const mockTodayWorkout = {
  title: "Core & Cardio",
  focus: "Core strength + cardiovascular endurance",
  duration: 30,
  difficulty: "Moderate",
  exerciseCount: 9,
  warmUp: [
    {
      id: 1,
      name: "Jumping Jacks",
      description: "Full-body warm-up activating shoulders and hips",
      sets: 1,
      reps: null,
      duration: "60s",
      rest: "15s",
      instructions: "Stand upright, jump feet apart while raising arms overhead. Return to start with light, springy bounces.",
      gifUrl: "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/3224.gif",
    },
    {
      id: 2,
      name: "Hip Circles",
      description: "Mobilize hip flexors, pelvic girdle and lower back",
      sets: 1,
      reps: null,
      duration: "30s each side",
      rest: "10s",
      instructions: "Hands on hips with feet shoulder-width apart. Draw large, smooth circles with your hips, clockwise then counterclockwise.",
      gifUrl: "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/1368.gif",
    },
  ],
  mainWorkout: [
    {
      id: 3,
      name: "Glute Bridge",
      description: "Glute activation, hip extension & posterior chain power — pure bodyweight",
      sets: 3,
      reps: null,
      duration: "45s",
      rest: "30s",
      instructions: "Lie on back with knees bent and feet flat on floor. Drive through heels to extend hips toward the ceiling until thighs and torso align. Squeeze glutes firmly at top.",
      gifUrl: "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/3013.gif",
    },
    {
      id: 4,
      name: "Plank Hold",
      description: "Core stability, pelvic alignment and endurance",
      sets: 3,
      reps: null,
      duration: "30s",
      rest: "30s",
      instructions: "Forearms on floor, elbows under shoulders, body forming a straight line from head to heels. Keep hips level and engage deep core.",
      gifUrl: "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0464.gif",
    },
    {
      id: 5,
      name: "Mountain Climbers",
      description: "Cardio and dynamic core engagement",
      sets: 3,
      reps: "16",
      duration: null,
      rest: "30s",
      instructions: "In high plank, drive knees toward chest alternately at a steady cadence. Keep hips level and avoid piking.",
      gifUrl: "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0630.gif",
    },
    {
      id: 6,
      name: "Russian Twists",
      description: "Oblique and rotational core activation",
      sets: 3,
      reps: "20",
      duration: null,
      rest: "30s",
      instructions: "Seated with knees bent, lean torso back at 45 degrees. Rotate torso smoothly side to side, keeping chest open.",
      gifUrl: "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0687.gif",
    },
    {
      id: 7,
      name: "High Knees",
      description: "Cardiovascular burst and hip flexor drive",
      sets: 3,
      reps: null,
      duration: "40s",
      rest: "30s",
      instructions: "Run in place driving knees up toward hip height with quick ground contact. Keep chest tall and arms pumping.",
      gifUrl: "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/3636.gif",
    },
    {
      id: 8,
      name: "Dead Bug",
      description: "Deep transverse abdominal activation & anti-extension",
      sets: 3,
      reps: "10 each side",
      duration: null,
      rest: "30s",
      instructions: "Lie on back with arms reaching up, knees bent 90 degrees. Lower opposite arm and leg simultaneously while pressing lower back into mat.",
      gifUrl: "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0276.gif",
    },
    {
      id: 9,
      name: "Burpee (Modified)",
      description: "Full-body metabolic conditioning finisher",
      sets: 3,
      reps: "8",
      duration: null,
      rest: "45s",
      instructions: "Squat down, place hands on floor, step or jump feet back to plank, perform push-up if able, then jump or step back to stand tall.",
      gifUrl: "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/1160.gif",
    },
  ],
  coolDown: [
    {
      id: 10,
      name: "Child's Pose",
      description: "Spinal decompression and lat/hip stretch",
      sets: 1,
      reps: null,
      duration: "60s",
      rest: "0s",
      instructions: "Kneel, sink hips back to heels, extend arms forward onto floor with forehead resting gently on mat. Breathe deeply into ribs.",
      gifUrl: "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/1363.gif",
    },
    {
      id: 11,
      name: "Seated Forward Fold",
      description: "Hamstring and posterior chain release",
      sets: 1,
      reps: null,
      duration: "45s",
      rest: "0s",
      instructions: "Sit with legs extended straight. Hinge at hips to reach forward toward shins or toes. Relax shoulders and neck.",
      gifUrl: "https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/1511.gif",
    },
  ],
};

export const mockReadinessHistory = [
  { date: "Sep 1", energy: 4, sleep: 4, soreness: 2, motivation: 5, result: "ready" },
  { date: "Sep 2", energy: 3, sleep: 3, soreness: 3, motivation: 3, result: "adjusted" },
  { date: "Sep 3", energy: 4, sleep: 4, soreness: 2, motivation: 4, result: "ready" },
];

export const mockHabits = {
  hydration: { today: 1400, target: 2500, unit: "ml", logs: [200, 300, 400, 300, 200] },
  weight: { latest: 65.2, unit: "kg", trend: -0.3, history: [66.1, 65.8, 65.6, 65.4, 65.2] },
  recovery: { sleepHours: 7.5, restDays: 2, recoveryScore: 78 },
  activity: { stepsToday: 6840, stepsTarget: 8000, activeMinutes: 22 },
  streaks: { current: 7, best: 14, weeklyConsistency: 5 },
};

export const mockProgress = {
  workoutConsistency: [
    { week: "W1 Aug", completed: 3, target: 3 },
    { week: "W2 Aug", completed: 2, target: 3 },
    { week: "W3 Aug", completed: 3, target: 3 },
    { week: "W4 Aug", completed: 3, target: 3 },
    { week: "W1 Sep", completed: 2, target: 3 },
  ],
  weightTrend: [
    { date: "Aug 5", value: 66.1 },
    { date: "Aug 12", value: 65.8 },
    { date: "Aug 19", value: 65.6 },
    { date: "Aug 26", value: 65.4 },
    { date: "Sep 2", value: 65.2 },
  ],
  completionRate: 87,
  currentStreak: 7,
  totalWorkouts: 24,
  avgDuration: 28,
  goalProgress: { primary: 62, secondary: 45 },
};

export const mockWeeklyReview = {
  completed: 2,
  target: 3,
  completionPct: 67,
  avgFeedback: "Appropriate",
  consistency: 5,
  recoveryDays: 2,
  nextWeekAdjustments: {
    duration: { from: 30, to: 30 },
    intensity: { from: "Moderate", to: "Moderate" },
    rest: { from: "30s", to: "30s" },
  },
};

export const mockAssistantResponses = {
  "WHY WAS MY WORKOUT ADJUSTED?": "Your check-in showed you were feeling a bit more tired than usual today. The plan reduced workout intensity slightly and extended rest periods to keep you moving without overdoing it. Consistency matters more than intensity on lower-energy days.",
  "EXPLAIN TODAY'S WORKOUT": "Today's session focuses on your core and cardiovascular endurance — two areas that support every other movement you do. You'll start with a warm-up to activate muscles, move through 6 core and cardio exercises in circuit style, then close with a focused cool-down. Total time: about 30 minutes.",
  "HOW DO I PERFORM THIS EXERCISE?": "For the Plank Hold: get into a forearm plank with elbows directly below shoulders. Your body should form a straight line from head to heels. Engage your core, squeeze your glutes lightly, and breathe steadily. Avoid letting your hips sag or rise. If 30 seconds feels too hard, start with 15-second holds.",
  "WHAT SHOULD I FOCUS ON THIS WEEK?": "This week, prioritize showing up consistently over performing perfectly. You've built a 7-day streak — keep that momentum. Focus on your core workouts and make sure you're getting enough sleep and hydration. Recovery days are just as important as workout days.",
  "WHY IS RECOVERY IMPORTANT?": "Recovery is when your body actually gets stronger. During workouts, you create small stress in your muscles — rest is when they repair and adapt. Without adequate recovery, you risk fatigue, reduced performance, and injury. Think of rest days as part of your training, not breaks from it.",
};

function getLocalDateStr(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayStr() {
  return getLocalDateStr(new Date());
}

let isEnsuringPhysicalStreak = false;

export function ensureLivePhysicalStreakData(user) {
  const u = user || useAuthStore.getState().user;
  if (!isDemoPatient(u)) return; // Strictly demo patient Arjun Mehta only!
  if (isEnsuringPhysicalStreak) return;
  isEnsuringPhysicalStreak = true;
  try {
    const HISTORICAL_DATES = ['2026-08-31', '2026-09-01', '2026-09-02', '2026-09-03'];
    const todayIso = getLocalDateStr(new Date());

    const checkinsKey = getUserPwKey("pw_checkins_v2", u);
    const raw = localStorage.getItem(checkinsKey);
    let checkins = raw ? JSON.parse(raw) : [];

    checkins = checkins.filter(c => {
      if (!c.date) return false;
      if (c.date < todayIso) return true;
      if (c.date > todayIso) return false; // future dates
      const isMockStub = c.ts === new Date(todayIso + 'T08:00:00').getTime();
      return !isMockStub;
    });

    HISTORICAL_DATES.forEach(dateStr => {
      if (dateStr < todayIso && !checkins.some(c => c.date === dateStr)) {
        checkins.push({
          date: dateStr,
          scores: { energy: 4, sleep: 4, soreness: 2, pain: 1, motivation: 4 },
          avgReadiness: 8,
          result: "ready",
          ts: new Date(dateStr + 'T08:00:00').getTime(),
        });
      }
    });

    localStorage.setItem(checkinsKey, JSON.stringify(checkins));

    // Ensure Arjun's demo onboarding state and profile exist in his scoped storage
    const onboardedKey = getUserPwKey("pw_onboarded_v2", u);
    if (localStorage.getItem(onboardedKey) !== "true") {
      localStorage.setItem(onboardedKey, "true");
    }

    const profileKey = getUserPwKey("pw_profile_v2", u);
    if (!localStorage.getItem(profileKey)) {
      localStorage.setItem(profileKey, JSON.stringify({
        name: "Arjun Mehta",
        firstName: "Arjun",
        age: 28,
        height: "175",
        heightUnit: "cm",
        weight: "72",
        weightUnit: "kg",
        fitnessLevel: "Intermediate",
        activityLevel: "Moderate",
        primaryGoal: "General Fitness",
        secondaryGoal: "Improve Stamina",
        environment: "Home",
        equipment: ["Dumbbells", "Resistance Bands"],
        commitment: "30 min",
      }));
    }
  } catch (err) {
    console.warn("ensureLivePhysicalStreakData warning:", err);
  } finally {
    isEnsuringPhysicalStreak = false;
  }
}

// ─── Exercise Libraries (with requiredEquipment metadata) ──────────────────────

// Bodyweight warm-ups (Zero equipment required)
const WARMUP_GENTLE = [
  {
    id: 'wg1', name: 'Spine Stretch & Mobilization', requiredEquipment: [],
    description: 'Gentle spinal decompression, neural relaxation and posterior chain warming',
    sets: 1, reps: null, duration: '60s', rest: '0s',
    instructions: 'Kneel, sink hips back toward heels, extend arms forward on floor with forehead resting gently on mat. Breathe deeply into ribs.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/1363.gif',
  },
  {
    id: 'wg2', name: 'Butterfly Hip Opener', requiredEquipment: [],
    description: 'Gentle pelvic decompression and adductor release',
    sets: 1, reps: null, duration: '45s', rest: '0s',
    instructions: 'Sit tall, press soles of feet together, gently let knees fall open. Hold ankles and lengthen spine upward.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/1494.gif',
  },
  {
    id: 'wg3', name: 'Supine Spinal Twist', requiredEquipment: [],
    description: 'Thoracic and lumbar decompression, hip external rotation',
    sets: 1, reps: null, duration: '30s each side', rest: '0s',
    instructions: 'Lie on back. Draw one knee toward chest, gently guide across body with opposite hand while keeping shoulders pinned flat.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/3639.gif',
  },
];

const WARMUP_MODERATE = [
  {
    id: 'wm1', name: 'Hip Circles', requiredEquipment: [],
    description: 'Mobilize hip flexors, pelvic girdle and lower back',
    sets: 1, reps: null, duration: '30s each side', rest: '10s',
    instructions: 'Hands on hips, feet shoulder-width apart. Draw large, smooth circles with your hips, clockwise then counterclockwise.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/1368.gif',
  },
  {
    id: 'wm2', name: 'Jumping Jacks', requiredEquipment: [],
    description: 'Dynamic full-body warm-up activating calves, shoulders and hips',
    sets: 1, reps: null, duration: '45s', rest: '10s',
    instructions: 'Stand tall with feet together. Jump feet out while raising arms overhead. Land softly on balls of feet.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/3224.gif',
  },
  {
    id: 'wm3', name: 'Alternate Heel Touchers', requiredEquipment: [],
    description: 'Gentle oblique and thoracic lateral flexion warming',
    sets: 1, reps: null, duration: '45s', rest: '10s',
    instructions: 'Lie on back with knees bent, feet flat. Crunch slightly and reach alternately to touch left heel then right heel.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0006.gif',
  },
];

const WARMUP_INTENSE = [
  {
    id: 'wi1', name: 'Jumping Jacks', requiredEquipment: [],
    description: 'Full-body metabolic warm-up activating shoulders and hips',
    sets: 1, reps: null, duration: '60s', rest: '15s',
    instructions: 'Stand upright, jump feet apart while raising arms overhead. Return to start with light, springy bounces.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/3224.gif',
  },
  {
    id: 'wi2', name: 'High Knees', requiredEquipment: [],
    description: 'Cardio activation and hip flexor dynamic priming',
    sets: 1, reps: null, duration: '40s', rest: '15s',
    instructions: 'Run in place, driving knees up toward hip height with quick, springy footwork and tall posture.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/3636.gif',
  },
  {
    id: 'wi3', name: 'Mountain Climbers', requiredEquipment: [],
    description: 'Core stabilization and dynamic hip flexor endurance',
    sets: 1, reps: null, duration: '35s', rest: '15s',
    instructions: 'In high plank on hands, drive knees alternately toward chest in a smooth, running cadence.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0630.gif',
  },
];

// Recovery exercises (Zero equipment required)
const MAIN_RECOVERY = [
  {
    id: 'mr1', name: 'Glute Bridge', requiredEquipment: [],
    description: 'Posterior chain activation with minimal spinal loading',
    sets: 2, reps: null, duration: '45s', rest: '30s',
    instructions: 'Lie on back, knees bent, feet hip-width flat on mat. Drive through heels to lift hips until body forms a straight line from knees to shoulders. Hold 2 seconds at top.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/3013.gif',
  },
  {
    id: 'mr2', name: 'Dead Bug', requiredEquipment: [],
    description: 'Deep core, anti-rotation stability and lumbar spine control',
    sets: 2, reps: '8 each side', duration: null, rest: '30s',
    instructions: 'Lie on back, arms pointing to ceiling, knees bent at 90°. Slowly extend opposite arm and leg toward floor while pressing lower back firmly into mat.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0276.gif',
  },
  {
    id: 'mr3', name: 'Side-Lying Hip Abduction', requiredEquipment: [],
    description: 'Glute medius and hip stability — low-impact, joint-safe',
    sets: 2, reps: '12 each side', duration: null, rest: '20s',
    instructions: 'Lie on your side on mat, bottom leg bent for stability. Slowly lift the top leg to 45 degrees, hold 1 second, lower with control.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0710.gif',
  },
  {
    id: 'mr4', name: 'Supine Spinal Twist', requiredEquipment: [],
    description: 'Deep transverse thoracic and lumbar decompression',
    sets: 2, reps: '30s each side', duration: null, rest: '20s',
    instructions: 'Lie on back with arms out. Draw knees up and gently let them drop to one side while keeping shoulders flat on mat. Breathe smoothly.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/3639.gif',
  },
  {
    id: 'mr5', name: 'Seated Hamstring & Posterior Stretch', requiredEquipment: [],
    description: 'Hamstring, calf and posterior chain decompression',
    sets: 2, reps: null, duration: '40s', rest: '20s',
    instructions: 'Sit on mat with legs extended straight. Hinge forward from hips reaching toward toes or shins with tall spine.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/1511.gif',
  },
];

// Pure Bodyweight Functional Movement Pool (Guaranteed Zero Equipment)
const MAIN_BODYWEIGHT_FUNCTIONAL = [
  {
    id: 'bwf1', name: 'Bodyweight Squat', requiredEquipment: [],
    description: 'Compound lower body strength with anterior core bracing — zero equipment',
    sets: 3, reps: '12', duration: null, rest: '45s',
    instructions: 'Feet shoulder-width apart, arms out for balance. Squat until thighs parallel to floor, keeping chest proud. Drive through heels to stand.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/3119.gif',
  },
  {
    id: 'bwf2', name: 'Standard Push-Up', requiredEquipment: [],
    description: 'Upper body horizontal pressing pattern — bodyweight only',
    sets: 3, reps: '10', duration: null, rest: '40s',
    instructions: 'Hands shoulder-width apart on floor. Lower chest with control, press up firmly with elbows tracking at 45 degrees.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0662.gif',
  },
  {
    id: 'bwf3', name: 'Glute Bridge March', requiredEquipment: [],
    description: 'Posterior chain and hip stability — bodyweight floor movement',
    sets: 3, reps: '12', duration: null, rest: '40s',
    instructions: 'Lie on back in glute bridge. Hold hips high while alternately lifting one foot slightly off floor in marching motion.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/3561.gif',
  },
  {
    id: 'bwf4', name: 'Bodyweight Split Squat', requiredEquipment: [],
    description: 'Unilateral lower body strength and dynamic hip stability — zero equipment',
    sets: 3, reps: '10 each leg', duration: null, rest: '40s',
    instructions: 'Take a staggered split stance. Lower back knee toward floor while keeping torso upright. Drive through front heel to return.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/2368.gif',
  },
  {
    id: 'bwf5', name: 'Plank Hold', requiredEquipment: [],
    description: 'Isometric core stability and anti-extension endurance — zero equipment',
    sets: 3, reps: null, duration: '30s', rest: '30s',
    instructions: 'Forearms on floor, body forming a rigid straight line from head to heels. Keep pelvis neutral and breathe steadily.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0464.gif',
  },
];

// Pure Bodyweight Strength Pool (Guaranteed Zero Equipment)
const MAIN_BODYWEIGHT_STRENGTH = [
  {
    id: 'bws1', name: 'Push-Up', requiredEquipment: [],
    description: 'Full-body pressing strength with scapular stability — zero equipment',
    sets: 4, reps: '10', duration: null, rest: '60s',
    instructions: 'Hands shoulder-width on floor, body straight. Lower chest to 1 inch from floor with elbows tracking at 45°. Press up powerfully.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0662.gif',
  },
  {
    id: 'bws2', name: 'Bodyweight Squats', requiredEquipment: [],
    description: 'Progressive quad and glute strength through deep controlled squats — zero equipment',
    sets: 4, reps: '12', duration: null, rest: '60s',
    instructions: 'Feet shoulder-width. Descend into full squat with thighs parallel or lower, chest tall. Drive up through heels.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/3119.gif',
  },
  {
    id: 'bws3', name: 'Diamond Push-Up', requiredEquipment: [],
    description: 'Triceps and inner chest focus — advanced bodyweight pressing pattern',
    sets: 3, reps: '8-10', duration: null, rest: '60s',
    instructions: 'Hands close together on floor under chest forming diamond shape with thumbs and index fingers. Lower chest with control and press up.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0283.gif',
  },
  {
    id: 'bws4', name: 'Bodyweight Glute Bridge', requiredEquipment: [],
    description: 'Posterior chain hypertrophy and glute drive — zero equipment floor mat',
    sets: 4, reps: '15', duration: null, rest: '45s',
    instructions: 'Lie on back, drive heels into floor to bridge hips up until knees, hips, and shoulders align. Squeeze glutes forcefully for 2 full seconds.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/3013.gif',
  },
  {
    id: 'bws5', name: 'Bodyweight Split Squat', requiredEquipment: [],
    description: 'Unilateral quadriceps strength and knee joint stabilizer strengthening',
    sets: 3, reps: '10 each side', duration: null, rest: '45s',
    instructions: 'Staggered stance. Lower back knee toward floor while keeping torso upright. Drive through front heel to return to top.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/2368.gif',
  },
  {
    id: 'bws6', name: 'Mountain Climbers', requiredEquipment: [],
    description: 'Core endurance, pelvic stabilization, and metabolic conditioning',
    sets: 3, reps: null, duration: '35s', rest: '30s',
    instructions: 'High plank position. Drive knees alternately toward chest at steady rhythm while keeping hips level.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0630.gif',
  },
];

// Dumbbell-Specific Strength Exercises (Requires Dumbbells)
const MAIN_DUMBBELL_STRENGTH = [
  {
    id: 'ms1', name: 'Dumbbell Romanian Deadlift', requiredEquipment: ['Dumbbells'],
    description: 'Posterior chain hinge strength — hamstrings and glutes',
    sets: 4, reps: '8', duration: null, rest: '60s',
    instructions: 'Hold dumbbells in front of thighs. Hinge at hips with a neutral spine, lowering weights along shins. Drive hips forward to stand. Squeeze glutes at top.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0411.gif',
  },
  {
    id: 'ms2', name: 'Push-Up', requiredEquipment: [],
    description: 'Full-body pressing strength with scapular stability',
    sets: 4, reps: '10', duration: null, rest: '60s',
    instructions: 'Hands shoulder-width on floor, body straight. Lower chest to 1 inch from floor with elbows tracking at 45°. Press up powerfully.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0662.gif',
  },
  {
    id: 'ms3', name: 'Dumbbell Goblet Squat', requiredEquipment: ['Dumbbells'],
    description: 'Compound quad and glute strength with core bracing',
    sets: 4, reps: '10', duration: null, rest: '60s',
    instructions: 'Hold weight at chest, feet shoulder-width. Lower into squat until thighs parallel. Keep chest upright and knees tracking toes.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0308.gif',
  },
  {
    id: 'ms4', name: 'Dumbbell Overhead Press', requiredEquipment: ['Dumbbells'],
    description: 'Vertical push strength — deltoids and triceps',
    sets: 3, reps: '10', duration: null, rest: '60s',
    instructions: 'Hold dumbbells at shoulder height, palms facing forward. Press up until arms are fully extended overhead. Lower slowly.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0318.gif',
  },
  {
    id: 'ms5', name: 'Dumbbell Row', requiredEquipment: ['Dumbbells'],
    description: 'Horizontal pull and scapular retraction strength',
    sets: 3, reps: '10 each side', duration: null, rest: '45s',
    instructions: 'Hinge forward with flat back. Pull dumbbell up to lower rib cage, driving elbow toward ceiling. Squeeze lats at top.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0368.gif',
  },
  {
    id: 'ms6', name: 'Dumbbell Walking Lunge', requiredEquipment: ['Dumbbells'],
    description: 'Loaded unilateral lower body strength and hip stabilizer recruitment',
    sets: 3, reps: '10 each leg', duration: null, rest: '60s',
    instructions: 'Hold dumbbell at sides. Step forward into lunge, lowering back knee toward floor. Drive up and step through.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0336.gif',
  },
];

// Resistance Band Strength Exercises (Requires Resistance Bands)
const MAIN_BAND_STRENGTH = [
  {
    id: 'band1', name: 'Banded Squat', requiredEquipment: ['Resistance Bands'],
    description: 'Lower body strength with ascending variable resistance',
    sets: 4, reps: '12', duration: null, rest: '45s',
    instructions: 'Stand on band with feet shoulder-width, loop ends over shoulders or hold at chest. Squat down and drive up against band tension.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/3119.gif',
  },
  {
    id: 'band2', name: 'Banded Row', requiredEquipment: ['Resistance Bands'],
    description: 'Upper back and lat recruitment with peak contraction tension',
    sets: 3, reps: '12', duration: null, rest: '45s',
    instructions: 'Anchor band around feet or sturdy object. Hinge forward and pull handles toward hips, squeezing shoulder blades together.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0368.gif',
  },
  {
    id: 'band3', name: 'Banded Overhead Press', requiredEquipment: ['Resistance Bands'],
    description: 'Shoulder stability and vertical pressing power',
    sets: 3, reps: '10', duration: null, rest: '45s',
    instructions: 'Stand on band, press handles directly overhead until elbows lock softly. Lower with control.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0318.gif',
  },
  {
    id: 'band4', name: 'Banded Pull-Aparts', requiredEquipment: ['Resistance Bands'],
    description: 'Rear deltoid and rhomboid postural strengthening',
    sets: 3, reps: '15', duration: null, rest: '30s',
    instructions: 'Hold band in front at shoulder height. Pull band apart by squeezing shoulder blades until band touches chest.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/3224.gif',
  },
  {
    id: 'band5', name: 'Push-Up', requiredEquipment: [],
    description: 'Horizontal pushing strength and core integration',
    sets: 3, reps: '10', duration: null, rest: '45s',
    instructions: 'Hands shoulder-width on floor, lower chest to 1 inch from floor, press up powerfully.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0662.gif',
  },
];

// Cardio & Metabolic Conditioning (Bodyweight Only)
const MAIN_CARDIO = [
  {
    id: 'mc1', name: 'High Knees', requiredEquipment: [],
    description: 'Cardiovascular conditioning and hip flexor drive',
    sets: 3, reps: null, duration: '45s', rest: '30s',
    instructions: 'Run in place driving knees up to hip height with quick ground contact. Keep chest tall and arms pumping.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/3636.gif',
  },
  {
    id: 'mc2', name: 'Burpee (Standard)', requiredEquipment: [],
    description: 'Full-body metabolic conditioning — peak intensity',
    sets: 3, reps: '8', duration: null, rest: '45s',
    instructions: 'Squat, place hands on floor, jump or step feet back to plank, perform push-up, jump feet to hands, and leap vertically with arms overhead.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/1160.gif',
  },
  {
    id: 'mc3', name: 'Jump Squat', requiredEquipment: [],
    description: 'Plyometric lower body power and heart rate elevation',
    sets: 3, reps: '12', duration: null, rest: '40s',
    instructions: 'Squat down to parallel, then explode upward into a jump. Land softly with bent knees and immediately descend into the next rep.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0514.gif',
  },
  {
    id: 'mc4', name: 'Mountain Climbers', requiredEquipment: [],
    description: 'Core engagement and sustained aerobic output',
    sets: 3, reps: null, duration: '40s', rest: '25s',
    instructions: 'High plank. Drive alternating knees toward chest rapidly. Keep hips level and breathe steadily.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0630.gif',
  },
  {
    id: 'mc5', name: 'Jumping Jacks', requiredEquipment: [],
    description: 'Full-body cardiovascular conditioning and agility',
    sets: 3, reps: null, duration: '45s', rest: '30s',
    instructions: 'Jump feet wide while bringing arms overhead. Jump back to starting position with feet together and arms at sides.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/3224.gif',
  },
];

// Dynamic Mobility Flow (Bodyweight Only)
const MAIN_MOBILITY = [
  {
    id: 'mm1', name: 'Butterfly Hip Opener', requiredEquipment: [],
    description: 'Hip flexors, groin and pelvic girdle mobility in a seated posture',
    sets: 2, reps: null, duration: '45s', rest: '15s',
    instructions: 'Sit tall, soles of feet touching. Gently allow knees to open downward toward floor while maintaining straight spine.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/1494.gif',
  },
  {
    id: 'mm2', name: 'Spine Stretch / Child’s Pose', requiredEquipment: [],
    description: 'Thoracic extension, lat release and spinal decompression',
    sets: 2, reps: null, duration: '60s', rest: '15s',
    instructions: 'Kneel and sit hips back to heels. Extend arms forward on mat and let forehead rest gently on floor. Breathe deeply.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/1363.gif',
  },
  {
    id: 'mm3', name: 'Supine Spinal Twist', requiredEquipment: [],
    description: 'Thoracic and lumbar decompression, hip external rotation',
    sets: 2, reps: null, duration: '45s each side', rest: '15s',
    instructions: 'Lie on back. Guide one knee across chest toward floor with opposite hand while keeping shoulders pinned flat.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/3639.gif',
  },
  {
    id: 'mm4', name: 'Seated Glute Stretch', requiredEquipment: [],
    description: 'Deep piriformis and glute medius tension release',
    sets: 2, reps: null, duration: '45s each side', rest: '10s',
    instructions: 'Seated, cross one leg over the other, hugging knee toward chest to feel a gentle stretch in the outer hip and glute.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/1424.gif',
  },
  {
    id: 'mm5', name: 'Seated Hamstring Stretch', requiredEquipment: [],
    description: 'Hamstrings, posterior chain and calf flexibility',
    sets: 2, reps: null, duration: '45s', rest: '10s',
    instructions: 'Seated with legs extended straight in front. Hinge forward at hips reaching toward toes or shins with neutral spine.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/1511.gif',
  },
];

// Cool-Down Libraries (Bodyweight Only)
const COOLDOWN_GENTLE = [
  {
    id: 'cg1', name: "Child's Pose", requiredEquipment: [],
    description: 'Spinal decompression and lat/hip stretch',
    sets: 1, reps: null, duration: '60s', rest: '0s',
    instructions: 'Kneel, sink hips back to heels, extend arms forward on floor. Forehead rests gently on mat. Breathe deeply into ribs and release.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/1363.gif',
  },
  {
    id: 'cg2', name: 'Butterfly Stretch', requiredEquipment: [],
    description: 'Lower back release and inner groin opening',
    sets: 1, reps: null, duration: '60s', rest: '0s',
    instructions: 'Sit with feet together, gently ease knees outward toward mat. Breathe smoothly into hip joints.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/1494.gif',
  },
  {
    id: 'cg3', name: 'Supine Spinal Twist', requiredEquipment: [],
    description: 'Thoracic and lumbar decompression and release',
    sets: 1, reps: null, duration: '45s each side', rest: '0s',
    instructions: 'Lie on back, draw one knee to chest, guide it across to opposite side. Keep both shoulders flat. Breathe into the rotation.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/3639.gif',
  },
];

const COOLDOWN_STANDARD = [
  {
    id: 'cs1', name: "Child's Pose", requiredEquipment: [],
    description: 'Spinal decompression and lat/hip stretch',
    sets: 1, reps: null, duration: '60s', rest: '0s',
    instructions: 'Kneel, sink hips back to heels, extend arms forward on floor. Breathe deeply into ribs.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/1363.gif',
  },
  {
    id: 'cs2', name: 'Seated Forward Fold', requiredEquipment: [],
    description: 'Hamstring and posterior chain release',
    sets: 1, reps: null, duration: '45s', rest: '0s',
    instructions: 'Sit with legs extended straight. Hinge at hips to reach forward toward shins or toes. Relax shoulders and neck completely.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/1511.gif',
  },
  {
    id: 'cs3', name: 'Seated Glute Stretch', requiredEquipment: [],
    description: 'Glute and hip rotator lengthening post-workout',
    sets: 1, reps: null, duration: '30s each side', rest: '0s',
    instructions: 'Seated, cross one ankle over opposite knee or hug knee into chest. Feel gentle release across outer hip.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/1424.gif',
  },
];

/**
 * Validates whether an exercise can be performed given the patient's selected equipment.
 * Strict mathematical subset rule: requiredEquipment ⊆ patientSelectedEquipment.
 * Zero-Equipment (Bodyweight) exercises have requiredEquipment: [] and are ALWAYS allowed.
 *
 * @param {object} exercise - Exercise object with requiredEquipment array.
 * @param {string[]} [userEquipment] - Array of equipment strings selected by the user.
 * @returns {boolean}
 */
export function canPerformExercise(exercise, userEquipment = []) {
  if (!exercise) return false;
  const required = exercise.requiredEquipment || [];

  // Bodyweight exercises require no equipment and are universally allowed
  if (required.length === 0) return true;

  // If user selected "No Equipment" or has empty selection, no equipment-dependent exercise is allowed
  if (
    !userEquipment ||
    userEquipment.length === 0 ||
    userEquipment.includes('No Equipment') ||
    (userEquipment.length === 1 && userEquipment[0] === 'No Equipment')
  ) {
    return false;
  }

  const normUserEq = userEquipment.map(e => String(e).toLowerCase().trim());

  // Check if every item in requiredEquipment is matched in patientSelectedEquipment
  return required.every(req => {
    const normReq = String(req).toLowerCase().trim();
    // 'Gym Equipment' superset satisfies Dumbbells / Barbells / Machines
    if (normUserEq.includes('gym equipment')) return true;
    return normUserEq.includes(normReq);
  });
}

/**
 * Filter an exercise list ensuring only compatible exercises are included,
 * filling missing slots from a bodyweight fallback pool if necessary.
 */
function filterAndBackfillExercises(exercises, userEquipment, fallbackPool, minCount = 3) {
  const allowed = exercises.filter(e => canPerformExercise(e, userEquipment));
  if (allowed.length >= minCount) return allowed;

  const existingIds = new Set(allowed.map(e => e.id));
  const result = [...allowed];

  for (const fallback of fallbackPool) {
    if (result.length >= minCount) break;
    if (!existingIds.has(fallback.id) && canPerformExercise(fallback, userEquipment)) {
      result.push(fallback);
      existingIds.add(fallback.id);
    }
  }

  return result;
}

/**
 * generatePersonalizedDailyPlan — creates a real-time, readiness-adaptive daily workout.
 * Strictly filters and customizes exercises based on the patient's selected equipment.
 *
 * Equipment precedence:
 *   1. todayCheckin.equipment (selected during today's check-in)
 *   2. profile.equipment (from latest weekly assessment / onboarding)
 *   3. ["No Equipment"] (default bodyweight fallback)
 *
 * @param {object|null} todayCheckin - { avgReadiness, result, scores, equipment }
 * @param {object|null} profile - { primaryGoal, fitnessLevel, commitment, equipment, considerations }
 * @param {string} date - YYYY-MM-DD local date string for this plan
 * @returns workout object with strict equipment validation
 */
export function generatePersonalizedDailyPlan(todayCheckin, profile, date) {
  const score = todayCheckin?.avgReadiness ?? 0;
  const result = todayCheckin?.result ?? null;
  const energy = todayCheckin?.scores?.energy ?? 0;
  const soreness = todayCheckin?.scores?.soreness ?? 3;
  const pain = todayCheckin?.scores?.pain ?? 3;
  const hasCheckin = !!todayCheckin;

  const goal = profile?.primaryGoal || 'General Fitness';
  const level = profile?.fitnessLevel || 'Beginner';
  const commitStr = profile?.commitment || '30 min';
  const considerations = profile?.considerations || [];

  // ── STRICT EQUIPMENT RESOLUTION ──
  // Check-in equipment takes precedence (e.g. user traveling or at home today)
  let rawEquipment = todayCheckin?.equipment || profile?.equipment || [];
  if (!Array.isArray(rawEquipment) || rawEquipment.length === 0) {
    rawEquipment = ['No Equipment'];
  }
  // If 'No Equipment' is selected along with others, enforce exclusive zero-equipment mode
  const isStrictNoEquipment = rawEquipment.includes('No Equipment') || rawEquipment.length === 0;
  const equipment = isStrictNoEquipment ? ['No Equipment'] : rawEquipment;

  const hasDumbbells = canPerformExercise({ requiredEquipment: ['Dumbbells'] }, equipment);
  const hasBands = canPerformExercise({ requiredEquipment: ['Resistance Bands'] }, equipment);
  const hasInjuryFlag = considerations.some(c => !['None of These'].includes(c));

  // Determine tier
  let tier = 'prime';
  if (!hasCheckin) tier = 'preview';
  else if (score <= 4 || energy <= 2 || pain >= 4) tier = 'recovery';
  else if (score <= 7 || energy <= 3 || soreness >= 4) tier = 'adjusted';

  // Build adaptation note
  let adaptationNote = '';
  if (!hasCheckin) {
    adaptationNote = 'Log your daily check-in to receive a readiness-calibrated plan. Below is a baseline routine.';
  } else if (tier === 'recovery') {
    adaptationNote = `Low readiness signals detected (Energy ${energy}/5, Score ${score}/10). Today's session prioritises joint decompression, restorative mobility, and nervous system recovery. No high-impact work.`;
  } else if (tier === 'adjusted') {
    adaptationNote = `Mixed readiness signals (Energy ${energy}/5, Score ${score}/10 — Train with Caution). Intensity is scaled back with controlled movements and extended rest. Focus on quality over volume.`;
  } else {
    adaptationNote = `Peak readiness (Energy ${energy}/5, Score ${score}/10 — Ready to Train). Full intensity session tailored to your ${goal} goal.`;
  }

  // Select warm-up (100% bodyweight compatible)
  let warmUp;
  if (tier === 'recovery') warmUp = WARMUP_GENTLE;
  else if (tier === 'adjusted') warmUp = WARMUP_MODERATE;
  else warmUp = WARMUP_INTENSE;

  // Select main workout matching Tier, Goal, AND Equipment
  let mainWorkout;
  let title, focus, difficulty;

  if (tier === 'recovery') {
    mainWorkout = MAIN_RECOVERY;
    title = 'Restorative Mobility & Decompression';
    focus = 'Joint decompression, restorative mobility, and gentle core activation';
    difficulty = 'Light';
  } else if (tier === 'adjusted') {
    // Controlled functional strength
    if (isStrictNoEquipment) {
      mainWorkout = MAIN_BODYWEIGHT_FUNCTIONAL;
    } else if (hasDumbbells) {
      mainWorkout = [
        MAIN_DUMBBELL_STRENGTH[2], // Dumbbell Goblet Squat
        MAIN_BODYWEIGHT_FUNCTIONAL[1], // Incline / Standard Push-Up
        MAIN_DUMBBELL_STRENGTH[4], // Dumbbell Row
        MAIN_BODYWEIGHT_FUNCTIONAL[3], // Reverse Lunge
        MAIN_BODYWEIGHT_FUNCTIONAL[4], // Plank Hold
      ];
    } else if (hasBands) {
      mainWorkout = [
        MAIN_BAND_STRENGTH[0], // Banded Squat
        MAIN_BODYWEIGHT_FUNCTIONAL[1], // Incline Push-Up
        MAIN_BAND_STRENGTH[1], // Banded Row
        MAIN_BODYWEIGHT_FUNCTIONAL[3], // Reverse Lunge
        MAIN_BODYWEIGHT_FUNCTIONAL[4], // Plank Hold
      ];
    } else {
      mainWorkout = MAIN_BODYWEIGHT_FUNCTIONAL;
    }

    if (hasInjuryFlag) {
      // Scale out high-compression movements
      mainWorkout = mainWorkout.filter(e => !['Push-Up', 'Burpee (Standard)'].includes(e.name));
    }
    title = 'Controlled Functional Strength';
    focus = 'Functional strength and core stability with controlled tempo';
    difficulty = 'Moderate';
  } else if (tier === 'preview') {
    mainWorkout = isStrictNoEquipment ? MAIN_BODYWEIGHT_FUNCTIONAL : (hasDumbbells ? MAIN_DUMBBELL_STRENGTH.slice(0, 5) : MAIN_BODYWEIGHT_FUNCTIONAL);
    title = 'Baseline Movement Routine';
    focus = 'Foundational movements — check in daily for a personalised plan';
    difficulty = 'Moderate';
  } else {
    // Prime — goal-specific
    if (goal === 'Build Strength' || goal === 'Weight Gain') {
      if (hasDumbbells) {
        mainWorkout = MAIN_DUMBBELL_STRENGTH;
        title = 'Progressive Dumbbell Strength';
        focus = 'Loaded compound movements targeting progressive hypertrophy and strength';
      } else if (hasBands) {
        mainWorkout = MAIN_BAND_STRENGTH;
        title = 'Resistance Band Hypertrophy';
        focus = 'Ascending tension compound movements with resistance bands';
      } else {
        mainWorkout = MAIN_BODYWEIGHT_STRENGTH;
        title = 'Calisthenics & Bodyweight Strength';
        focus = 'Full-body progressive calisthenics, tempo squats, push-ups and core endurance';
      }
      difficulty = level === 'Advanced' ? 'Intense' : 'Moderate-High';
    } else if (goal === 'Weight Loss' || goal === 'Improve Stamina') {
      mainWorkout = MAIN_CARDIO;
      title = 'Metabolic Conditioning Circuit';
      focus = 'High-intensity intervals and aerobic work to maximise calorie burn and stamina';
      difficulty = level === 'Beginner' ? 'Moderate' : 'High';
    } else if (goal === 'Improve Mobility') {
      mainWorkout = MAIN_MOBILITY;
      title = 'Dynamic Mobility Flow';
      focus = 'Joint mobility, flexibility, and movement quality across full range of motion';
      difficulty = 'Light-Moderate';
    } else {
      // General Fitness / Build Healthy Habits
      if (hasDumbbells) {
        mainWorkout = [MAIN_DUMBBELL_STRENGTH[2], MAIN_DUMBBELL_STRENGTH[4], MAIN_CARDIO[0], MAIN_BODYWEIGHT_STRENGTH[0], MAIN_CARDIO[3]];
      } else if (hasBands) {
        mainWorkout = [MAIN_BAND_STRENGTH[0], MAIN_BAND_STRENGTH[1], MAIN_CARDIO[0], MAIN_BODYWEIGHT_STRENGTH[0], MAIN_CARDIO[3]];
      } else {
        mainWorkout = [MAIN_BODYWEIGHT_FUNCTIONAL[0], MAIN_BODYWEIGHT_FUNCTIONAL[1], MAIN_CARDIO[0], MAIN_BODYWEIGHT_FUNCTIONAL[3], MAIN_CARDIO[3]];
      }
      title = 'Balanced Fitness Circuit';
      focus = 'Balanced circuit of strength and cardiovascular endurance';
      difficulty = 'Moderate';
    }
  }

  // ── STRICT EQUIPMENT FILTERING & BACKFILLING ──
  warmUp = filterAndBackfillExercises(warmUp, equipment, WARMUP_GENTLE, 2);
  mainWorkout = filterAndBackfillExercises(mainWorkout, equipment, MAIN_BODYWEIGHT_STRENGTH, 3);
  let coolDown = filterAndBackfillExercises(
    tier === 'recovery' ? COOLDOWN_GENTLE : COOLDOWN_STANDARD,
    equipment,
    COOLDOWN_STANDARD,
    2
  );

  // ── ABSOLUTE ZERO-EQUIPMENT ASSERTION SAFEGUARD ──
  if (isStrictNoEquipment || equipment.length === 0 || equipment.includes('No Equipment')) {
    warmUp = warmUp.filter(e => !e.requiredEquipment || e.requiredEquipment.length === 0);
    mainWorkout = mainWorkout.filter(e => !e.requiredEquipment || e.requiredEquipment.length === 0);
    coolDown = coolDown.filter(e => !e.requiredEquipment || e.requiredEquipment.length === 0);
  }

  // Trim to fitness level volume
  if (level === 'Beginner') {
    mainWorkout = mainWorkout.slice(0, 3).map(e => ({ ...e, sets: Math.min(e.sets || 2, 2) }));
  } else if (level === 'Intermediate') {
    mainWorkout = mainWorkout.slice(0, 4);
  }

  const totalExercises = warmUp.length + mainWorkout.length + coolDown.length;
  let duration;
  if (tier === 'recovery') duration = 18;
  else if (tier === 'adjusted') duration = 25;
  else {
    const commitMins = parseInt(commitStr) || 30;
    duration = Math.min(commitMins, tier === 'prime' ? 38 : 25);
  }

  const equipmentBadge = isStrictNoEquipment
    ? '🤸 Bodyweight Only (No Equipment)'
    : `🏋️ ${equipment.join(', ')}`;

  return {
    id: `workout_${date || 'today'}_${Date.now()}`,
    date: date || todayStr(),
    title,
    focus,
    duration,
    difficulty,
    exerciseCount: totalExercises,
    tier,
    equipment,
    equipmentBadge,
    adaptationNote,
    score: score || null,
    readinessLabel: result === 'ready' ? 'Ready to Train' : result === 'adjusted' ? 'Train with Caution' : result === 'recovery' ? 'Recovery Day' : null,
    goal,
    warmUp,
    mainWorkout,
    coolDown,
  };
}


// ─── Monday Biometrics System ──────────────────────────────────────────────

export const SK_BIOMETRICS = 'pw_biometrics_history_v2';
export const SK_PROFILE     = 'pw_profile_v2';

function _localDateStr(date = new Date()) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Returns BMI and clinical category. */
export function calculateBmi(weight, weightUnit, height, heightUnit) {
  let weightKg = parseFloat(weight);
  let heightM = parseFloat(height);
  if (!weightKg || !heightM) return { bmi: null, category: null };

  if (weightUnit === 'lb') weightKg = weightKg * 0.453592;
  if (heightUnit === 'cm') heightM = heightM / 100;
  else if (heightUnit === 'ft') heightM = heightM * 0.3048;

  const bmi = weightKg / (heightM * heightM);
  let category;
  if (bmi < 18.5) category = 'Underweight';
  else if (bmi < 25) category = 'Healthy Weight';
  else if (bmi < 30) category = 'Overweight';
  else category = 'Obese';

  return { bmi: Math.round(bmi * 10) / 10, category };
}

/** Returns YYYY-MM-DD of the Monday of the current week (local time). */
export function getCurrentMondayDateStr() {
  const d = new Date();
  const dow = d.getDay();
  const offset = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + offset);
  return _localDateStr(d);
}

/** Returns YYYY-MM-DD of the NEXT Monday (the Monday of next week, local time). */
export function getNextMondayDateStr() {
  const d = new Date();
  const dow = d.getDay();
  const daysUntilNextMon = dow === 0 ? 1 : 8 - dow;
  d.setDate(d.getDate() + daysUntilNextMon);
  return _localDateStr(d);
}

/** Format YYYY-MM-DD → 'Monday, Sep 7, 2026' */
export function formatMondayDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Returns true if today is Monday AND no biometrics entry exists yet for this Monday for the user.
 * @param {object} [user]
 */
export function isMondayBiometricsDue(user) {
  const u = user || useAuthStore.getState().user;
  const today = new Date();
  if (today.getDay() !== 1) return false; // not Monday
  const mondayStr = _localDateStr(today);
  try {
    const raw = localStorage.getItem(getUserPwKey(SK_BIOMETRICS, u));
    const history = raw ? JSON.parse(raw) : [];
    return !history.some(e => e.date === mondayStr);
  } catch { return false; }
}

/**
 * Load biometrics history array (newest first) for user.
 * Seeds historical Monday entry for Arjun Mehta ONLY.
 * @param {object} [user]
 */
export function loadBiometricsHistory(user) {
  const u = user || useAuthStore.getState().user;
  try {
    const bioKey = getUserPwKey(SK_BIOMETRICS, u);
    const raw = localStorage.getItem(bioKey);
    let history = raw ? JSON.parse(raw) : [];

    // Seed baseline entry from user's onboarding profile if history is empty
    if (history.length === 0) {
      try {
        const profileRaw = localStorage.getItem(getUserPwKey(SK_PROFILE, u));
        const profile = profileRaw ? JSON.parse(profileRaw) : null;
        if (profile && profile.weight && profile.height) {
          const { bmi, category } = calculateBmi(profile.weight, profile.weightUnit || 'kg', profile.height, profile.heightUnit || 'cm');
          history.push({
            date: isDemoPatient(u) ? '2026-08-31' : _localDateStr(),
            weight: parseFloat(profile.weight),
            weightUnit: profile.weightUnit || 'kg',
            height: parseFloat(profile.height),
            heightUnit: profile.heightUnit || 'cm',
            bmi,
            category,
            note: isDemoPatient(u) ? 'Initial onboarding entry' : 'Initial profile baseline',
          });
          localStorage.setItem(bioKey, JSON.stringify(history));
        }
      } catch {}
    }

    return history.sort((a, b) => b.date.localeCompare(a.date));
  } catch {
    return [];
  }
}

/**
 * Save a new biometrics entry and update the user's profile.
 * @param {{ weight, weightUnit, height, heightUnit, note }} entry
 * @param {object} [user]
 */
export function saveBiometricsEntry(entry, user) {
  const u = user || useAuthStore.getState().user;
  const todayStr = _localDateStr();
  const { bmi, category } = calculateBmi(entry.weight, entry.weightUnit, entry.height, entry.heightUnit);

  const record = {
    date: todayStr,
    weight: parseFloat(entry.weight),
    weightUnit: entry.weightUnit || 'kg',
    height: parseFloat(entry.height),
    heightUnit: entry.heightUnit || 'cm',
    bmi,
    category,
    note: entry.note || '',
  };

  try {
    const bioKey = getUserPwKey(SK_BIOMETRICS, u);
    const raw = localStorage.getItem(bioKey);
    let history = raw ? JSON.parse(raw) : [];
    // Replace same-day entry or append
    history = history.filter(e => e.date !== todayStr);
    history.push(record);
    localStorage.setItem(bioKey, JSON.stringify(history));
    window.dispatchEvent(new CustomEvent('pw-biometrics-updated', { detail: record }));

    // Update profile with latest weight/height/bmi
    const profKey = getUserPwKey(SK_PROFILE, u);
    const profileRaw = localStorage.getItem(profKey);
    if (profileRaw) {
      const profile = JSON.parse(profileRaw);
      profile.weight = String(record.weight);
      profile.weightUnit = record.weightUnit;
      profile.height = String(record.height);
      profile.heightUnit = record.heightUnit;
      profile.bmi = bmi;
      profile.bmiCategory = category;
      localStorage.setItem(profKey, JSON.stringify(profile));
    }
  } catch {}

  return record;
}

// ─── Weekly Monday Assessment & Historical Versioning ──────────────────────

export const SK_ASSESSMENT_HISTORY = "pw_assessment_history_v2";
export const SK_WEEKLY_PLANS_HISTORY = "pw_weekly_plans_history_v2";

/**
 * Loads the full historical record of Physical Wellness weekly assessments for the user (newest first).
 * Never overwrites or destroys historical assessments.
 * @param {object} [user]
 * @returns {Array<object>}
 */
export function loadAssessmentHistory(user) {
  const u = user || useAuthStore.getState().user;
  try {
    const raw = localStorage.getItem(getUserPwKey(SK_ASSESSMENT_HISTORY, u));
    let history = raw ? JSON.parse(raw) : [];

    // If history is empty but user already has an onboarding profile, seed Baseline Version 1
    if (history.length === 0) {
      const profRaw = localStorage.getItem(getUserPwKey(SK_PROFILE, u));
      if (profRaw) {
        const p = JSON.parse(profRaw);
        const baselineMonday = isDemoPatient(u) ? "2026-08-31" : getCurrentMondayDateStr();
        const { bmi, category } = calculateBmi(p.weight, p.weightUnit || "kg", p.height, p.heightUnit || "cm");
        const v1 = {
          id: `asm_v1_${isDemoPatient(u) ? "demo" : Date.now()}`,
          version: 1,
          weekStartDate: baselineMonday,
          completedAt: isDemoPatient(u) ? "2026-08-31T09:00:00.000Z" : new Date().toISOString(),
          weight: parseFloat(p.weight || 70),
          weightUnit: p.weightUnit || "kg",
          height: parseFloat(p.height || 175),
          heightUnit: p.heightUnit || "cm",
          bmi,
          bmiCategory: category,
          primaryGoal: p.primaryGoal || "General Fitness",
          secondaryGoal: p.secondaryGoal || "",
          fitnessLevel: p.fitnessLevel || "Beginner",
          activityLevel: p.activityLevel || "Moderate",
          exerciseFrequency: p.exerciseFrequency || "4 days/week",
          commitment: p.commitment || "30 min",
          environment: p.environment || "Home",
          equipment: Array.isArray(p.equipment) && p.equipment.length > 0 ? p.equipment : ["No Equipment"],
          workoutPreferences: p.workoutPreferences || [],
          considerations: p.considerations || [],
          progressNotes: "Initial onboarding assessment baseline",
        };
        history.push(v1);
        localStorage.setItem(getUserPwKey(SK_ASSESSMENT_HISTORY, u), JSON.stringify(history));
      }
    }

    return history.sort((a, b) => (b.version || 0) - (a.version || 0));
  } catch {
    return [];
  }
}

/**
 * Returns the latest active Physical Wellness assessment.
 * @param {object} [user]
 * @returns {object|null}
 */
export function getLatestAssessment(user) {
  const history = loadAssessmentHistory(user);
  return history[0] || null;
}

/**
 * Returns true if today is Monday AND the patient has not yet completed their weekly assessment for this Monday.
 * @param {object} [user]
 * @returns {boolean}
 */
export function isWeeklyAssessmentDue(user) {
  const u = user || useAuthStore.getState().user;
  const today = new Date();
  if (today.getDay() !== 1) return false; // Only required on Mondays
  const currentMondayStr = getCurrentMondayDateStr(today);
  const history = loadAssessmentHistory(u);
  // Check if a weekly assessment already exists for this Monday with version > 1 or completed today
  const hasThisWeek = history.some(a => a.weekStartDate === currentMondayStr && a.version > 1);
  return !hasThisWeek;
}

/**
 * Saves a new Monday assessment as a NEW VERSION, preserving all prior history intact.
 * Updates active profile and regenerates personalized recommendations matching new equipment.
 *
 * @param {object} data - Assessment data collected from Monday update modal.
 * @param {object} [user]
 * @returns {{ assessment: object, plan: object }}
 */
export function saveWeeklyAssessment(data, user) {
  const u = user || useAuthStore.getState().user;
  const prevHistory = loadAssessmentHistory(u);
  const currentMondayStr = getCurrentMondayDateStr();
  const nextVersion = prevHistory.length > 0 ? (prevHistory[0].version || prevHistory.length) + 1 : 1;

  const { bmi, category } = calculateBmi(data.weight, data.weightUnit || "kg", data.height, data.heightUnit || "cm");

  const newAssessment = {
    id: `asm_v${nextVersion}_${Date.now()}`,
    version: nextVersion,
    weekStartDate: currentMondayStr,
    completedAt: new Date().toISOString(),
    weight: parseFloat(data.weight),
    weightUnit: data.weightUnit || "kg",
    height: parseFloat(data.height),
    heightUnit: data.heightUnit || "cm",
    bmi,
    bmiCategory: category,
    primaryGoal: data.primaryGoal || "General Fitness",
    secondaryGoal: data.secondaryGoal || "",
    fitnessLevel: data.fitnessLevel || "Beginner",
    activityLevel: data.activityLevel || "Moderate",
    exerciseFrequency: data.exerciseFrequency || "4 days/week",
    commitment: data.commitment || "30 min",
    environment: data.environment || "Home",
    equipment: Array.isArray(data.equipment) && data.equipment.length > 0
      ? (data.equipment.includes("No Equipment") ? ["No Equipment"] : data.equipment)
      : ["No Equipment"],
    workoutPreferences: data.workoutPreferences || [],
    considerations: data.considerations || [],
    progressNotes: data.progressNotes || data.note || "",
  };

  // 1. PRESERVE HISTORY: Prepend new version to assessment history
  const updatedHistory = [newAssessment, ...prevHistory];
  try {
    localStorage.setItem(getUserPwKey(SK_ASSESSMENT_HISTORY, u), JSON.stringify(updatedHistory));
  } catch {}

  // 2. UPDATE ACTIVE PROFILE: Sync active profile with new equipment & goals
  try {
    const profKey = getUserPwKey(SK_PROFILE, u);
    const existingProfRaw = localStorage.getItem(profKey);
    const existingProf = existingProfRaw ? JSON.parse(existingProfRaw) : {};
    const updatedProf = {
      ...existingProf,
      weight: String(newAssessment.weight),
      weightUnit: newAssessment.weightUnit,
      height: String(newAssessment.height),
      heightUnit: newAssessment.heightUnit,
      bmi: newAssessment.bmi,
      bmiCategory: newAssessment.bmiCategory,
      primaryGoal: newAssessment.primaryGoal,
      secondaryGoal: newAssessment.secondaryGoal,
      fitnessLevel: newAssessment.fitnessLevel,
      activityLevel: newAssessment.activityLevel,
      exerciseFrequency: newAssessment.exerciseFrequency,
      commitment: newAssessment.commitment,
      environment: newAssessment.environment,
      equipment: newAssessment.equipment,
      considerations: newAssessment.considerations,
      lastAssessmentId: newAssessment.id,
      lastAssessmentVersion: newAssessment.version,
    };
    localStorage.setItem(profKey, JSON.stringify(updatedProf));
  } catch {}

  // 3. UPDATE BIOMETRICS: Add Monday biometrics entry for charts
  saveBiometricsEntry({
    weight: newAssessment.weight,
    weightUnit: newAssessment.weightUnit,
    height: newAssessment.height,
    heightUnit: newAssessment.heightUnit,
    note: `Week ${newAssessment.version} Monday update: ${newAssessment.equipment.join(", ")}`,
  }, u);

  // 4. REGENERATE RECOMMENDATIONS: Build new personalized plan strictly matching new equipment
  const todayPlan = generatePersonalizedDailyPlan(null, newAssessment, _localDateStr());

  // 5. PRESERVE PLAN HISTORY: Link new plan to assessment version
  saveWeeklyPlanVersion(todayPlan, newAssessment.id, u);

  // 6. DISPATCH LIVE EVENTS: Trigger UI updates across all components
  window.dispatchEvent(new CustomEvent("pw-assessment-updated", { detail: newAssessment }));
  window.dispatchEvent(new CustomEvent("pw-profile-updated", { detail: newAssessment }));
  window.dispatchEvent(new CustomEvent("pw-workout-plan-updated", { detail: todayPlan }));

  return { assessment: newAssessment, plan: todayPlan };
}

/**
 * Load saved weekly plan versions linked to assessment cycles.
 * @param {object} [user]
 * @returns {Array<object>}
 */
export function loadWeeklyPlansHistory(user) {
  const u = user || useAuthStore.getState().user;
  try {
    const raw = localStorage.getItem(getUserPwKey(SK_WEEKLY_PLANS_HISTORY, u));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Saves a weekly plan version linked to an assessment ID.
 * @param {object} plan
 * @param {string} assessmentId
 * @param {object} [user]
 */
export function saveWeeklyPlanVersion(plan, assessmentId, user) {
  const u = user || useAuthStore.getState().user;
  try {
    const history = loadWeeklyPlansHistory(u);
    const planRecord = {
      id: `wplan_${Date.now()}`,
      assessmentId,
      createdAt: new Date().toISOString(),
      equipmentContext: plan.equipment || [],
      plan,
    };
    const updated = [planRecord, ...history.slice(0, 15)];
    localStorage.setItem(getUserPwKey(SK_WEEKLY_PLANS_HISTORY, u), JSON.stringify(updated));
    return planRecord;
  } catch {
    return null;
  }
}

export function getCurrentWeekPhysicalStreakStatus(user) {
  const u = user || useAuthStore.getState().user;
  try {
    if (isDemoPatient(u)) {
      ensureLivePhysicalStreakData(u);
    }
    const rawCheckins = localStorage.getItem(getUserPwKey("pw_checkins_v2", u));
    const checkins = rawCheckins ? JSON.parse(rawCheckins) : [];

    const rawWorkouts = localStorage.getItem(getUserPwKey("pw_workouts_v2", u));
    const workouts = rawWorkouts ? JSON.parse(rawWorkouts) : [];

    const rawHabits = localStorage.getItem(getUserPwKey("pw_habit_logs_v2", u));
    const habitLogs = rawHabits ? JSON.parse(rawHabits) : {};

    const checkedDates = new Set();
    checkins.forEach(c => c.date && checkedDates.add(c.date));
    workouts.forEach(w => w.date && w.completed && checkedDates.add(w.date));
    Object.keys(habitLogs).forEach(date => {
      if (Array.isArray(habitLogs[date]) && habitLogs[date].length > 0) {
        checkedDates.add(date);
      }
    });

    const today = new Date();
    const todayIso = getLocalDateStr(today);

    // Calculate consecutive streak ending today or yesterday
    let streak = 0;
    const startOffset = checkedDates.has(todayIso) ? 0 : 1;
    for (let i = startOffset; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const ds = getLocalDateStr(d);
      if (checkedDates.has(ds)) {
        streak++;
      } else {
        break;
      }
    }
    if (streak === 0 && checkedDates.has(todayIso)) {
      streak = 1;
    }

    // Determine Monday of current week
    const dayOfWeek = today.getDay(); // 0 is Sun, 1 is Mon, ...
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
    const dayOfWeek = today.getDay();
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

// ─── Today's Workout Progress Tracker ─────────────────────────────────────────
export const SK_TODAY_WORKOUT_PROGRESS = "pw_today_workout_progress_v2";

export function getTodayWorkoutProgress(todayDateStr, user) {
  const u = user || useAuthStore.getState().user;
  const targetDate = todayDateStr || getLocalDateStr(new Date());
  try {
    const raw = localStorage.getItem(getUserPwKey(SK_TODAY_WORKOUT_PROGRESS, u));
    if (raw) {
      const data = JSON.parse(raw);
      if (data && data.date === targetDate) {
        return data;
      }
    }
  } catch {}
  return {
    date: targetDate,
    completedExercises: {}, // { [exerciseId]: { completedSets: number, totalSets: number, isComplete: boolean, completedAt: number } }
    lastActiveExIndex: 0,
    lastActiveSetNum: 1,
    isWorkoutComplete: false,
  };
}

export function saveTodayWorkoutProgress(progress, user) {
  const u = user || useAuthStore.getState().user;
  try {
    localStorage.setItem(getUserPwKey(SK_TODAY_WORKOUT_PROGRESS, u), JSON.stringify(progress));
    window.dispatchEvent(new CustomEvent('pw-workout-progress-updated', { detail: progress }));
  } catch {}
}

export function saveWorkoutActivePosition(exIndex, setNum, todayDateStr, user) {
  const u = user || useAuthStore.getState().user;
  const targetDate = todayDateStr || getLocalDateStr(new Date());
  const prog = getTodayWorkoutProgress(targetDate, u);
  prog.lastActiveExIndex = typeof exIndex === 'number' ? exIndex : 0;
  prog.lastActiveSetNum = typeof setNum === 'number' ? setNum : 1;
  saveTodayWorkoutProgress(prog, u);
  return prog;
}

export function getWorkoutResumePosition(allExercises = [], todayDateStr, user) {
  const u = user || useAuthStore.getState().user;
  const targetDate = todayDateStr || getLocalDateStr(new Date());
  const prog = getTodayWorkoutProgress(targetDate, u);
  if (!allExercises || allExercises.length === 0) {
    return { exIndex: 0, setNum: 1, isAllComplete: false };
  }

  // Find first incomplete exercise in sequence
  const firstIncompleteIdx = allExercises.findIndex(e => !prog.completedExercises?.[e.id]?.isComplete);

  if (firstIncompleteIdx === -1) {
    // All exercises completely finished
    return { exIndex: 0, setNum: 1, isAllComplete: true };
  }

  const lastIdx = typeof prog.lastActiveExIndex === 'number' ? prog.lastActiveExIndex : 0;

  let targetIdx = firstIncompleteIdx;
  if (lastIdx >= 0 && lastIdx < allExercises.length) {
    const lastEx = allExercises[lastIdx];
    const isLastExIncomplete = !prog.completedExercises?.[lastEx.id]?.isComplete;
    // Only resume at saved index if all exercises preceding it are finished
    const allPriorComplete = allExercises.slice(0, lastIdx).every(e => prog.completedExercises?.[e.id]?.isComplete);
    if (isLastExIncomplete && allPriorComplete) {
      targetIdx = lastIdx;
    }
  }

  const targetEx = allExercises[targetIdx];
  const exProg = prog.completedExercises?.[targetEx.id];
  const compSets = exProg?.completedSets || 0;
  const targetSets = targetEx?.sets || 1;

  let targetSet = 1;
  if (targetIdx === lastIdx && typeof prog.lastActiveSetNum === 'number') {
    targetSet = Math.min(targetSets, Math.max(1, prog.lastActiveSetNum, compSets + 1));
  } else {
    targetSet = Math.min(targetSets, Math.max(1, compSets + 1));
  }

  return { exIndex: targetIdx, setNum: targetSet, isAllComplete: false };
}

export function markExerciseSetComplete(exerciseId, setNum, totalSets, todayDateStr) {
  const targetDate = todayDateStr || getLocalDateStr(new Date());
  const prog = getTodayWorkoutProgress(targetDate);
  const prev = prog.completedExercises[exerciseId] || { completedSets: 0, totalSets, isComplete: false };
  const nextCompletedSets = Math.max(prev.completedSets, setNum);
  const isComplete = nextCompletedSets >= totalSets;

  prog.completedExercises[exerciseId] = {
    completedSets: nextCompletedSets,
    totalSets,
    isComplete,
    completedAt: Date.now(),
  };

  saveTodayWorkoutProgress(prog);
  return prog;
}

export function resetExerciseProgress(exerciseId, todayDateStr) {
  const targetDate = todayDateStr || getLocalDateStr(new Date());
  const prog = getTodayWorkoutProgress(targetDate);
  if (prog.completedExercises[exerciseId]) {
    delete prog.completedExercises[exerciseId];
    prog.isWorkoutComplete = false;
    prog.lastActiveSetNum = 1;
    saveTodayWorkoutProgress(prog);
  }
  return prog;
}

export function resetFullWorkoutProgress(todayDateStr) {
  const targetDate = todayDateStr || getLocalDateStr(new Date());
  const prog = {
    date: targetDate,
    completedExercises: {},
    lastActiveExIndex: 0,
    lastActiveSetNum: 1,
    isWorkoutComplete: false,
  };
  saveTodayWorkoutProgress(prog);
  return prog;
}

/**
 * Web Audio completion chime for satisfying auditory feedback when a set/exercise completes.
 */
export function playCompletionChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // First tone (523.25 Hz - C5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now);
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);

    // Second tone (659.25 Hz - E5) - upbeat resolution
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(659.25, now + 0.15);
    gain2.gain.setValueAtTime(0.15, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.55);
  } catch {}
}

