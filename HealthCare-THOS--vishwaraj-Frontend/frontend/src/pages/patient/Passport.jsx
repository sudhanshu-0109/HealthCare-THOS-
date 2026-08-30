/**
 * pages/patient/Passport.jsx — Healthcare Passport full editor.
 * Allergies, conditions, medications, notes, and consent management.
 */

import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Shield, Heart, Loader2, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import AllergyConditionEditor from '../../components/passport/AllergyConditionEditor';
import ConsentManager from '../../components/passport/ConsentManager';
import * as passportService from '../../services/passport.service';

export default function Passport() {
  const [passport, setPassport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  const [allergies, setAllergies] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [medications, setMedications] = useState([]);
  const [notes, setNotes] = useState('');

  const fetchPassport = async () => {
    try {
      const res = await passportService.getMyPassport();
      const data = res.data || res;
      setPassport(data);
      setAllergies(data.allergies || []);
      setConditions(data.medicalConditions || []);
      setMedications(data.currentMedications || []);
      setNotes(data.notes || '');
    } catch (err) {
      setError('Failed to load passport.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPassport(); }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await passportService.updateMyPassport({
        allergies,
        medicalConditions: conditions,
        currentMedications: medications,
        notes,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save passport.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading passport…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/20 to-teal-50/10">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/patient/dashboard" className="text-slate-400 hover:text-slate-700 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500" /> Healthcare Passport
            </h1>
            <p className="text-sm text-slate-400">Your personal health profile</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? 'Saved!' : 'Save'}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
        )}

        <div className="space-y-4">
          {/* Medical info card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
            <h2 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-3">Medical Information</h2>

            <AllergyConditionEditor
              label="Allergies"
              items={allergies}
              onChange={setAllergies}
              placeholder="e.g. Penicillin, Peanuts…"
            />

            <AllergyConditionEditor
              label="Medical Conditions"
              items={conditions}
              onChange={setConditions}
              placeholder="e.g. Hypertension, Diabetes…"
            />

            <AllergyConditionEditor
              label="Current Medications"
              items={medications}
              onChange={setMedications}
              placeholder="e.g. Atorvastatin 10mg…"
            />

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">Additional Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional health notes…"
                rows={3}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 transition-all resize-none"
              />
            </div>
          </div>

          {/* Consent card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <ConsentManager
              consents={passport?.consents || []}
              onUpdate={fetchPassport}
            />
          </div>

          {/* Timeline link */}
          <Link
            to="/patient/timeline"
            className="flex items-center justify-between bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 hover:border-cyan-200 transition-colors no-underline"
          >
            <div>
              <p className="text-sm font-semibold text-slate-800">Medical Timeline</p>
              <p className="text-xs text-slate-400">View your complete health history</p>
            </div>
            <div className="text-cyan-500">→</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
