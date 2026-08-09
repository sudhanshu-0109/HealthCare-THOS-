import prisma from '../prisma/client.js';
import { createInvitedUser } from './auth.service.js';

export const getDoctors = async (filters) => {
  return prisma.doctor.findMany({
    where: { isActive: true, ...filters },
    include: {
      user: { select: { fullName: true, email: true } },
      department: { select: { name: true } },
    }
  });
};

export const inviteDoctor = async (hospitalId, data, invitedBy) => {
  // First, create the invited user
  const user = await createInvitedUser({
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
