/**
 * scratch/testEquipmentAndJourney.mjs
 * Verification script for strict equipment filtering and non-destructive weekly journey versioning.
 */

// Mock browser globals for node execution
const storageMap = new Map();
global.localStorage = {
  getItem: (k) => storageMap.get(k) || null,
  setItem: (k, v) => storageMap.set(k, String(v)),
  removeItem: (k) => storageMap.delete(k),
  clear: () => storageMap.clear(),
};
global.window = {
  dispatchEvent: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
};
global.CustomEvent = class {
  constructor(name, detail) {
    this.name = name;
    this.detail = detail;
  }
};

import {
  canPerformExercise,
  generatePersonalizedDailyPlan,
  loadAssessmentHistory,
  saveWeeklyAssessment,
  getLatestAssessment,
  loadWeeklyPlansHistory,
} from "../frontend/src/data/physicalWellnessMockData.js";

console.log("==================================================");
console.log("TEST SUITE: Strict Equipment Filtering & Journey");
console.log("==================================================");

let failed = 0;
let passed = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    failed++;
  } else {
    console.log(`✅ PASS: ${message}`);
    passed++;
  }
}

// ── TEST 1: canPerformExercise ──
console.log("\n--- TEST 1: canPerformExercise Mathematical Subset Rule ---");
const bodyweightEx = { name: "Push-Up", requiredEquipment: [] };
const dumbbellEx = { name: "Dumbbell Goblet Squat", requiredEquipment: ["Dumbbells"] };
const bandEx = { name: "Banded Squat", requiredEquipment: ["Resistance Bands"] };

assert(canPerformExercise(bodyweightEx, ["No Equipment"]) === true, "Bodyweight allowed for 'No Equipment'");
assert(canPerformExercise(bodyweightEx, ["Dumbbells"]) === true, "Bodyweight allowed for 'Dumbbells'");
assert(canPerformExercise(dumbbellEx, ["No Equipment"]) === false, "Dumbbell exercise BLOCKED for 'No Equipment'");
assert(canPerformExercise(dumbbellEx, ["Dumbbells"]) === true, "Dumbbell exercise allowed for 'Dumbbells'");
assert(canPerformExercise(dumbbellEx, ["Resistance Bands"]) === false, "Dumbbell exercise BLOCKED for 'Resistance Bands'");
assert(canPerformExercise(bandEx, ["Dumbbells"]) === false, "Band exercise BLOCKED for 'Dumbbells'");
assert(canPerformExercise(bandEx, ["Resistance Bands"]) === true, "Band exercise allowed for 'Resistance Bands'");
assert(canPerformExercise(dumbbellEx, ["Gym Equipment"]) === true, "'Gym Equipment' acts as superset for dumbbells");

// ── TEST 2: Strict "No Equipment" across all goals and tiers ──
console.log("\n--- TEST 2: Strict Zero-Equipment Guarantee in Daily Plans ---");
const goals = ["General Fitness", "Build Strength", "Weight Loss", "Improve Mobility"];
const readinessTiers = [
  { avgReadiness: 9, result: "ready", scores: { energy: 5, soreness: 1, pain: 1, motivation: 5 } },
  { avgReadiness: 6, result: "adjusted", scores: { energy: 3, soreness: 3, pain: 1, motivation: 3 } },
  { avgReadiness: 3, result: "recovery", scores: { energy: 1, soreness: 4, pain: 4, motivation: 2 } },
  null, // preview tier
];

goals.forEach(goal => {
  readinessTiers.forEach(checkin => {
    const profile = { primaryGoal: goal, equipment: ["No Equipment"], fitnessLevel: "Intermediate" };
    const plan = generatePersonalizedDailyPlan(checkin, profile, "2026-09-07");
    const allExercises = [...plan.warmUp, ...plan.mainWorkout, ...plan.coolDown];

    const hasIllegal = allExercises.some(e => e.requiredEquipment && e.requiredEquipment.length > 0);
    assert(!hasIllegal, `Goal '${goal}' (${plan.tier} tier): 0 equipment-dependent exercises found out of ${allExercises.length}`);
  });
});

