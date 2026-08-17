/**
 * sockets/consultationHandlers.js — WebRTC signaling relay for online consultations (Phase 16).
 *
 * Room strategy: consultation:{appointmentId}
 *  - Patient and doctor both join this room.
 *  - The server relays ICE candidates and SDP offers/answers between them.
 *  - The server also broadcasts session lifecycle events (joined, started, ended).
 *
 * Architecture rule preserved: NO state mutations here.
 *   All actual state updates go through REST endpoints.
 *   Sockets only relay signaling payloads + echo server-driven status events.
 *
 * Events the CLIENT emits to server:
 *   consultation:join          { appointmentId }
 *   consultation:leave         { appointmentId }
 *   consultation:offer         { appointmentId, sdp }        — patient → doctor
 *   consultation:answer        { appointmentId, sdp }        — doctor  → patient
 *   consultation:ice-candidate { appointmentId, candidate }  — either direction
 *
 * Events the SERVER emits to consultation room:
 *   consultation:participant-joined { appointmentId, role }
 *   consultation:participant-left   { appointmentId, role, socketId }
 *   consultation:offer              { appointmentId, sdp, fromRole }
 *   consultation:answer             { appointmentId, sdp, fromRole }
 *   consultation:ice-candidate      { appointmentId, candidate, fromRole }
 *   consultation:session-started    { appointmentId }
 *   consultation:session-ended      { appointmentId, reason }
 */

import prisma from '../prisma/client.js';

export const registerConsultationHandlers = (io, socket, user) => {
  /**
   * Validate that the socket user is a participant in this appointment.
   * Returns 'PATIENT' | 'DOCTOR' | null.
   */
  const resolveRole = async (appointmentId) => {
    if (!appointmentId) return null;
    try {
      const appt = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        select: {
          patientId: true,
          consultationType: true,
          doctor: { select: { user: { select: { id: true } } } },
        },
      });
      if (!appt || appt.consultationType !== 'ONLINE') return null;
      if (appt.patientId === user.id) return 'PATIENT';
      if (appt.doctor?.user?.id === user.id) return 'DOCTOR';
      return null;
    } catch {
      return null;
    }
  };

  // ── Join / Leave ────────────────────────────────────────────────────────────

  socket.on('consultation:join', async ({ appointmentId } = {}) => {
    const role = await resolveRole(appointmentId);
    if (!role) return; // silently ignore — unauthorized or wrong type

    const room = `consultation:${appointmentId}`;
    socket.join(room);

    // Tell everyone in the room someone joined
    io.to(room).emit('consultation:participant-joined', { appointmentId, role });

    console.log(`[Socket.IO] ${role} joined consultation room: ${room}`);
  });

  socket.on('consultation:leave', async ({ appointmentId } = {}) => {
    const role = await resolveRole(appointmentId);
    const room = `consultation:${appointmentId}`;
    socket.leave(room);

    io.to(room).emit('consultation:participant-left', {
      appointmentId,
      role: role ?? 'UNKNOWN',
      socketId: socket.id,
    });
  });

  // ── WebRTC Signaling Relay ──────────────────────────────────────────────────

  socket.on('consultation:offer', async ({ appointmentId, sdp } = {}) => {
    const role = await resolveRole(appointmentId);
    if (!role) return;

    const room = `consultation:${appointmentId}`;
    // Relay to the OTHER participant only (not back to sender)
    socket.to(room).emit('consultation:offer', { appointmentId, sdp, fromRole: role });
  });

  socket.on('consultation:answer', async ({ appointmentId, sdp } = {}) => {
    const role = await resolveRole(appointmentId);
    if (!role) return;

    const room = `consultation:${appointmentId}`;
    socket.to(room).emit('consultation:answer', { appointmentId, sdp, fromRole: role });
  });

  socket.on('consultation:ice-candidate', async ({ appointmentId, candidate } = {}) => {
    const role = await resolveRole(appointmentId);
    if (!role) return;

    const room = `consultation:${appointmentId}`;
    socket.to(room).emit('consultation:ice-candidate', {
      appointmentId,
      candidate,
      fromRole: role,
    });
  });
};

/**
 * Utility: emit session-started event from REST layer after DB update.
 * Called by onlineSession.service.js#startSession.
 */
export const emitSessionStarted = (io, appointmentId) => {
  if (!io) return;
  io.to(`consultation:${appointmentId}`).emit('consultation:session-started', { appointmentId });
};

/**
 * Utility: emit session-ended event from REST layer after DB update.
 * Called by onlineSession.service.js#endSession.
 */
export const emitSessionEnded = (io, appointmentId, reason) => {
  if (!io) return;
  io.to(`consultation:${appointmentId}`).emit('consultation:session-ended', {
    appointmentId,
    reason: reason ?? null,
  });
};
