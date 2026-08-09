/**
 * components/passport/AllergyConditionEditor.jsx — Tag-input editor for arrays.
 */

import { useState } from 'react';
import { X, Plus } from 'lucide-react';

export default function AllergyConditionEditor({ label, items = [], onChange, placeholder = 'Add item…' }) {
  const [inputValue, setInputValue] = useState('');

  const addItem = () => {
    const val = inputValue.trim();
    if (!val || items.includes(val)) return;
    onChange([...items, val]);
    setInputValue('');
  };

  const removeItem = (idx) => onChange(items.filter((_, i) => i !== idx));

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addItem(); }
  };

  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-2">{label}</label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {items.map((item, idx) => (
          <span key={idx} className="flex items-center gap-1 px-2.5 py-1 bg-cyan-50 text-cyan-700 border border-cyan-200 rounded-lg text-xs font-medium">
            {item}
            <button onClick={() => removeItem(idx)} className="hover:text-red-500 transition-colors ml-0.5">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        {items.length === 0 && (
          <span className="text-xs text-slate-400 italic">None added</span>
        )}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 transition-all"
        />
        <button
          onClick={addItem}
          disabled={!inputValue.trim()}
          className="px-3 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-40 text-white rounded-lg text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
