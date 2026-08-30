/**
 * pages/patient/VideoConsultation.jsx — Patient-side video call screen (Phase 16).
 *
 * Joined once the doctor calls startSession via REST → socket fires consultation:session-started.
 * The patient view is receive-only for offer/answer (answers to doctor's offer).
 * Controls: mute, camera toggle, end call (leaves session; doctor ends it officially).
 */

import { useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, Wifi, Loader2,
} from 'lucide-react';
import useVideoConsultation from '../../hooks/useVideoConsultation';
import * as onlineSessionService from '../../services/onlineSession.service';
import { getSocket } from '../../services/socket';

export default function VideoConsultation() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();

  const {
    localRef,
    remoteRef,
    isConnected,
    isConnecting,
    isMuted,
    isCameraOff,
    remoteJoined,
    sessionStatus,
    startCall,
    endCall,
    toggleMute,
    toggleVideo,
  } = useVideoConsultation(appointmentId, { role: 'PATIENT' });

  // Start capturing local stream as soon as we land here
  useEffect(() => {
    startCall();
  }, [startCall]);

  // When doctor ends session, go back to dashboard
  useEffect(() => {
    const s = getSocket();
    if (!s) return;
    const onEnded = ({ appointmentId: id }) => {
      if (id !== appointmentId) return;
      endCall();
      navigate('/patient/dashboard', { replace: true });
    };
    s.on('consultation:session-ended', onEnded);
    return () => s.off('consultation:session-ended', onEnded);
  }, [appointmentId, endCall, navigate]);

  const handleLeave = useCallback(async () => {
    endCall();
    navigate('/patient/dashboard', { replace: true });
  }, [endCall, navigate]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/80 backdrop-blur border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : isConnecting ? 'bg-amber-400 animate-pulse' : 'bg-red-400'}`} />
          <span className="text-white/60 text-sm">
            {isConnected ? 'Connected' : isConnecting ? 'Connecting…' : 'Disconnected'}
          </span>
        </div>
        <div className="flex items-center gap-1 text-white/40 text-xs">
          <Wifi className="w-3 h-3" />
          Online Consultation
        </div>
      </div>

      {/* Video area */}
      <div className="flex-1 relative bg-slate-950">
        {/* Remote video (doctor) */}
        <video
          ref={remoteRef}
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Overlay when doctor hasn't joined yet */}
        {!remoteJoined && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
            <div className="text-center">
              <Loader2 className="w-10 h-10 text-violet-400 animate-spin mx-auto mb-3" />
              <p className="text-white/70 text-sm">Waiting for doctor to join…</p>
            </div>
          </div>
        )}

        {/* Local video (picture-in-picture) */}
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
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 py-5 bg-slate-900/80 backdrop-blur border-t border-white/10">
        <button
          onClick={toggleMute}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
            isMuted ? 'bg-red-500/20 border border-red-500/50' : 'bg-white/10 border border-white/20 hover:bg-white/20'
          }`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOff className="w-5 h-5 text-red-400" /> : <Mic className="w-5 h-5 text-white" />}
        </button>

        <button
          onClick={toggleVideo}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
            isCameraOff ? 'bg-red-500/20 border border-red-500/50' : 'bg-white/10 border border-white/20 hover:bg-white/20'
          }`}
          title={isCameraOff ? 'Start Camera' : 'Stop Camera'}
        >
          {isCameraOff ? <VideoOff className="w-5 h-5 text-red-400" /> : <Video className="w-5 h-5 text-white" />}
        </button>

        <button
          onClick={handleLeave}
          className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center transition-all shadow-lg shadow-red-900/50"
          title="Leave Call"
        >
          <PhoneOff className="w-6 h-6 text-white" />
        </button>
      </div>
    </div>
  );
}
