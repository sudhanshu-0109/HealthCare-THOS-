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

/**
 * Get or create the singleton socket connection.
 * Uses the current JWT access token from authStore.
 */
export const getSocket = () => {
  const token = useAuthStore.getState().token;

  if (socket && socket.connected) return socket;

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

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket.id);
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
 * Disconnect and cleanup the socket.
 */
export const disconnectSocket = () => {
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
  if (s) s.emit('join-doctor-queue', { doctorId, date });
};

/**
 * Leave a doctor's queue room.
 */
export const leaveDoctorQueue = (doctorId, date) => {
  if (socket) socket.emit('leave-doctor-queue', { doctorId, date });
};

/**
 * Patient room is auto-joined on connection (server-side).
 * This helper just ensures a socket connection exists.
 */
export const joinPatientRoom = () => {
  getSocket();
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
