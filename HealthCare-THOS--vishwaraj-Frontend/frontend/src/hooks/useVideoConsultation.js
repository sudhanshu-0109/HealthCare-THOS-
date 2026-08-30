/**
 * hooks/useVideoConsultation.js — WebRTC video call hook for online consultations (Phase 16).
 *
 * Handles:
 *  - Local media stream capture
 *  - RTCPeerConnection lifecycle (offer / answer / ICE candidates)
 *  - Socket-based signaling via socket.js helpers
 *  - Session status tracking from server events
 *
 * Usage (patient or doctor):
 *   const {
 *     localRef, remoteRef, isConnected, isConnecting,
 *     startCall, endCall, toggleMute, toggleVideo,
 *     isMuted, isCameraOff,
 *   } = useVideoConsultation(appointmentId, { role: 'DOCTOR' | 'PATIENT' });
 *
 * The hook does NOT call the REST API — callers are responsible for
 * calling joinSession() / startSession() / endSession() at appropriate times.
 * That separation ensures the DB state and the WebRTC state are kept independent.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import {
  getSocket,
  joinConsultationRoom,
  leaveConsultationRoom,
  sendOffer,
  sendAnswer,
  sendIceCandidate,
} from '../services/socket';

// STUN servers — use Google's public ones in dev; replace with TURN for prod
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

/**
 * @param {string} appointmentId
 * @param {{ role: 'DOCTOR' | 'PATIENT' }} options
 */
const useVideoConsultation = (appointmentId, { role } = {}) => {
  const localRef = useRef(null);   // <video> element for local stream
  const remoteRef = useRef(null);  // <video> element for remote stream

  const localStreamRef = useRef(null);
  const pcRef = useRef(null);      // RTCPeerConnection

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [remoteJoined, setRemoteJoined] = useState(false);
  const [sessionStatus, setSessionStatus] = useState(null);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const getOrCreatePC = useCallback(() => {
    if (pcRef.current && pcRef.current.signalingState !== 'closed') {
      return pcRef.current;
    }

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) sendIceCandidate(appointmentId, candidate);
    };

    pc.ontrack = (event) => {
      if (remoteRef.current && event.streams[0]) {
        remoteRef.current.srcObject = event.streams[0];
      }
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      setIsConnected(state === 'connected');
      setIsConnecting(state === 'connecting' || state === 'new');
      if (state === 'failed' || state === 'disconnected' || state === 'closed') {
        setIsConnected(false);
        setIsConnecting(false);
      }
    };

    return pc;
  }, [appointmentId]);

  const attachLocalStream = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;

    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStreamRef.current = stream;

    if (localRef.current) {
      localRef.current.srcObject = stream;
    }

    return stream;
  }, []);

  // ── startCall — called by DOCTOR when session moves to IN_PROGRESS ───────────

  const startCall = useCallback(async () => {
    setIsConnecting(true);
    try {
      const stream = await attachLocalStream();
      const pc = getOrCreatePC();

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // Doctor creates and sends the offer
      if (role === 'DOCTOR') {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sendOffer(appointmentId, pc.localDescription);
      }
    } catch (err) {
      console.error('[VideoConsultation] startCall error:', err);
      setIsConnecting(false);
    }
  }, [appointmentId, role, attachLocalStream, getOrCreatePC]);

  // ── endCall — cleanup ─────────────────────────────────────────────────────────

  const endCall = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (localRef.current) localRef.current.srcObject = null;
    if (remoteRef.current) remoteRef.current.srcObject = null;

    leaveConsultationRoom(appointmentId);
    setIsConnected(false);
    setIsConnecting(false);
  }, [appointmentId]);

  // ── toggles ───────────────────────────────────────────────────────────────────

  const toggleMute = useCallback(() => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setIsMuted((prev) => !prev);
  }, []);

  const toggleVideo = useCallback(() => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getVideoTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setIsCameraOff((prev) => !prev);
  }, []);

  // ── Socket event listeners ────────────────────────────────────────────────────

  useEffect(() => {
    if (!appointmentId) return;

    joinConsultationRoom(appointmentId);
    const s = getSocket();
    if (!s) return;

    const onParticipantJoined = ({ role: joinedRole }) => {
      if (joinedRole !== role) setRemoteJoined(true);
    };

    const onParticipantLeft = ({ role: leftRole }) => {
      if (leftRole !== role) {
        setRemoteJoined(false);
        setIsConnected(false);
      }
    };

    const onOffer = async ({ sdp }) => {
      // Patient receives offer from Doctor
      if (role !== 'PATIENT') return;
      try {
        const stream = await attachLocalStream();
        const pc = getOrCreatePC();
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sendAnswer(appointmentId, pc.localDescription);
        setIsConnecting(true);
      } catch (err) {
        console.error('[VideoConsultation] onOffer error:', err);
      }
    };

    const onAnswer = async ({ sdp }) => {
      // Doctor receives answer from Patient
      if (role !== 'DOCTOR') return;
      try {
        const pc = getOrCreatePC();
        if (pc.signalingState === 'have-local-offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        }
      } catch (err) {
        console.error('[VideoConsultation] onAnswer error:', err);
      }
    };

    const onIceCandidate = async ({ candidate }) => {
      try {
        const pc = getOrCreatePC();
        if (candidate && pc.remoteDescription) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (err) {
        console.warn('[VideoConsultation] ICE candidate error:', err.message);
      }
    };

    const onSessionStarted = () => setSessionStatus('IN_PROGRESS');
    const onSessionEnded = () => {
      setSessionStatus('COMPLETED');
      endCall();
    };

    s.on('consultation:participant-joined', onParticipantJoined);
    s.on('consultation:participant-left', onParticipantLeft);
    s.on('consultation:offer', onOffer);
    s.on('consultation:answer', onAnswer);
    s.on('consultation:ice-candidate', onIceCandidate);
    s.on('consultation:session-started', onSessionStarted);
    s.on('consultation:session-ended', onSessionEnded);

    return () => {
      s.off('consultation:participant-joined', onParticipantJoined);
      s.off('consultation:participant-left', onParticipantLeft);
      s.off('consultation:offer', onOffer);
      s.off('consultation:answer', onAnswer);
      s.off('consultation:ice-candidate', onIceCandidate);
      s.off('consultation:session-started', onSessionStarted);
      s.off('consultation:session-ended', onSessionEnded);
      leaveConsultationRoom(appointmentId);
    };
  }, [appointmentId, role, attachLocalStream, getOrCreatePC, endCall]);

  return {
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
  };
};

export default useVideoConsultation;
