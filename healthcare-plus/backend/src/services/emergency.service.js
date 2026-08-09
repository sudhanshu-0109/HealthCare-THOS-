import prisma from '../prisma/client.js';
import { searchHospitals } from './hospitalSearch.service.js';
import { dispatchRequest } from './emergencyDispatch.service.js';

export const createEmergencyRequest = async (patientId, data) => {
  const { latitude, longitude, hospitalId } = data;
  
  let targetHospitalId = hospitalId;
  
  if (!targetHospitalId) {
    const nearestHospitals = await searchHospitals(latitude, longitude, 100);
    if (nearestHospitals.length > 0) {
      targetHospitalId = nearestHospitals[0].id;
    }
  }

  const request = await prisma.emergencyRequest.create({
    data: {
      patientId,
      hospitalId: targetHospitalId,
      latitude,
      longitude,
      status: 'REQUESTED'
    }
  });

  // Phase 13: Begin dispatch immediately (non-blocking — dispatch updates socket rooms)
  dispatchRequest(request.id).catch((err) => {
    console.error('[EmergencyDispatch] Dispatch failed after create:', err.message);
  });

  return request;
};


export const getEmergencyRequests = async (hospitalId) => {
  return prisma.emergencyRequest.findMany({
    where: { hospitalId },
    orderBy: { createdAt: 'desc' },
    include: {
      patient: { 
        select: { 
          fullName: true, 
          email: true,
          patientProfile: { select: { phone: true } }
        } 
      }
    }
  });
};

export const updateEmergencyStatus = async (id, status) => {
  return prisma.emergencyRequest.update({
    where: { id },
    data: { status }
  });
};
