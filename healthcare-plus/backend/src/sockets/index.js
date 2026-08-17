/**
 * sockets/index.js — Socket.IO server with JWT authentication and room management.
 *
 * Phase 6: Real queue event wiring.
 * Phase 13: Emergency dispatch rooms.
 * Architecture rule: NO client-emitted state mutations.
 * Clients call REST endpoints → server updates DB → server emits events.
 *
 * Rooms:
 *   doctor:{doctorId}:{date}      — doctor's daily queue view
 *   patient:{patientId}           — patient's personal updates (legacy room)
 *   user:{userId}                 — personal notification room (Phase 15, all roles)
 *   hospital:{hospitalId}:queue   — hospital-wide monitoring (Phase 14)
 *   emergency:{requestId}         — patient emergency tracking room
 *   driver:{userId}               — ambulance driver personal room (auto-joined)
 *   consultation:{appointmentId}  — WebRTC signaling room (Phase 16)
 *
 * Events emitted by server:
 *   queue:updated             → doctor room + individual patient rooms
 *   queue:token-called        → specific patient room
 *   emergency:new-request     → driver:{userId} room
 *   emergency:accepted        → emergency:{requestId} room
 *   emergency:location-update → emergency:{requestId} room
 *   emergency:status-update   → emergency:{requestId} room
 */

import { Server } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt.js';
import { env } from '../config/env.js';
import { registerEmergencyHandlers } from './emergencyHandlers.js';
import { setIo as setDispatchIo } from '../services/emergencyDispatch.service.js';
import { registerConsultationHandlers } from './consultationHandlers.js';

let io = null;

/**
 * Get the singleton Socket.IO instance.
 * @returns {import('socket.io').Server|null}
 */
export const getIO = () => io;

/**
 * Initialize Socket.IO server with JWT authentication middleware.
 * @param {import('http').Server} httpServer
 * @returns {import('socket.io').Server}
 */
export const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        // Allow any localhost port in dev, or configured CLIENT_URL in prod
        if (!origin || /^https?:\/\/localhost:\d+$/.test(origin) || origin === env.CLIENT_URL) {
          callback(null, true);
        } else {
          callback(new Error('Socket.IO CORS: origin not allowed'));
        }
      },
      credentials: true,
    },
  });

  // Inject io into dispatch service immediately after creation
  setDispatchIo(io);

  // ── JWT Authentication Middleware ──────────────────────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication required: no token provided'));
    }

    try {
      const decoded = verifyAccessToken(token);
      socket.user = {
        id: decoded.sub,
        role: decoded.role,
      };
      next();
    } catch (err) {
      next(new Error('Authentication failed: invalid or expired token'));
    }
  });

  // ── Connection Handler ─────────────────────────────────────────────────────
  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Authenticated connection: ${socket.id} (user: ${socket.user?.id}, role: ${socket.user?.role})`);

    // All authenticated users join their personal notification room (Phase 15)
    if (socket.user?.id) {
      socket.join(`user:${socket.user.id}`);
    }

    // Client joins its own patient room automatically (legacy — keep for queue events)
    if (socket.user?.role === 'PATIENT') {
      socket.join(`patient:${socket.user.id}`);
    }

    /**
     * Join a doctor's daily queue room (doctor or admin).
     * Payload: { doctorId: string, date: string (YYYY-MM-DD) }
     */
    socket.on('join-doctor-queue', ({ doctorId, date }) => {
      if (!doctorId || !date) return;
      const room = `doctor:${doctorId}:${date}`;
      socket.join(room);
      console.log(`[Socket.IO] ${socket.id} joined room: ${room}`);
    });

    /**
     * Leave a doctor queue room.
     */
    socket.on('leave-doctor-queue', ({ doctorId, date }) => {
      if (!doctorId || !date) return;
      const room = `doctor:${doctorId}:${date}`;
      socket.leave(room);
    });

    /**
     * Join hospital-wide queue monitoring room (admin).
     */
    socket.on('join-hospital-queue', ({ hospitalId }) => {
      if (!hospitalId) return;
      const room = `hospital:${hospitalId}:queue`;
      socket.join(room);
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket.IO] Disconnected: ${socket.id} (${reason})`);
    });

    // Phase 13: Emergency dispatch handlers
    registerEmergencyHandlers(io, socket, socket.user);
    // Phase 16: Online consultation signaling handlers
    registerConsultationHandlers(io, socket, socket.user);
  });

  console.log('[Socket.IO] Server initialized with JWT auth');
  return io;
};
