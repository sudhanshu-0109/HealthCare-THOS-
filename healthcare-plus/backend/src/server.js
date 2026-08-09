/**
 * server.js — HTTP server entry point.
 * Creates the HTTP server, attaches the Express app,
 * initializes Socket.IO, and starts listening.
 */

import http from 'http';
import app from './app.js';
import { env } from './config/env.js';
import { initializeSocket } from './sockets/index.js';

const server = http.createServer(app);

// Initialize Socket.IO (event handlers attached in Phase 6+)
initializeSocket(server);

// Start listening
server.listen(env.PORT, () => {
  console.log(`\n🚀 healthcare+ API running`);
  console.log(`   Port:        ${env.PORT}`);
  console.log(`   Environment: ${env.NODE_ENV}`);
  console.log(`   Health:      http://localhost:${env.PORT}/api/health\n`);
});

// ── Graceful shutdown ─────────────────────────────────────────────────────
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('[Server] HTTP server closed.');
    process.exit(0);
  });
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Server] Unhandled Rejection at:', promise, 'reason:', reason);
  // In production, you may want to exit and let the process manager restart
});

export default server;
