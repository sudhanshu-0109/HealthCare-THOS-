/**
 * services/demo.service.js — Handles Demo Mode specific logic.
 */

import prisma from '../prisma/client.js';
import { env } from '../config/env.js';
import { recalculateQueueTokens } from './queue.service.js';
import { toMidnightUTC } from './slotGenerator.service.js';

let lastRolledDateStr = null;

/**
 * Checks if the day has rolled over. If so, updates unresolved demo appointments
 * to match Today's date, preventing them from becoming permanently 'past'.
 */
export const checkAndRollDemoAppointments = async () => {
  if (!env.DEMO_MODE) return;

  // Use India timezone for demo dates (en-CA format is YYYY-MM-DD)
  const todayStr = new Date().toLocaleString('en-CA', { timeZone: 'Asia/Kolkata' }).split(',')[0];
  
  if (lastRolledDateStr === todayStr) {
    return; // Already rolled for today
  }

  console.log(`[DEMO MODE] Checking rolling appointments for ${todayStr}...`);
  const today = toMidnightUTC(todayStr);

  try {
    // Find all unresolved appointments from previous days
    const unresolvedAppointments = await prisma.appointment.findMany({
      where: {
        scheduledDate: { lt: today },
        status: {
          in: ['PENDING_PAYMENT', 'CONFIRMED']
        }
      },
      select: { id: true, doctorId: true, scheduledDate: true }
    });

    if (unresolvedAppointments.length === 0) {
      lastRolledDateStr = todayStr;
      return;
    }

    console.log(`[DEMO MODE] Rolling ${unresolvedAppointments.length} unresolved appointments to ${todayStr}...`);

    // Group by doctor to recalculate queues properly after update
    const affectedDoctors = new Set(unresolvedAppointments.map(a => a.doctorId));

    // Update all unresolved appointments to Today
    await prisma.$transaction(async (tx) => {
      // 1. Update Appointment scheduledDate
      await tx.appointment.updateMany({
        where: { id: { in: unresolvedAppointments.map(a => a.id) } },
        data: { scheduledDate: today, updatedAt: new Date() }
      });

      // 2. Update QueueToken queueDate (QueueTokens are 1:1 with Appointments for the same date)
      await tx.queueToken.updateMany({
        where: { appointmentId: { in: unresolvedAppointments.map(a => a.id) } },
        data: { queueDate: today, updatedAt: new Date() }
      });
      
      // Note: We don't change the actual tokenNumber here, the recalculateQueueTokens will handle sequence if needed
    });

    // Recalculate queue tokens for each affected doctor for Today
    for (const doctorId of affectedDoctors) {
      await recalculateQueueTokens(doctorId, today);
    }

    lastRolledDateStr = todayStr;
    console.log(`[DEMO MODE] Rolling complete.`);
  } catch (error) {
    console.error(`[DEMO MODE] Failed to roll appointments:`, error);
  }
};
