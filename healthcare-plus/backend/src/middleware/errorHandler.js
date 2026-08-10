/**
 * errorHandler.js — Global Express error handling middleware.
 * Must be the LAST middleware mounted in app.js.
 *
 * Handles:
 *   - ApiError instances → consistent JSON response with correct status code
 *   - Prisma known errors → normalized to ApiError responses
 *   - Generic errors → 500 Internal Server Error
 *
 * Response shape: { success: false, message: string, errors?: any }
 */

import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';

export const errorHandler = (err, req, res, next) => {
  // Log full stack in development
  if (env.NODE_ENV === 'development') {
    console.error('[ERROR]', err);
  } else {
    console.error(`[ERROR] ${err.message}`);
  }

  // ── ApiError: known, intentional errors ──────────────────────────────────
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.details && { errors: err.details }),
    });
  }

  // ── Prisma known request errors ───────────────────────────────────────────
  if (err.code) {
    switch (err.code) {
      case 'P2002':
        // Unique constraint violation. Do NOT echo err.meta.target — that leaks
        // internal DB column names to the client. The frontend only reads message.
        return res.status(409).json({
          success: false,
          message: 'A record with this value already exists.',
        });
      case 'P2025':
        // Record not found
        return res.status(404).json({
          success: false,
          message: 'The requested record was not found.',
        });
      case 'P2003':
        // Foreign key constraint failed
        return res.status(400).json({
          success: false,
          message: 'Related record not found. Check your input IDs.',
        });
      default:
        break;
    }
  }

  // ── SyntaxError from JSON body parsing ───────────────────────────────────
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON in request body.',
    });
  }

  // ── Generic / unhandled errors → 500 ─────────────────────────────────────
  return res.status(500).json({
    success: false,
    message:
      env.NODE_ENV === 'development'
        ? err.message
        : 'Something went wrong. Please try again later.',
  });
};
