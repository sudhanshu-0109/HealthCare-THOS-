import React, { useState } from "react";

const questions = [
  {
    id: "energy",
    label: "How is your energy today?",
    low: "Very Low",
    high: "Very High",
    emojis: ["😴", "😐", "🙂", "😊", "⚡"],
  },
  {
    id: "sleep",
    label: "How was your sleep last night?",
    low: "Poor",
    high: "Excellent",
    emojis: ["😩", "😔", "😐", "😌", "😴✨"],
  },
  {
    id: "soreness",
    label: "How sore do you feel?",
    low: "Not at all",
    high: "Very Sore",
    emojis: ["✅", "🟡", "🟠", "🔴", "🛑"],
  },
  {
    id: "pain",
    label: "Are you experiencing any pain?",
    low: "No pain",
    high: "Significant pain",
    emojis: ["✅", "🟡", "🟠", "🔴", "🛑"],
  },
  {
    id: "motivation",
    label: "How motivated do you feel right now?",
    low: "Low",
    high: "Ready to go",
    emojis: ["😶", "😑", "🙂", "😤", "🔥"],
  },
];

const EQUIPMENT_OPTIONS = [
  { id: "No Equipment", label: "No Equipment", sub: "Pure bodyweight exercises only (Push-ups, squats, lunges, planks)", icon: "🤸" },
  { id: "Dumbbells", label: "Dumbbells", sub: "Dumbbell goblet squats, rows, Romanian deadlifts + bodyweight", icon: "🏋️" },
  { id: "Resistance Bands", label: "Resistance Bands", sub: "Banded squats, band pull-aparts, rows + bodyweight", icon: "🎗️" },
  { id: "Gym Equipment", label: "Gym Equipment", sub: "Full gym machines, barbells, benches, cables", icon: "🏢" },
  { id: "Other", label: "Other / Cardio Gear", sub: "Kettlebell, yoga mat, pull-up bar, treadmill", icon: "🚲" },
];

