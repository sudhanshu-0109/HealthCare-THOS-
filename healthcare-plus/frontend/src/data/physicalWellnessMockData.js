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

export const mockWeeklyPlan = [
  { day: "Mon", date: "Sep 1", type: "workout", focus: "Upper Body Strength", duration: 30, difficulty: "Moderate", status: "completed" },
  { day: "Tue", date: "Sep 2", type: "recovery", focus: "Mobility & Stretch", duration: 20, difficulty: "Light", status: "completed" },
  { day: "Wed", date: "Sep 3", type: "workout", focus: "Core & Cardio", duration: 30, difficulty: "Moderate", status: "today" },
  { day: "Thu", date: "Sep 4", type: "rest", focus: "Rest Day", duration: 0, difficulty: "—", status: "upcoming" },
  { day: "Fri", date: "Sep 5", type: "workout", focus: "Lower Body Strength", duration: 35, difficulty: "Moderate", status: "upcoming" },
  { day: "Sat", date: "Sep 6", type: "optional", focus: "Optional Walk / Activity", duration: 20, difficulty: "Light", status: "upcoming" },
  { day: "Sun", date: "Sep 7", type: "rest", focus: "Rest Day", duration: 0, difficulty: "—", status: "upcoming" },
];

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

export function ensureLivePhysicalStreakData() {
  try {
    const raw = localStorage.getItem("pw_checkins_v2");
    if (!raw || JSON.parse(raw).length === 0) {
      const today = new Date();
      const seed = [];
      for (let i = 3; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = getLocalDateStr(d);
        seed.push({
          date: dateStr,
          scores: { energy: 4, sleep: 4, soreness: 2, pain: 1, motivation: 4 },
          avgReadiness: 8,
          result: "ready",
          ts: d.getTime(),
        });
      }
      localStorage.setItem("pw_checkins_v2", JSON.stringify(seed));
    }
  } catch (err) {
    console.warn("ensureLivePhysicalStreakData warning:", err);
  }
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
      streak: Math.max(streak, 4),
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

