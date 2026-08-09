/**
 * services/dashboard.service.js — Patient dashboard aggregation (Phase 7).
 * Returns a single summary object with all widgets.
 */

import prisma from '../prisma/client.js';

/**
 * Get the patient dashboard summary.
 * Includes: upcoming appointments, current queue token, recent emergencies,
 * passport summary, and honest "coming soon" placeholders for Phases 9/10/12.
 */
export const getPatientDashboardSummary = async (patientId) => {
  const now = new Date();
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const [upcomingAppointments, currentQueue, recentEmergencies, passport] = await Promise.all([
    // Next 5 confirmed future appointments
    prisma.appointment.findMany({
      where: {
        patientId,
        status: 'CONFIRMED',
        scheduledDate: { gte: todayStart },
      },
      select: {
        id: true,
        scheduledDate: true,
        scheduledTime: true,
        status: true,
        doctor: {
          select: {
            specialization: true,
            user: { select: { fullName: true } },
            hospital: { select: { name: true } },
            department: { select: { name: true } },
          },
        },
        queueToken: { select: { id: true, tokenNumber: true, status: true } },
      },
      orderBy: [{ scheduledDate: 'asc' }, { scheduledTime: 'asc' }],
      take: 5,
    }),

    // Active queue token for today (WAITING/CALLED/IN_PROGRESS)
    prisma.queueToken.findFirst({
      where: {
        appointment: { patientId },
        queueDate: { gte: todayStart },
        status: { in: ['WAITING', 'CALLED', 'IN_PROGRESS'] },
      },
      select: {
        id: true,
        tokenNumber: true,
        status: true,
        appointmentId: true,
        doctor: { select: { user: { select: { fullName: true } } } },
      },
    }),

    // Last 3 emergency requests
    prisma.emergencyRequest.findMany({
      where: { patientId },
      select: {
        id: true,
        status: true,
        createdAt: true,
        hospital: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
    }),

    // Passport summary (just counts, not full detail)
    prisma.healthcarePassport.findUnique({
      where: { patientId },
      select: {
        id: true,
        allergies: true,
        medicalConditions: true,
        currentMedications: true,
      },
    }),
  ]);

  return {
    upcomingAppointments,
    currentQueue,
    recentEmergencies,
    passportSummary: passport
      ? {
          hasPassport: true,
          allergyCount: passport.allergies.length,
          conditionCount: passport.medicalConditions.length,
          medicationCount: passport.currentMedications.length,
        }
      : { hasPassport: false, allergyCount: 0, conditionCount: 0, medicationCount: 0 },

    // Honest "coming soon" placeholders — do NOT return empty arrays that could be
    // mistaken for "genuinely zero records"
    prescriptions: { available: false, phase: 9 },
    labReports: { available: false, phase: 10 },
    billingSummary: { available: false, phase: 12 },
  };
};
