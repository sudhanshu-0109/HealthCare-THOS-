/**
 * services/analytics.service.js — Hospital analytics and reporting (Phase 14).
 * All queries are hospital-scoped. No cross-hospital data is returned.
 */

import prisma from '../prisma/client.js';
import { getHospitalRevenue } from './bills.service.js';

/**
 * Dashboard summary — today's live counts.
 */
export const getDashboardSummary = async (hospitalId) => {
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const now = new Date();

  const [
    todayAppointments,
    distinctPatientsToday,
    activeDoctors,
    waitingTokenCount,
    revenue,
    pendingPharmacyOrders,
    pendingLabRequests,
    activeEmergencies,
  ] = await Promise.all([
    // Appointments confirmed today
    prisma.appointment.count({
      where: {
        hospitalId,
        status: 'CONFIRMED',
        scheduledDate: { gte: todayStart },
      },
    }),

    // Distinct patients seen today (confirmed appointments)
    prisma.appointment.findMany({
      where: { hospitalId, status: 'CONFIRMED', scheduledDate: { gte: todayStart } },
      select: { patientId: true },
      distinct: ['patientId'],
    }).then((res) => res.length),

    // Active doctors
    prisma.doctor.count({ where: { hospitalId, isActive: true } }),

    // WAITING queue tokens today
    prisma.queueToken.count({
      where: { hospitalId, status: 'WAITING', queueDate: { gte: todayStart } },
    }),

    // Today's revenue
    getHospitalRevenue(hospitalId, { from: todayStart.toISOString() }),

    // Pending pharmacy orders
    prisma.pharmacyOrder.count({ where: { hospitalId, status: 'PENDING' } }),

    // Pending lab requests
    prisma.labRequest.count({ where: { hospitalId, status: 'PENDING' } }),

    // Active emergency requests (non-terminal)
    prisma.emergencyRequest.count({
      where: {
        hospitalId,
        status: { notIn: ['ARRIVED', 'CANCELLED', 'NO_DRIVER_FALLBACK'] },
      },
    }),
  ]);

  return {
    todayAppointments,
    distinctPatientsToday,
    activeDoctors,
    waitingTokenCount,
    todayRevenue: revenue.total,
    pendingPharmacyOrders,
    pendingLabRequests,
    activeEmergencies,
    generatedAt: now.toISOString(),
  };
};

/**
 * Appointment trends — grouped by day or month.
 * @param {string} hospitalId
 * @param {{ period?: 'day'|'month', from?: string, to?: string }} options
 */
export const getAppointmentTrends = async (hospitalId, { from, to } = {}) => {
  const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const toDate = to ? new Date(to) : new Date();

  // Use Prisma raw groupBy on scheduledDate (truncated to date)
  const results = await prisma.appointment.findMany({
    where: {
      hospitalId,
      scheduledDate: { gte: fromDate, lte: toDate },
      status: { in: ['CONFIRMED', 'COMPLETED'] },
    },
    select: { scheduledDate: true },
    orderBy: { scheduledDate: 'asc' },
  });

  // Group by date string client-side (avoids raw SQL for cross-DB compat)
  const grouped = {};
  for (const apt of results) {
    const key = apt.scheduledDate.toISOString().split('T')[0];
    grouped[key] = (grouped[key] || 0) + 1;
  }

  return Object.entries(grouped).map(([date, count]) => ({ date, count }));
};

/**
 * Department usage — appointments grouped by department.
 */
