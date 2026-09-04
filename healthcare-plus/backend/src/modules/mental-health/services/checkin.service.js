/**
 * services/checkin.service.js — Daily mental wellness check-in CRUD.
 * Consent Level 1 required (enforced in middleware before this service).
 * Free-text notes are scanned by safety engine before storage.
 *
 * Date strategy
 * ─────────────
 * The frontend always sends `checkInDate` as a YYYY-MM-DD LOCAL date string
 * (computed with getFullYear/getMonth/getDate, NOT toISOString).
 * The backend stores it verbatim and uses it as the unique-per-day identity.
 * The DB enforces @@unique([profileId, checkInDate]) — one record per user per day.
 */

import prisma from '../../../prisma/client.js';
import { quickRiskScan } from './safety.service.js';

/**
 * Returns local YYYY-MM-DD for the server clock.
 * NOTE: The frontend MUST send checkInDate explicitly so the server timezone
 * does not matter for primary date determination. This is only a fallback.
 */
function serverLocalDateStr(date = new Date()) {
  const d = new Date(date);
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

/**
 * Normalize mood: accepts string label (e.g. 'good') or numeric 1–5.
 * Maps: overwhelmed→1, low→2, neutral→3, okay→4, good→5, thriving→5
 */
function normalizeMood(mood) {
  if (typeof mood === 'number') return Math.min(5, Math.max(1, Math.round(mood)));
  const map = { overwhelmed: 1, low: 2, neutral: 3, okay: 4, good: 5, thriving: 5 };
  return map[String(mood).toLowerCase()] ?? 3;
}

/**
 * Normalize a 1–10 slider value to 1–5 scale.
 * Frontend SliderRow uses 1–10; DB schema stores 1–5.
 */
function normalize1to5(val) {
  const n = Number(val);
  if (Number.isFinite(n)) {
    if (n >= 1 && n <= 5) return Math.round(n);        // already in 1-5 range
    if (n > 5 && n <= 10) return Math.max(1, Math.round(n / 2)); // 1-10 → 1-5
  }
  return 3; // fallback
}

/**
 * Submit a daily check-in (true upsert using @@unique([profileId, checkInDate])).
 * One authoritative record per user per calendar day.
 *
 * @param {string} profileId
 * @param {{ mood, stress, energy, motivation, sleepHours, note, checkInDate }} data
 */
export async function createCheckIn(profileId, data) {
  const { mood, stress, energy, motivation, sleepHours, note, checkInDate } = data;

  const moodNum       = normalizeMood(mood);
  const energyNum     = normalize1to5(energy);
  const motivationNum = normalize1to5(motivation);
  const stressNum     = Math.min(10, Math.max(0, Number(stress ?? 5)));

  // Prefer the client-supplied date (local calendar date); fall back to server local
  const dateStr = (checkInDate && /^\d{4}-\d{2}-\d{2}$/.test(checkInDate))
    ? checkInDate
    : serverLocalDateStr();

  // Safety-scan the note before storing
  let noteRiskLevel = null;
  if (note && note.trim().length > 0) {
    noteRiskLevel = quickRiskScan(note.trim());
  }

  const payload = {
    mood: moodNum,
    stress: stressNum,
    energy: energyNum,
    motivation: motivationNum,
    sleepHours: sleepHours !== undefined && sleepHours !== null ? parseFloat(sleepHours) : null,
    note: note?.trim() || null,
    noteRiskLevel,
  };

  try {
    // Use Prisma upsert with the @@unique([profileId, checkInDate]) compound key.
    // This is atomic and race-condition safe.
    return await prisma.mentalHealthCheckIn.upsert({
      where: {
        profileId_checkInDate: { profileId, checkInDate: dateStr },
      },
      update: payload,
      create: {
        profileId,
        checkInDate: dateStr,
        ...payload,
      },
    });
  } catch (err) {
    // If the @@unique constraint doesn't exist yet in the DB (migration not run),
    // fall back to manual find-then-update/create approach.
    if (err.code === 'P2025' || err.message?.includes('profileId_checkInDate')) {
      const existing = await prisma.mentalHealthCheckIn.findFirst({
        where: { profileId, checkInDate: dateStr },
        orderBy: { createdAt: 'desc' },
      });
      if (existing) {
        return prisma.mentalHealthCheckIn.update({ where: { id: existing.id }, data: payload });
      }
      return prisma.mentalHealthCheckIn.create({
        data: { profileId, checkInDate: dateStr, ...payload },
      });
    }

    // Fallback: if checkInDate column doesn't exist yet in DB (very old schema)
    if (err.code === 'P2022' || err.message?.includes('checkInDate')) {
      return prisma.mentalHealthCheckIn.create({ data: { profileId, ...payload } });
    }

    throw err;
  }
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
 * Primary: query by checkInDate string (timezone-safe, client-supplied date).
 * Fallback: UTC boundary range query for legacy rows with null checkInDate.
 *
 * @param {string} profileId
 * @param {string} [clientDateStr] - Optional YYYY-MM-DD from client (most accurate)
 */
export async function getTodaysCheckIn(profileId, clientDateStr) {
  const dateStr = (clientDateStr && /^\d{4}-\d{2}-\d{2}$/.test(clientDateStr))
    ? clientDateStr
    : serverLocalDateStr();

  // Primary: query by checkInDate string
  try {
    const byDate = await prisma.mentalHealthCheckIn.findFirst({
      where: { profileId, checkInDate: dateStr },
      orderBy: { createdAt: 'desc' },
    });
    if (byDate) return byDate;
  } catch {
    // checkInDate column may not exist yet (pre-migration) — fall through
  }

  // Fallback: UTC boundary range for legacy rows (null checkInDate)
  // Use start of today in UTC as the boundary, which is close enough for most cases.
  const todayUTC = new Date();
  todayUTC.setUTCHours(0, 0, 0, 0);
  const tomorrowUTC = new Date(todayUTC);
  tomorrowUTC.setUTCDate(todayUTC.getUTCDate() + 1);

  return prisma.mentalHealthCheckIn.findFirst({
    where: {
      profileId,
      checkInDate: null, // only legacy rows without a date string
      createdAt: { gte: todayUTC, lt: tomorrowUTC },
    },
    orderBy: { createdAt: 'desc' },
  });
}
