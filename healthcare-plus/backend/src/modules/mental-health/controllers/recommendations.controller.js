/**
 * controllers/recommendations.controller.js — Personalized wellness recommendations.
 */

import { asyncHandler } from '../../../utils/asyncHandler.js';
import { getRecommendations, logRecommendationsShown } from '../services/recommendation.service.js';

/**
 * GET /api/mental-health/recommendations
 * Get personalized recommendations.
 * Query: ?emotion=STRESSED&intent=STRESS_SUPPORT&limit=5
 */
export const getPersonalizedRecommendations = asyncHandler(async (req, res) => {
  const profileId = req.mentalHealthProfile.id;
  const { emotion = 'NEUTRAL', intent = 'GENERAL', limit = '5' } = req.query;

  const recommendations = await getRecommendations(profileId, {
    emotion,
    intent,
    limit: Math.min(parseInt(limit), 10),
  });

  await logRecommendationsShown(profileId, recommendations);

  res.json({
    success: true,
    data: recommendations.map((r) => ({
      id: r.id,
      type: r.type,
      title: r.title,
      description: r.description,
      duration: r.duration,
      imageUrl: r.imageUrl,
      tags: r.tags,
    })),
  });
});
