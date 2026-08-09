/**
 * services/availability.service.js — CRUD for DoctorAvailability.
 * Admin-managed: only HOSPITAL_ADMIN (of the doctor's hospital) can create/edit.
 */

import prisma from '../prisma/client.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Verify that a doctor belongs to the caller's hospital.
 */
const assertDoctorInHospital = async (doctorId, hospitalId) => {
  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
  if (!doctor || doctor.hospitalId !== hospitalId) {
    throw ApiError.forbidden('You can only manage availability for doctors in your hospital.');
  }
  return doctor;
};

/**
 * Get all availability slots for a doctor (public).
 */
export const getDoctorAvailability = async (doctorId) => {
  return prisma.doctorAvailability.findMany({
    where: { doctorId, isActive: true },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  });
};

/**
 * Create availability for a doctor (hospital admin only).
 */
export const createAvailability = async ({ doctorId, dayOfWeek, startTime, endTime, slotMinutes = 15 }, hospitalId, actorUserId) => {
  await assertDoctorInHospital(doctorId, hospitalId);

  const avail = await prisma.doctorAvailability.create({
    data: { doctorId, dayOfWeek, startTime, endTime, slotMinutes },
  });

  if (actorUserId) {
    try {
      const { recordAction } = await import('./auditLog.service.js');
      await recordAction(hospitalId, actorUserId, 'AVAILABILITY_CHANGED', 'DoctorAvailability', avail.id, { action: 'CREATE', doctorId, dayOfWeek, startTime, endTime });
    } catch (auditErr) {
      console.warn('[Availability] Failed to write audit log:', auditErr.message);
    }
  }

  return avail;
};

/**
 * Update an availability record (hospital admin only).
 */
export const updateAvailability = async (id, updates, hospitalId, actorUserId) => {
  const existing = await prisma.doctorAvailability.findUnique({
    where: { id },
    include: { doctor: true },
  });

  if (!existing) throw ApiError.notFound('Availability record not found.');
  if (existing.doctor.hospitalId !== hospitalId) {
    throw ApiError.forbidden('Cannot edit availability for a doctor outside your hospital.');
  }

  const updated = await prisma.doctorAvailability.update({
    where: { id },
    data: updates,
  });

  if (actorUserId) {
    try {
      const { recordAction } = await import('./auditLog.service.js');
      await recordAction(hospitalId, actorUserId, 'AVAILABILITY_CHANGED', 'DoctorAvailability', id, { action: 'UPDATE', updates });
    } catch (auditErr) {
      console.warn('[Availability] Failed to write audit log:', auditErr.message);
    }
  }

  return updated;
};

/**
 * Delete (deactivate) an availability record.
 */
export const deleteAvailability = async (id, hospitalId, actorUserId) => {
  const existing = await prisma.doctorAvailability.findUnique({
    where: { id },
    include: { doctor: true },
  });

  if (!existing) throw ApiError.notFound('Availability record not found.');
  if (existing.doctor.hospitalId !== hospitalId) {
    throw ApiError.forbidden('Cannot delete availability for a doctor outside your hospital.');
  }

  const updated = await prisma.doctorAvailability.update({
    where: { id },
    data: { isActive: false },
  });

  if (actorUserId) {
    try {
      const { recordAction } = await import('./auditLog.service.js');
      await recordAction(hospitalId, actorUserId, 'AVAILABILITY_CHANGED', 'DoctorAvailability', id, { action: 'DELETE' });
    } catch (auditErr) {
      console.warn('[Availability] Failed to write audit log:', auditErr.message);
    }
  }

  return updated;
};
