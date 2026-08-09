/**
 * components/dashboard/UpcomingAppointments.jsx — Displays upcoming appointments on dashboard.
 */

import { Calendar, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import * as appointmentsService from '../../services/appointments.service';

export default function UpcomingAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    appointmentsService.getMyAppointments({ limit: 3 })
      .then((res) => {
        const apptsData = res.data?.appointments || res.data || [];
        const apptsArray = Array.isArray(apptsData) ? apptsData : apptsData.appointments || [];
        const upcoming = apptsArray.filter(a => a.status === 'CONFIRMED');
        setAppointments(upcoming);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;

  if (appointments.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm text-center">
        <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-2">
          <Calendar className="w-5 h-5 text-slate-300" />
        </div>
        <h3 className="text-sm font-semibold text-slate-600">No upcoming appointments</h3>
        <p className="text-xs text-slate-400 mt-1">Book a doctor to get started</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-slate-50">
        <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-cyan-500" /> Upcoming
        </h3>
      </div>
      <div className="divide-y divide-slate-50">
        {appointments.map((appt) => (
          <Link
            key={appt.id}
            to={`/appointments/${appt.id}/queue`}
            state={{ appointment: appt }}
            className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
          >
            <div>
              <p className="font-semibold text-slate-900 text-sm">{appt.doctor?.user?.fullName}</p>
              <p className="text-xs text-slate-500">{new Date(appt.scheduledDate).toLocaleDateString('en-IN')} at {appt.scheduledTime}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </Link>
        ))}
      </div>
    </div>
  );
}
