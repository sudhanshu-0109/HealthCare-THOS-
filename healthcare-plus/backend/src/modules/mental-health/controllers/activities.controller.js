/**
 * controllers/activities.controller.js — Wellness activities and programs.
 */

import prisma from '../../../prisma/client.js';
import { asyncHandler } from '../../../utils/asyncHandler.js';
import { ApiError } from '../../../utils/ApiError.js';

/**
 * GET /api/mental-health/activities/content
 * Browse wellness content library.
 * Query: ?type=BREATHING&tags=STRESS
 */
export const getWellnessContent = asyncHandler(async (req, res) => {
  const { type, tags } = req.query;

  const where = { isActive: true };
  if (type) where.type = type;
  if (tags) where.tags = { hasSome: tags.split(',') };

  const content = await prisma.wellnessContent.findMany({
    where,
    orderBy: { sortOrder: 'asc' },
  });

  res.json({ success: true, data: content });
});

/**
 * POST /api/mental-health/activities/:id/start
 * Begin a wellness activity session.
 */
export const startActivity = asyncHandler(async (req, res) => {
  const profileId = req.mentalHealthProfile.id;
  const { id: contentId } = req.params;

  const content = await prisma.wellnessContent.findUnique({ where: { id: contentId } });
  if (!content || !content.isActive) throw ApiError.notFound('Wellness content not found');

  const activity = await prisma.wellnessActivity.create({
    data: { profileId, contentId },
    include: { content: true },
  });

  res.status(201).json({ success: true, data: activity });
});

/**
 * POST /api/mental-health/activities/:id/complete
 * Mark an activity as completed.
 * Body: { activityId, durationSeconds }
 */
export const completeActivity = asyncHandler(async (req, res) => {
  const profileId = req.mentalHealthProfile.id;
  const { id: contentId } = req.params;
  const { activityId, durationSeconds } = req.body;

  // Find the most recent incomplete activity for this content
  const activity = await prisma.wellnessActivity.findFirst({
    where: {
      id: activityId || undefined,
      profileId,
      contentId,
      completedAt: null,
    },
    orderBy: { startedAt: 'desc' },
  });

  if (!activity) throw ApiError.notFound('Active activity session not found');

  const updated = await prisma.wellnessActivity.update({
    where: { id: activity.id },
    data: {
      completedAt: new Date(),
      durationSeconds: durationSeconds ? parseInt(durationSeconds) : null,
    },
    include: { content: true },
  });

  // Update program enrollment if applicable
  await updateProgramProgress(profileId);

  res.json({ success: true, data: updated });
});

/**
 * GET /api/mental-health/programs
 * List available wellness programs + user's enrollment status.
 */
export const getPrograms = asyncHandler(async (req, res) => {
  const profileId = req.mentalHealthProfile.id;

  const programs = await prisma.wellnessProgram.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' },
  });

  const enrollments = await prisma.wellnessProgramEnrollment.findMany({
    where: { profileId, isActive: true },
    select: { programId: true, currentDay: true, streakDays: true, startedAt: true },
  });

  const enrollmentMap = Object.fromEntries(enrollments.map((e) => [e.programId, e]));

  res.json({
    success: true,
    data: programs.map((p) => ({
      ...p,
      enrollment: enrollmentMap[p.id] || null,
    })),
  });
});

/**
 * POST /api/mental-health/programs/:id/enroll
 * Enroll in a wellness program.
 */
export const enrollInProgram = asyncHandler(async (req, res) => {
  const profileId = req.mentalHealthProfile.id;
  const { id: programId } = req.params;

  const program = await prisma.wellnessProgram.findUnique({ where: { id: programId } });
  if (!program || !program.isActive) throw ApiError.notFound('Program not found');

  // Check existing enrollment
  const existing = await prisma.wellnessProgramEnrollment.findFirst({
    where: { profileId, programId, isActive: true },
  });
  if (existing) throw ApiError.conflict('Already enrolled in this program');

  const enrollment = await prisma.wellnessProgramEnrollment.create({
    data: { profileId, programId },
    include: { program: true },
  });

  res.status(201).json({ success: true, data: enrollment });
});

// ── Helpers ───────────────────────────────────────────────────────────────────

async function updateProgramProgress(profileId) {
  const enrollments = await prisma.wellnessProgramEnrollment.findMany({
    where: { profileId, isActive: true },
  });

  for (const enrollment of enrollments) {
    // Simple increment — more sophisticated logic can be added later
    await prisma.wellnessProgramEnrollment.update({
      where: { id: enrollment.id },
      data: {
        streakDays: { increment: 1 },
        currentDay: Math.min(enrollment.currentDay + 1, enrollment.program?.durationDays || 999),
      },
    });
  }
}
