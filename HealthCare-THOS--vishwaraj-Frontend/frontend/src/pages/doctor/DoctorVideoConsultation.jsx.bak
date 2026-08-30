/**
 * pages/doctor/DoctorVideoConsultation.jsx — Doctor-side video call screen (Phase 16).
 *
 * The doctor:
 *  1. Calls POST /online-sessions/:appointmentId/start (REST) → creates Consultation record
 *     → server emits consultation:session-started → patient navigates to VideoConsultation.
 *  2. Sends WebRTC offer via socket signaling.
 *  3. Can end the call via POST /online-sessions/:appointmentId/end.
 *  4. After ending, redirected to ConsultationScreen to complete clinical notes.
 */

import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, UserCheck,
  Loader2, AlertCircle, ClipboardList,
} from 'lucide-react';
import useVideoConsultation from '../../hooks/useVideoConsultation';
import * as onlineSessionService from '../../services/onlineSession.service';
import { getSocket } from '../../services/socket';

export default function DoctorVideoConsultation() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [starting, setStarting] = useState(false);
  const [ending, setEnding] = useState(false);
  const [callStarted, setCallStarted] = useState(false);
  const [error, setError] = useState(null);

  const {
    localRef,
    remoteRef,
    isConnected,
    isConnecting,
    isMuted,
    isCameraOff,
    remoteJoined,
    startCall,
    endCall,
    toggleMute,
    toggleVideo,
  } = useVideoConsultation(appointmentId, { role: 'DOCTOR' });

  // Load session details
  useEffect(() => {
    onlineSessionService.getSession(appointmentId)
      .then((res) => setSession(res.data?.data || res.data))
      .catch((err) => setError(err.response?.data?.message || err.message));
  }, [appointmentId]);

  // Listen for session-ended (e.g. if ended from another tab)
  useEffect(() => {
    const s = getSocket();
    if (!s) return;
    const onEnded = ({ appointmentId: id }) => {
      if (id !== appointmentId) return;
      endCall();
      // Navigate to consultation clinical screen
      navigate(`/doctor/consultation/${appointmentId}`, { replace: true });
    };
    s.on('consultation:session-ended', onEnded);
    return () => s.off('consultation:session-ended', onEnded);
  }, [appointmentId, endCall, navigate]);

  const handleStartCall = useCallback(async () => {
    setStarting(true);
    setError(null);
    try {
      // 1. Tell server to start session (creates Consultation record + emits started event)
      const res = await onlineSessionService.startSession(appointmentId);
      setSession(res.data?.data || res.data);
      setCallStarted(true);
      // 2. Start capturing local media + create WebRTC offer
      await startCall();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not start call.');
    } finally {
      setStarting(false);
    }
  }, [appointmentId, startCall]);

  const handleEndCall = useCallback(async () => {
    setEnding(true);
    try {
      await onlineSessionService.endSession(appointmentId, 'Doctor ended the session');
      endCall();
      // Go to clinical consultation screen
      navigate(`/doctor/consultation/${appointmentId}`, { replace: true });
    } catch (err) {
      console.error('[DoctorVideoConsultation] endSession error:', err.message);
      endCall();
      navigate(`/doctor/consultation/${appointmentId}`, { replace: true });
    } finally {
      setEnding(false);
    }
  }, [appointmentId, endCall, navigate]);

  const appt = session?.appointment;
  const patientName = appt?.patient?.fullName || 'Patient';

  if (error && !session) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 rounded-3xl border border-white/10 p-8 max-w-sm w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Session Error</h2>
          <p className="text-white/60 text-sm">{error}</p>
          <button onClick={() => navigate(-1)} className="mt-6 w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold transition-colors">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/80 backdrop-blur border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : isConnecting ? 'bg-amber-400 animate-pulse' : 'bg-white/20'}`} />
          <span className="text-white/60 text-sm">
            {callStarted ? (isConnected ? 'Connected' : 'Connecting…') : 'Ready to start'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-white/50 text-xs">
          <UserCheck className="w-3.5 h-3.5" />
          {patientName}
        </div>
      </div>

      {/* Video area */}
      <div className="flex-1 relative bg-slate-950">
        {/* Remote video (patient) */}
        <video
          ref={remoteRef}
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Pre-call overlay */}
        {!callStarted && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm">
            <div className="text-center max-w-xs">
              <div className="w-20 h-20 rounded-full bg-violet-500/20 border border-violet-400/30 flex items-center justify-center mx-auto mb-4">
                <Video className="w-8 h-8 text-violet-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Start Consultation</h2>
              <p className="text-white/50 text-sm mb-6">
                Patient <span className="text-white font-medium">{patientName}</span> is waiting
              </p>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleStartCall}
                disabled={starting}
                className="w-full py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
              >
                {starting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
                {starting ? 'Starting...' : 'Start Video Call'}
              </button>
            </div>
          </div>
        )}

        {/* Patient not yet joined */}
        {callStarted && !remoteJoined && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-violet-400 animate-spin mx-auto mb-2" />
              <p className="text-white/60 text-sm">Waiting for patient to connect…</p>
            </div>
          </div>
        )}

        {/* Local PiP */}
        {callStarted && (
          <div className="absolute bottom-4 right-4 w-28 h-20 rounded-xl overflow-hidden border border-white/20 shadow-xl bg-slate-800">
            <video
              ref={localRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {isCameraOff && (
              <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
                <VideoOff className="w-5 h-5 text-white/40" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      {callStarted && (
        <div className="flex items-center justify-center gap-4 py-5 bg-slate-900/80 backdrop-blur border-t border-white/10">
          <button
            onClick={toggleMute}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              isMuted ? 'bg-red-500/20 border border-red-500/50' : 'bg-white/10 border border-white/20 hover:bg-white/20'
            }`}
          >
            {isMuted ? <MicOff className="w-5 h-5 text-red-400" /> : <Mic className="w-5 h-5 text-white" />}
          </button>

          <button
            onClick={toggleVideo}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              isCameraOff ? 'bg-red-500/20 border border-red-500/50' : 'bg-white/10 border border-white/20 hover:bg-white/20'
            }`}
          >
            {isCameraOff ? <VideoOff className="w-5 h-5 text-red-400" /> : <Video className="w-5 h-5 text-white" />}
          </button>

          <button
            onClick={handleEndCall}
            disabled={ending}
            className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 disabled:opacity-50 flex items-center justify-center transition-all shadow-lg shadow-red-900/50"
            title="End Call & Go to Notes"
          >
            {ending ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <PhoneOff className="w-6 h-6 text-white" />}
          </button>

          <button
            onClick={() => navigate(`/doctor/consultation/${appointmentId}`)}
            className="w-14 h-14 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 flex items-center justify-center transition-all"
            title="Open Clinical Notes"
          >
            <ClipboardList className="w-5 h-5 text-white" />
          </button>
        </div>
      )}
    </div>
  );
}
