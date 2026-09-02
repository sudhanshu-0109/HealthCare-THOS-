/**
 * services/intent.service.js — Maps conversation intent from AI output.
 */

const VALID_INTENTS = new Set([
  'SLEEP_SUPPORT', 'STRESS_SUPPORT', 'FOCUS_SUPPORT', 'SOCIAL_SUPPORT',
  'RELAXATION', 'MEDITATION', 'REFLECTION', 'PROFESSIONAL_SUPPORT', 'GENERAL',
]);

// Maps intent → recommended content types (used by recommendation engine)
export const INTENT_TO_CONTENT_TYPES = {
  SLEEP_SUPPORT:       ['SLEEP_SOUND', 'SLEEP_STORY', 'MEDITATION'],
  STRESS_SUPPORT:      ['BREATHING', 'MEDITATION', 'MINDFULNESS'],
  FOCUS_SUPPORT:       ['FOCUS', 'BREATHING', 'MEDITATION'],
  SOCIAL_SUPPORT:      ['GRATITUDE', 'REFLECTION', 'MINDFULNESS'],
  RELAXATION:          ['RELAXATION_MUSIC', 'MINDFULNESS', 'BREATHING'],
  MEDITATION:          ['MEDITATION', 'MINDFULNESS', 'GROUNDING'],
  REFLECTION:          ['GRATITUDE', 'MINDFULNESS', 'MEDITATION'],
  PROFESSIONAL_SUPPORT: ['WELLNESS_PROGRAM'],
  GENERAL:             ['BREATHING', 'MEDITATION', 'MINDFULNESS'],
};

/**
 * Extract and validate intent from an AI response.
 * @param {object} aiResponse
 * @returns {string} — WellnessIntentType value
 */
export function extractIntent(aiResponse) {
  const intent = aiResponse?.intent;
  return VALID_INTENTS.has(intent) ? intent : 'GENERAL';
}

/**
 * Get content type priorities for a given intent.
 * @param {string} intent
 * @returns {string[]}
 */
export function getContentTypesForIntent(intent) {
  return INTENT_TO_CONTENT_TYPES[intent] || INTENT_TO_CONTENT_TYPES.GENERAL;
}
