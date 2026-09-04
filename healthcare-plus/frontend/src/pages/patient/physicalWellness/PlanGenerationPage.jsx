import React, { useState, useEffect } from "react";

const stages = [
  "Understanding your goals",
  "Matching your fitness level",
  "Considering your preferences",
  "Preparing your weekly plan",
  "Finalizing your schedule",
];

export default function PlanGenerationPage({ onComplete }) {
  const [currentStage, setCurrentStage] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStage(s => {
        if (s >= stages.length - 1) {
          clearInterval(interval);
          setTimeout(() => setDone(true), 600);
          return s;
        }
        return s + 1;
      });
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (done) {
      const t = setTimeout(onComplete, 800);
      return () => clearTimeout(t);
    }
  }, [done, onComplete]);

  return (
    <div className="min-h-full flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[var(--primary)] flex items-center justify-center mb-10 shadow-md">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
        </svg>
      </div>
      <h1 className="font-display text-3xl text-[var(--foreground)] mb-2">Building your plan</h1>
      <p className="text-[var(--muted-foreground)] text-sm mb-12 max-w-xs">Creating a personalized wellness plan based on your profile and goals.</p>
      <div className="w-full max-w-xs space-y-3">
        {stages.map((stage, i) => {
          const isComplete = i < currentStage || done;
          const isActive = i === currentStage && !done;
          return (
            <div key={stage} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${isActive ? "bg-[var(--card)] border border-[var(--border)] shadow-xs" : ""}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                isComplete ? "bg-[var(--accent)]" : isActive ? "border-2 border-[var(--accent)]" : "border-2 border-[var(--border)]"
              }`}>
                {isComplete && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
                {isActive && <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />}
              </div>
              <span className={`text-sm ${isComplete ? "text-[var(--foreground)] font-medium" : isActive ? "text-[var(--foreground)] font-medium" : "text-[var(--muted-foreground)]"}`}>
                {stage}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
