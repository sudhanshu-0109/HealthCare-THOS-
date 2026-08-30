/**
 * pages/patient/LiveQueue.jsx — Patient's live queue tracking page.
 */

import { useLocation, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar } from 'lucide-react';
import PatientQueueTracker from '../../components/queue/PatientQueueTracker';

export default function LiveQueue() {
  const { appointmentId } = useParams();
  const { state } = useLocation();
  const appointment = state?.appointment;
  const doctor = appointment?.doctor;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/20 to-teal-50/10">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/patient/dashboard" className="text-slate-400 hover:text-slate-700 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-bold text-slate-900">Live Queue</h1>
            {doctor && (
              <p className="text-sm text-slate-500">
                Dr. {doctor?.user?.fullName} · {appointment?.scheduledTime}
              </p>
            )}
          </div>
        </div>

        <PatientQueueTracker appointmentId={appointmentId} />

        {/* Appointment details link */}
        <div className="mt-6 flex justify-center">
          <Link
            to={`/appointments/${appointmentId}`}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            <Calendar className="w-4 h-4" /> View appointment details
          </Link>
        </div>
      </div>
    </div>
  );
}
