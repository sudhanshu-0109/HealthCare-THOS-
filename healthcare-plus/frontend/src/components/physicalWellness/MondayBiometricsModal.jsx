/**
 * MondayBiometricsModal.jsx
 * Weekly biometrics check-in modal — prompts user to log weight & height,
 * calculates live BMI, and persists to pw_biometrics_history_v2.
 */

import React, { useState, useEffect } from "react";
import {
  saveBiometricsEntry,
  calculateBmi,
  getNextMondayDateStr,
  formatMondayDate,
} from "../../data/physicalWellnessMockData.js";

function bmiCategoryColor(bmi) {
  if (!bmi) return "text-[var(--muted-foreground)]";
  if (bmi < 18.5) return "text-sky-600";
  if (bmi < 25) return "text-emerald-600";
  if (bmi < 30) return "text-amber-600";
  return "text-rose-600";
}

export default function MondayBiometricsModal({ isOpen, onClose, onSaved, isManualUpdate = false }) {
  const [weight, setWeight] = useState("");
  const [weightUnit, setWeightUnit] = useState("kg");
  const [height, setHeight] = useState("");
  const [heightUnit, setHeightUnit] = useState("cm");
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  // Seed from profile if available
  useEffect(() => {
    if (!isOpen) return;
    try {
      const raw = localStorage.getItem("pw_profile_v2");
      if (raw) {
        const p = JSON.parse(raw);
        if (p.weight) setWeight(p.weight);
        if (p.weightUnit) setWeightUnit(p.weightUnit);
        if (p.height) setHeight(p.height);
        if (p.heightUnit) setHeightUnit(p.heightUnit);
      }
    } catch {}
    setSaved(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const { bmi, category } = calculateBmi(weight, weightUnit, height, heightUnit);
  const canSave = weight && height && parseFloat(weight) > 0 && parseFloat(height) > 0;

  const handleSave = () => {
    if (!canSave) return;
    saveBiometricsEntry({ weight, weightUnit, height, heightUnit, note });
    setSaved(true);
    if (onSaved) onSaved();
    setTimeout(() => onClose(), 1200);
  };

  const nextMondayLabel = formatMondayDate(getNextMondayDateStr());

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-[var(--border)]">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-[var(--border)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
                {isManualUpdate ? "Manual Update" : "Weekly Monday Check-in"}
              </p>
              <h2 className="font-display text-xl text-[var(--foreground)]">Body Metrics</h2>
              {!isManualUpdate && (
                <p className="text-xs text-[var(--muted-foreground)] mt-1">
                  Due today — Next: <span className="font-medium">{nextMondayLabel}</span>
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[var(--muted)] flex items-center justify-center hover:bg-[var(--border)] transition cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {saved ? (
          // Success state
          <div className="px-6 py-10 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <p className="font-display text-lg text-[var(--foreground)]">Metrics saved!</p>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">Your BMI has been updated.</p>
          </div>
        ) : (
          <div className="px-6 py-5 space-y-4">
            {/* Weight */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-[var(--foreground)]">Weight</label>
                <div className="flex bg-[var(--muted)] rounded-lg p-0.5">
                  {["kg", "lb"].map(u => (
                    <button
                      key={u}
                      onClick={() => setWeightUnit(u)}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${weightUnit === u ? "bg-white text-[var(--foreground)] shadow-sm" : "text-[var(--muted-foreground)]"}`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="number"
                placeholder={weightUnit === "kg" ? "e.g. 65" : "e.g. 143"}
                value={weight}
                onChange={e => setWeight(e.target.value)}
                className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] transition"
              />
            </div>

            {/* Height */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-[var(--foreground)]">Height</label>
                <div className="flex bg-[var(--muted)] rounded-lg p-0.5">
                  {["cm", "ft"].map(u => (
                    <button
                      key={u}
                      onClick={() => setHeightUnit(u)}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${heightUnit === u ? "bg-white text-[var(--foreground)] shadow-sm" : "text-[var(--muted-foreground)]"}`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="number"
                placeholder={heightUnit === "cm" ? "e.g. 168" : "e.g. 66"}
                value={height}
                onChange={e => setHeight(e.target.value)}
                className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] transition"
              />
            </div>

            {/* Live BMI Preview */}
            {bmi && (
              <div className="bg-[var(--muted)] rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wider mb-0.5">Live BMI</p>
                  <p className={`text-3xl font-bold ${bmiCategoryColor(bmi)}`}>{bmi}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
                    bmi < 18.5 ? "bg-sky-50 text-sky-700 border border-sky-100"
                    : bmi < 25 ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                    : bmi < 30 ? "bg-amber-50 text-amber-700 border border-amber-100"
                    : "bg-rose-50 text-rose-700 border border-rose-100"
                  }`}>
                    {category}
                  </span>
                  <p className="text-[10px] text-[var(--muted-foreground)] mt-1">BMI Range: 18.5 – 24.9 Healthy</p>
                </div>
              </div>
            )}

            {/* Optional note */}
            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1.5">Note <span className="font-normal">(optional)</span></label>
              <input
                type="text"
                placeholder="e.g. Post-meal, morning weight..."
                value={note}
                onChange={e => setNote(e.target.value)}
                className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] transition"
              />
            </div>

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={!canSave}
              className={`w-full py-4 rounded-2xl text-sm font-semibold transition ${
                canSave
                  ? "bg-[var(--primary)] text-white hover:opacity-90 shadow-md cursor-pointer"
                  : "bg-[var(--muted)] text-[var(--muted-foreground)] cursor-not-allowed"
              }`}
            >
              Save Metrics
            </button>
            <button
              onClick={onClose}
              className="w-full text-center text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition cursor-pointer py-1"
            >
              Remind me later
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
