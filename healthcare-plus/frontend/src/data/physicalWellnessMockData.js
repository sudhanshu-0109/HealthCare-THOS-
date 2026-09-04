/**
 * data/physicalWellnessMockData.js
 * Source: frontend_Physical/src/data/mockData.ts
 * Converted to ES module JavaScript for Healthcare+ frontend.
 */

export const mockUser = {
  name: "Sarah",
  age: 32,
  height: { cm: 168, ft: 5, inches: 6 },
  weight: { kg: 65, lb: 143 },
  fitnessLevel: "Intermediate",
  activityLevel: "Moderate",
  goals: { primary: "General Fitness", secondary: "Improve Stamina" },
  environment: "Home",
  equipment: ["Dumbbells", "Resistance Bands"],
  considerations: [],
  commitmentMinutes: 30,
  streak: 7,
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
      name: "Hip Thrust",
      description: "Glute activation, hip extension & posterior chain power",
      sets: 3,
      reps: null,
      duration: "45s",
      rest: "30s",
      instructions: "Position upper back against support or mat, feet flat and hip-width apart. Drive through heels to extend hips toward the ceiling until thighs and torso align. Squeeze glutes firmly at top.",
      gifUrl: "https://i.pinimg.com/originals/12/31/e2/1231e24fc3d7944e38b180c51067689d.gif",
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

let isEnsuringPhysicalStreak = false;

export function ensureLivePhysicalStreakData() {
  if (isEnsuringPhysicalStreak) return;
  isEnsuringPhysicalStreak = true;
  try {
    // Seed only strictly historical demo dates (Mon Aug 31 – Thu Sep 3, 2026).
    // NEVER seed today or any future date automatically.
    const HISTORICAL_DATES = ['2026-08-31', '2026-09-01', '2026-09-02', '2026-09-03'];
    const todayIso = getLocalDateStr(new Date());

    const raw = localStorage.getItem("pw_checkins_v2");
    let checkins = raw ? JSON.parse(raw) : [];

    // Remove any auto-seeded entries for future dates or old mock stubs, but preserve real user check-ins for today
    checkins = checkins.filter(c => {
      if (!c.date) return false;
      if (c.date < todayIso) return true;
      if (c.date > todayIso) return false; // future dates
      // For today: preserve real user check-ins; remove only old auto-generated mock stubs
      const isMockStub = c.ts === new Date(todayIso + 'T08:00:00').getTime();
      return !isMockStub;
    });

    // Seed historical records if not already present
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

    localStorage.setItem("pw_checkins_v2", JSON.stringify(checkins));
  } catch (err) {
    console.warn("ensureLivePhysicalStreakData warning:", err);
  } finally {
    isEnsuringPhysicalStreak = false;
  }
}

// ─── Exercise Libraries ────────────────────────────────────────────────────

const WARMUP_GENTLE = [
  {
    id: 'wg1', name: 'Cat-Cow Stretch', description: 'Spinal mobilization and neural warming for the posterior chain',
    sets: 1, reps: null, duration: '60s', rest: '0s',
    instructions: 'On hands and knees, alternate between arching your back up (cat) and dipping it down (cow). Move slowly, syncing with your breath.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/1376.gif',
  },
  {
    id: 'wg2', name: 'Neck Half-Circles', description: 'Gentle cervical decompression and trapezius release',
    sets: 1, reps: null, duration: '45s', rest: '0s',
    instructions: 'Sit or stand tall. Drop your chin to chest, slowly roll it to one shoulder, back through center, to the other shoulder. Avoid full backward circles.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/1388.gif',
  },
  {
    id: 'wg3', name: 'Supine Spinal Twist', description: 'Thoracic and lumbar decompression, hip external rotation',
    sets: 1, reps: null, duration: '30s each side', rest: '0s',
    instructions: 'Lie on back. Draw one knee to chest, guide it across to the opposite side. Keep both shoulders flat. Breathe into the rotation.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/1472.gif',
  },
];

const WARMUP_MODERATE = [
  {
    id: 'wm1', name: 'Hip Circles', description: 'Mobilize hip flexors, pelvic girdle and lower back',
    sets: 1, reps: null, duration: '30s each side', rest: '10s',
    instructions: 'Hands on hips, feet shoulder-width apart. Draw large, smooth circles with your hips, clockwise then counterclockwise.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/1368.gif',
  },
  {
    id: 'wm2', name: 'Leg Swings', description: 'Hip flexor and hamstring dynamic warm-up',
    sets: 1, reps: null, duration: '30s each side', rest: '10s',
    instructions: 'Stand beside a wall for balance. Swing one leg forward and backward in a controlled pendulum motion, gradually increasing range of motion.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/1374.gif',
  },
  {
    id: 'wm3', name: 'Arm Circles & Cross-Body Swings', description: 'Shoulder joint mobilization and thoracic rotation warm-up',
    sets: 1, reps: null, duration: '45s', rest: '10s',
    instructions: 'Extend arms out to sides, draw small then progressively larger circles. Then swing arms across chest in alternating cross-body hugs.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/1397.gif',
  },
];

const WARMUP_INTENSE = [
  {
    id: 'wi1', name: 'Jumping Jacks', description: 'Full-body warm-up activating shoulders and hips',
    sets: 1, reps: null, duration: '60s', rest: '15s',
    instructions: 'Stand upright, jump feet apart while raising arms overhead. Return to start with light, springy bounces.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/3224.gif',
  },
  {
    id: 'wi2', name: 'Hip Circles', description: 'Mobilize hip flexors and pelvic girdle',
    sets: 1, reps: null, duration: '30s each side', rest: '10s',
    instructions: 'Hands on hips, feet shoulder-width. Draw large smooth circles with your hips in each direction.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/1368.gif',
  },
  {
    id: 'wi3', name: 'Inchworm Walk-Out', description: 'Full-body neural activation and hamstring priming',
    sets: 1, reps: null, duration: '45s', rest: '15s',
    instructions: 'Standing, hinge forward and walk hands out to a plank. Hold 1 second, walk hands back. Stand tall and repeat.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0311.gif',
  },
];

// Main exercises by tier
const MAIN_RECOVERY = [
  {
    id: 'mr1', name: 'Glute Bridge', description: 'Posterior chain activation with minimal spinal loading',
    sets: 2, reps: null, duration: '45s', rest: '30s',
    instructions: 'Lie on back, knees bent, feet hip-width. Drive through heels to lift hips until body forms a straight line from knees to shoulders. Hold 2 seconds at top.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0044.gif',
  },
  {
    id: 'mr2', name: 'Bird-Dog', description: 'Deep core, anti-rotation stability and lumbar spine control',
    sets: 2, reps: '8 each side', duration: null, rest: '30s',
    instructions: 'On hands and knees, extend opposite arm and leg simultaneously while keeping hips perfectly level and pelvis neutral. Hold 2 sec.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0272.gif',
  },
  {
    id: 'mr3', name: 'Side-Lying Hip Abduction', description: 'Glute medius and hip stability — low-impact, joint-safe',
    sets: 2, reps: '12 each side', duration: null, rest: '20s',
    instructions: 'Lie on your side, bottom leg bent for stability. Slowly lift the top leg to 45 degrees, hold 1 second, lower with control.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0596.gif',
  },
  {
    id: 'mr4', name: 'Dead Bug', description: 'Deep transverse abdominal activation and anti-extension control',
    sets: 2, reps: '8 each side', duration: null, rest: '30s',
    instructions: 'Lie on back, arms reaching up, knees bent 90°. Lower opposite arm and leg toward floor while pressing lower back into mat. Return and switch.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0276.gif',
  },
  {
    id: 'mr5', name: 'Seated Hip Hinge', description: 'Posterior chain patterning with controlled range of motion',
    sets: 2, reps: '10', duration: null, rest: '20s',
    instructions: 'Sit on the edge of a chair, feet hip-width. Hinge forward at hips with a neutral spine, feeling a light hamstring stretch. Drive hips back to upright.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/1511.gif',
  },
];

const MAIN_FUNCTIONAL = [
  {
    id: 'mf1', name: 'Goblet Squat', description: 'Compound lower body strength with anterior core bracing',
    sets: 3, reps: '12', duration: null, rest: '45s',
    instructions: 'Hold weight at chest, feet shoulder-width. Squat until thighs parallel, keeping chest tall and knees tracking toes. Drive through heels to stand.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0527.gif',
  },
  {
    id: 'mf2', name: 'Incline Push-Up', description: 'Horizontal push pattern — upper body pushing strength',
    sets: 3, reps: '10', duration: null, rest: '40s',
    instructions: 'Hands on raised surface (desk, wall, bench). Body forms a straight line from head to heels. Lower chest to surface, press up explosively.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0471.gif',
  },
  {
    id: 'mf3', name: 'Dumbbell Row', description: 'Horizontal pull and scapular retraction strength',
    sets: 3, reps: '10 each side', duration: null, rest: '40s',
    instructions: 'Hinge forward, one hand braced on thigh. Pull dumbbell toward hip, leading with the elbow. Keep shoulder blades moving — avoid shrugging.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0368.gif',
  },
  {
    id: 'mf4', name: 'Reverse Lunge', description: 'Unilateral lower body strength and dynamic hip stability',
    sets: 3, reps: '10 each leg', duration: null, rest: '40s',
    instructions: 'Step one foot back and lower back knee toward floor. Keep front shin vertical and chest upright. Drive front heel into floor to return to standing.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0420.gif',
  },
  {
    id: 'mf5', name: 'Plank Hold', description: 'Core stability, pelvic alignment and anti-extension endurance',
    sets: 3, reps: null, duration: '30s', rest: '30s',
    instructions: 'Forearms on floor, elbows under shoulders. Body forms a straight line from head to heels. Keep hips level and engage deep core throughout.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0464.gif',
  },
];

// Intensity-specific main exercises by goal
const MAIN_STRENGTH = [
  {
    id: 'ms1', name: 'Dumbbell Romanian Deadlift', description: 'Posterior chain hinge strength — hamstrings and glutes',
    sets: 4, reps: '8', duration: null, rest: '60s',
    instructions: 'Hold dumbbells in front of thighs. Hinge at hips with a neutral spine, lowering weights along shins. Drive hips forward to stand. Squeeze glutes at top.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0411.gif',
  },
  {
    id: 'ms2', name: 'Push-Up', description: 'Full-body pressing strength with scapular stability',
    sets: 4, reps: '10', duration: null, rest: '60s',
    instructions: 'Hands shoulder-width on floor, body straight. Lower chest to 1 inch from floor with elbows tracking at 45°. Press up powerfully.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0662.gif',
  },
  {
    id: 'ms3', name: 'Dumbbell Goblet Squat', description: 'Compound quad and glute strength with core bracing',
    sets: 4, reps: '10', duration: null, rest: '60s',
    instructions: 'Hold weight at chest, feet shoulder-width. Lower into squat until thighs parallel. Keep chest upright and knees tracking toes.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0527.gif',
  },
  {
    id: 'ms4', name: 'Dumbbell Overhead Press', description: 'Vertical push strength — deltoids and triceps',
    sets: 3, reps: '10', duration: null, rest: '60s',
    instructions: 'Hold dumbbells at shoulder height, palms facing forward. Press up until arms are fully extended overhead. Lower slowly.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0318.gif',
  },
  {
    id: 'ms5', name: 'Mountain Climbers', description: 'Core endurance and metabolic finisher',
    sets: 3, reps: null, duration: '30s', rest: '30s',
    instructions: 'High plank. Drive knees alternately toward chest at a steady pace. Keep hips level and avoid piking.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0630.gif',
  },
];

const MAIN_CARDIO = [
  {
    id: 'mc1', name: 'High Knees', description: 'Cardiovascular conditioning and hip flexor drive',
    sets: 3, reps: null, duration: '45s', rest: '30s',
    instructions: 'Run in place driving knees up to hip height with quick ground contact. Keep chest tall and arms pumping.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/3636.gif',
  },
  {
    id: 'mc2', name: 'Burpee (Standard)', description: 'Full-body metabolic conditioning — peak intensity',
    sets: 3, reps: '8', duration: null, rest: '45s',
    instructions: 'Squat, place hands on floor, jump or step feet back to plank, perform push-up, jump feet to hands, and leap vertically with arms overhead.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/1160.gif',
  },
  {
    id: 'mc3', name: 'Jump Squat', description: 'Plyometric lower body power and heart rate elevation',
    sets: 3, reps: '12', duration: null, rest: '40s',
    instructions: 'Squat down to parallel, then explode upward into a jump. Land softly with bent knees and immediately descend into the next rep.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0542.gif',
  },
  {
    id: 'mc4', name: 'Mountain Climbers', description: 'Core engagement and sustained aerobic output',
    sets: 3, reps: null, duration: '40s', rest: '25s',
    instructions: 'High plank. Drive alternating knees toward chest rapidly. Keep hips level and breathe steadily.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/0630.gif',
  },
  {
    id: 'mc5', name: 'Lateral Shuffles', description: 'Agility, hip abduction and cardiovascular work',
    sets: 3, reps: null, duration: '40s', rest: '30s',
    instructions: 'Start in athletic stance. Shuffle laterally 4-5 steps, then change direction rapidly. Stay low with bent knees throughout.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/3636.gif',
  },
];

const MAIN_MOBILITY = [
  {
    id: 'mm1', name: "World's Greatest Stretch", description: 'Hip flexors, thoracic spine, and ankle mobility in one movement',
    sets: 2, reps: null, duration: '30s each side', rest: '15s',
    instructions: 'Lunge forward, drop back knee. Place same-side hand inside foot. Rotate top arm to ceiling, hold. Then reach down and straighten front knee.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/1494.gif',
  },
  {
    id: 'mm2', name: '90/90 Hip Stretch', description: 'Hip internal and external rotation — comprehensive joint work',
    sets: 2, reps: null, duration: '60s each side', rest: '15s',
    instructions: 'Sit on floor with both knees bent at 90°, one in front (external rotation), one to the side (internal rotation). Lean gently into front hip to deepen.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/1363.gif',
  },
  {
    id: 'mm3', name: 'Thoracic Extension over Foam Roller', description: 'Mid-back mobility and chest opening',
    sets: 2, reps: null, duration: '45s', rest: '15s',
    instructions: 'Place foam roller (or rolled towel) perpendicular to spine at mid-back. Support head with hands. Extend over roller, breathing into the stretch.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/1511.gif',
  },
  {
    id: 'mm4', name: 'Pigeon Pose', description: 'Deep hip flexor and glute medius release',
    sets: 2, reps: null, duration: '60s each side', rest: '10s',
    instructions: 'From plank, bring one knee forward behind same-side wrist. Extend back leg. Lower hips toward floor. Hold, breathing into the hip pocket.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/1363.gif',
  },
  {
    id: 'mm5', name: 'Seated Figure-4 Stretch', description: 'Piriformis and hip external rotator release',
    sets: 2, reps: null, duration: '45s each side', rest: '10s',
    instructions: 'Seated, cross one ankle over opposite knee. Flex foot and gently press knee down. Hinge forward at hips for deeper stretch.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/1511.gif',
  },
];

const COOLDOWN_GENTLE = [
  {
    id: 'cg1', name: "Child's Pose", description: 'Spinal decompression and lat/hip stretch',
    sets: 1, reps: null, duration: '60s', rest: '0s',
    instructions: 'Kneel, sink hips back to heels, extend arms forward on floor. Forehead rests gently on mat. Breathe deeply into ribs and release.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/1363.gif',
  },
  {
    id: 'cg2', name: 'Happy Baby Pose', description: 'Lower back release and inner groin opening',
    sets: 1, reps: null, duration: '60s', rest: '0s',
    instructions: 'Lie on back. Bring knees toward armpits, grab outer edges of feet. Rock gently side to side, breathing into the lower back.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/1363.gif',
  },
  {
    id: 'cg3', name: 'Supine Spinal Twist', description: 'Thoracic and lumbar decompression and release',
    sets: 1, reps: null, duration: '45s each side', rest: '0s',
    instructions: 'Lie on back, draw one knee to chest, guide it across to opposite side. Keep both shoulders flat. Breathe into the rotation.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/1472.gif',
  },
];

const COOLDOWN_STANDARD = [
  {
    id: 'cs1', name: "Child's Pose", description: 'Spinal decompression and lat/hip stretch',
    sets: 1, reps: null, duration: '60s', rest: '0s',
    instructions: 'Kneel, sink hips back to heels, extend arms forward on floor. Breathe deeply into ribs.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/1363.gif',
  },
  {
    id: 'cs2', name: 'Seated Forward Fold', description: 'Hamstring and posterior chain release',
    sets: 1, reps: null, duration: '45s', rest: '0s',
    instructions: 'Sit with legs extended straight. Hinge at hips to reach forward toward shins or toes. Relax shoulders and neck completely.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/1511.gif',
  },
  {
    id: 'cs3', name: 'Standing Quad Stretch', description: 'Quadriceps and hip flexor lengthening post-workout',
    sets: 1, reps: null, duration: '30s each side', rest: '0s',
    instructions: 'Stand on one leg. Draw opposite heel toward glutes, keep knees together. Hold for a full 30 seconds then switch.',
    gifUrl: 'https://raw.githubusercontent.com/omercotkd/exercises-gifs/main/assets/1511.gif',
  },
];

/**
 * generatePersonalizedDailyPlan — creates a real-time, readiness-adaptive daily workout.
 *
 * Tier assignment:
 *   recovery (score <= 4)  → gentle decompression / restorative mobility — 15-20 min
 *   adjusted (score 5-7)   → functional strength / core stability — 20-30 min
 *   prime    (score 8-10)  → full intensity aligned with onboarding goal — 30-40 min
 *
 * @param {object|null} todayCheckin - { avgReadiness, result, scores: { energy, sleep, soreness, pain, motivation } }
 * @param {object|null} profile - { primaryGoal, fitnessLevel, commitment, equipment, considerations }
 * @param {string} date - YYYY-MM-DD local date string for this plan
 * @returns workout object with { title, focus, duration, difficulty, exerciseCount, tier, adaptationNote, warmUp, mainWorkout, coolDown }
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
  const equipment = profile?.equipment || [];
  const considerations = profile?.considerations || [];
  const hasDumbbells = equipment.includes('Dumbbells') || equipment.includes('Gym Equipment');
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

  // Select warm-up
  let warmUp;
  if (tier === 'recovery') warmUp = WARMUP_GENTLE;
  else if (tier === 'adjusted') warmUp = WARMUP_MODERATE;
  else warmUp = WARMUP_INTENSE;

  // Select main workout
  let mainWorkout;
  let title, focus, difficulty;

  if (tier === 'recovery') {
    mainWorkout = MAIN_RECOVERY;
    title = 'Restorative Mobility & Decompression';
    focus = 'Joint decompression, restorative mobility, and gentle core activation';
    difficulty = 'Light';
  } else if (tier === 'adjusted') {
    mainWorkout = MAIN_FUNCTIONAL;
    if (hasInjuryFlag) {
      // Lower-impact substitutions already in functional set
      mainWorkout = MAIN_FUNCTIONAL.filter(e => !['mf2'].includes(e.id)); // remove push-ups if flag
    }
    title = 'Controlled Functional Strength';
    focus = 'Functional strength and core stability with controlled tempo';
    difficulty = 'Moderate';
  } else if (tier === 'preview') {
    mainWorkout = MAIN_FUNCTIONAL;
    title = 'Baseline Movement Routine';
    focus = 'Foundational movements — check in daily for a personalised plan';
    difficulty = 'Moderate';
  } else {
    // Prime — goal-specific
    if (goal === 'Build Strength' || goal === 'Weight Gain') {
      mainWorkout = hasDumbbells ? MAIN_STRENGTH : MAIN_FUNCTIONAL;
      title = 'Progressive Strength Training';
      focus = 'Compound movements with progressive overload targeting strength gains';
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
      mainWorkout = hasDumbbells ? MAIN_STRENGTH.slice(0, 3).concat(MAIN_CARDIO.slice(0, 2)) : MAIN_FUNCTIONAL;
      title = 'Balanced Fitness Circuit';
      focus = 'Mix of strength and cardio for overall fitness and healthy habits';
      difficulty = 'Moderate';
    }
  }

  // Trim to fitness level volume
  if (level === 'Beginner') {
    mainWorkout = mainWorkout.slice(0, 3).map(e => ({ ...e, sets: Math.min(e.sets, 2) }));
  } else if (level === 'Intermediate') {
    mainWorkout = mainWorkout.slice(0, 4);
  }
  // Advanced gets full set

  // Select cool-down
  const coolDown = tier === 'recovery' ? COOLDOWN_GENTLE : COOLDOWN_STANDARD;

  // Duration
  const totalExercises = warmUp.length + mainWorkout.length + coolDown.length;
  let duration;
  if (tier === 'recovery') duration = 18;
  else if (tier === 'adjusted') duration = 25;
  else {
    const commitMins = parseInt(commitStr) || 30;
    duration = Math.min(commitMins, tier === 'prime' ? 38 : 25);
  }

  return {
    title,
    focus,
    duration,
    difficulty,
    exerciseCount: totalExercises,
    tier,
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

const SK_BIOMETRICS = 'pw_biometrics_history_v2';
const SK_PROFILE     = 'pw_profile_v2';

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
 * Returns true if today is Monday AND no biometrics entry exists yet for this Monday.
 */
export function isMondayBiometricsDue() {
  const today = new Date();
  if (today.getDay() !== 1) return false; // not Monday
  const mondayStr = _localDateStr(today);
  try {
    const raw = localStorage.getItem(SK_BIOMETRICS);
    const history = raw ? JSON.parse(raw) : [];
    return !history.some(e => e.date === mondayStr);
  } catch { return false; }
}

/**
 * Load biometrics history array (newest first).
 * Seeds historical Monday entry from profile if empty.
 */
export function loadBiometricsHistory() {
  try {
    const raw = localStorage.getItem(SK_BIOMETRICS);
    let history = raw ? JSON.parse(raw) : [];

    // Seed initial entry from onboarding profile if empty
    if (history.length === 0) {
      try {
        const profileRaw = localStorage.getItem(SK_PROFILE);
        const profile = profileRaw ? JSON.parse(profileRaw) : null;
        if (profile && profile.weight && profile.height) {
          const { bmi, category } = calculateBmi(profile.weight, profile.weightUnit || 'kg', profile.height, profile.heightUnit || 'cm');
          history.push({
            date: '2026-08-31', // historical Monday seed
            weight: parseFloat(profile.weight),
            weightUnit: profile.weightUnit || 'kg',
            height: parseFloat(profile.height),
            heightUnit: profile.heightUnit || 'cm',
            bmi,
            category,
            note: 'Initial onboarding entry',
          });
          localStorage.setItem(SK_BIOMETRICS, JSON.stringify(history));
        }
      } catch {}
    }

    return history.sort((a, b) => b.date.localeCompare(a.date));
  } catch {
    return [];
  }
}

/**
 * Save a new biometrics entry and update the profile.
 * @param {{ weight, weightUnit, height, heightUnit, note }} entry
 */
export function saveBiometricsEntry(entry) {
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
    const raw = localStorage.getItem(SK_BIOMETRICS);
    let history = raw ? JSON.parse(raw) : [];
    // Replace same-day entry or append
    history = history.filter(e => e.date !== todayStr);
    history.push(record);
    localStorage.setItem(SK_BIOMETRICS, JSON.stringify(history));

    // Update profile with latest weight/height/bmi
    const profileRaw = localStorage.getItem(SK_PROFILE);
    if (profileRaw) {
      const profile = JSON.parse(profileRaw);
      profile.weight = String(record.weight);
      profile.weightUnit = record.weightUnit;
      profile.height = String(record.height);
      profile.heightUnit = record.heightUnit;
      profile.bmi = bmi;
      profile.bmiCategory = category;
      localStorage.setItem(SK_PROFILE, JSON.stringify(profile));
    }
  } catch {}

  return record;
}

