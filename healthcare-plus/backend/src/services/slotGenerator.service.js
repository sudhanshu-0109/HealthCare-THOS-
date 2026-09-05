/**
 * services/slotGenerator.service.js — Generate appointment slots for a doctor.
 *
 * Key behaviors:
 *  1. Lazy expiry of stale PENDING_PAYMENT holds (10-min window).
 *  2. For TODAY: past slots (before current IST time) are marked unavailable.
 *  3. Slot times stored & compared as IST HH:MM strings.
 *  4. Booked = status NOT in [CANCELLED] → blocks the slot.
 */

import prisma from '../prisma/client.js';

const SLOT_HOLD_MINUTES = 10;

// ── IST HELPERS ───────────────────────────────────────────────────────────────

/**
 * Returns current time as IST HH:MM string (India Standard Time = UTC+5:30).
 */
const nowIST_HHMM = () => {
  const now = new Date();
  const istMs = now.getTime() + (5 * 60 + 30) * 60 * 1000;
  const istDate = new Date(istMs);
  return `${String(istDate.getUTCHours()).padStart(2, '0')}:${String(istDate.getUTCMinutes()).padStart(2, '0')}`;
};

/**
 * Returns true if the given date (UTC midnight) is today in IST.
 * Compares IST-offset date string.
 */
const isDateTodayIST = (dateUTC) => {
  const now = new Date();
  const istMs = now.getTime() + (5 * 60 + 30) * 60 * 1000;
  const istNow = new Date(istMs);
  const istToday = `${istNow.getUTCFullYear()}-${String(istNow.getUTCMonth() + 1).padStart(2, '0')}-${String(istNow.getUTCDate()).padStart(2, '0')}`;

  // dateUTC is midnight UTC; add IST offset to get the IST calendar date
  const dateIST = new Date(dateUTC.getTime() + (5 * 60 + 30) * 60 * 1000);
  const dateISTStr = `${dateIST.getUTCFullYear()}-${String(dateIST.getUTCMonth() + 1).padStart(2, '0')}-${String(dateIST.getUTCDate()).padStart(2, '0')}`;

  return dateISTStr === istToday;
};

// ── SLOT HELPERS ──────────────────────────────────────────────────────────────

/**
 * Parse "HH:MM" time string into minutes from midnight.
 */
const timeToMinutes = (timeStr) => {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

/**
 * Format minutes from midnight into "HH:MM".
 */
const minutesToTime = (mins) => {
  const h = Math.floor(mins / 60).toString().padStart(2, '0');
  const m = (mins % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
};

/**
 * Get midnight UTC DateTime for a given date string (YYYY-MM-DD).
 */
export const toMidnightUTC = (dateStr) => {
  const d = new Date(dateStr);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

// ── STALE HOLD EXPIRY ─────────────────────────────────────────────────────────

/**
 * Lazily expire stale PENDING_PAYMENT appointments older than SLOT_HOLD_MINUTES.
 * Called before slot generation to ensure stale holds don't block fresh bookings.
 */
const expireStaleHolds = async (doctorId, scheduledDate) => {
  const expiryTime = new Date(Date.now() - SLOT_HOLD_MINUTES * 60 * 1000);
  await prisma.appointment.updateMany({
    where: {
      doctorId,
      scheduledDate,
      status: 'PENDING_PAYMENT',
      createdAt: { lt: expiryTime },
    },
    data: { status: 'CANCELLED', cancelReason: 'Slot hold expired after 10 minutes' },
  });
};

// ── SLOT GRID GENERATION ──────────────────────────────────────────────────────

/**
 * Get every slot for a doctor on a given date, each flagged booked/available/past.
 * Returns the full grid so the UI can render booked slots struck-through/disabled.
 *
 * @param {string} doctorId
 * @param {string} dateStr — "YYYY-MM-DD"
 * @returns {{ time: string, booked: boolean, isPast: boolean }[]} — sorted by time
 */
export const getSlotsWithStatus = async (doctorId, dateStr) => {
  const date = toMidnightUTC(dateStr);
  const dayOfWeek = date.getDay(); // 0=Sun, 6=Sat

  // Expire stale holds first (lazy expiry)
  await expireStaleHolds(doctorId, date);

  const availabilities = await prisma.doctorAvailability.findMany({
    where: { doctorId, dayOfWeek, isActive: true },
  });

  if (availabilities.length === 0) return [];

  const bookedAppointments = await prisma.appointment.findMany({
    where: {
      doctorId,
      scheduledDate: date,
      status: { notIn: ['CANCELLED'] },
    },
    select: { scheduledTime: true },
  });
  const bookedTimes = new Set(bookedAppointments.map((a) => a.scheduledTime));

  // For today: determine current IST time to mark past slots
  const checkingToday = isDateTodayIST(date);
  const currentIST = checkingToday ? nowIST_HHMM() : null;

  // De-dupe times across overlapping availability windows
  const seen = new Map(); // time -> { booked, isPast }
  for (const avail of availabilities) {
    const start = timeToMinutes(avail.startTime);
    const end = timeToMinutes(avail.endTime);
    const interval = avail.slotMinutes;

    for (let t = start; t + interval <= end; t += interval) {
      const slotTime = minutesToTime(t);
      if (!seen.has(slotTime)) {
        const isPast = checkingToday ? slotTime <= currentIST : false;
        const booked = bookedTimes.has(slotTime);
        seen.set(slotTime, { booked, isPast });
      }
    }
  }

  return [...seen.entries()]
    .map(([time, { booked, isPast }]) => ({ time, booked, isPast }))
    .sort((a, b) => a.time.localeCompare(b.time));
};

/**
 * Get available (not booked AND not past) slots for a doctor on a given date.
 * @param {string} doctorId
 * @param {string} dateStr — "YYYY-MM-DD"
 * @returns {string[]} — array of "HH:MM" slot strings
 */
export const getAvailableSlots = async (doctorId, dateStr) => {
  const slots = await getSlotsWithStatus(doctorId, dateStr);
  return slots.filter((s) => !s.booked && !s.isPast).map((s) => s.time);
};
