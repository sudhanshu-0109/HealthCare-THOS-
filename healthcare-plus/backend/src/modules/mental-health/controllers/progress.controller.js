/**
 * controllers/progress.controller.js — Wellness progress and trend data.
 */

import { asyncHandler } from '../../../utils/asyncHandler.js';
import { getTrends } from '../services/trend.service.js';

/**
 * GET /api/mental-health/progress
 * Returns 7-day trends, averages, streak, and activity count.
 */
export const getProgress = asyncHandler(async (req, res) => {
  const profileId = req.mentalHealthProfile.id;
  const data = await getTrends(profileId);
  res.json({ success: true, data });
});
