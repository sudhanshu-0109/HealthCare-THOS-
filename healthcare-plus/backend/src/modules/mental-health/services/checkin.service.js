/**
 * services/checkin.service.js — Daily mental wellness check-in CRUD.
 * Consent Level 1 required (enforced in middleware before this service).
 * Free-text notes are scanned by safety engine before storage.
 */

import prisma from '../../../prisma/client.js';
import { quickRiskScan } from './safety.service.js';

/**
 * Submit a daily check-in.
 * @param {string} profileId
 * @param {{ mood, stress, energy, motivation, sleepHours, note }} data
 */
export async function createCheckIn(profileId, data) {
  const { mood, stress, energy, motivation, sleepHours, note } = data;

  // Validate ranges
  if (mood < 1 || mood > 5)           throw Object.assign(new Error('mood must be 1-5'), { statusCode: 400 });
  if (stress < 0 || stress > 10)      throw Object.assign(new Error('stress must be 0-10'), { statusCode: 400 });
  if (energy < 1 || energy > 5)       throw Object.assign(new Error('energy must be 1-5'), { statusCode: 400 });
  if (motivation < 1 || motivation > 5) throw Object.assign(new Error('motivation must be 1-5'), { statusCode: 400 });

  // Safety-scan the note before storing
  let noteRiskLevel = null;
  if (note && note.trim().length > 0) {
    noteRiskLevel = quickRiskScan(note.trim());
  }

  return prisma.mentalHealthCheckIn.create({
    data: {
      profileId,
      mood,
      stress,
      energy,
      motivation,
      sleepHours: sleepHours !== undefined ? parseFloat(sleepHours) : null,
      note: note?.trim() || null,
      noteRiskLevel,
    },
  });
}

/**
 * Get check-in history for a user (most recent first).
 * @param {string} profileId
 * @param {number} [limit]
 */
export async function getCheckIns(profileId, limit = 30) {
  return prisma.mentalHealthCheckIn.findMany({
    where: { profileId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

/**
 * Get today's check-in (if any).
 */
export async function getTodaysCheckIn(profileId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return prisma.mentalHealthCheckIn.findFirst({
    where: {
      profileId,
      createdAt: { gte: today, lt: tomorrow },
    },
    orderBy: { createdAt: 'desc' },
  });
}