export function getCurrentWeekPhysicalStreakStatus() {
  try {
    ensureLivePhysicalStreakData();
    const rawCheckins = localStorage.getItem("pw_checkins_v2");
    const checkins = rawCheckins ? JSON.parse(rawCheckins) : [];

    const rawWorkouts = localStorage.getItem("pw_workouts_v2");
    const workouts = rawWorkouts ? JSON.parse(rawWorkouts) : [];

    const rawHabits = localStorage.getItem("pw_habit_logs_v2");
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
    return {
      streak: 4,
      weekDays: [
        { day: 'Mon', isChecked: true, isToday: false },
        { day: 'Tue', isChecked: true, isToday: false },
        { day: 'Wed', isChecked: true, isToday: false },
        { day: 'Thu', isChecked: true, isToday: true },
        { day: 'Fri', isChecked: false, isToday: false },
        { day: 'Sat', isChecked: false, isToday: false },
        { day: 'Sun', isChecked: false, isToday: false },
      ],
    };
  }
}

// ─── Today's Workout Progress Tracker ─────────────────────────────────────────
export const SK_TODAY_WORKOUT_PROGRESS = "pw_today_workout_progress_v2";

export function getTodayWorkoutProgress(todayDateStr) {
  const targetDate = todayDateStr || getLocalDateStr(new Date());
  try {
    const raw = localStorage.getItem(SK_TODAY_WORKOUT_PROGRESS);
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

export function saveTodayWorkoutProgress(progress) {
  try {
    localStorage.setItem(SK_TODAY_WORKOUT_PROGRESS, JSON.stringify(progress));
    window.dispatchEvent(new CustomEvent('pw-workout-progress-updated', { detail: progress }));
  } catch {}
}

export function saveWorkoutActivePosition(exIndex, setNum, todayDateStr) {
  const targetDate = todayDateStr || getLocalDateStr(new Date());
  const prog = getTodayWorkoutProgress(targetDate);
  prog.lastActiveExIndex = typeof exIndex === 'number' ? exIndex : 0;
  prog.lastActiveSetNum = typeof setNum === 'number' ? setNum : 1;
  saveTodayWorkoutProgress(prog);
  return prog;
}

export function getWorkoutResumePosition(allExercises = [], todayDateStr) {
  const targetDate = todayDateStr || getLocalDateStr(new Date());
  const prog = getTodayWorkoutProgress(targetDate);
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

