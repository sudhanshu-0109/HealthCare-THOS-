/**
 * sockets/emergencyHandlers.js — Phase 13: Emergency dispatch socket handlers.
 *
 * Called from sockets/index.js within the io.on('connection', ...) handler.
 * Server emits to rooms; clients only join rooms and receive events.
 *
 * Room Authorization Rules:
 *   emergency:{requestId} — only joinable by:
 *     - The patient who created the request (patientId === socket.user.id)
 *     - The assigned driver (verified via DB after assignment)
 *     - HOSPITAL_ADMIN or RECEPTIONIST (hospital staff monitoring)
 *
 * Rooms:
 *   emergency:{requestId}   — patient + assigned driver + hospital staff
 *   driver:{userId}         — each driver's personal notification room
 */

import prisma from '../prisma/client.js';

/**
 * Register emergency socket handlers for a given connection.
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 * @param {{ id: string, role: string }} user — already-verified user from sockets/index.js
 */
export const registerEmergencyHandlers = (io, socket, user) => {
  // Auto-join driver's personal room on connection
  if (user.role === 'AMBULANCE_DRIVER') {
    socket.join(`driver:${user.id}`);
    console.info(`[Socket] Driver ${user.id} auto-joined driver room`);
  }

  /**
   * Join a specific emergency request room — with authorization check.
   * Payload: { requestId: string }
   */
  socket.on('join-emergency-room', async ({ requestId }) => {
    if (!requestId) return;

    // HOSPITAL_ADMIN and RECEPTIONIST may monitor any emergency in their hospital
    if (['HOSPITAL_ADMIN', 'RECEPTIONIST', 'SUPER_ADMIN'].includes(user.role)) {
      socket.join(`emergency:${requestId}`);
      socket.emit('emergency:joined', { requestId });
      console.info(`[Socket] Staff ${user.id} (${user.role}) joined emergency room ${requestId}`);
      return;
    }

    // For patients and drivers, verify ownership before joining
    try {
      const request = await prisma.emergencyRequest.findUnique({
        where: { id: requestId },
        select: {
          patientId: true,
          ambulance: { select: { driver: { select: { userId: true } } } },
        },
      });

      if (!request) {
        socket.emit('emergency:error', { code: 'NOT_FOUND', message: 'Emergency request not found.' });
        return;
      }

      const isPatient = request.patientId === user.id;
      const isAssignedDriver = request.ambulance?.driver?.userId === user.id;

      if (!isPatient && !isAssignedDriver) {
        console.warn(`[Socket] Unauthorized join-emergency-room attempt: user ${user.id} (${user.role}) for request ${requestId}`);
        socket.emit('emergency:error', { code: 'UNAUTHORIZED', message: 'Not authorized to join this emergency room.' });
        return;
      }

      socket.join(`emergency:${requestId}`);
      console.info(`[Socket] User ${user.id} (${user.role}) joined emergency room ${requestId}`);
      // Emit confirmation back to the joining socket so the client knows auth succeeded.
      // Also include last-known driver position for immediate refresh recovery.
      try {
        const latestReq = await prisma.emergencyRequest.findUnique({
          where: { id: requestId },
          select: { lastDriverLat: true, lastDriverLng: true, status: true },
        });
        socket.emit('emergency:joined', {
          requestId,
          lastDriverLat: latestReq?.lastDriverLat ?? null,
          lastDriverLng: latestReq?.lastDriverLng ?? null,
          status: latestReq?.status ?? null,
        });
      } catch {
        socket.emit('emergency:joined', { requestId });
      }
    } catch (err) {
      console.error(`[Socket] Error validating emergency room join for ${requestId}:`, err.message);
      socket.emit('emergency:error', { code: 'SERVER_ERROR', message: 'Could not join emergency room.' });
    }
  });

  socket.on('leave-emergency-room', ({ requestId }) => {
    if (!requestId) return;
    socket.leave(`emergency:${requestId}`);
  });
};
