/**
 * sockets/emergencyHandlers.js — Phase 13: Emergency dispatch socket handlers.
 *
 * Called from sockets/index.js within the io.on('connection', ...) handler.
 * Server emits to rooms; clients only join rooms and send their location.
 *
 * Rooms:
 *   emergency:{requestId}   — patient + any admin who cares about this request
 *   driver:{userId}         — each driver's personal notification room
 */

/**
 * Register emergency socket handlers for a given connection.
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 * @param {{ id: string, role: string }} user  — already-verified user from sockets/index.js
 */
export const registerEmergencyHandlers = (io, socket, user) => {
  // Auto-join driver's personal room on connection
  if (user.role === 'AMBULANCE_DRIVER') {
    socket.join(`driver:${user.id}`);
    console.info(`[Socket] Driver ${user.id} auto-joined driver room`);
  }

  // Patient (or admin) joins a specific emergency request room
  socket.on('join-emergency-room', ({ requestId }) => {
    if (!requestId) return;
    socket.join(`emergency:${requestId}`);
    console.info(`[Socket] User ${user.id} joined emergency room ${requestId}`);
  });

  socket.on('leave-emergency-room', ({ requestId }) => {
    if (!requestId) return;
    socket.leave(`emergency:${requestId}`);
  });
};
