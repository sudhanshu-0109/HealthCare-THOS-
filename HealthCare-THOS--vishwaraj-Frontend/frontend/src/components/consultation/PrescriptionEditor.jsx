import { useState } from 'react';
import { Pill, Plus, Trash2, CheckCircle } from 'lucide-react';
import * as prescriptionsService from '../../services/prescriptions.service';

const FREQUENCY_OPTIONS = [
  'Once daily',
  'Twice daily',
  'Three times daily',
  'Four times daily',
  'Every morning',
  'At bedtime',
  'As needed'
];

export default function PrescriptionEditor({ consultationId, onSuccess, isReadOnly }) {
  const [items, setItems] = useState([]);
  const [generalInstructions, setGeneralInstructions] = useState('');
  const [loading, setLoading] = useState(false);

  const addItem = () => {
    setItems([...items, { medicineName: '', dosage: '', frequency: 'Once daily', durationDays: 5, instructions: '' }]);
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    if (field === 'durationDays') value = parseInt(value, 10) || 1;
    newItems[index][field] = value;
    setItems(newItems);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (items.length === 0) return alert('Add at least one medicine.');
    if (items.some(i => !i.medicineName || !i.dosage)) return alert('Medicine name and dosage are required.');

    setLoading(true);
    try {
      await prescriptionsService.createPrescription(consultationId, { generalInstructions, items });
      onSuccess();
    } catch (err) {
      alert(err.message || 'Failed to save prescription.');
    } finally {
      setLoading(false);
    }
  };

  if (isReadOnly) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-emerald-200 p-6">
        <div className="flex items-center gap-2 text-emerald-700 font-bold mb-4">
          <CheckCircle className="w-5 h-5" />
          Prescription Saved
        </div>
        <p className="text-sm text-slate-600">{items.length} medications prescribed.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Pill className="w-5 h-5 text-indigo-500" />
          Prescription
        </h2>
        <button 
          onClick={addItem}
          className="text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Medicine
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-center text-slate-400 py-4 text-sm">No medicines added yet.</div>
      ) : (
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="flex flex-wrap items-start gap-3 p-4 bg-slate-50 border border-slate-200 rounded-lg relative group">
              <button 
                onClick={() => removeItem(index)}
                className="absolute -right-2 -top-2 bg-white text-red-500 p-1.5 rounded-full shadow border border-slate-200 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs font-bold text-slate-500 mb-1 block">Medicine Name</label>
                <input 
                  type="text" 
                  value={item.medicineName} 
                  onChange={(e) => updateItem(index, 'medicineName', e.target.value)}
                  placeholder="e.g. Paracetamol"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-indigo-500 outline-none"
                />
              </div>
              
              <div className="w-32">
                <label className="text-xs font-bold text-slate-500 mb-1 block">Dosage</label>
                <input 
                  type="text" 
                  value={item.dosage} 
                  onChange={(e) => updateItem(index, 'dosage', e.target.value)}
                  placeholder="e.g. 500mg"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="w-40">
                <label className="text-xs font-bold text-slate-500 mb-1 block">Frequency</label>
                <select 
                  value={item.frequency} 
                  onChange={(e) => updateItem(index, 'frequency', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-indigo-500 outline-none bg-white"
                >
                  {FREQUENCY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>

              <div className="w-24">
                <label className="text-xs font-bold text-slate-500 mb-1 block">Days</label>
                <input 
                  type="number" 
                  min="1"
                  value={item.durationDays} 
                  onChange={(e) => updateItem(index, 'durationDays', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="w-full mt-2">
                <input 
                  type="text" 
                  value={item.instructions} 
                  onChange={(e) => updateItem(index, 'instructions', e.target.value)}
                  placeholder="Special instructions (e.g. Take after meals)"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-indigo-500 outline-none"
                />
              </div>
            </div>
          ))}

          <div className="pt-4 border-t border-slate-100">
            <label className="text-sm font-bold text-slate-700 block mb-2">General Instructions (Optional)</label>
            <textarea
              value={generalInstructions}
              onChange={e => setGeneralInstructions(e.target.value)}
              placeholder="e.g. Drink plenty of water and rest."
              rows={2}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all resize-y text-sm"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button 
              onClick={handleSave}
              disabled={loading}
              className="bg-indigo-600 text-white font-medium px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Finalize Prescription'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
