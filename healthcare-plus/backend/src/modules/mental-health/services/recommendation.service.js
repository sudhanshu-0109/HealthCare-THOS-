/**
 * services/recommendation.service.js — V1 deterministic scoring engine (Section 8).
 *
 * All recommendations are drawn from the governed WellnessContent library.
 * Gemini never invents activities — it only signals categories.
 * This service maps those categories to actual governed content records.
 *
 * SCORE = MoodMatch + IntentMatch + TagMatch + UserPreference
 *       + PreviousCompletion + TimeOfDay + Novelty
 */

import prisma from '../../../prisma/client.js';
import { getContentTypesForIntent } from './intent.service.js';

// Scoring weights
const WEIGHTS = {
  INTENT_MATCH:           30,
  MOOD_TAG_MATCH:         25,
  AI_CATEGORY_MATCH:      20,
  NOVELTY_BONUS:          15, // never completed before
  COMPLETION_PENALTY:     -10, // completed in last 24h (avoid repetition)
  TIME_OF_DAY_MATCH:      10,
};

// Tag sets for mood-to-content matching
const MOOD_TAGS = {
  STRESSED:    ['STRESS', 'ANXIETY', 'CALM', 'FOCUS'],
  OVERWHELMED: ['ANXIETY', 'CALM', 'GROUNDING', 'STRESS'],
  ANXIOUS:     ['ANXIETY', 'CALM', 'BREATHING', 'GROUNDING'],
  SAD:         ['MOOD', 'GRATITUDE', 'SOCIAL'],
  LOW:         ['MOOD', 'GRATITUDE', 'MOTIVATION'],
  ANGRY:       ['CALM', 'BREATHING', 'GROUNDING'],
  LONELY:      ['SOCIAL', 'GRATITUDE', 'MINDFULNESS'],
  FRUSTRATED:  ['CALM', 'FOCUS', 'BREATHING'],
  CALM:        ['SLEEP', 'MINDFULNESS', 'GRATITUDE'],
  HAPPY:       ['GRATITUDE', 'MINDFULNESS'],
  NEUTRAL:     ['MINDFULNESS', 'BREATHING'],
};

// Content types better suited to time of day
function getTimeOfDayTypes() {
  const hour = new Date().getHours();
  if (hour < 9)  return ['MEDITATION', 'MINDFULNESS', 'BREATHING'];   // morning
  if (hour < 14) return ['FOCUS', 'BREATHING', 'MINDFULNESS'];         // midday
  if (hour < 18) return ['FOCUS', 'MINDFULNESS', 'RELAXATION_MUSIC']; // afternoon
  return ['SLEEP_SOUND', 'SLEEP_STORY', 'RELAXATION_MUSIC', 'MEDITATION']; // evening/night
}

/**
 * Get personalized recommendations for a user.
 *
 * @param {string} profileId — MentalHealthProfile.id
 * @param {object} opts
 * @param {string} [opts.emotion] — current primary emotion (e.g. 'STRESSED')
 * @param {string} [opts.intent] — current intent (e.g. 'STRESS_SUPPORT')
 * @param {string[]} [opts.aiCategories] — categories Gemini suggested
 * @param {number} [opts.limit] — max results (default 5)
 * @returns {Promise<object[]>} — scored WellnessContent records
 */
export async function getRecommendations(profileId, opts = {}) {
  const { emotion = 'NEUTRAL', intent = 'GENERAL', aiCategories = [], limit = 5 } = opts;

  // Fetch all active wellness content
  const allContent = await prisma.wellnessContent.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });

  // Fetch recent completions (last 24h) and all-time completions for this user
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const recentActivities = await prisma.wellnessActivity.findMany({
    where: { profileId, completedAt: { gte: yesterday } },
    select: { contentId: true },
  });
  const recentSet = new Set(recentActivities.map((a) => a.contentId));

  const allActivities = await prisma.wellnessActivity.findMany({
    where: { profileId, completedAt: { not: null } },
    select: { contentId: true },
  });
  const completedSet = new Set(allActivities.map((a) => a.contentId));

  // Scoring sets
  const intentTypes = new Set(getContentTypesForIntent(intent));
  const moodTagSet = new Set(MOOD_TAGS[emotion] || []);
  const aiCategorySet = new Set(aiCategories);
  const timeTypes = new Set(getTimeOfDayTypes());

  // Score each content item
  const scored = allContent.map((item) => {
    let score = 0;
    const reasons = [];

    if (intentTypes.has(item.type)) {
      score += WEIGHTS.INTENT_MATCH;
      reasons.push(`intent:${intent}`);
    }
    if (item.tags.some((t) => moodTagSet.has(t))) {
      score += WEIGHTS.MOOD_TAG_MATCH;
      reasons.push(`mood:${emotion}`);
    }
    if (aiCategorySet.has(item.type)) {
      score += WEIGHTS.AI_CATEGORY_MATCH;
      reasons.push('ai_suggested');
    }
    if (!completedSet.has(item.id)) {
      score += WEIGHTS.NOVELTY_BONUS;
      reasons.push('novelty');
    }
    if (recentSet.has(item.id)) {
      score += WEIGHTS.COMPLETION_PENALTY;
    }
    if (timeTypes.has(item.type)) {
      score += WEIGHTS.TIME_OF_DAY_MATCH;
      reasons.push('time_of_day');
    }

    return { ...item, _score: score, _reason: reasons.join(',') };
  });

  // Sort by score descending, take top N
  scored.sort((a, b) => b._score - a._score);
  return scored.slice(0, limit);
}

/**
 * Log a recommendation as shown to the user.
 */
export async function logRecommendationsShown(profileId, scoredItems) {
  await prisma.wellnessRecommendation.createMany({
    data: scoredItems.map((item) => ({
      profileId,
      contentId: item.id,
      score: item._score,
      reason: item._reason,
    })),
    skipDuplicates: false,
  });
}
