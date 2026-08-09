/**
 * services/hospitalSearch.service.js — Hospital search with real crowd status (Phase 14).
 * Phase 4 left a TODO for real crowd status calculation. Phase 14 closes it.
 *
 * Crowd status is based on real queue load:
 *   ratio = WAITING token count / max(active doctors, 1)
 *   LOW if ratio <= 2, MODERATE if ratio <= 5, HIGH otherwise
 */

import prisma from '../prisma/client.js';
import { calculateDistance } from '../utils/geo.js';

/**
 * Calculate real crowd status for a hospital based on current queue load.
 * Exported for use in analytics and testing.
 *
 * @param {string} hospitalId
 * @returns {'low' | 'moderate' | 'high'}
 */
export const calculateCrowdStatus = async (hospitalId) => {
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const [waitingCount, activeDoctors] = await Promise.all([
    prisma.queueToken.count({
      where: {
        hospitalId,
        status: 'WAITING',
        queueDate: { gte: todayStart },
      },
    }),
    prisma.doctor.count({
      where: { hospitalId, isActive: true },
    }),
  ]);

  const ratio = waitingCount / Math.max(activeDoctors, 1);

  if (ratio <= 2) return 'low';
  if (ratio <= 5) return 'moderate';
  return 'high';
};

export const searchHospitals = async (lat, lng, radiusKm = 50) => {
  const hospitals = await prisma.hospital.findMany({
    where: { isActive: true },
    include: {
      departments: true,
    },
  });

  // Calculate real crowd status for all hospitals concurrently
  const withDistanceAndCrowd = await Promise.all(
    hospitals.map(async (h) => {
      const distance = calculateDistance(lat, lng, h.latitude, h.longitude);
      const crowdStatus = await calculateCrowdStatus(h.id);
      return { ...h, distance, crowdStatus };
    })
  );

  return withDistanceAndCrowd
    .filter((h) => h.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance);
};