export const getDepartmentUsage = async (hospitalId, { from, to } = {}) => {
  const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const toDate = to ? new Date(to) : new Date();

  const grouped = await prisma.appointment.groupBy({
    by: ['departmentId'],
    where: {
      hospitalId,
      scheduledDate: { gte: fromDate, lte: toDate },
      status: { in: ['CONFIRMED', 'COMPLETED'] },
    },
    _count: { _all: true },
    orderBy: { _count: { departmentId: 'desc' } },
  });

  // Enrich with department names
  const deptIds = grouped.map((g) => g.departmentId);
  const departments = await prisma.department.findMany({
    where: { id: { in: deptIds } },
    select: { id: true, name: true },
  });

  const deptMap = Object.fromEntries(departments.map((d) => [d.id, d.name]));

  return grouped.map((g) => ({
    departmentId: g.departmentId,
    departmentName: deptMap[g.departmentId] || 'Unknown',
    count: g._count._all,
  }));
};

/**
 * Doctor activity — consultations completed per doctor.
 */
export const getDoctorActivity = async (hospitalId, { from, to } = {}) => {
  const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const toDate = to ? new Date(to) : new Date();

  const grouped = await prisma.consultation.groupBy({
    by: ['doctorId'],
    where: {
      hospitalId,
      createdAt: { gte: fromDate, lte: toDate },
    },
    _count: { _all: true },
    orderBy: { _count: { doctorId: 'desc' } },
  });

  const doctorIds = grouped.map((g) => g.doctorId);
  const doctors = await prisma.doctor.findMany({
    where: { id: { in: doctorIds } },
    include: { user: { select: { fullName: true } } },
  });

  const doctorMap = Object.fromEntries(doctors.map((d) => [d.id, d.user?.fullName || 'Unknown']));

  return grouped.map((g) => ({
    doctorId: g.doctorId,
    doctorName: doctorMap[g.doctorId],
    consultations: g._count._all,
  }));
};

/**
 * Queue load stats — average wait time based on QueueToken timestamps.
 */
export const getQueueLoadStats = async (hospitalId, { from, to } = {}) => {
  const fromDate = from ? new Date(from) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const toDate = to ? new Date(to) : new Date();

  const tokens = await prisma.queueToken.findMany({
    where: {
      hospitalId,
      status: { in: ['COMPLETED', 'DONE'] },
      queueDate: { gte: fromDate, lte: toDate },
      calledAt: { not: null },
    },
    select: { createdAt: true, calledAt: true },
  });

  if (tokens.length === 0) {
    return { avgWaitMinutes: null, tokenCount: 0, from: fromDate, to: toDate };
  }

  const totalWaitMs = tokens.reduce((sum, t) => {
    return sum + (new Date(t.calledAt) - new Date(t.createdAt));
  }, 0);

  return {
    avgWaitMinutes: Math.round(totalWaitMs / tokens.length / 60000),
    tokenCount: tokens.length,
    from: fromDate,
    to: toDate,
  };
};

/**
 * Emergency stats — request count, avg acceptance time, fallback rate.
 */
export const getEmergencyStats = async (hospitalId, { from, to } = {}) => {
  const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const toDate = to ? new Date(to) : new Date();

  const [total, fallbacks, accepted] = await Promise.all([
    prisma.emergencyRequest.count({
      where: { hospitalId, createdAt: { gte: fromDate, lte: toDate } },
    }),
    prisma.emergencyRequest.count({
      where: { hospitalId, status: 'NO_DRIVER_FALLBACK', createdAt: { gte: fromDate, lte: toDate } },
    }),
    prisma.emergencyRequest.findMany({
      where: {
        hospitalId,
        acceptedAt: { not: null },
        createdAt: { gte: fromDate, lte: toDate },
      },
      select: { createdAt: true, acceptedAt: true },
    }),
  ]);

  const avgAcceptanceMs = accepted.length
    ? accepted.reduce((sum, r) => sum + (new Date(r.acceptedAt) - new Date(r.createdAt)), 0) / accepted.length
    : null;

  return {
    total,
    fallbackCount: fallbacks,
    fallbackRate: total > 0 ? (fallbacks / total).toFixed(3) : 0,
    avgAcceptanceSeconds: avgAcceptanceMs ? Math.round(avgAcceptanceMs / 1000) : null,
    from: fromDate,
    to: toDate,
  };
};
