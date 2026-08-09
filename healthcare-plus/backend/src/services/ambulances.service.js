/**
 * services/ambulances.service.js — Ambulance fleet management (Phase 13).
 * Ambulances are hospital-scoped but drivers go online/offline across the system.
 */

import prisma from '../prisma/client.js';
import { ApiError } from '../utils/ApiError.js';

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
 */
export const goOnline = async (driverId, { latitude, longitude }) => {
  const ambulance = await prisma.ambulance.findUnique({ where: { driverId } });
  if (!ambulance) throw ApiError.notFound('No ambulance assigned to this driver.');
  if (!ambulance.isActive) throw ApiError.badRequest('Your ambulance is deactivated by admin.');

  return prisma.ambulance.update({
    where: { driverId },
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
 */
export const goOffline = async (driverId) => {
  const ambulance = await prisma.ambulance.findUnique({ where: { driverId } });
  if (!ambulance) throw ApiError.notFound('No ambulance assigned to this driver.');

  return prisma.ambulance.update({
    where: { driverId },
    data: { isOnline: false },
  });
};

/**
 * Update driver's current location.
 * Returns the ambulanceId for the caller to use in socket emit.
 */
export const updateDriverLocation = async (driverId, { latitude, longitude }) => {
  const ambulance = await prisma.ambulance.findUnique({ where: { driverId } });
  if (!ambulance) throw ApiError.notFound('No ambulance assigned to this driver.');

  return prisma.ambulance.update({
    where: { driverId },
    data: {
      currentLatitude: latitude,
      currentLongitude: longitude,
      locationUpdatedAt: new Date(),
    },
  });
};
