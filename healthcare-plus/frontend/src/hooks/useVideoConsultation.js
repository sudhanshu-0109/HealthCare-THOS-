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
 *
 * Bug fixes (v2):
 *  - Eliminated double addTrack: patient no longer calls startCall() before offer.
 *  - ICE candidates are queued if remoteDescription is not yet set; flushed after.
 *  - Doctor re-sends offer when patient joins after call has already started.
 *  - Socket effect deps are stable (role/appointmentId via refs) — no listener churn.
 *  - Remote video autoplay triggered programmatically; muted fallback on policy block.
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
  { urls: 'stun:stun2.l.google.com:19302' },
];

/**
 * @param {string} appointmentId
 * @param {{ role: 'DOCTOR' | 'PATIENT' }} options
 */
const useVideoConsultation = (appointmentId, { role } = {}) => {
  const localRef = useRef(null);   // <video> element for local stream
  const remoteRef = useRef(null);  // <video> element for remote stream

  const localStreamRef = useRef(null);
  const pcRef = useRef(null);              // RTCPeerConnection
  const iceCandidateQueueRef = useRef([]); // Queue ICE candidates until remoteDescription is set
  const tracksAddedRef = useRef(false);    // Guard: prevent double addTrack on same PC
  const offerInProgressRef = useRef(false); // Guard: prevent concurrent offer creation

  // Stable refs so socket callbacks never need role/appointmentId in dep array
  const roleRef = useRef(role);
  useEffect(() => { roleRef.current = role; }, [role]);
  const appointmentIdRef = useRef(appointmentId);
  useEffect(() => { appointmentIdRef.current = appointmentId; }, [appointmentId]);

  // Stable function refs — updated on every render so socket effect closures
  // always call the latest version without needing them in useEffect deps.
  const createPCRef = useRef(null);
  const addTracksToPCRef = useRef(null);
  const attachLocalStreamRef = useRef(null);
  const flushIceQueueRef = useRef(null);
  const endCallRef = useRef(null);

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [remoteJoined, setRemoteJoined] = useState(false);
  const [sessionStatus, setSessionStatus] = useState(null);

  // ── Play remote video, bypassing browser autoplay policy ─────────────────

  const playRemoteVideo = useCallback(() => {
    if (!remoteRef.current) return;
    remoteRef.current.play().catch((err) => {
      if (err.name === 'NotAllowedError') {
        // Autoplay blocked — mute and retry so at least video shows
        console.warn('[VideoConsultation] Autoplay blocked — muting remote video and retrying');
        remoteRef.current.muted = true;
        remoteRef.current.play().catch(() => {});
      }
    });
  }, []);

  // ── Flush queued ICE candidates once remoteDescription is available ───────

  const flushIceQueue = useCallback(async (pc) => {
    const queue = iceCandidateQueueRef.current;
    if (!queue.length) return;
    iceCandidateQueueRef.current = [];
    for (const candidate of queue) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn('[VideoConsultation] Queued ICE candidate error:', err.message);
      }
    }
  }, []);
  useEffect(() => { flushIceQueueRef.current = flushIceQueue; });

  // ── Create a fresh RTCPeerConnection (called per-negotiation) ─────────────

  const createPC = useCallback(() => {
    if (pcRef.current && pcRef.current.signalingState !== 'closed') {
      pcRef.current.close();
    }
    iceCandidateQueueRef.current = [];
    tracksAddedRef.current = false;
    offerInProgressRef.current = false;

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) sendIceCandidate(appointmentIdRef.current, candidate);
    };

    pc.ontrack = (event) => {
      console.log('[VideoConsultation] ontrack fired, streams:', event.streams.length);
      if (remoteRef.current && event.streams[0]) {
        remoteRef.current.srcObject = event.streams[0];
        playRemoteVideo();
      }
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      console.log('[VideoConsultation] connectionState:', state);
      setIsConnected(state === 'connected');
      setIsConnecting(state === 'connecting' || state === 'new');
      if (state === 'failed' || state === 'disconnected' || state === 'closed') {
        setIsConnected(false);
        setIsConnecting(false);
      }
    };

    return pc;
  }, [playRemoteVideo]);
  useEffect(() => { createPCRef.current = createPC; });

  // ── Capture local media (idempotent) ─────────────────────────────────────

  const attachLocalStream = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStreamRef.current = stream;
    if (localRef.current) {
      localRef.current.srcObject = stream;
    }
    return stream;
  }, []);
  useEffect(() => { attachLocalStreamRef.current = attachLocalStream; });

  // ── Add local tracks to PC, guarded to prevent double-add ────────────────

  const addTracksToPC = useCallback((pc, stream) => {
    if (tracksAddedRef.current) return;
    tracksAddedRef.current = true;
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    console.log('[VideoConsultation] Local tracks added to PeerConnection');
  }, []);
  useEffect(() => { addTracksToPCRef.current = addTracksToPC; });

  // ── startCall ─────────────────────────────────────────────────────────────
  // Doctor: captures media, creates PC, sends offer.
  // Patient: only captures media and waits — the offer arrives via socket.

  const startCall = useCallback(async () => {
    try {
      const stream = await attachLocalStream();

      if (roleRef.current === 'DOCTOR') {
        setIsConnecting(true);
        const pc = createPC();
        addTracksToPC(pc, stream);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sendOffer(appointmentIdRef.current, pc.localDescription);
        console.log('[VideoConsultation] Doctor sent initial offer');
      }
      // Patient: local stream captured; WebRTC negotiation begins on onOffer
    } catch (err) {
      console.error('[VideoConsultation] startCall error:', err);
      setIsConnecting(false);
    }
  }, [attachLocalStream, createPC, addTracksToPC]);

  // ── endCall — cleanup ─────────────────────────────────────────────────────

  const endCall = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    tracksAddedRef.current = false;
    iceCandidateQueueRef.current = [];
    offerInProgressRef.current = false;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (localRef.current) localRef.current.srcObject = null;
    if (remoteRef.current) remoteRef.current.srcObject = null;

    leaveConsultationRoom(appointmentIdRef.current);
    setIsConnected(false);
    setIsConnecting(false);
    setRemoteJoined(false);
  }, []);
  useEffect(() => { endCallRef.current = endCall; });

  // ── toggles ───────────────────────────────────────────────────────────────

  const toggleMute = useCallback(() => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
    setIsMuted((prev) => !prev);
  }, []);

  const toggleVideo = useCallback(() => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getVideoTracks().forEach((t) => { t.enabled = !t.enabled; });
    setIsCameraOff((prev) => !prev);
  }, []);

  // ── Socket event listeners ────────────────────────────────────────────────
  // Only depends on appointmentId. All other state accessed via stable refs,
  // preventing listener teardown/re-attach on every render.

  useEffect(() => {
    if (!appointmentId) return;

    joinConsultationRoom(appointmentId);
    const s = getSocket();
    if (!s) return;

    const onParticipantJoined = async ({ role: joinedRole }) => {
      if (joinedRole === roleRef.current) return; // ignore own join echo
      setRemoteJoined(true);
      console.log('[VideoConsultation] Remote participant joined:', joinedRole);

      // Doctor: if the call is already in progress (stream exists),
      // re-send offer so the late-joining patient can answer.
      // Guard against concurrent re-offers (e.g., participant-joined firing rapidly).
      if (roleRef.current === 'DOCTOR' && localStreamRef.current && !offerInProgressRef.current) {
        offerInProgressRef.current = true;
        try {
          const pc = createPCRef.current();
          addTracksToPCRef.current(pc, localStreamRef.current);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          sendOffer(appointmentId, pc.localDescription);
          setIsConnecting(true);
          console.log('[VideoConsultation] Doctor re-sent offer to late-joining patient');
        } catch (err) {
          console.error('[VideoConsultation] Re-offer error:', err);
        } finally {
          // Allow new offer after 3 seconds (renegotiation window)
          setTimeout(() => { offerInProgressRef.current = false; }, 3000);
        }
      }
    };

    const onParticipantLeft = ({ role: leftRole }) => {
      if (leftRole !== roleRef.current) {
        setRemoteJoined(false);
        setIsConnected(false);
        console.log('[VideoConsultation] Remote participant left:', leftRole);
      }
    };

    // Patient receives offer from Doctor
    const onOffer = async ({ sdp }) => {
      if (roleRef.current !== 'PATIENT') return;
      console.log('[VideoConsultation] Patient received offer');
      try {
        const stream = await attachLocalStreamRef.current();
        const pc = createPCRef.current(); // fresh PC per negotiation round
        addTracksToPCRef.current(pc, stream);

        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        await flushIceQueueRef.current(pc); // apply any early-arriving ICE candidates

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sendAnswer(appointmentId, pc.localDescription);
        setIsConnecting(true);
        console.log('[VideoConsultation] Patient sent answer');
      } catch (err) {
        console.error('[VideoConsultation] onOffer error:', err);
      }
    };

    // Doctor receives answer from Patient
    const onAnswer = async ({ sdp }) => {
      if (roleRef.current !== 'DOCTOR') return;
      console.log('[VideoConsultation] Doctor received answer');
      try {
        const pc = pcRef.current;
        if (!pc) return;
        if (pc.signalingState === 'have-local-offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(sdp));
          await flushIceQueueRef.current(pc);
          console.log('[VideoConsultation] Doctor set remote description');
        }
      } catch (err) {
        console.error('[VideoConsultation] onAnswer error:', err);
      }
    };

    const onIceCandidate = async ({ candidate }) => {
      if (!candidate) return;
      const pc = pcRef.current;
      if (!pc || pc.signalingState === 'closed') return;

      if (pc.remoteDescription) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn('[VideoConsultation] ICE candidate error:', err.message);
        }
      } else {
        // Queue candidates that arrive before remote SDP is set
        iceCandidateQueueRef.current.push(candidate);
        console.log('[VideoConsultation] ICE candidate queued (no remoteDescription yet)');
      }
    };

    const onSessionStarted = () => setSessionStatus('IN_PROGRESS');
    const onSessionEnded = () => {
      setSessionStatus('COMPLETED');
      endCallRef.current();
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
    // Intentionally minimal deps — all other state accessed via stable refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId]);

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
