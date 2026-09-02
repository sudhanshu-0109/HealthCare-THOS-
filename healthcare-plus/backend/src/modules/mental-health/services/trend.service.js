/**
 * services/trend.service.js — Deterministic 7/30-day trend analysis.
 *
 * All calculations are deterministic and explainable — no AI generation.
 * Thresholds are documented inline for clinical review.
 */

import prisma from '../../../prisma/client.js';

// Threshold: a change of more than this % from baseline is "significant"
// These should be reviewed by a clinician before production launch.
const SIGNIFICANT_CHANGE_THRESHOLD = 0.15; // 15%

/**
 * Get trend data for a user's recent check-ins.
 * @param {string} profileId
 * @returns {Promise<object>} — trend signals and summary
 */
export async function getTrends(profileId) {
  const now = new Date();
  const sevenDaysAgo  = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const recent = await prisma.mentalHealthCheckIn.findMany({
    where: { profileId, createdAt: { gte: sevenDaysAgo } },
    orderBy: { createdAt: 'asc' },
  });

  const baseline = await prisma.mentalHealthCheckIn.findMany({
    where: { profileId, createdAt: { gte: thirtyDaysAgo, lt: sevenDaysAgo } },
    orderBy: { createdAt: 'asc' },
  });

  // Helper: average a field across an array of check-ins
  const avg = (arr, field) => {
    if (!arr.length) return null;
    return arr.reduce((sum, c) => sum + (c[field] || 0), 0) / arr.length;
  };

  const recentAvg = {
    mood:       avg(recent, 'mood'),
    stress:     avg(recent, 'stress'),
    energy:     avg(recent, 'energy'),
    motivation: avg(recent, 'motivation'),
    sleep:      avg(recent, 'sleepHours'),
  };

  const baselineAvg = {
    mood:       avg(baseline, 'mood'),
    stress:     avg(baseline, 'stress'),
    energy:     avg(baseline, 'energy'),
    motivation: avg(baseline, 'motivation'),
    sleep:      avg(baseline, 'sleepHours'),
  };

  /**
   * Compute trend signal for a metric.
   * For mood/energy/motivation: higher is better (improving if recent > baseline)
   * For stress: lower is better (improving if recent < baseline)
   */
  const trendSignal = (field, higherIsBetter = true) => {
    const r = recentAvg[field];
    const b = baselineAvg[field];
    if (r === null) return { direction: 'insufficient_data', change: null };
    if (b === null) return { direction: 'no_baseline', recentAvg: r };

    const scale = field === 'stress' ? 10 : field === 'sleep' ? 10 : 5;
    const relativeChange = (r - b) / scale;
    const isSignificant = Math.abs(relativeChange) > SIGNIFICANT_CHANGE_THRESHOLD;

    let direction;
    if (!isSignificant) {
      direction = 'stable';
    } else if ((higherIsBetter && r > b) || (!higherIsBetter && r < b)) {
      direction = 'improving';
    } else {
      direction = 'concerning';
    }

    return { direction, recentAvg: r, baselineAvg: b, change: relativeChange };
  };

  const trends = {
    mood:       trendSignal('mood',       true),
    stress:     trendSignal('stress',     false), // lower stress = improving
    energy:     trendSignal('energy',     true),
    motivation: trendSignal('motivation', true),
    sleep:      trendSignal('sleep',      true),
  };

  // Generate a human-readable summary insight
  const concerning = Object.entries(trends)
    .filter(([, v]) => v.direction === 'concerning')
    .map(([k]) => k);

  const improving = Object.entries(trends)
    .filter(([, v]) => v.direction === 'improving')
    .map(([k]) => k);

  let summaryInsight = null;
  if (concerning.length > 0 && recent.length >= 3) {
    summaryInsight = `We've noticed that your recent ${concerning.join(' and ')} level${concerning.length > 1 ? 's' : ''} ${concerning.length > 1 ? 'have' : 'has'} been ${concerning.includes('stress') ? 'higher' : 'lower'} than your usual pattern.`;
  } else if (improving.length > 0) {
    summaryInsight = `Your ${improving.join(' and ')} ${improving.length > 1 ? 'have' : 'has'} been improving over the past week — that's something to acknowledge.`;
  }

  // Streak calculation
  const streak = await calculateStreak(profileId);

  // Activity stats
  const activityCount = await prisma.wellnessActivity.count({
    where: { profileId, completedAt: { gte: thirtyDaysAgo, not: null } },
  });

  return {
    checkInCount:  recent.length,
    recentAvg,
    baselineAvg,
    trends,
    summaryInsight,
    streak,
    activityCount,
    chartData: recent.map((c) => ({
      date: c.createdAt.toISOString().split('T')[0],
      mood: c.mood,
      stress: c.stress,
      energy: c.energy,
      motivation: c.motivation,
      sleep: c.sleepHours,
    })),
  };
}

/**
 * Calculate the user's current check-in streak (consecutive days).
 */
async function calculateStreak(profileId) {
  const checkIns = await prisma.mentalHealthCheckIn.findMany({
    where: { profileId },
    orderBy: { createdAt: 'desc' },
    take: 60,
    select: { createdAt: true },
  });

  if (!checkIns.length) return 0;

  const dateStrings = [...new Set(
    checkIns.map((c) => c.createdAt.toISOString().split('T')[0])
  )].sort((a, b) => b.localeCompare(a)); // descending

  let streak = 0;
  const today = new Date().toISOString().split('T')[0];

  for (let i = 0; i < dateStrings.length; i++) {
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    const expectedStr = expected.toISOString().split('T')[0];
    if (dateStrings[i] === expectedStr) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}
