import { useState, useEffect } from 'react';
import { FileText, ChevronRight, Activity } from 'lucide-react';
import * as consultationsService from '../../../services/consultations.service';

export default function ConsultationHistoryWidget() {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    consultationsService.getRecentConsultations(5)
      .then(res => {
        const data = res.data?.data || res.data?.consultations || res.data || [];
        setConsultations(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error(err);
        setConsultations([]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Recent Consultations</h2>
        <div className="flex justify-center items-center h-32 text-slate-400">Loading...</div>
      </div>
    );
  }

  const list = Array.isArray(consultations) ? consultations : [];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-800">Recent Consultations</h2>
        <span className="text-xs text-slate-400">Last 5 patients</span>
      </div>

      <div className="space-y-3">
        {list.length === 0 ? (
          <div className="text-center text-slate-400 py-6 text-sm">No recent consultations found.</div>
        ) : (
          list.map(c => (
            <div key={c.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg group cursor-pointer hover:bg-slate-100 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                  {(c.patient?.fullName || c.patientName || 'P')[0]}
                </div>
                <div>
                  <div className="font-medium text-slate-900 text-sm">{c.patient?.fullName || c.patientName || 'Patient Record'}</div>
                  <div className="text-xs text-slate-500 flex gap-2">
                    <span>{new Date(c.startedAt || c.createdAt || Date.now()).toLocaleDateString()}</span>
                    <span>•</span>
                    <span className="truncate max-w-[120px]">{c.diagnosis || 'No diagnosis recorded'}</span>
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
