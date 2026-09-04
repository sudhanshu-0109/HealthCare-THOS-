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

export default function CheckInPage({ onComplete, onBack }) {
  const [current, setCurrent] = useState(0);
  const [scores, setScores] = useState({});
  const [selected, setSelected] = useState(null);

  const q = questions[current];
  const isLast = current === questions.length - 1;
  const progress = (current / questions.length) * 100;

  const handlePick = (score) => {
    setSelected(score);
  };

  const handleNext = () => {
    if (selected === null) return;
    const newScores = { ...scores, [q.id]: selected };
    setScores(newScores);
    if (isLast) {
      onComplete(newScores);
    } else {
      setCurrent(c => c + 1);
      setSelected(null);
    }
  };

  const handleBack = () => {
    if (current === 0) {
      onBack();
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
            Question {current + 1} of {questions.length}
          </span>
          <div className="flex gap-1">
            {questions.map((_, i) => (
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

      {/* Question */}
      <div className="flex-1 flex flex-col justify-center">
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
      </div>

      {/* Continue button */}
      <button
        onClick={handleNext}
        disabled={selected === null}
        className="w-full bg-[var(--primary)] text-white font-semibold py-4 rounded-2xl text-sm hover:opacity-90 transition disabled:opacity-40 cursor-pointer shadow-md"
      >
        {isLast ? "See My Readiness" : "Continue →"}
      </button>
    </div>
  );
}
