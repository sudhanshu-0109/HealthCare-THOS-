import { useState, useEffect } from 'react';
import useDebounce from '../../hooks/useDebounce';

export default function ConsultationForm({ initialData, onSave }) {
  const [formData, setFormData] = useState({
    symptoms: initialData?.symptoms || '',
    diagnosis: initialData?.diagnosis || '',
    notes: initialData?.notes || '',
    treatmentPlan: initialData?.treatmentPlan || ''
  });

  const debouncedFormData = useDebounce(formData, 1000);

  // Trigger save when debounced data changes
  useEffect(() => {
    // Only save if it's changed from initial or previous
    if (debouncedFormData.symptoms !== initialData?.symptoms ||
        debouncedFormData.diagnosis !== initialData?.diagnosis ||
        debouncedFormData.notes !== initialData?.notes ||
        debouncedFormData.treatmentPlan !== initialData?.treatmentPlan) {
      onSave(debouncedFormData);
    }
  }, [debouncedFormData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const Field = ({ label, name, placeholder, rows = 3 }) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-bold text-slate-700">{label}</label>
      <textarea
        name={name}
        value={formData[name]}
        onChange={handleChange}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 outline-none transition-all resize-y text-slate-700 bg-white"
      />
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-5">
      <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">Clinical Notes</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field 
          label="Symptoms & Chief Complaint" 
          name="symptoms" 
          placeholder="E.g., Fever for 3 days, dry cough..." 
        />
        <Field 
          label="Diagnosis" 
          name="diagnosis" 
          placeholder="E.g., Viral Pharyngitis" 
        />
        <Field 
          label="Treatment Plan" 
          name="treatmentPlan" 
          placeholder="E.g., Rest, hydration, paracetamol as needed" 
        />
        <Field 
          label="Private Notes (Not visible to patient)" 
          name="notes" 
          placeholder="Internal observations..." 
        />
      </div>
    </div>
  );
}
