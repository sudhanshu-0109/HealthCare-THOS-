/**
 * controllers/checkin.controller.js — Daily mental wellness check-in endpoints.
 */

import { asyncHandler } from '../../../utils/asyncHandler.js';
import { createCheckIn, getCheckIns, getTodaysCheckIn } from '../services/checkin.service.js';
import { getRecommendations, logRecommendationsShown } from '../services/recommendation.service.js';
import { moodScaleToEmotion, stressToEmotion } from '../services/mood.service.js';

/**
 * POST /api/mental-health/check-ins
 * Submit a daily check-in. Returns the check-in + personalized recommendations.
 */
export const submitCheckIn = asyncHandler(async (req, res) => {
  const profileId = req.mentalHealthProfile.id;
  const { mood, stress, energy, motivation, sleepHours, note } = req.body;

  const checkIn = await createCheckIn(profileId, { mood, stress, energy, motivation, sleepHours, note });

  // Generate recommendations based on check-in state
  const emotion = moodScaleToEmotion(mood);
  const stressEmotion = stressToEmotion(stress);
  // Use whichever is more severe
  const primaryEmotion = ['OVERWHELMED', 'ANXIOUS', 'STRESSED'].includes(stressEmotion)
    ? stressEmotion
    : emotion;

  const recommendations = await getRecommendations(profileId, {
    emotion: primaryEmotion,
    intent: stress >= 7 ? 'STRESS_SUPPORT' : energy <= 2 ? 'FOCUS_SUPPORT' : 'GENERAL',
    limit: 4,
  });

  await logRecommendationsShown(profileId, recommendations);

  res.status(201).json({
    success: true,
    data: {
      checkIn,
      recommendations: recommendations.map((r) => ({
        id: r.id,
        type: r.type,
        title: r.title,
        description: r.description,
        duration: r.duration,
        imageUrl: r.imageUrl,
        tags: r.tags,
      })),
    },
  });
});

/**
 * GET /api/mental-health/check-ins
 * Get recent check-in history.
 * Query: ?limit=30
 */
export const getCheckInHistory = asyncHandler(async (req, res) => {
  const profileId = req.mentalHealthProfile.id;
  const limit = Math.min(parseInt(req.query.limit || '30'), 90);
  const checkIns = await getCheckIns(profileId, limit);
  const today = await getTodaysCheckIn(profileId);

  res.json({ success: true, data: { checkIns, todaysCheckIn: today } });
});
