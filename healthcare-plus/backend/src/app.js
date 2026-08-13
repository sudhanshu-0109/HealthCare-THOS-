/**
 * app.js — Express application configuration.
 * Sets up middleware stack and mounts all routes.
 * Does NOT start the server (that's server.js).
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import { corsConfig } from './config/cors.js';
import { env } from './config/env.js';
import apiRouter from './routes/index.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// ── Security headers ──────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────────────────
app.use(cors(corsConfig));

// ── Body & Cookie parsing ──────────────────────────────────────────────────
// The app has no file uploads — every payload is small JSON (form fields, URLs).
// A 1mb cap is generous for that while limiting request-body DoS surface.
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// ── Static Files ───────────────────────────────────────────────────────────
app.use('/uploads', express.static('uploads'));

// ── HTTP request logging (development only) ───────────────────────────────
if (env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ── Demo Mode Middleware ──────────────────────────────────────────────────
import { checkAndRollDemoAppointments } from './services/demo.service.js';
app.use(async (req, res, next) => {
  if (env.DEMO_MODE) {
    // Run it asynchronously in the background so it doesn't block the request immediately
    // or await it if we want strong consistency. 
    // Given the simplicity, awaiting it is fine, but it might slow down the very first request of the day.
    checkAndRollDemoAppointments().catch(err => console.error('[DEMO MODE] Error:', err));
  }
  next();
});

// ── API routes ────────────────────────────────────────────────────────────
app.use('/api', apiRouter);

// ── 404 handler (must come AFTER all route definitions) ──────────────────
app.use(notFound);

// ── Global error handler (must be LAST middleware) ────────────────────────
app.use(errorHandler);

export default app;
