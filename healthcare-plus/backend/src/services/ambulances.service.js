/**
 * services/ambulances.service.js — Ambulance fleet management (Phase 13).
 * Ambulances are hospital-scoped but drivers go online/offline across the system.
 */

import prisma from '../prisma/client.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Resolve a driver's ambulance from their USER id.
 * NOTE: Ambulance.driverId references AmbulanceDriver.id — NOT the User id — so a
 * driver's ambulance must be looked up through the driver relation, never by the
 * raw authenticated user id.
 */
const findAmbulanceByUserId = (userId, include) =>
  prisma.ambulance.findFirst({ where: { driver: { userId } }, include });

/**
 * Register an ambulance for a hospital (hospital admin).
 */
export const registerAmbulance = async (hospitalId, { driverId, vehicleNumber }) => {
  // Verify driver belongs to this hospital
  const driver = await prisma.ambulanceDriver.findUnique({
    where: { id: driverId },
  });
  if (!driver) throw ApiError.notFound('Ambulance driver not found.');
  if (driver.hospitalId !== hospitalId) {
    throw ApiError.forbidden('Driver does not belong to your hospital.');
  }

  // Check if driver already has an ambulance
  const existing = await prisma.ambulance.findUnique({ where: { driverId } });
  if (existing) throw ApiError.conflict('This driver is already assigned an ambulance.');

  return prisma.ambulance.create({
    data: { hospitalId, driverId, vehicleNumber },
    include: { driver: { include: { user: { select: { fullName: true } } } } },
  });
};

/**
 * Get all ambulances for a hospital.
 */
export const getHospitalAmbulances = async (hospitalId) => {
  return prisma.ambulance.findMany({
    where: { hospitalId },
    include: {
      driver: { include: { user: { select: { fullName: true, email: true } } } },
    },
    orderBy: { isActive: 'desc' },
  });
};

/**
 * Activate or deactivate an ambulance (hospital admin).
 */
export const setAmbulanceStatus = async (ambulanceId, isActive, hospitalId) => {
  const ambulance = await prisma.ambulance.findUnique({ where: { id: ambulanceId } });
  if (!ambulance) throw ApiError.notFound('Ambulance not found.');
  if (ambulance.hospitalId !== hospitalId) throw ApiError.forbidden('Ambulance does not belong to your hospital.');

  return prisma.ambulance.update({
    where: { id: ambulanceId },
    data: { isActive },
  });
};

/**
 * Driver goes online — marks ambulance online with initial location.
 * @param {string} userId — the authenticated driver's User id.
 */
export const goOnline = async (userId, { latitude, longitude }) => {
  const ambulance = await findAmbulanceByUserId(userId);
  if (!ambulance) throw ApiError.notFound('No ambulance assigned to this driver.');
  if (!ambulance.isActive) throw ApiError.badRequest('Your ambulance is deactivated by admin.');

  return prisma.ambulance.update({
    where: { id: ambulance.id },
    data: {
      isOnline: true,
      currentLatitude: latitude,
      currentLongitude: longitude,
      locationUpdatedAt: new Date(),
    },
  });
};

/**
 * Driver goes offline.
 * @param {string} userId — the authenticated driver's User id.
 */
export const goOffline = async (userId) => {
  const ambulance = await findAmbulanceByUserId(userId);
  if (!ambulance) throw ApiError.notFound('No ambulance assigned to this driver.');

  return prisma.ambulance.update({
    where: { id: ambulance.id },
    data: { isOnline: false },
  });
};

/**
 * Update driver's current location.
 * @param {string} userId — the authenticated driver's User id.
 */
export const updateDriverLocation = async (userId, { latitude, longitude }) => {
  const ambulance = await findAmbulanceByUserId(userId);
  if (!ambulance) throw ApiError.notFound('No ambulance assigned to this driver.');

  return prisma.ambulance.update({
    where: { id: ambulance.id },
    data: {
      currentLatitude: latitude,
      currentLongitude: longitude,
      locationUpdatedAt: new Date(),
    },
  });
};
