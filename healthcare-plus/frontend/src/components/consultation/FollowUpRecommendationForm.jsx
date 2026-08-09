import { useState } from 'react';
import { CalendarClock, CheckCircle } from 'lucide-react';
import * as followUpService from '../../services/followUp.service';

export default function FollowUpRecommendationForm({ consultationId, onSuccess, isReadOnly }) {
  const [recommendedDate, setRecommendedDate] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Default to 1 week from now
  const handleShowForm = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    setRecommendedDate(d.toISOString().split('T')[0]);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!recommendedDate) return alert('Select a date.');

    setLoading(true);
    try {
      await followUpService.recommendFollowUp(consultationId, { recommendedDate, reason });
      onSuccess();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save follow-up recommendation.');
    } finally {
      setLoading(false);
    }
  };

  if (isReadOnly) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-emerald-200 p-6">
        <div className="flex items-center gap-2 text-emerald-700 font-bold mb-2">
          <CheckCircle className="w-5 h-5" />
          Follow-up Recommended
        </div>
        <p className="text-sm text-slate-600">Patient recommended to return on {new Date(recommendedDate).toLocaleDateString()}.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <CalendarClock className="w-5 h-5 text-fuchsia-500" />
          Follow-Up Recommendation
        </h2>
        
        {!showForm && (
          <button 
            onClick={handleShowForm}
            className="text-sm font-medium text-fuchsia-600 bg-fuchsia-50 hover:bg-fuchsia-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            Recommend Follow-up
          </button>
        )}
      </div>

      {showForm && (
        <div className="pt-3 border-t border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm font-bold text-slate-700 block mb-1">Recommended Date</label>
              <input 
                type="date" 
                value={recommendedDate} 
                onChange={e => setRecommendedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-fuchsia-500 outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700 block mb-1">Reason (Optional)</label>
              <input 
                type="text" 
                value={reason} 
                onChange={e => setReason(e.target.value)}
                placeholder="e.g. To check if infection has cleared"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-fuchsia-500 outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button 
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={loading}
              className="bg-fuchsia-600 text-white text-sm font-medium px-6 py-2 rounded-lg hover:bg-fuchsia-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Finalize Recommendation'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
