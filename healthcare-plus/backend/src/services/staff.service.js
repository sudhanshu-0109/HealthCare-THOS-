import prisma from '../prisma/client.js';
import { createInvitedUser } from './auth.service.js';

export const getStaff = async (hospitalId) => {
  const users = await prisma.user.findMany({
    where: { 
      role: { in: ['RECEPTIONIST', 'PHARMACIST', 'LAB_STAFF', 'AMBULANCE_DRIVER'] },
    },
    include: {
      receptionist: true,
      pharmacist: true,
      labStaff: true,
      ambulanceDriver: true,
    }
  });

  return users.filter(user => {
    const profile = user.receptionist || user.pharmacist || user.labStaff || user.ambulanceDriver;
    return profile && profile.hospitalId === hospitalId;
  }).map(user => ({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
  }));
};

export const inviteStaff = async (hospitalId, data, invitedBy) => {
  const { email, fullName, role } = data;
  
  const user = await createInvitedUser({
    email,
    fullName,
    role,
    hospitalId,
    invitedBy
  });

  if (role === 'RECEPTIONIST') {
    await prisma.receptionist.create({ data: { userId: user.id, hospitalId } });
  } else if (role === 'PHARMACIST') {
    await prisma.pharmacist.create({ data: { userId: user.id, hospitalId } });
  } else if (role === 'LAB_STAFF') {
    await prisma.labStaff.create({ data: { userId: user.id, hospitalId } });
  } else if (role === 'AMBULANCE_DRIVER') {
    await prisma.ambulanceDriver.create({ data: { userId: user.id, hospitalId } });
  }

  // Phase 14: Audit log (fire-and-forget)
  try {
    const { recordAction } = await import('./auditLog.service.js');
    await recordAction(hospitalId, invitedBy, 'STAFF_INVITED', 'User', user.id, { role, email });
  } catch (auditErr) {
    console.warn('[Staff] Failed to write audit log:', auditErr.message);
  }

  return user;
};
