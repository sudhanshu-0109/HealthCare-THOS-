/**
 * services/crisis.service.js — Crisis path handling.
 *
 * INTENTIONALLY ISOLATED from conversation.service.js.
 * A bug introduced in conversation features cannot affect this service.
 * This service only appends records — never updates or deletes risk events.
 */

import prisma from '../../../prisma/client.js';

/**
 * Create an append-only risk event record.
 * Called for ORANGE and RED levels.
 * @param {string} profileId
 * @param {'ORANGE'|'RED'} riskLevel
 * @param {string} triggerText
 * @param {string} [sessionId] — conversation ID
 */
export async function createRiskEvent(profileId, riskLevel, triggerText, sessionId = null) {
  return prisma.mentalHealthRiskEvent.create({
    data: {
      profileId,
      riskLevel,
      triggerText,
      sessionId,
    },
  });
}

/**
 * Record a user action taken during the crisis flow.
 * @param {string} riskEventId
 * @param {string} actionType — CrisisActionType enum value
 * @param {object} [metadata]
 */
export async function recordCrisisAction(riskEventId, actionType, metadata = null) {
  return prisma.crisisAction.create({
    data: {
      riskEventId,
      actionType,
      metadata,
    },
  });
}

/**
 * Get the most recent open risk event for a profile.
 * Used to link follow-up crisis actions to the right event.
 * @param {string} profileId
 */
export async function getLatestOpenRiskEvent(profileId) {
  return prisma.mentalHealthRiskEvent.findFirst({
    where: { profileId, resolvedAt: null },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Mark a risk event as resolved (when user completes the crisis flow).
 * @param {string} riskEventId
 */
export async function resolveRiskEvent(riskEventId) {
  return prisma.mentalHealthRiskEvent.update({
    where: { id: riskEventId },
    data: { resolvedAt: new Date() },
  });
}
