/**
 * WeeklyAssessmentModal.jsx
 * Comprehensive Monday Journey Update modal for Physical Wellness.
 * Collects biometrics, activity level, goals, frequency, notes, and STRICT equipment availability.
 * Never overwrites previous records; creates an incremented version (Version 1, Version 2, etc.)
 * in pw_assessment_history_v2 and refreshes the daily workout recommendations immediately.
 */

import React, { useState, useEffect } from "react";
import {
  saveWeeklyAssessment,
  calculateBmi,
  loadAssessmentHistory,
  getUserPwKey,
  getNextMondayDateStr,
  formatMondayDate,
  getCurrentMondayDateStr,
} from "../../data/physicalWellnessMockData.js";
import useAuthStore from "../../store/authStore.js";

const GOAL_OPTIONS = [
  "General Fitness",
  "Build Strength",
  "Weight Loss",
  "Weight Gain",
  "Improve Stamina",
  "Improve Mobility",
];

const ACTIVITY_LEVELS = [
  { value: "Sedentary", label: "Sedentary", desc: "Desk job, little daily movement" },
  { value: "Light", label: "Lightly Active", desc: "1-2 light walks or sessions/week" },
  { value: "Moderate", label: "Moderately Active", desc: "3-4 exercise sessions/week" },
  { value: "Very Active", label: "Very Active", desc: "5+ intense workouts or physical job" },
];

const FREQUENCY_OPTIONS = [
  "2-3 days / week",
  "3-4 days / week",
  "4-5 days / week",
  "5-6 days / week",
  "Daily Movement",
];

const COMMITMENT_OPTIONS = ["15 min", "20 min", "30 min", "45 min", "60 min"];

const EQUIPMENT_OPTIONS = [
  { id: "No Equipment", label: "No Equipment (Pure Bodyweight)", icon: "🤸", desc: "Zero equipment needed. 100% bodyweight exercises only." },
  { id: "Dumbbells", label: "Dumbbells", icon: "🏋️", desc: "Adjustable or fixed dumbbells at home or gym." },
  { id: "Resistance Bands", label: "Resistance Bands", icon: "🎗️", desc: "Loop bands, tube bands, or pull-up assist bands." },
  { id: "Gym Equipment", label: "Gym Equipment", icon: "🏢", desc: "Access to cable machines, barbells, benches, and machines." },
  { id: "Other", label: "Other / Cardio Gear", icon: "🚲", desc: "Kettlebells, pull-up bar, yoga mat, or treadmill." },
];

function bmiCategoryColor(bmi) {
  if (!bmi) return "text-[var(--muted-foreground)]";
  if (bmi < 18.5) return "text-sky-600";
  if (bmi < 25) return "text-emerald-600";
  if (bmi < 30) return "text-amber-600";
  return "text-rose-600";
}

