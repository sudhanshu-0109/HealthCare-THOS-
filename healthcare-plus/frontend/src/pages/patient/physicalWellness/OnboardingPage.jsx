import React, { useState } from "react";

const GOALS = ["Weight Loss", "Weight Gain", "Build Strength", "General Fitness", "Improve Stamina", "Improve Mobility", "Build Healthy Habits"];
const FITNESS_LEVELS = ["Beginner", "Intermediate", "Advanced"];
const ACTIVITY_LEVELS = ["Low", "Light", "Moderate", "High"];
const COMMITMENTS = ["15 min", "30 min", "45 min", "60+ min"];
const ENVIRONMENTS = ["Home", "Gym", "Outdoor"];
const EQUIPMENT = ["No Equipment", "Dumbbells", "Resistance Bands", "Gym Equipment", "Other"];
const CONSIDERATIONS = ["Previous Injury", "Current Limitation", "Joint Discomfort", "Mobility Limitation", "Recent Surgery", "Doctor Restriction", "None of These"];

function Chip({ label, selected, onToggle, single }) {
  return (
    <button
      onClick={onToggle}
      className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all cursor-pointer ${
        selected
          ? "bg-[var(--primary)] text-white border-[var(--primary)]"
          : "bg-[var(--card)] text-[var(--foreground)] border-[var(--border)] hover:border-[var(--accent)]"
      }`}
    >
      {label}
    </button>
  );
}

function SelectCard({ label, description, selected, onSelect }) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left px-4 py-4 rounded-2xl border transition-all cursor-pointer ${
        selected
          ? "bg-[var(--secondary)] border-[var(--primary)] ring-1 ring-[var(--primary)]"
          : "bg-[var(--card)] border-[var(--border)] hover:border-[var(--accent)]"
      }`}
    >
      <p className="text-sm font-semibold text-[var(--foreground)]">{label}</p>
      {description && <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{description}</p>}
    </button>
  );
}

