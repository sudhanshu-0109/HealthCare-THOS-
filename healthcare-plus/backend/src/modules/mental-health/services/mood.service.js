/**
 * services/mood.service.js — Parses mood/emotion metadata from AI responses.
 * Maps to the supported WellnessEmotionType enum values.
 */

const VALID_EMOTIONS = new Set([
  'CALM', 'HAPPY', 'NEUTRAL', 'SAD', 'LOW',
  'STRESSED', 'OVERWHELMED', 'ANXIOUS', 'ANGRY', 'LONELY', 'FRUSTRATED',
]);

/**
 * Extract and validate mood data from a wellness AI response.
 * @param {object} aiResponse - parsed Gemini response
 * @returns {{ primary: string, secondary: string[], intensity: number }}
 */
export function extractMoodMetadata(aiResponse) {
  const emotion = aiResponse?.emotion || {};
  const primary = VALID_EMOTIONS.has(emotion.primary) ? emotion.primary : 'NEUTRAL';
  const secondary = (emotion.secondary || []).filter((e) => VALID_EMOTIONS.has(e));
  const intensity = Math.min(10, Math.max(1, Number(emotion.intensity) || 5));
  return { primary, secondary, intensity };
}

/**
 * Map a numeric mood value (from check-in 1-5 scale) to an emotion type.
 * Used for recommendation scoring without a full AI call.
 */
export function moodScaleToEmotion(moodValue) {
  switch (moodValue) {
    case 5: return 'HAPPY';
    case 4: return 'CALM';
    case 3: return 'NEUTRAL';
    case 2: return 'SAD';
    case 1: return 'OVERWHELMED';
    default: return 'NEUTRAL';
  }
}

/**
 * Map a stress level (0-10) to an emotion modifier.
 */
export function stressToEmotion(stressLevel) {
  if (stressLevel >= 8) return 'OVERWHELMED';
  if (stressLevel >= 6) return 'STRESSED';
  if (stressLevel >= 4) return 'ANXIOUS';
  return 'NEUTRAL';
}
