/**
 * cors.js — CORS configuration for Express.
 */

import { env } from './env.js';

export const corsConfig = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Allow any localhost port — DEVELOPMENT ONLY. Gating this behind NODE_ENV
    // prevents a malicious local page from making credentialed cross-origin
    // requests against a production deployment (credentials: true below).
    if (env.NODE_ENV !== 'production' && /^https?:\/\/localhost:\d+$/.test(origin)) {
      return callback(null, true);
    }

    if (origin === env.CLIENT_URL) {
      return callback(null, true);
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
