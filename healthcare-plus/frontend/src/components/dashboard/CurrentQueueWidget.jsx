/**
 * components/dashboard/CurrentQueueWidget.jsx — Displays current active queue token on dashboard.
 */

import { Radio, ArrowRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import * as appointmentsService from '../../services/appointments.service';
import * as queueService from '../../services/queue.service';

export default function CurrentQueueWidget() {
  const [activeToken, setActiveToken] = useState(null);
  const [appointmentId, setAppointmentId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Find today's confirmed appointment and its queue position
    const checkQueue = async () => {
      try {
        const res = await appointmentsService.getMyAppointments({ limit: 10 });
        const today = new Date().toISOString().split('T')[0];
        
        const apptsData = res.data?.appointments || res.data || [];
        const apptsArray = Array.isArray(apptsData) ? apptsData : apptsData.appointments || [];
        const todayAppts = apptsArray.filter(
          a => a.scheduledDate?.startsWith(today) && a.status === 'CONFIRMED'
        );

        if (todayAppts.length > 0) {
          const appt = todayAppts[0];
          const posRes = await queueService.getMyQueuePosition(appt.id);
          const posData = posRes.data || posRes;
          if (posData?.token) {
            setActiveToken(posData);
            setAppointmentId(appt.id);
          }
        }
      } catch (err) {
        // Ignore errors if no active queue
      } finally {
        setLoading(false);
      }
    };
    
    checkQueue();
  }, []);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-cyan-500 to-teal-600 rounded-2xl p-5 text-white shadow-sm flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  if (!activeToken) return null; // Only render if there's an active queue today

  return (
    <div className="bg-gradient-to-br from-cyan-500 to-teal-600 rounded-2xl p-5 text-white shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-20">
        <Radio className="w-16 h-16" />
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold tracking-wide uppercase">Live Queue</span>
        </div>
        <div className="flex items-end gap-3 mb-4">
          <div>
            <p className="text-sm opacity-80">Your Token</p>
            <p className="text-4xl font-bold">#{Math.floor(activeToken.token.tokenNumber)}</p>
          </div>
          <div className="pb-1">
            <p className="text-xs opacity-80">Est. Wait</p>
            <p className="text-lg font-semibold">{activeToken.estimatedWaitMinutes}m</p>
          </div>
        </div>
        <Link
          to={`/appointments/${appointmentId}/queue`}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-semibold transition-colors"
        >
          Open Tracker <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