export default function WeeklyAssessmentModal({
  isOpen,
  onClose,
  onCompleted,
  isManualUpdate = false,
  user = null,
}) {
  const authUser = user || useAuthStore.getState().user;

  const [step, setStep] = useState(1);
  const [weight, setWeight] = useState("");
  const [weightUnit, setWeightUnit] = useState("kg");
  const [height, setHeight] = useState("");
  const [heightUnit, setHeightUnit] = useState("cm");
  const [primaryGoal, setPrimaryGoal] = useState("General Fitness");
  const [activityLevel, setActivityLevel] = useState("Moderate");
  const [exerciseFrequency, setExerciseFrequency] = useState("4-5 days / week");
  const [commitment, setCommitment] = useState("30 min");
  const [equipment, setEquipment] = useState(["No Equipment"]);
  const [progressNotes, setProgressNotes] = useState("");
  const [savedResult, setSavedResult] = useState(null);
  const [currentVersion, setCurrentVersion] = useState(1);

  // Initialize from latest assessment or active profile
  useEffect(() => {
    if (!isOpen) return;
    setStep(1);
    setSavedResult(null);

    try {
      const history = loadAssessmentHistory(authUser);
      const latest = history[0];
      const nextVer = history.length > 0 ? (latest?.version || history.length) + 1 : 1;
      setCurrentVersion(nextVer);

      const profRaw = localStorage.getItem(getUserPwKey("pw_profile_v2", authUser));
      const p = profRaw ? JSON.parse(profRaw) : {};
      const source = latest || p;

      if (source.weight) setWeight(String(source.weight));
      if (source.weightUnit) setWeightUnit(source.weightUnit);
      if (source.height) setHeight(String(source.height));
      if (source.heightUnit) setHeightUnit(source.heightUnit);
      if (source.primaryGoal) setPrimaryGoal(source.primaryGoal);
      if (source.activityLevel) setActivityLevel(source.activityLevel);
      if (source.exerciseFrequency) setExerciseFrequency(source.exerciseFrequency);
      if (source.commitment) setCommitment(source.commitment);
      if (Array.isArray(source.equipment) && source.equipment.length > 0) {
        setEquipment(source.equipment);
      } else {
        setEquipment(["No Equipment"]);
      }
      if (source.progressNotes) setProgressNotes(source.progressNotes);
    } catch {}
  }, [isOpen, authUser]);

  if (!isOpen) return null;

  const { bmi, category } = calculateBmi(weight, weightUnit, height, heightUnit);

  // Equipment toggle with strict exclusivity for "No Equipment"
  const handleToggleEquipment = (item) => {
    if (item === "No Equipment") {
      setEquipment(["No Equipment"]);
      return;
    }

    setEquipment((prev) => {
      // Remove "No Equipment" if choosing a physical gear item
      const withoutNoEq = prev.filter((e) => e !== "No Equipment");
      if (withoutNoEq.includes(item)) {
        const next = withoutNoEq.filter((e) => e !== item);
        return next.length === 0 ? ["No Equipment"] : next;
      } else {
        return [...withoutNoEq, item];
      }
    });
  };

  const isStep1Valid = weight && height && parseFloat(weight) > 0 && parseFloat(height) > 0;
  const isStep2Valid = !!primaryGoal && !!activityLevel && !!exerciseFrequency;
  const isStep3Valid = equipment.length > 0;

  const handleFinish = () => {
    const assessmentData = {
      weight,
      weightUnit,
      height,
      heightUnit,
      primaryGoal,
      activityLevel,
      exerciseFrequency,
      commitment,
      equipment,
      progressNotes,
    };

    const res = saveWeeklyAssessment(assessmentData, authUser);
    setSavedResult(res);
    if (onCompleted) {
      onCompleted(res.assessment, res.plan);
    }
    setTimeout(() => {
      onClose();
    }, 1600);
  };

  const currentMonday = getCurrentMondayDateStr();
  const nextMondayFormatted = formatMondayDate(getNextMondayDateStr());

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-[var(--border)] flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] bg-gradient-to-r from-emerald-50/70 to-teal-50/70">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white uppercase tracking-wider">
                  {isManualUpdate ? `Assessment Update • Version ${currentVersion}` : `Weekly Monday Journey • Version ${currentVersion}`}
                </span>
                <span className="text-xs text-[var(--muted-foreground)]">
                  Week of {formatMondayDate(currentMonday)}
                </span>
              </div>
              <h2 className="font-display text-xl text-[var(--foreground)] font-semibold">
                Weekly Physical Wellness Assessment
              </h2>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                Every Monday we adjust your goals, biometrics, and equipment. All historical versions are strictly preserved.
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/80 border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition cursor-pointer text-gray-500 hover:text-gray-800"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Stepper Tabs */}
          {!savedResult && (
            <div className="flex items-center justify-between mt-4 pt-2 border-t border-emerald-100/60 text-xs">
              {[
                { s: 1, label: "Biometrics & Condition" },
                { s: 2, label: "Goals & Routine" },
                { s: 3, label: "Available Equipment" },
                { s: 4, label: "Review & Apply" },
              ].map((item) => (
                <button
                  key={item.s}
                  onClick={() => {
                    if (item.s < step || (item.s === 2 && isStep1Valid) || (item.s === 3 && isStep1Valid && isStep2Valid)) {
                      setStep(item.s);
                    }
                  }}
                  className={`flex items-center gap-1.5 font-medium transition cursor-pointer ${
                    step === item.s
                      ? "text-emerald-700 font-semibold"
                      : step > item.s
                      ? "text-teal-600"
                      : "text-gray-400"
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      step === item.s
                        ? "bg-emerald-600 text-white"
                        : step > item.s
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {step > item.s ? "✓" : item.s}
                  </span>
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {savedResult ? (
            /* Success State */
            <div className="py-8 text-center animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-400 flex items-center justify-center mx-auto mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 mb-2">
                Version {savedResult.assessment.version} Saved
              </span>
              <h3 className="font-display text-2xl text-[var(--foreground)] font-bold mb-1">
                Assessment Updated Successfully!
              </h3>
              <p className="text-sm text-[var(--muted-foreground)] max-w-md mx-auto mb-6">
                Your workout recommendations have been immediately regenerated to strictly match your equipment selection:{" "}
                <span className="font-semibold text-emerald-700">
                  {savedResult.assessment.equipment.join(", ")}
                </span>
                .
              </p>

              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-left max-w-md mx-auto space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Active Version:</span>
                  <span className="font-semibold text-gray-900">Version {savedResult.assessment.version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Weight & BMI:</span>
                  <span className="font-semibold text-gray-900">
                    {savedResult.assessment.weight} {savedResult.assessment.weightUnit} • BMI {savedResult.assessment.bmi} ({savedResult.assessment.bmiCategory})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Focus Routine:</span>
                  <span className="font-semibold text-gray-900">{savedResult.plan.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Exercise Count:</span>
                  <span className="font-semibold text-emerald-700">
                    {savedResult.plan.exerciseCount} exercises ({savedResult.plan.equipmentBadge})
                  </span>
                </div>
              </div>
            </div>
          ) : step === 1 ? (
            /* STEP 1: Biometrics & Progress Condition */
            <div className="space-y-5 animate-fadeIn">
              <div className="border-b pb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-800">
                  Step 1: Current Biometrics & Condition
                </h3>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                  Update your weight and check your body mass index for this week's journey snapshot.
                </p>
              </div>

              {/* Weight */}
              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1.5">
                  Current Weight
                </label>
                <div className="flex rounded-2xl border border-[var(--border)] overflow-hidden focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
                  <input
                    type="number"
                    step="0.1"
                    min="20"
                    max="300"
                    placeholder="e.g. 70.5"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="flex-1 px-4 py-3 text-base text-[var(--foreground)] outline-none bg-transparent"
                  />
                  <div className="flex bg-[var(--muted)] p-1 gap-1 border-l border-[var(--border)]">
                    {["kg", "lb"].map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setWeightUnit(u)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          weightUnit === u
                            ? "bg-white text-[var(--foreground)] shadow-xs"
                            : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                        }`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Height */}
              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1.5">
                  Height
                </label>
                <div className="flex rounded-2xl border border-[var(--border)] overflow-hidden focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
                  <input
                    type="number"
                    step="0.5"
                    min="50"
                    max="250"
                    placeholder="e.g. 175"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="flex-1 px-4 py-3 text-base text-[var(--foreground)] outline-none bg-transparent"
                  />
                  <div className="flex bg-[var(--muted)] p-1 gap-1 border-l border-[var(--border)]">
                    {["cm", "ft"].map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setHeightUnit(u)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          heightUnit === u
                            ? "bg-white text-[var(--foreground)] shadow-xs"
                            : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                        }`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Live BMI Preview Card */}
              {bmi && (
                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-emerald-800 font-medium">Calculated BMI</span>
                    <div className="text-2xl font-bold font-display text-[var(--foreground)]">
                      {bmi} <span className="text-xs font-normal text-[var(--muted-foreground)]">kg/m²</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-[var(--muted-foreground)] block mb-0.5">Clinical Classification</span>
                    <span className={`text-sm font-bold px-3 py-1 rounded-full bg-white border border-emerald-200 shadow-xs ${bmiCategoryColor(bmi)}`}>
                      {category}
                    </span>
                  </div>
                </div>
              )}

              {/* Physical Condition Notes */}
              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1.5">
                  Physical Condition & Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="How is your body feeling? (e.g. recovering from knee strain, feeling energized, lower back tight...)"
                  value={progressNotes}
                  onChange={(e) => setProgressNotes(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-[var(--border)] text-sm text-[var(--foreground)] outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 resize-none bg-transparent"
                />
              </div>
            </div>
          ) : step === 2 ? (
            /* STEP 2: Goals & Activity Routine */
            <div className="space-y-5 animate-fadeIn">
              <div className="border-b pb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-800">
                  Step 2: Goals & Routine Preferences
                </h3>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                  Adjust your primary target, exercise frequency, and commitment time.
                </p>
              </div>

              {/* Primary Goal */}
              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-2">
                  Primary Fitness Goal
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {GOAL_OPTIONS.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setPrimaryGoal(g)}
                      className={`p-3 rounded-2xl border text-left text-xs font-semibold transition cursor-pointer ${
                        primaryGoal === g
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                          : "bg-white border-gray-200 text-gray-700 hover:border-emerald-300"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Activity Level */}
              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-2">
                  Current Activity Level
                </label>
                <div className="space-y-2">
                  {ACTIVITY_LEVELS.map((lvl) => (
                    <button
                      key={lvl.value}
                      type="button"
                      onClick={() => setActivityLevel(lvl.value)}
                      className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition cursor-pointer ${
                        activityLevel === lvl.value
                          ? "bg-emerald-50/80 border-emerald-500 text-emerald-900 ring-1 ring-emerald-500"
                          : "bg-white border-gray-200 hover:border-gray-300 text-gray-800"
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold">{lvl.label}</div>
                        <div className="text-[11px] text-gray-500">{lvl.desc}</div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                        activityLevel === lvl.value ? "border-emerald-600 bg-emerald-600 text-white text-[10px]" : "border-gray-300"
                      }`}>
                        {activityLevel === lvl.value && "✓"}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Frequency & Commitment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground)] mb-1.5">
                    Exercise Frequency
                  </label>
                  <select
                    value={exerciseFrequency}
                    onChange={(e) => setExerciseFrequency(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-800 outline-none focus:border-emerald-500"
                  >
                    {FREQUENCY_OPTIONS.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground)] mb-1.5">
                    Daily Commitment
                  </label>
                  <select
                    value={commitment}
                    onChange={(e) => setCommitment(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-800 outline-none focus:border-emerald-500"
                  >
                    {COMMITMENT_OPTIONS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ) : step === 3 ? (
            /* STEP 3: Available Equipment (Strict Filtering Enforcement) */
            <div className="space-y-5 animate-fadeIn">
              <div className="border-b pb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-800">
                  Step 3: Available Equipment
                </h3>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                  Select the exact equipment you have access to. Recommendations strictly respect this list.
                </p>
              </div>

              {/* Strict filtering alert notice */}
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex gap-3 text-xs text-amber-900">
                <span className="text-base">🛡️</span>
                <div>
                  <span className="font-bold block">Strict Equipment Guarantee</span>
                  The system will never recommend an exercise requiring equipment you do not possess. If you select{" "}
                  <strong>No Equipment</strong>, your plan will contain <strong>100% pure bodyweight movements</strong>.
                </div>
              </div>

              {/* Equipment Cards */}
              <div className="space-y-2.5">
                {EQUIPMENT_OPTIONS.map((opt) => {
                  const isSelected = equipment.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleToggleEquipment(opt.id)}
                      className={`w-full p-4 rounded-2xl border text-left flex items-center gap-3.5 transition cursor-pointer ${
                        isSelected
                          ? "bg-emerald-50 border-emerald-500 ring-2 ring-emerald-200/60 shadow-xs"
                          : "bg-white border-gray-200 hover:border-emerald-300"
                      }`}
                    >
                      <span className="text-2xl">{opt.icon}</span>
                      <div className="flex-1">
                        <div className="text-xs font-bold text-gray-900 flex items-center gap-2">
                          {opt.label}
                          {isSelected && (
                            <span className="text-[10px] bg-emerald-600 text-white font-semibold px-2 py-0.2 rounded-full">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5">{opt.desc}</p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition ${
                          isSelected ? "bg-emerald-600 border-emerald-600 text-white text-xs font-bold" : "border-gray-300 bg-white"
                        }`}
                      >
                        {isSelected && "✓"}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="text-xs text-gray-500 italic text-center">
                Currently Selected:{" "}
                <span className="font-semibold text-emerald-800">
                  {equipment.join(", ")}
                </span>
              </div>
            </div>
          ) : (
            /* STEP 4: Review & Apply */
            <div className="space-y-5 animate-fadeIn">
              <div className="border-b pb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-800">
                  Step 4: Review & Confirm Weekly Update
                </h3>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                  Confirm the changes for Version {currentVersion}. All historical assessments will remain completely untouched.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                  <span className="text-gray-500 font-medium">New Version:</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-bold text-[11px]">
                    Version {currentVersion}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 font-medium">Week Period:</span>
                  <span className="font-semibold text-gray-900">
                    Week of {formatMondayDate(currentMonday)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 font-medium">Weight & BMI:</span>
                  <span className="font-semibold text-gray-900">
                    {weight} {weightUnit} • BMI {bmi} ({category})
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 font-medium">Primary Goal:</span>
                  <span className="font-semibold text-gray-900">{primaryGoal}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 font-medium">Frequency & Commitment:</span>
                  <span className="font-semibold text-gray-900">{exerciseFrequency} • {commitment}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <span className="text-gray-500 font-medium">Equipment Availability:</span>
                  <span className="font-bold text-emerald-700">
                    {equipment.join(", ")}
                  </span>
                </div>
                {progressNotes && (
                  <div className="pt-2 border-t border-gray-200">
                    <span className="text-gray-500 block mb-1">Notes:</span>
                    <p className="text-gray-700 italic">"{progressNotes}"</p>
                  </div>
                )}
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex gap-2.5">
                <span className="text-base">ℹ️</span>
                <div>
                  <span className="font-bold block">Non-Destructive Audit Trail</span>
                  This assessment will be saved as <strong>Version {currentVersion}</strong>. Your Version 1 baseline and all previous weekly records remain preserved in your historical timeline.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        {!savedResult && (
          <div className="px-6 py-4 border-t border-[var(--border)] bg-gray-50 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-white transition cursor-pointer"
              >
                ← Back
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-600 hover:bg-white transition cursor-pointer"
              >
                Cancel
              </button>
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                disabled={
                  (step === 1 && !isStep1Valid) ||
                  (step === 2 && !isStep2Valid) ||
                  (step === 3 && !isStep3Valid)
                }
                className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition disabled:opacity-40 cursor-pointer shadow-xs"
              >
                Next Step →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition cursor-pointer shadow-md flex items-center gap-2"
              >
                <span>Save Assessment & Refresh Plans</span>
                <span className="text-sm">✓</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
