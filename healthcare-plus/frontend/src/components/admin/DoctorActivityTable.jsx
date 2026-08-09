import React from 'react';
import { UserCheck } from 'lucide-react';

export default function DoctorActivityTable({ data = [] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
      <div className="p-6 border-b border-slate-100">
        <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-emerald-600" /> Doctor Activity & Consultations
        </h3>
        <p className="text-xs text-slate-500">Completed patient consultations per practitioner</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase">
            <tr>
              <th className="p-4">Practitioner Name</th>
              <th className="p-4 text-center">Consultations Completed</th>
              <th className="p-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {data.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-8 text-center text-slate-400">
                  No practitioner activity records found for this period.
                </td>
              </tr>
            ) : (
              data.map((doc, i) => (
                <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-4 font-bold text-slate-900">{doc.doctorName || 'Doctor'}</td>
                  <td className="p-4 text-center font-bold text-cyan-700 text-sm">{doc.consultations}</td>
                  <td className="p-4 text-right">
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-medium rounded-full border border-emerald-200">
                      Active
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
