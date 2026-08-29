import prisma from '../prisma/client.js';
import { createStaffUser } from './auth.service.js';

export const getDoctors = async (filters) => {
  return prisma.doctor.findMany({
    where: { 
      isActive: true, 
      hospital: { isActive: true },
      ...filters 
    },
    include: {
      user: { select: { fullName: true, email: true } },
      department: { select: { name: true } },
      hospital: { select: { id: true, name: true } },
    }
  });
};

export const inviteDoctor = async (hospitalId, data, invitedBy) => {
  // First, create the active staff user
  const user = await createStaffUser({
    email: data.email,
    fullName: data.fullName,
    role: 'DOCTOR',
    hospitalId,
    invitedBy
  });

  // Then create doctor profile
  const doctor = await prisma.doctor.create({
    data: {
      userId: user.id,
      hospitalId,
      departmentId: data.departmentId,
      specialization: data.specialization,
      experienceYears: data.experienceYears,
      consultationFee: data.consultationFee,
    }
  });

  // Phase 14: Audit log (fire-and-forget)
  try {
    const { recordAction } = await import('./auditLog.service.js');
    await recordAction(hospitalId, invitedBy, 'DOCTOR_ADDED', 'Doctor', doctor.id, { specialization: data.specialization });
  } catch (auditErr) {
    console.warn('[Doctor] Failed to write audit log:', auditErr.message);
  }

  return { user, doctor };
};
