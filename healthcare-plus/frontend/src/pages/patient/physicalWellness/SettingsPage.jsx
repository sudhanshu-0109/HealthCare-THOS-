import React, { useState } from "react";

export default function SettingsPage({ onBack, profile, user, onSaveProfile }) {
  const [showConfirm, setShowConfirm] = useState(false);

  const name =
    profile?.name ||
    profile?.firstName ||
    user?.fullName ||
    user?.name ||
    "User";

  const avatarLetter = name.charAt(0).toUpperCase();

  const bioDetails = [
    profile?.age ? `${profile.age} yrs` : null,
    profile?.height ? `${profile.height}${profile.heightUnit || 'cm'}` : null,
    profile?.weight ? `${profile.weight}${profile.weightUnit || 'kg'}` : null,
  ].filter(Boolean).join(" · ") || user?.email || "Personalized Fitness Profile";

  const [goal, setGoal] = useState(profile?.primaryGoal || "General Fitness");
  const [fitnessLevel, setFitnessLevel] = useState(profile?.fitnessLevel || "Beginner");
  const [environment, setEnvironment] = useState(profile?.environment || "Home");
  const [commitment, setCommitment] = useState(profile?.commitment || "30 min");
  const [units, setUnits] = useState(profile?.units || "metric");
  const [edited, setEdited] = useState(false);

  const trackEdit = (fn) => { fn(); setEdited(true); };

  const handleSave = () => {
    setShowConfirm(false);
    setEdited(false);
    if (onSaveProfile) {
      onSaveProfile({
        ...profile,
        primaryGoal: goal,
        fitnessLevel,
        environment,
        commitment,
        units,
      });
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] mb-6 hover:text-[var(--foreground)] transition cursor-pointer">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        Back
      </button>

      <h1 className="font-display text-3xl text-[var(--foreground)] mb-6">Settings</h1>

      {/* Profile summary */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 mb-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[var(--secondary)] flex items-center justify-center text-lg font-bold text-[var(--primary)]">
            {avatarLetter}
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--foreground)]">{name}</p>
            <p className="text-xs text-[var(--muted-foreground)]">{bioDetails}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {/* Goals */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">Primary Goal</p>
          <div className="grid grid-cols-2 gap-2">
            {["Weight Loss", "General Fitness", "Build Strength", "Improve Stamina"].map(g => (
              <button key={g} onClick={() => trackEdit(() => setGoal(g))}
                className={`py-2.5 rounded-xl text-xs font-medium border transition cursor-pointer ${goal === g ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-xs" : "bg-[var(--muted)] text-[var(--foreground)] border-transparent hover:border-[var(--accent)]"}`}>
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Fitness Level */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">Fitness Level</p>
          <div className="grid grid-cols-3 gap-2">
            {["Beginner", "Intermediate", "Advanced"].map(l => (
              <button key={l} onClick={() => trackEdit(() => setFitnessLevel(l))}
                className={`py-2.5 rounded-xl text-xs font-medium border transition cursor-pointer ${fitnessLevel === l ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-xs" : "bg-[var(--muted)] text-[var(--foreground)] border-transparent hover:border-[var(--accent)]"}`}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Environment */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">Workout Environment</p>
          <div className="grid grid-cols-3 gap-2">
            {["Home", "Gym", "Outdoor"].map(e => (
              <button key={e} onClick={() => trackEdit(() => setEnvironment(e))}
                className={`py-2.5 rounded-xl text-xs font-medium border transition cursor-pointer ${environment === e ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-xs" : "bg-[var(--muted)] text-[var(--foreground)] border-transparent hover:border-[var(--accent)]"}`}>
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Time commitment */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">Session Length</p>
          <div className="flex gap-2">
            {["15 min", "30 min", "45 min", "60+ min"].map(c => (
              <button key={c} onClick={() => trackEdit(() => setCommitment(c))}
                className={`flex-1 py-2.5 rounded-xl text-xs font-medium border transition cursor-pointer ${commitment === c ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-xs" : "bg-[var(--muted)] text-[var(--foreground)] border-transparent hover:border-[var(--accent)]"}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Units */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">Units</p>
          <div className="flex bg-[var(--muted)] rounded-xl p-1">
            {["metric", "imperial"].map(u => (
              <button key={u} onClick={() => trackEdit(() => setUnits(u))}
                className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition capitalize cursor-pointer ${units === u ? "bg-white text-[var(--foreground)] shadow-sm" : "text-[var(--muted-foreground)]"}`}>
                {u}
              </button>
            ))}
          </div>
        </div>

        {/* Safety considerations */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">Safety & Considerations</p>
          <p className="text-xs text-[var(--muted-foreground)] mb-3">No active physical considerations set.</p>
          <button className="text-xs font-medium text-[var(--accent)] cursor-pointer">Edit Considerations</button>
        </div>
      </div>

      {edited && (
        <button onClick={() => setShowConfirm(true)} className="mt-6 w-full bg-[var(--primary)] text-white font-semibold py-4 rounded-2xl text-sm hover:opacity-90 transition cursor-pointer shadow-md">
          Save Changes
        </button>
      )}

      {/* Confirm modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-end lg:items-center justify-center z-50 px-4 pb-4 lg:pb-0">
          <div className="bg-[var(--card)] rounded-3xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-display text-xl text-[var(--foreground)] mb-2">Update settings?</h3>
            <p className="text-sm text-[var(--muted-foreground)] mb-6 leading-relaxed">Updating these details will adjust future wellness recommendations.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="flex-1 py-3 border border-[var(--border)] rounded-xl text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--muted)] transition cursor-pointer">
                Cancel
              </button>
              <button onClick={handleSave} className="flex-1 py-3 bg-[var(--primary)] text-white rounded-xl text-sm font-semibold hover:opacity-90 transition cursor-pointer shadow-sm">
                Save & Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
