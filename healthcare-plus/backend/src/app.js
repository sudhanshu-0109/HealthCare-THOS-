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
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── HTTP request logging (development only) ───────────────────────────────
if (env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ── API routes ────────────────────────────────────────────────────────────
app.use('/api', apiRouter);

// ── 404 handler (must come AFTER all route definitions) ──────────────────
app.use(notFound);

// ── Global error handler (must be LAST middleware) ────────────────────────
app.use(errorHandler);

export default app;