export default function OnboardingPage({ onComplete }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    age: "", height: "", weight: "",
    heightUnit: "cm", weightUnit: "kg",
    primaryGoal: "", secondaryGoal: "",
    fitnessLevel: "", activityLevel: "", commitment: "",
    environment: "", equipment: [],
    considerations: [], shareWithHospital: false,
  });

  const steps = ["Consent", "Profile", "Goals", "Fitness", "Environment", "Summary"];
  const progress = ((step + 1) / steps.length) * 100;

  const update = (field, value) => setData(d => ({ ...d, [field]: value }));
  const toggleEquipment = (item) => {
    setData(d => ({
      ...d,
      equipment: d.equipment.includes(item) ? d.equipment.filter(e => e !== item) : [...d.equipment, item]
    }));
  };
  const toggleConsideration = (item) => {
    if (item === "None of These") { setData(d => ({ ...d, considerations: ["None of These"] })); return; }
    setData(d => ({
      ...d,
      considerations: d.considerations.includes(item)
        ? d.considerations.filter(e => e !== item)
        : [...d.considerations.filter(e => e !== "None of These"), item]
    }));
  };

  const canContinue = () => {
    if (step === 1) return data.age && data.height && data.weight;
    if (step === 2) return data.primaryGoal;
    if (step === 3) return data.fitnessLevel && data.activityLevel && data.commitment;
    if (step === 4) return data.environment;
    return true;
  };

  return (
    <div className="min-h-full flex flex-col max-w-lg mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-medium text-[var(--muted-foreground)]">Step {step + 1} of {steps.length}</span>
          <span className="text-xs font-medium text-[var(--muted-foreground)]">{steps[step]}</span>
        </div>
        <div className="h-1.5 bg-[var(--muted)] rounded-full overflow-hidden">
          <div className="h-full bg-[var(--accent)] rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="flex-1">
        {/* Step 0: Consent */}
        {step === 0 && (
          <div>
            <h2 className="font-display text-3xl text-[var(--foreground)] mb-2">Before we begin</h2>
            <p className="text-[var(--muted-foreground)] mb-6 text-sm leading-relaxed">Your wellness information helps us personalize your experience. Here's how we use it.</p>
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 mb-4 shadow-xs">
              <p className="text-sm font-semibold text-[var(--foreground)] mb-2">Physical Wellness Data</p>
              <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">Your profile, goals, and activity data are used solely to create and adapt your personalized wellness plan. This data is stored locally and is never shared without your explicit consent.</p>
            </div>
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-[var(--foreground)]">Share wellness summary with Hospital Care</p>
                <button
                  onClick={() => update("shareWithHospital", !data.shareWithHospital)}
                  className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${data.shareWithHospital ? "bg-[var(--accent)]" : "bg-[var(--muted)]"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${data.shareWithHospital ? "translate-x-5" : ""}`} />
                </button>
              </div>
              <p className="text-xs text-[var(--muted-foreground)]">Optional. Allows your care team to view a high-level wellness summary.</p>
            </div>
          </div>
        )}

        {/* Step 1: Profile */}
        {step === 1 && (
          <div>
            <h2 className="font-display text-3xl text-[var(--foreground)] mb-2">Your profile</h2>
            <p className="text-[var(--muted-foreground)] mb-6 text-sm">This helps us tailor your plan accurately.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Age</label>
                <input
                  type="number" placeholder="e.g. 32"
                  value={data.age}
                  onChange={e => update("age", e.target.value)}
                  className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] transition"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-[var(--foreground)]">Height</label>
                  <div className="flex bg-[var(--muted)] rounded-lg p-0.5">
                    {["cm", "ft"].map(u => (
                      <button key={u} onClick={() => update("heightUnit", u)}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition cursor-pointer ${data.heightUnit === u ? "bg-white text-[var(--foreground)] shadow-sm" : "text-[var(--muted-foreground)]"}`}>
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="number" placeholder={data.heightUnit === "cm" ? "e.g. 168" : "e.g. 66"}
                  value={data.height}
                  onChange={e => update("height", e.target.value)}
                  className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] transition"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-[var(--foreground)]">Weight</label>
                  <div className="flex bg-[var(--muted)] rounded-lg p-0.5">
                    {["kg", "lb"].map(u => (
                      <button key={u} onClick={() => update("weightUnit", u)}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition cursor-pointer ${data.weightUnit === u ? "bg-white text-[var(--foreground)] shadow-sm" : "text-[var(--muted-foreground)]"}`}>
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="number" placeholder={data.weightUnit === "kg" ? "e.g. 65" : "e.g. 143"}
                  value={data.weight}
                  onChange={e => update("weight", e.target.value)}
                  className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] transition"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Goals */}
        {step === 2 && (
          <div>
            <h2 className="font-display text-3xl text-[var(--foreground)] mb-2">Your goals</h2>
            <p className="text-[var(--muted-foreground)] mb-6 text-sm">Select a primary goal, and optionally a secondary goal.</p>
            <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">Primary Goal</p>
            <div className="grid grid-cols-1 gap-2 mb-6">
              {GOALS.map(g => (
                <SelectCard key={g} label={g} selected={data.primaryGoal === g} onSelect={() => update("primaryGoal", g)} />
              ))}
            </div>
            <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">Secondary Goal <span className="font-normal normal-case text-[var(--muted-foreground)]">(optional)</span></p>
            <div className="flex flex-wrap gap-2">
              {GOALS.filter(g => g !== data.primaryGoal).map(g => (
                <Chip key={g} label={g} selected={data.secondaryGoal === g} onToggle={() => update("secondaryGoal", data.secondaryGoal === g ? "" : g)} />
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Fitness */}
        {step === 3 && (
          <div>
            <h2 className="font-display text-3xl text-[var(--foreground)] mb-2">Your fitness</h2>
            <p className="text-[var(--muted-foreground)] mb-6 text-sm">Be honest — this helps us start you in the right place.</p>
            <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">Fitness Level</p>
            <div className="grid grid-cols-3 gap-2 mb-6">
              {FITNESS_LEVELS.map(l => (
                <SelectCard key={l} label={l} selected={data.fitnessLevel === l} onSelect={() => update("fitnessLevel", l)} />
              ))}
            </div>
            <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">Current Activity Level</p>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {ACTIVITY_LEVELS.map(l => (
                <SelectCard key={l} label={l} selected={data.activityLevel === l} onSelect={() => update("activityLevel", l)} />
              ))}
            </div>
            <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">Time per session</p>
            <div className="flex flex-wrap gap-2">
              {COMMITMENTS.map(c => (
                <Chip key={c} label={c} selected={data.commitment === c} onToggle={() => update("commitment", c)} />
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Environment */}
        {step === 4 && (
          <div>
            <h2 className="font-display text-3xl text-[var(--foreground)] mb-2">Your space & tools</h2>
            <p className="text-[var(--muted-foreground)] mb-6 text-sm">Tell us where you'll work out and what you have available.</p>
            <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">Environment</p>
            <div className="grid grid-cols-3 gap-2 mb-6">
              {ENVIRONMENTS.map(e => (
                <SelectCard key={e} label={e} selected={data.environment === e} onSelect={() => update("environment", e)} />
              ))}
            </div>
            <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">Equipment <span className="font-normal normal-case">(select all that apply)</span></p>
            <div className="flex flex-wrap gap-2 mb-8">
              {EQUIPMENT.map(eq => (
                <Chip key={eq} label={eq} selected={data.equipment.includes(eq)} onToggle={() => toggleEquipment(eq)} />
              ))}
            </div>
            <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">Physical Considerations</p>
            <p className="text-xs text-[var(--muted-foreground)] mb-3 leading-relaxed">This helps us keep your plan safe. Select anything that applies.</p>
            <div className="flex flex-wrap gap-2">
              {CONSIDERATIONS.map(c => (
                <Chip key={c} label={c} selected={data.considerations.includes(c)} onToggle={() => toggleConsideration(c)} />
              ))}
            </div>
          </div>
        )}

        {/* Step 5: Summary */}
        {step === 5 && (
          <div>
            <h2 className="font-display text-3xl text-[var(--foreground)] mb-2">Your summary</h2>
            <p className="text-[var(--muted-foreground)] mb-6 text-sm">Review before we build your plan.</p>
            {[
              { label: "Profile", value: data.age ? `${data.age} yrs · ${data.height}${data.heightUnit} · ${data.weight}${data.weightUnit}` : "—" },
              { label: "Primary Goal", value: data.primaryGoal || "—" },
              { label: "Secondary Goal", value: data.secondaryGoal || "None" },
              { label: "Fitness Level", value: data.fitnessLevel || "—" },
              { label: "Activity Level", value: data.activityLevel || "—" },
              { label: "Session Length", value: data.commitment || "—" },
              { label: "Environment", value: data.environment || "—" },
              { label: "Equipment", value: data.equipment.length ? data.equipment.join(", ") : "—" },
              { label: "Considerations", value: data.considerations.length ? data.considerations.join(", ") : "None" },
            ].map(row => (
              <div key={row.label} className="flex items-start justify-between py-3 border-b border-[var(--border)] last:border-0">
                <span className="text-sm text-[var(--muted-foreground)]">{row.label}</span>
                <span className="text-sm font-medium text-[var(--foreground)] text-right max-w-[60%]">{row.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-8 flex gap-3">
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)} className="px-6 py-3.5 rounded-2xl border border-[var(--border)] text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--muted)] transition cursor-pointer">
            Back
          </button>
        )}
        <button
          onClick={() => step < steps.length - 1 ? setStep(s => s + 1) : onComplete(data)}
          disabled={!canContinue()}
          className="flex-1 bg-[var(--primary)] text-white font-semibold py-3.5 rounded-2xl text-sm hover:opacity-90 transition disabled:opacity-40 cursor-pointer shadow-xs"
        >
          {step === steps.length - 1 ? "Create My Plan" : "Continue"}
        </button>
      </div>
    </div>
  );
}
