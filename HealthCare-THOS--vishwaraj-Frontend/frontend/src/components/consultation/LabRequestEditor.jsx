import { useState } from 'react';
import { FlaskConical, Plus, Trash2, CheckCircle } from 'lucide-react';
import * as labRequestsService from '../../services/labRequests.service';

export default function LabRequestEditor({ consultationId, onSuccess, isReadOnly }) {
  const [items, setItems] = useState([]);
  const [priority, setPriority] = useState('ROUTINE');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const addItem = () => {
    setItems([...items, { testName: '' }]);
  };

  const updateItem = (index, value) => {
    const newItems = [...items];
    newItems[index].testName = value;
    setItems(newItems);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (items.length === 0) return alert('Add at least one lab test.');
    if (items.some(i => !i.testName.trim())) return alert('Test names cannot be empty.');

    setLoading(true);
    try {
      await labRequestsService.createLabRequest(consultationId, { priority, notes, items });
      onSuccess();
    } catch (err) {
      alert(err.message || 'Failed to save lab request.');
    } finally {
      setLoading(false);
    }
  };

  if (isReadOnly) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-emerald-200 p-6">
        <div className="flex items-center gap-2 text-emerald-700 font-bold mb-4">
          <CheckCircle className="w-5 h-5" />
          Lab Request Saved
        </div>
        <p className="text-sm text-slate-600">{items.length} test(s) ordered ({priority}).</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-rose-500" />
          Lab Request
        </h2>
        <button 
          onClick={addItem}
          className="text-sm font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Test
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-center text-slate-400 py-4 text-sm">No lab tests requested.</div>
      ) : (
        <div className="space-y-4">
          <div className="flex gap-4 mb-4">
            <div className="w-48">
              <label className="text-xs font-bold text-slate-500 mb-1 block">Priority</label>
              <select 
                value={priority} 
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-rose-500 outline-none bg-white"
              >
                <option value="ROUTINE">Routine</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 block">Tests to run</label>
            {items.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <input 
                  type="text" 
                  value={item.testName} 
                  onChange={(e) => updateItem(index, e.target.value)}
                  placeholder="e.g. Complete Blood Count (CBC)"
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-rose-500 outline-none"
                />
                <button 
                  onClick={() => removeItem(index)}
                  className="text-slate-400 hover:text-red-500 p-2 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100">
            <label className="text-sm font-bold text-slate-700 block mb-2">Instructions for Lab (Optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Fasting required"
              rows={2}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none transition-all resize-y text-sm"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button 
              onClick={handleSave}
              disabled={loading}
              className="bg-rose-600 text-white font-medium px-6 py-2 rounded-lg hover:bg-rose-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Finalize Request'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
