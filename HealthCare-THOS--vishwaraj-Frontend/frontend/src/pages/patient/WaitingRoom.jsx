/**
 * pages/patient/WaitingRoom.jsx — Patient waiting room for online consultations (Phase 16).
 *
 * Patient enters this page after payment is confirmed for an ONLINE appointment.
 * - Calls POST /online-sessions/:appointmentId/join to update DB status.
 * - Joins the WebRTC signaling socket room.
 * - Listens for consultation:session-started to navigate to VideoConsultation.
 */

import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Video, Clock, Wifi, CheckCircle2, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import * as onlineSessionService from '../../services/onlineSession.service';
import { joinConsultationRoom, leaveConsultationRoom, getSocket } from '../../services/socket';

const STATUS_LABELS = {
  SCHEDULED: 'Appointment scheduled',
  WAITING_FOR_PARTICIPANTS: 'Waiting for participants',
  PATIENT_JOINED: "You've joined — waiting for doctor",
  DOCTOR_JOINED: 'Doctor is ready — call will start soon',
  IN_PROGRESS: 'Consultation in progress',
  COMPLETED: 'Consultation completed',
  CANCELLED: 'Appointment cancelled',
  EXPIRED: 'Session expired',
};

export default function WaitingRoom() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [joining, setJoining] = useState(false);

  const fetchAndJoin = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await onlineSessionService.getSession(appointmentId);
      const sessionData = res.data?.data || res.data;
      setSession(sessionData);

      // If session already in progress, go straight to video
      if (sessionData?.status === 'IN_PROGRESS') {
        navigate(`/patient/video-consultation/${appointmentId}`, { replace: true });
        return;
      }

      // Join the waiting room (REST)
      if (sessionData?.status !== 'COMPLETED' && sessionData?.status !== 'CANCELLED') {
        setJoining(true);
        try {
          const joinRes = await onlineSessionService.joinSession(appointmentId);
          setSession(joinRes.data?.data || joinRes.data || sessionData);
        } catch (joinErr) {
          console.warn('[WaitingRoom] Join session error:', joinErr.message);
        } finally {
          setJoining(false);
        }
      }

      // Join socket room for real-time events
      joinConsultationRoom(appointmentId);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not load session.');
    } finally {
      setLoading(false);
    }
  }, [appointmentId, navigate]);

  useEffect(() => {
    fetchAndJoin();
    return () => leaveConsultationRoom(appointmentId);
  }, [fetchAndJoin, appointmentId]);

  // Listen for session-started event from doctor
  useEffect(() => {
    const s = getSocket();
    if (!s) return;

    const onStarted = ({ appointmentId: id }) => {
      if (id === appointmentId) {
        navigate(`/patient/video-consultation/${appointmentId}`, { replace: true });
      }
    };
    const onParticipantJoined = ({ role }) => {
      if (role === 'DOCTOR') {
        setSession((prev) => prev ? { ...prev, status: 'DOCTOR_JOINED' } : prev);
      }
    };

    s.on('consultation:session-started', onStarted);
    s.on('consultation:participant-joined', onParticipantJoined);
    return () => {
      s.off('consultation:session-started', onStarted);
      s.off('consultation:participant-joined', onParticipantJoined);
    };
  }, [appointmentId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-violet-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-violet-400 animate-spin mx-auto mb-4" />
          <p className="text-white/70 text-sm">Connecting to session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-violet-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 p-8 max-w-sm w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Could not join session</h2>
          <p className="text-white/60 text-sm mb-6">{error}</p>
          <button
            onClick={fetchAndJoin}
            className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>
        </div>
      </div>
    );
  }

  const appt = session?.appointment;
  const status = session?.status || 'SCHEDULED';
  const doctorName = appt?.doctor?.user?.fullName;
  const doctorSpec = appt?.doctor?.specialization;
  const scheduledTime = appt?.scheduledTime;
  const scheduledDate = appt?.scheduledDate ? new Date(appt.scheduledDate).toLocaleDateString('en-US', { dateStyle: 'medium' }) : '';

  const doctorReady = ['DOCTOR_JOINED', 'IN_PROGRESS'].includes(status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-violet-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 p-8 text-center">

          {/* Animated ring */}
          <div className="relative w-28 h-28 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-violet-500/20 animate-ping" />
            <div className="absolute inset-2 rounded-full bg-violet-500/30" />
            <div className="relative w-28 h-28 rounded-full bg-violet-600/40 border border-violet-400/50 flex items-center justify-center">
              <Video className="w-10 h-10 text-violet-300" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white mb-1">Waiting Room</h1>
          <p className="text-white/50 text-sm mb-6">Your doctor will start the call shortly</p>

          {/* Session status */}
          <div className="bg-white/5 rounded-2xl p-4 mb-6 text-left space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <p className="text-white/50 text-xs">Appointment</p>
                <p className="text-white text-sm font-medium">{scheduledDate} at {scheduledTime}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                <Wifi className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <p className="text-white/50 text-xs">Doctor</p>
                <p className="text-white text-sm font-medium">Dr. {doctorName}</p>
                <p className="text-white/40 text-xs">{doctorSpec}</p>
              </div>
            </div>
          </div>

          {/* Status indicator */}
          <div className={`flex items-center gap-2 justify-center py-3 px-4 rounded-xl text-sm font-medium transition-all ${
            doctorReady ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-white/60'
          }`}>
            {doctorReady
              ? <><CheckCircle2 className="w-4 h-4" /> {STATUS_LABELS[status]}</>
              : <><Loader2 className="w-4 h-4 animate-spin" /> {STATUS_LABELS[status] || 'Waiting...'}</>
            }
          </div>

          {/* Tip */}
          <p className="text-white/30 text-xs mt-6">
            Make sure your camera and microphone are allowed in your browser settings.
          </p>
        </div>

        {/* Back link */}
        <button
          onClick={() => navigate('/patient/dashboard')}
          className="w-full text-center text-white/40 hover:text-white/70 text-sm mt-4 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
