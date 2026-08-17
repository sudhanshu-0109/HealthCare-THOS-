/**
 * services/socket.js — Singleton Socket.IO client with JWT auth.
 * Phase 6: Real queue event subscriptions.
 *
 * Usage:
 *   import { getSocket, joinDoctorQueue, joinPatientRoom } from './socket';
 *   joinDoctorQueue(doctorId, date);
 *   getSocket().on('queue:updated', handler);
 */

import { io } from 'socket.io-client';
import useAuthStore from '../store/authStore';

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

let socket = null;

// Track room-join intents so they can be re-emitted after a reconnect. Socket.IO
// rooms live only for the duration of a connection; when the socket drops and
// reconnects it lands in a fresh server-side session with no rooms, so without
// this the client silently stops receiving room events. (R17)
const joinIntents = new Map(); // key -> { event, payload }

const rejoinAll = () => {
  if (!socket) return;
  for (const { event, payload } of joinIntents.values()) {
    socket.emit(event, payload);
  }
};

/**
 * Get or create the singleton socket connection.
 * Uses the current JWT access token from authStore.
 */
export const getSocket = () => {
  const token = useAuthStore.getState().token;

  // Reuse a live OR actively-reconnecting socket. Tearing down a socket that is
  // mid-reconnect would drop all registered listeners; instead refresh its auth
  // token so subsequent reconnect attempts use the latest access token.
  if (socket && (socket.connected || socket.active)) {
    if (token) socket.auth = { token };
    return socket;
  }

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  if (!token) {
    console.warn('[Socket] No auth token available. Socket not connected.');
    return null;
  }

  socket = io(BACKEND_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  // Fires on the initial connection AND on every successful reconnection —
  // re-emit tracked room joins so the client resumes receiving room events.
  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket.id);
    rejoinAll();
  });

  socket.on('connect_error', (err) => {
    console.error('[Socket] Connection error:', err.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  return socket;
};

/**
 * Disconnect and cleanup the socket. Clears room-join intents (full logout).
 */
export const disconnectSocket = () => {
  joinIntents.clear();
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Join a doctor's daily queue room.
 */
export const joinDoctorQueue = (doctorId, date) => {
  const s = getSocket();
  joinIntents.set(`doctor:${doctorId}:${date}`, { event: 'join-doctor-queue', payload: { doctorId, date } });
  if (s) s.emit('join-doctor-queue', { doctorId, date });
};

/**
 * Leave a doctor's queue room.
 */
export const leaveDoctorQueue = (doctorId, date) => {
  joinIntents.delete(`doctor:${doctorId}:${date}`);
  if (socket) socket.emit('leave-doctor-queue', { doctorId, date });
};

/**
 * Join the hospital-wide queue monitoring room (admin Queue Monitor).
 */
export const joinHospitalQueue = (hospitalId) => {
  const s = getSocket();
  if (!hospitalId) return;
  joinIntents.set(`hospital:${hospitalId}:queue`, { event: 'join-hospital-queue', payload: { hospitalId } });
  if (s) s.emit('join-hospital-queue', { hospitalId });
};

/**
 * Stop tracking the hospital queue room (server auto-cleans rooms on disconnect;
 * there is no explicit leave handler for this room).
 */
export const leaveHospitalQueue = (hospitalId) => {
  joinIntents.delete(`hospital:${hospitalId}:queue`);
};

/**
 * Patient room is auto-joined on connection (server-side).
 * This helper just ensures a socket connection exists.
 */
export const joinPatientRoom = () => {
  getSocket();
};

/**
 * Join an emergency tracking room. The server emits emergency:accepted /
 * emergency:location-update / emergency:status-update into `emergency:{requestId}`.
 * The join is tracked and re-emitted automatically on reconnect.
 */
export const joinEmergencyRoom = (requestId) => {
  const s = getSocket();
  if (!requestId) return;
  joinIntents.set(`emergency:${requestId}`, { event: 'join-emergency-room', payload: { requestId } });
  if (s) s.emit('join-emergency-room', { requestId });
};

/**
 * Leave an emergency tracking room.
 */
export const leaveEmergencyRoom = (requestId) => {
  joinIntents.delete(`emergency:${requestId}`);
  if (socket && requestId) socket.emit('leave-emergency-room', { requestId });
};

/**
 * Subscribe to a socket event. Returns an unsubscribe function.
 */
export const onSocketEvent = (event, handler) => {
  const s = getSocket();
  if (!s) return () => {};
  s.on(event, handler);
  return () => s.off(event, handler);
};

// ─── Phase 16: Online Consultation Signaling ────────────────────────────────

/**
 * Join the WebRTC signaling room for an online consultation.
 * The room is tracked and re-joined automatically on reconnect.
 */
export const joinConsultationRoom = (appointmentId) => {
  const s = getSocket();
  if (!appointmentId) return;
  const key = `consultation:${appointmentId}`;
  joinIntents.set(key, { event: 'consultation:join', payload: { appointmentId } });
  if (s) s.emit('consultation:join', { appointmentId });
};

/**
 * Leave the WebRTC signaling room.
 */
export const leaveConsultationRoom = (appointmentId) => {
  joinIntents.delete(`consultation:${appointmentId}`);
  if (socket && appointmentId) socket.emit('consultation:leave', { appointmentId });
};

/**
 * Send a WebRTC SDP offer to the other participant.
 */
export const sendOffer = (appointmentId, sdp) => {
  if (socket) socket.emit('consultation:offer', { appointmentId, sdp });
};

/**
 * Send a WebRTC SDP answer to the other participant.
 */
export const sendAnswer = (appointmentId, sdp) => {
  if (socket) socket.emit('consultation:answer', { appointmentId, sdp });
};

/**
 * Send an ICE candidate to the other participant.
 */
export const sendIceCandidate = (appointmentId, candidate) => {
  if (socket) socket.emit('consultation:ice-candidate', { appointmentId, candidate });
};
