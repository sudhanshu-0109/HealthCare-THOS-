import { useState, useEffect } from 'react';
import { ShieldAlert } from 'lucide-react';

export default function PatientContextPanel({ summary, patientId }) {
  if (!summary) return null;

  const renderList = (title, items, emptyText) => (
    <div className="mb-5">
      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{title}</h4>
      {items && items.length > 0 ? (
        <ul className="space-y-1.5">
          {items.map((item, i) => (
            <li key={i} className="text-sm font-medium text-slate-700 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-100">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-sm text-slate-400 italic">{emptyText}</div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-6 flex gap-3">
        <ShieldAlert className="w-5 h-5 text-blue-600 shrink-0" />
        <p className="text-xs text-blue-800">
          You are viewing this passport via active patient consent. Access is logged.
        </p>
      </div>

      {renderList('Allergies', summary.allergies, 'No known allergies')}
      {renderList('Medical Conditions', summary.medicalConditions, 'No recorded conditions')}
      {renderList('Current Medications', summary.currentMedications, 'Not on any medications')}

      {summary.notes && (
        <div className="mb-5">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">General Notes</h4>
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{summary.notes}</p>
        </div>
      )}

      <div className="mt-auto pt-6 border-t border-slate-100">
        <a 
          href={`/doctor/passport/${patientId}`} 
          target="_blank" 
          rel="noreferrer"
          className="text-sm font-medium text-blue-600 hover:text-blue-700 block text-center"
        >
          View Full Timeline →
        </a>
      </div>
    </div>
  );
}
