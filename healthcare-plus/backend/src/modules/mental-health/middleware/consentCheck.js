/**
 * middleware/consentCheck.js — Mental Wellness consent authorization middleware.
 *
 * Enforces the three-tier consent model (Section 16 of spec) at the
 * backend authorization layer — NEVER just in the UI.
 *
 * Usage:
 *   router.post('/conversations', authenticate, requireConsent('LEVEL_2'), handler)
 *
 * A user who has not granted the required consent level receives a 403
 * BEFORE any controller logic runs.
 *
 * Also auto-creates a MentalHealthProfile (with NONE consent) if one
 * doesn't exist yet, so the profile record is always available.
 */

import prisma from '../../../prisma/client.js';
import { ApiError } from '../../../utils/ApiError.js';

const CONSENT_ORDER = { NONE: 0, LEVEL_1: 1, LEVEL_2: 2, LEVEL_3: 3 };

/**
 * Middleware factory — requires a minimum consent level.
 * @param {'LEVEL_1'|'LEVEL_2'|'LEVEL_3'} requiredLevel
 */
export function requireConsent(requiredLevel) {
  return async (req, res, next) => {
    try {
      if (!req.user?.id) {
        return next(ApiError.unauthorized('Authentication required'));
      }

      // Upsert profile so it always exists
      let profile = await prisma.mentalHealthProfile.findUnique({
        where: { userId: req.user.id },
        select: { id: true, consentLevel: true },
      });

      if (!profile) {
        profile = await prisma.mentalHealthProfile.create({
          data: { userId: req.user.id },
          select: { id: true, consentLevel: true },
        });
      }

      // Attach profile to request for downstream controllers
      req.mentalHealthProfile = profile;

      // Check consent level
      if (CONSENT_ORDER[profile.consentLevel] < CONSENT_ORDER[requiredLevel]) {
        return next(
          ApiError.forbidden(
            `This feature requires Mental Wellness consent level ${requiredLevel}. ` +
            `Your current consent level is ${profile.consentLevel}. ` +
            `Please update your consent settings to continue.`,
            { requiredLevel, currentLevel: profile.consentLevel }
          )
        );
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Middleware that only ensures the profile exists without requiring any consent.
 * Used for profile/consent management endpoints.
 */
export async function ensureProfile(req, res, next) {
  try {
    if (!req.user?.id) return next(ApiError.unauthorized('Authentication required'));

    let profile = await prisma.mentalHealthProfile.findUnique({
      where: { userId: req.user.id },
      select: { id: true, consentLevel: true },
    });

    if (!profile) {
      profile = await prisma.mentalHealthProfile.create({
        data: { userId: req.user.id },
        select: { id: true, consentLevel: true },
      });
    }

    req.mentalHealthProfile = profile;
    next();
  } catch (err) {
    next(err);
  }
}
