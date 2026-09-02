/**
 * controllers/crisis.controller.js — Crisis flow action recording.
 * Isolated from conversation controller — crisis path bugs cannot bleed
 * into conversation features and vice versa.
 */

import { asyncHandler } from '../../../utils/asyncHandler.js';
import { ApiError } from '../../../utils/ApiError.js';
import {
  recordCrisisAction,
  getLatestOpenRiskEvent,
  resolveRiskEvent,
} from '../services/crisis.service.js';

const VALID_ACTIONS = ['VIEWED_RESOURCES', 'CALLED_HELPLINE', 'CONTACTED_TRUSTED_PERSON', 'BOOKED_PROFESSIONAL', 'DISMISSED'];

/**
 * POST /api/mental-health/crisis/action
 * Record a user action taken during the crisis flow.
 * Body: { actionType, metadata?, resolve? }
 */
export const recordAction = asyncHandler(async (req, res) => {
  const profileId = req.mentalHealthProfile.id;
  const { actionType, metadata, resolve } = req.body;

  if (!VALID_ACTIONS.includes(actionType)) {
    throw ApiError.badRequest(`Invalid actionType. Must be one of: ${VALID_ACTIONS.join(', ')}`);
  }

  const riskEvent = await getLatestOpenRiskEvent(profileId);
  if (!riskEvent) {
    throw ApiError.notFound('No active risk event found for this user');
  }

  await recordCrisisAction(riskEvent.id, actionType, metadata || null);

  if (resolve) {
    await resolveRiskEvent(riskEvent.id);
  }

  res.json({ success: true, data: { recorded: true, actionType } });
});
