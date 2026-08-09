/**
 * services/passport.service.js — Healthcare Passport CRUD and consent enforcement.
 * Phase 7. addTimelineEvent() is an internal function called by appointments.service
 * and will be called by Phases 8-10 for Consultation/Prescription/LabReport events.
 */

import prisma from '../prisma/client.js';
import { ApiError } from '../utils/ApiError.js';
import { notifyPassportAccessChanged } from './notifications.service.js';

/**
 * Get or lazily create a patient's passport.
 * Idempotent: safe to call multiple times — creates exactly once.
 */
export const getOrCreatePassport = async (patientId) => {
  const existing = await prisma.healthcarePassport.findUnique({
    where: { patientId },
    include: { consents: { include: { hospital: true, doctor: { include: { user: true } } } } },
  });
  if (existing) return existing;

  return prisma.healthcarePassport.create({
    data: {
      patientId,
      allergies: [],
      medicalConditions: [],
      currentMedications: [],
    },
    include: { consents: { include: { hospital: true, doctor: { include: { user: true } } } } },
  });
};

/**
 * Update passport fields.
 */
export const updatePassport = async (patientId, { allergies, medicalConditions, currentMedications, notes }) => {
  const passport = await getOrCreatePassport(patientId);
  return prisma.healthcarePassport.update({
    where: { id: passport.id },
    data: {
      ...(allergies !== undefined && { allergies }),
      ...(medicalConditions !== undefined && { medicalConditions }),
      ...(currentMedications !== undefined && { currentMedications }),
      ...(notes !== undefined && { notes }),
    },
  });
};

/**
 * Grant consent to a hospital or specific doctor.
 * At least one of hospitalId or doctorId must be provided.
 */
export const grantConsent = async (patientId, { hospitalId, doctorId }) => {
  if (!hospitalId && !doctorId) {
    throw ApiError.badRequest('Must specify either a hospitalId or doctorId to grant consent to.');
  }

  const passport = await getOrCreatePassport(patientId);

  // Check for existing active (non-revoked) consent to the same target
  const existing = await prisma.passportConsent.findFirst({
    where: {
      passportId: passport.id,
      hospitalId: hospitalId || null,
      doctorId: doctorId || null,
      revokedAt: null,
    },
  });
  if (existing) {
    throw ApiError.conflict('Active consent already granted to this hospital/doctor.');
  }

  const consent = await prisma.passportConsent.create({
    data: {
      passportId: passport.id,
      hospitalId: hospitalId || null,
      doctorId: doctorId || null,
    },
    include: { hospital: true, doctor: { include: { user: true } } },
  });

  // Phase 15: Notify patient of new passport access grant
  try {
    const targetName = consent.hospital?.name || consent.doctor?.user?.fullName || 'a healthcare provider';
    await notifyPassportAccessChanged(patientId, targetName, true);
  } catch (notifErr) {
    console.warn('[Passport] Failed to send consent-granted notification:', notifErr.message);
  }

  return consent;
};

/**
 * Revoke a specific consent grant.
 */
export const revokeConsent = async (patientId, consentId) => {
  const passport = await prisma.healthcarePassport.findUnique({ where: { patientId } });
  if (!passport) throw ApiError.notFound('Passport not found.');

  const consent = await prisma.passportConsent.findUnique({ where: { id: consentId } });
  if (!consent || consent.passportId !== passport.id) {
    throw ApiError.notFound('Consent record not found.');
  }
  if (consent.revokedAt) {
    throw ApiError.badRequest('This consent has already been revoked.');
  }

  const revoked = await prisma.passportConsent.update({
    where: { id: consentId },
    data: { revokedAt: new Date() },
    include: { hospital: true, doctor: { include: { user: true } } },
  });

  // Phase 15: Notify patient of revocation
  try {
    const targetName = revoked.hospital?.name || revoked.doctor?.user?.fullName || 'a healthcare provider';
    await notifyPassportAccessChanged(patientId, targetName, false);
  } catch (notifErr) {
    console.warn('[Passport] Failed to send consent-revoked notification:', notifErr.message);
  }

  return revoked;
};

/**
 * Get paginated timeline events for a patient.
 */
export const getTimeline = async (patientId, { eventType, from, to, page = 1, limit = 20 } = {}) => {
  const passport = await prisma.healthcarePassport.findUnique({ where: { patientId } });
  if (!passport) return { events: [], total: 0 };

  const where = {
    passportId: passport.id,
    ...(eventType && { eventType }),
    ...(from || to ? {
      eventDate: {
        ...(from && { gte: new Date(from) }),
        ...(to && { lte: new Date(to) }),
      },
    } : {}),
  };

  const [events, total] = await Promise.all([
    prisma.medicalTimelineEvent.findMany({
      where,
      orderBy: { eventDate: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.medicalTimelineEvent.count({ where }),
  ]);

  return { events, total, page, limit };
};

/**
 * INTERNAL: Add a timeline event. Called by appointments, consultations, prescriptions, lab reports.
 * Phases 8-10 must call this when creating their respective records.
 */
export const addTimelineEvent = async (patientId, { eventType, sourceId, title, description, eventDate }) => {
  let passport = await prisma.healthcarePassport.findUnique({ where: { patientId } });
  if (!passport) {
    passport = await prisma.healthcarePassport.create({
      data: { patientId, allergies: [], medicalConditions: [], currentMedications: [] },
    });
  }

  return prisma.medicalTimelineEvent.create({
    data: {
      passportId: passport.id,
      eventType,
      sourceId,
      title,
      description: description || null,
      eventDate: eventDate ? new Date(eventDate) : new Date(),
    },
  });
};

/**
 * Verify a doctor has active consent from a patient.
 * Used to enforce consent on GET /api/passport/:patientId (doctor-facing).
 */
export const checkDoctorConsent = async (patientId, doctorId) => {
  const passport = await prisma.healthcarePassport.findUnique({ where: { patientId } });
  if (!passport) return false;

  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
  if (!doctor) return false;

  const consent = await prisma.passportConsent.findFirst({
    where: {
      passportId: passport.id,
      revokedAt: null,
      OR: [
        { doctorId },
        { hospitalId: doctor.hospitalId },
      ],
    },
  });

  return Boolean(consent);
};
