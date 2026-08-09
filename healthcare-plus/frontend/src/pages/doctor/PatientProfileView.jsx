import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import DashboardShell from '../../components/layout/DashboardShell';
import api from '../../services/api';

export default function PatientProfileView() {
  const { patientId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // This calls the existing Phase 7 endpoint GET /api/passport/:patientId
    api.get(`/passport/${patientId}`)
      .then(res => {
        setData(res.data);
      })
      .catch(err => {
        setError(err.response?.data?.message || 'Failed to load passport');
      })
      .finally(() => setLoading(false));
  }, [patientId]);

  if (loading) return <div className="p-8 text-center">Loading passport...</div>;

  return (
    <DashboardShell navItems={[]} activeItem="" setActiveItem={() => {}} roleLabel="Doctor">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold text-slate-800">Patient Medical Record</h1>
        
        {error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 font-medium">
            {error}
          </div>
        ) : (
          <>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm grid grid-cols-3 gap-6">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Allergies</h3>
                <ul className="list-disc pl-4 text-sm text-slate-700">
                  {data.passport.allergies?.length ? data.passport.allergies.map(a => <li key={a}>{a}</li>) : 'None'}
                </ul>
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Conditions</h3>
                <ul className="list-disc pl-4 text-sm text-slate-700">
                  {data.passport.medicalConditions?.length ? data.passport.medicalConditions.map(c => <li key={c}>{c}</li>) : 'None'}
                </ul>
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Medications</h3>
                <ul className="list-disc pl-4 text-sm text-slate-700">
                  {data.passport.currentMedications?.length ? data.passport.currentMedications.map(m => <li key={m}>{m}</li>) : 'None'}
                </ul>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-4">Medical Timeline</h3>
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                {data.timeline?.events?.length === 0 ? (
                  <div className="text-center text-slate-400 py-4">No events found.</div>
                ) : (
                  data.timeline?.events?.map(event => (
                    <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-300 group-[.is-active]:bg-emerald-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                        <span className="text-xs font-bold">{event.eventType.substring(0, 1)}</span>
                      </div>
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-bold text-slate-800 text-sm">{event.title}</h4>
                          <time className="text-xs font-medium text-slate-400">
                            {new Date(event.eventDate).toLocaleDateString()}
                          </time>
                        </div>
                        {event.description && <p className="text-sm text-slate-600">{event.description}</p>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
