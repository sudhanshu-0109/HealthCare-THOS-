/**
 * services/slotGenerator.service.js — Generate available appointment slots for a doctor.
 * Applies 10-minute lazy expiry on abandoned PENDING_PAYMENT appointments.
 */

import prisma from '../prisma/client.js';

const SLOT_HOLD_MINUTES = 10;

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

/**
 * Get available slots for a doctor on a given date.
 * @param {string} doctorId
 * @param {string} dateStr — "YYYY-MM-DD"
 * @returns {string[]} — array of "HH:MM" slot strings that are still available
 */
export const getAvailableSlots = async (doctorId, dateStr) => {
  const date = toMidnightUTC(dateStr);
  const dayOfWeek = date.getDay(); // 0=Sun, 6=Sat

  // Expire stale holds first (lazy expiry)
  await expireStaleHolds(doctorId, date);

  // Fetch doctor availability for this day
  const availabilities = await prisma.doctorAvailability.findMany({
    where: { doctorId, dayOfWeek, isActive: true },
  });

  if (availabilities.length === 0) return [];

  // Collect all booked/held slots for this doctor/date
  const bookedAppointments = await prisma.appointment.findMany({
    where: {
      doctorId,
      scheduledDate: date,
      status: { in: ['CONFIRMED', 'PENDING_PAYMENT'] },
    },
    select: { scheduledTime: true },
  });
  const bookedTimes = new Set(bookedAppointments.map((a) => a.scheduledTime));

  // Generate candidate slots from all availability windows
  const slots = [];
  for (const avail of availabilities) {
    const start = timeToMinutes(avail.startTime);
    const end = timeToMinutes(avail.endTime);
    const interval = avail.slotMinutes;

    for (let t = start; t + interval <= end; t += interval) {
      const slotTime = minutesToTime(t);
      if (!bookedTimes.has(slotTime)) {
        slots.push(slotTime);
      }
    }
  }

  return slots.sort();
};
