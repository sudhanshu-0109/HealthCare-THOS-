/**
 * cors.js — CORS configuration for Express.
 */

import { env } from './env.js';

// Matches any Cloudflare Quick Tunnel hostname used during local tunneling.
const CLOUDFLARE_TUNNEL_RE = /^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/;

// Matches localhost, 127.0.0.1, and private LAN IP ranges (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
const LOCAL_NETWORK_RE = /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/;

export const corsConfig = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Allow any localhost or LAN IP port — DEVELOPMENT ONLY.
    if (env.NODE_ENV !== 'production' && LOCAL_NETWORK_RE.test(origin)) {
      return callback(null, true);
    }

    // Allow Cloudflare Quick Tunnel hostnames — DEVELOPMENT ONLY.
    if (env.NODE_ENV !== 'production' && CLOUDFLARE_TUNNEL_RE.test(origin)) {
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
