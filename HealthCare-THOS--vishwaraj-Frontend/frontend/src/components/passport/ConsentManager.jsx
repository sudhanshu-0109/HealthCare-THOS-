/**
 * components/passport/ConsentManager.jsx — Grant/revoke passport consent.
 */

import { useState } from 'react';
import { Trash2, Plus, Building2, User, Shield } from 'lucide-react';
import * as passportService from '../../services/passport.service';

export default function ConsentManager({ consents = [], passportId, onUpdate }) {
  const [showForm, setShowForm] = useState(false);
  const [hospitalId, setHospitalId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [granting, setGranting] = useState(false);
  const [error, setError] = useState(null);

  const handleGrant = async () => {
    if (!hospitalId.trim() && !doctorId.trim()) {
      setError('Enter a Hospital ID or Doctor ID to grant consent.');
      return;
    }
    setGranting(true);
    setError(null);
    try {
      await passportService.grantConsent({
        hospitalId: hospitalId.trim() || undefined,
        doctorId: doctorId.trim() || undefined,
      });
      setHospitalId('');
      setDoctorId('');
      setShowForm(false);
      onUpdate();
    } catch (err) {
      setError(err.message || 'Failed to grant consent.');
    } finally {
      setGranting(false);
    }
  };

  const handleRevoke = async (consentId) => {
    try {
      await passportService.revokeConsent(consentId);
      onUpdate();
    } catch (err) {
      console.error('[ConsentManager]', err);
    }
  };

  const activeConsents = consents.filter((c) => !c.revokedAt);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-cyan-500" />
          <h3 className="text-sm font-semibold text-slate-700">Access Consent</h3>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 text-xs text-cyan-600 hover:text-cyan-700 font-medium transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Grant Access
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-3 space-y-3">
          <p className="text-xs text-slate-500">Grant a hospital or specific doctor access to view your passport.</p>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Hospital ID (optional)</label>
            <input
              type="text"
              value={hospitalId}
              onChange={(e) => setHospitalId(e.target.value)}
              placeholder="hospital-uuid"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Doctor ID (optional)</label>
            <input
              type="text"
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
              placeholder="doctor-uuid"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-500 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              onClick={handleGrant}
              disabled={granting}
              className="flex-1 py-1.5 bg-cyan-600 text-white rounded-lg text-xs font-semibold hover:bg-cyan-700 disabled:opacity-50"
            >
              {granting ? 'Granting…' : 'Grant Consent'}
            </button>
          </div>
        </div>
      )}

      {activeConsents.length === 0 ? (
        <p className="text-xs text-slate-400 italic">No active consent grants. Your passport is private.</p>
      ) : (
        <div className="space-y-2">
          {activeConsents.map((consent) => (
            <div key={consent.id} className="flex items-center gap-3 bg-white border border-slate-100 rounded-xl px-3 py-2.5">
              <div className="w-7 h-7 rounded-lg bg-cyan-50 flex items-center justify-center flex-shrink-0">
                {consent.hospitalId ? <Building2 className="w-3.5 h-3.5 text-cyan-600" /> : <User className="w-3.5 h-3.5 text-cyan-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">
                  {consent.hospital?.name || consent.doctor?.user?.fullName || 'Unknown'}
                </p>
                <p className="text-[10px] text-slate-400">
                  Granted {new Date(consent.grantedAt).toLocaleDateString('en-IN')}
                </p>
              </div>
              <button
                onClick={() => handleRevoke(consent.id)}
                className="text-slate-300 hover:text-red-500 transition-colors"
                title="Revoke consent"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