// ── TEST 3: Dumbbell-Only Equipment Plan ──
console.log("\n--- TEST 3: Dumbbell-Only Equipment Plan ---");
const dbProfile = { primaryGoal: "Build Strength", equipment: ["Dumbbells"], fitnessLevel: "Intermediate" };
const dbPlan = generatePersonalizedDailyPlan(
  { avgReadiness: 9, result: "ready", scores: { energy: 5, soreness: 1, pain: 1, motivation: 5 } },
  dbProfile,
  "2026-09-07"
);
const dbAllExercises = [...dbPlan.warmUp, ...dbPlan.mainWorkout, ...dbPlan.coolDown];
const dbIllegal = dbAllExercises.some(e => {
  if (!e.requiredEquipment || e.requiredEquipment.length === 0) return false;
  return !e.requiredEquipment.includes("Dumbbells");
});
assert(!dbIllegal, `Dumbbell plan contains only Bodyweight or Dumbbell exercises (0 bands/machines). Total: ${dbAllExercises.length}`);

// ── TEST 4: Non-Destructive Weekly Journey Versioning ──
console.log("\n--- TEST 4: Non-Destructive Weekly Assessment Versioning ---");
const testUser = { id: "test-patient-123", email: "patient@test.com" };

// Seed profile
localStorage.setItem(`pw_profile_v2_${testUser.id}`, JSON.stringify({
  weight: 75,
  weightUnit: "kg",
  height: 178,
  heightUnit: "cm",
  primaryGoal: "Weight Loss",
  equipment: ["No Equipment"],
}));

// 1. Initial load seeds Version 1 baseline
const v1History = loadAssessmentHistory(testUser);
assert(v1History.length === 1, "Baseline Version 1 seeded automatically when history empty");
assert(v1History[0].version === 1, "Baseline is Version 1");
assert(v1History[0].weight === 75, "Version 1 weight matches baseline (75 kg)");
assert(v1History[0].equipment.includes("No Equipment"), "Version 1 equipment is ['No Equipment']");

// 2. Patient updates on Monday (Week 2): bought dumbbells, lost 1 kg
const v2Result = saveWeeklyAssessment({
  weight: 74,
  weightUnit: "kg",
  height: 178,
  heightUnit: "cm",
  primaryGoal: "Build Strength",
  activityLevel: "Moderate",
  exerciseFrequency: "4-5 days / week",
  commitment: "30 min",
  equipment: ["Dumbbells"],
  progressNotes: "Bought a pair of dumbbells this weekend, ready to build strength.",
}, testUser);

assert(v2Result.assessment.version === 2, "New update created Version 2");
assert(v2Result.plan.equipment.includes("Dumbbells"), "Version 2 plan immediately reflects 'Dumbbells'");

const historyAfterV2 = loadAssessmentHistory(testUser);
assert(historyAfterV2.length === 2, "History now contains 2 records (NON-DESTRUCTIVE)");
assert(historyAfterV2[0].version === 2, "Newest record is Version 2");
assert(historyAfterV2[1].version === 1, "Historical Version 1 is preserved intact");
assert(historyAfterV2[1].weight === 75, "Historical Version 1 weight unchanged (75 kg)");
assert(historyAfterV2[1].equipment.includes("No Equipment"), "Historical Version 1 equipment unchanged ('No Equipment')");

// 3. Patient updates on subsequent Monday (Week 3): added resistance bands
const v3Result = saveWeeklyAssessment({
  weight: 73.5,
  weightUnit: "kg",
  height: 178,
  heightUnit: "cm",
  primaryGoal: "Build Strength",
  activityLevel: "High",
  exerciseFrequency: "5 days / week",
  commitment: "45 min",
  equipment: ["Dumbbells", "Resistance Bands"],
  progressNotes: "Added resistance bands for progressive overload.",
}, testUser);

assert(v3Result.assessment.version === 3, "New update created Version 3");

const historyAfterV3 = loadAssessmentHistory(testUser);
assert(historyAfterV3.length === 3, "History now contains all 3 versions");
assert(historyAfterV3.map(h => h.version).join(",") === "3,2,1", "Versions ordered newest to oldest: 3, 2, 1");

const latest = getLatestAssessment(testUser);
assert(latest.version === 3, "getLatestAssessment returns active Version 3");

const plansHistory = loadWeeklyPlansHistory(testUser);
assert(plansHistory.length >= 2, "Weekly plans history preserved and linked to assessment cycles");

console.log("\n==================================================");
console.log(`RESULTS: ${passed} passed, ${failed} failed`);
console.log("==================================================");

if (failed > 0) {
  process.exit(1);
} else {
  console.log("🎉 ALL TESTS PASSED SUCCESSFULLY!");
}
