/**
 * cors.js — CORS configuration for Express.
 */

import { env } from './env.js';

export const corsConfig = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow any localhost port in development
    if (/^https?:\/\/localhost:\d+$/.test(origin)) {
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
