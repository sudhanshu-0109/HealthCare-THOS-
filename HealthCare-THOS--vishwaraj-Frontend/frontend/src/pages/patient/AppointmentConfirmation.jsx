/**
 * pages/patient/AppointmentConfirmation.jsx — Post-booking confirmation screen.
 * Shows appointment details, queue token number, and link to live queue.
 */

import { useLocation, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, Calendar, Clock, Hash, ArrowRight, Home } from 'lucide-react';

export default function AppointmentConfirmation() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { appointment, queueToken } = state || {};

  if (!appointment) {
    navigate('/patient/dashboard', { replace: true });
    return null;
  }

  const doctor = appointment.doctor;
  const date = new Date(appointment.scheduledDate).toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/20 to-teal-50/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Success icon */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 mb-4 animate-bounce-once">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Appointment Confirmed!</h1>
          <p className="text-slate-500 text-sm mt-1">Your payment was successful and your slot is reserved.</p>
        </div>

        {/* Appointment details card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-lg p-6 space-y-4 mb-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {(doctor?.user?.fullName || 'Dr')[0]}
              </span>
            </div>
            <div>
              <p className="font-semibold text-slate-900">{doctor?.user?.fullName}</p>
              <p className="text-xs text-cyan-600">{doctor?.specialization} · {doctor?.hospital?.name}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="text-slate-700">{date}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="text-slate-700">{appointment.scheduledTime}</span>
            </div>
            {queueToken && (
              <div className="flex items-center gap-3">
                <Hash className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <div>
                  <span className="text-sm text-slate-500">Your Queue Token</span>
                  <span className="ml-2 inline-flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-100 text-cyan-700 font-bold text-sm">
                    {Math.floor(queueToken.tokenNumber)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {queueToken && (
            <Link
              to={`/appointments/${appointment.id}/queue`}
              state={{ appointment, queueToken }}
              className="flex items-center justify-center gap-2 w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-semibold text-sm transition-colors"
            >
              View Live Queue <ArrowRight className="w-4 h-4" />
            </Link>
          )}
          <Link
            to="/patient/dashboard"
            className="flex items-center justify-center gap-2 w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-sm transition-colors"
          >
            <Home className="w-4 h-4" /> Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
