/**
 * health.controller.js — Smoke-test endpoint controller.
 * GET /api/health → confirms the API is running.
 */

import { asyncHandler } from '../utils/asyncHandler.js';

export const healthCheck = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'healthcare+ API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});