export default function CheckInPage({ onComplete, onBack, profile }) {
  const [current, setCurrent] = useState(0);
  const [scores, setScores] = useState({});
  const [selected, setSelected] = useState(null);

  // Initialize equipment from profile if available, defaulting to "No Equipment"
  const [equipment, setEquipment] = useState(() => {
    if (profile?.equipment && Array.isArray(profile.equipment) && profile.equipment.length > 0) {
      return profile.equipment;
    }
    return ["No Equipment"];
  });

  const totalSteps = questions.length + 1; // 5 scores + 1 equipment
  const isEquipmentStep = current === questions.length;
  const isLast = current === totalSteps - 1;
  const progress = ((current + 1) / totalSteps) * 100;

  const q = current < questions.length ? questions[current] : null;

  const handlePick = (score) => {
    setSelected(score);
  };

  const handleToggleEquipment = (item) => {
    if (item === "No Equipment") {
      setEquipment(["No Equipment"]);
      return;
    }
    setEquipment(prev => {
      const withoutNo = prev.filter(e => e !== "No Equipment");
      if (withoutNo.includes(item)) {
        const next = withoutNo.filter(e => e !== item);
        return next.length === 0 ? ["No Equipment"] : next;
      } else {
        return [...withoutNo, item];
      }
    });
  };

  const handleNext = () => {
    if (!isEquipmentStep) {
      if (selected === null) return;
      const newScores = { ...scores, [q.id]: selected };
      setScores(newScores);
      setCurrent(c => c + 1);
      setSelected(null);
    } else {
      // Completed equipment step
      const finalEquipment = equipment.length > 0 ? equipment : ["No Equipment"];
      onComplete(scores, finalEquipment);
    }
  };

  const handleBack = () => {
    if (current === 0) {
      onBack();
    } else if (isEquipmentStep) {
      setCurrent(questions.length - 1);
      setSelected(scores[questions[questions.length - 1].id] ?? null);
    } else {
      setCurrent(c => c - 1);
      setSelected(scores[questions[current - 1].id] ?? null);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8 flex flex-col min-h-full">
      {/* Back button */}
      <button
        onClick={handleBack}
        className="flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] mb-8 hover:text-[var(--foreground)] transition cursor-pointer w-fit"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        {current === 0 ? "Back" : "Previous"}
      </button>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-[var(--accent)] uppercase tracking-wider">
            {isEquipmentStep ? `Step ${totalSteps} of ${totalSteps} • Equipment` : `Question ${current + 1} of ${totalSteps}`}
          </span>
          <div className="flex gap-1">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i < current
                    ? "bg-[var(--accent)] w-4"
                    : i === current
                    ? "bg-[var(--primary)] w-6"
                    : "bg-[var(--muted)] w-3"
                }`}
              />
            ))}
          </div>
        </div>
        <div className="h-1 bg-[var(--muted)] rounded-full">
          <div
            className="h-full bg-[var(--accent)] rounded-full transition-all duration-400"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question or Equipment Step */}
      <div className="flex-1 flex flex-col justify-center">
        {!isEquipmentStep ? (
          <>
            <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-widest mb-4">Check-In</p>
            <h2 className="font-display text-3xl text-[var(--foreground)] mb-10 leading-tight">{q.label}</h2>

            {/* Emoji + Number score buttons */}
            <div className="space-y-3 mb-8">
              {[1, 2, 3, 4, 5].map((score, idx) => (
                <button
                  key={score}
                  onClick={() => handlePick(score)}
                  className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                    selected === score
                      ? "bg-[var(--primary)] border-[var(--primary)] shadow-md text-white"
                      : "bg-[var(--card)] border-[var(--border)] hover:border-[var(--accent)] shadow-xs text-[var(--foreground)]"
                  }`}
                >
                  <span className="text-2xl">{q.emojis[idx]}</span>
                  <div className="flex-1">
                    <span className={`text-sm font-semibold ${selected === score ? "text-white" : "text-[var(--foreground)]"}`}>
                      {score === 1 ? q.low : score === 5 ? q.high : score === 2 ? "A little" : score === 3 ? "Moderate" : "Quite a bit"}
                    </span>
                  </div>
                  <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                    selected === score ? "border-white bg-white/20" : "border-[var(--border)]"
                  }`}>
                    {selected === score && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-between text-xs text-[var(--muted-foreground)] mb-8 px-1">
              <span>{q.low}</span>
              <span>{q.high}</span>
            </div>
          </>
        ) : (
          <div className="animate-fadeIn">
            <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-widest mb-2">Equipment Check</p>
            <h2 className="font-display text-2xl sm:text-3xl text-[var(--foreground)] mb-2 leading-tight">
              What equipment do you have available today?
            </h2>
            <p className="text-xs text-[var(--muted-foreground)] mb-6">
              Your workout will strictly include only exercises you have equipment for. Selecting "No Equipment" gives 100% pure bodyweight movements.
            </p>

            {/* Equipment Options */}
            <div className="space-y-3 mb-6">
              {EQUIPMENT_OPTIONS.map((opt) => {
                const isChecked = equipment.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleToggleEquipment(opt.id)}
                    className={`w-full flex items-center gap-3.5 p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                      isChecked
                        ? "bg-emerald-50 border-emerald-500 shadow-sm"
                        : "bg-[var(--card)] border-[var(--border)] hover:border-emerald-300"
                    }`}
                  >
                    <span className="text-2xl">{opt.icon}</span>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
                        {opt.label}
                        {isChecked && (
                          <span className="text-[10px] bg-emerald-600 text-white font-semibold px-2 py-0.5 rounded-full">
                            Selected
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{opt.sub}</p>
                    </div>
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition ${
                      isChecked ? "border-emerald-600 bg-emerald-600 text-white text-xs font-bold" : "border-gray-300"
                    }`}>
                      {isChecked && "✓"}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs mb-4 flex items-center gap-2">
              <span>💡</span>
              <span>
                {equipment.includes("No Equipment")
                  ? "Zero-equipment mode active: All exercises will be bodyweight movements."
                  : `Personalized mode active: Exercises will use only ${equipment.join(", ")} and bodyweight.`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Continue / Finish button */}
      <button
        onClick={handleNext}
        disabled={!isEquipmentStep && selected === null}
        className="w-full bg-[var(--primary)] text-white font-semibold py-4 rounded-2xl text-sm hover:opacity-90 transition disabled:opacity-40 cursor-pointer shadow-md"
      >
        {isEquipmentStep ? "See My Readiness & Plan →" : "Continue →"}
      </button>
    </div>
  );
}
