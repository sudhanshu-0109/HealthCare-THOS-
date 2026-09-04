import React, { useState } from "react";

export default function PostWorkoutPage({ onSave, onGoToDashboard }) {
  const [feeling, setFeeling] = useState(null);
  const [pain, setPain] = useState(null);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(onSave, 1500);
  };

  if (saved) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center px-6 text-center py-16">
        <div className="w-20 h-20 rounded-full bg-[var(--accent)] flex items-center justify-center mb-8 shadow-md">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h2 className="font-display text-3xl text-[var(--foreground)] mb-3">Workout Saved</h2>
        <p className="text-[var(--muted-foreground)] text-sm">Great work today. See you next session.</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      {/* Completion header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-full bg-[var(--secondary)] border-2 border-[var(--accent)] flex items-center justify-center mx-auto mb-4 shadow-sm">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h1 className="font-display text-3xl text-[var(--foreground)] mb-1">Workout Complete</h1>
        <p className="text-[var(--muted-foreground)] text-sm">You showed up. That's what matters.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: "Completed", value: "100%" },
          { label: "Exercises", value: "10" },
          { label: "Duration", value: "32 min" },
        ].map(s => (
          <div key={s.label} className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 text-center shadow-xs">
            <p className="text-xl font-bold text-[var(--foreground)]">{s.value}</p>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Feedback */}
      <div className="mb-6">
        <p className="text-sm font-semibold text-[var(--foreground)] mb-3">How did this workout feel?</p>
        <div className="grid grid-cols-2 gap-2">
          {["Easy", "Appropriate", "Hard", "Too Difficult"].map(opt => (
            <button
              key={opt}
              onClick={() => setFeeling(opt)}
              className={`py-3 rounded-xl text-sm font-medium border transition cursor-pointer ${
                feeling === opt ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-xs" : "bg-[var(--card)] text-[var(--foreground)] border-[var(--border)] hover:border-[var(--accent)] shadow-xs"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <p className="text-sm font-semibold text-[var(--foreground)] mb-3">Did you experience any pain?</p>
        <div className="grid grid-cols-2 gap-2">
          {[{ label: "No", val: false }, { label: "Yes", val: true }].map(opt => (
            <button
              key={opt.label}
              onClick={() => setPain(opt.val)}
              className={`py-3 rounded-xl text-sm font-medium border transition cursor-pointer ${
                pain === opt.val ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-xs" : "bg-[var(--card)] text-[var(--foreground)] border-[var(--border)] hover:border-[var(--accent)] shadow-xs"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {pain && (
          <p className="text-xs text-amber-600 mt-2 bg-amber-50 px-3 py-2 rounded-xl border border-amber-100">
            If pain persists, please consult a healthcare professional before your next session.
          </p>
        )}
      </div>

      <button
        onClick={handleSave}
        disabled={feeling === null || pain === null}
        className="w-full bg-[var(--primary)] text-white font-semibold py-4 rounded-2xl text-base hover:opacity-90 transition disabled:opacity-40 cursor-pointer shadow-md"
      >
        Save Workout
      </button>
    </div>
  );
}
