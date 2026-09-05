import prisma from '../prisma/client.js';
import { ApiError } from '../utils/ApiError.js';
import { createStaffUser } from './auth.service.js';
import { calculateCrowdStatus } from './hospitalSearch.service.js';


export const getAllHospitals = async () => {
  const hospitals = await prisma.hospital.findMany({
    orderBy: { name: 'asc' },
    include: {
      departments: {
        where: { isActive: true },
        select: { id: true, name: true },
      },
      _count: {
        select: { doctors: true, appointments: true },
      },
      hospitalAdmins: {
        include: { user: true },
        take: 1,
      }
    },
  });
  
  return hospitals.map(h => {
    const admin = h.hospitalAdmins[0]?.user;
    return {
      ...h,
      status: h.isActive ? 'ACTIVE' : 'INACTIVE',
      doctors: h._count.doctors,
      patients: h._count.appointments,
      admin: admin ? { name: admin.fullName, email: admin.email } : null
    };
  });
};

export const getHospitals = async () => {
  const hospitals = await prisma.hospital.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    include: {
      departments: {
        where: { isActive: true },
        select: { id: true, name: true },
      },
      _count: {
        select: { doctors: true, appointments: true },
      },
      hospitalAdmins: {
        include: { user: true },
        take: 1,
      }
    },
  });

  // Enrich with real-time crowd status concurrently
  const enriched = await Promise.all(
    hospitals.map(async (h) => {
      const admin = h.hospitalAdmins[0]?.user;
      const crowd = await calculateCrowdStatus(h.id);
      return {
        ...h,
        crowd,
        status: 'ACTIVE',
        doctors: h._count.doctors,
        doctorCount: h._count.doctors,
        patients: h._count.appointments,
        lowestFee: null, // optional: calculate from doctors if needed
        admin: admin ? { name: admin.fullName, email: admin.email } : null,
      };
    })
  );

  return enriched;
};

export const getHospitalById = async (id, allowInactive = false) => {
  const hospital = await prisma.hospital.findUnique({
    where: { id },
    include: {
      departments: true,
    }
  });
  if (!hospital || (!hospital.isActive && !allowInactive)) {
    throw ApiError.notFound('Hospital not found.');
  }
  return hospital;
};

export const createHospital = async (data, superAdminId) => {
  const { adminEmail, adminName, ...hospitalData } = data;
  
  // Transaction to create hospital and its admin
  return prisma.$transaction(async (tx) => {
    const hospital = await tx.hospital.create({
      data: hospitalData
    });

    if (adminEmail && adminName) {
      // Create user within transaction? We can't directly use authService.createInvitedUser easily in tx unless we pass tx. 
      // It's safer to just create the user directly here if inside a transaction.
      // But authService.createInvitedUser does its own prisma calls.
      // Since createInvitedUser is async and sends an email, let's call it outside the transaction.
    }
    return hospital;
  });
};

export const createHospitalWithAdmin = async (data, superAdminId) => {
  const { adminEmail, adminName, ...hospitalData } = data;
  
  const hospital = await prisma.hospital.create({
    data: hospitalData
  });

  if (adminEmail && adminName) {
    await createStaffUser({
      email: adminEmail,
      fullName: adminName,
      role: 'HOSPITAL_ADMIN',
      hospitalId: hospital.id,
      invitedBy: superAdminId
    });
  }

  return hospital;
};

export const updateHospital = async (id, data, actorUserId) => {
  const updated = await prisma.hospital.update({
    where: { id },
    data
  });

  if (actorUserId) {
    try {
      const { recordAction } = await import('./auditLog.service.js');
      await recordAction(id, actorUserId, 'HOSPITAL_SETTINGS_CHANGED', 'Hospital', id, { changes: data });
    } catch (auditErr) {
      console.warn('[Hospital] Failed to write audit log:', auditErr.message);
    }
  }

  return updated;
};
