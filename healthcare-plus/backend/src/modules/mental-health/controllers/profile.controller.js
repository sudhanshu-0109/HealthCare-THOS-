/**
 * controllers/profile.controller.js — Mental Wellness profile and consent management.
 */

import prisma from '../../../prisma/client.js';
import { asyncHandler } from '../../../utils/asyncHandler.js';
import { ApiError } from '../../../utils/ApiError.js';

const VALID_CONSENT_LEVELS = ['NONE', 'LEVEL_1', 'LEVEL_2', 'LEVEL_3'];

/**
 * GET /api/mental-health/profile
 * Returns the user's MentalHealthProfile + consent level.
 * Auto-creates profile if it doesn't exist (handled by ensureProfile middleware).
 */
export const getProfile = asyncHandler(async (req, res) => {
  const profile = req.mentalHealthProfile;
  res.json({ success: true, data: profile });
});

/**
 * PATCH /api/mental-health/profile/consent
 * Update consent level. Users can upgrade OR downgrade their consent.
 * Body: { consentLevel: 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3' | 'NONE' }
 */
export const updateConsent = asyncHandler(async (req, res) => {
  const { consentLevel } = req.body;

  if (!VALID_CONSENT_LEVELS.includes(consentLevel)) {
    throw ApiError.badRequest(
      `Invalid consent level. Must be one of: ${VALID_CONSENT_LEVELS.join(', ')}`
    );
  }

  const updated = await prisma.mentalHealthProfile.update({
    where: { id: req.mentalHealthProfile.id },
    data: { consentLevel },
    select: { id: true, consentLevel: true, updatedAt: true },
  });

  res.json({ success: true, data: updated });
});
