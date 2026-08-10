import prisma from '../prisma/client.js';
import { createInvitedUser } from './auth.service.js';

const STAFF_ROLES = ['RECEPTIONIST', 'PHARMACIST', 'LAB_STAFF', 'AMBULANCE_DRIVER'];

/**
 * List hospital staff, optionally filtered to a single role. Returns a shape the
 * admin UI renders directly: { id, user: { fullName, email, status }, role,
 * isActive, plus ambulance fields for drivers }.
 */
export const getStaff = async (hospitalId, role) => {
  const roles = role && STAFF_ROLES.includes(role) ? [role] : STAFF_ROLES;

  const users = await prisma.user.findMany({
    where: { role: { in: roles } },
    include: {
      receptionist: true,
      pharmacist: true,
      labStaff: true,
      ambulanceDriver: { include: { ambulance: true } },
    },
  });

  return users
    .map((user) => {
      const profile =
        user.receptionist || user.pharmacist || user.labStaff || user.ambulanceDriver;
      if (!profile || profile.hospitalId !== hospitalId) return null;

      const ambulance = user.ambulanceDriver?.ambulance || null;
      return {
        id: user.id,
        role: user.role,
        user: {
          fullName: user.fullName,
          email: user.email,
          status: user.status,
        },
        createdAt: user.createdAt,
        // Driver-only fields (undefined for other roles → StaffList hides them).
        vehicleNumber: ambulance?.vehicleNumber,
        isActive: user.role === 'AMBULANCE_DRIVER' ? Boolean(ambulance?.isActive) : user.status === 'ACTIVE',
        isAvailable: user.role === 'AMBULANCE_DRIVER' ? Boolean(ambulance?.isOnline) : undefined,
      };
    })
    .filter(Boolean);
};

export const inviteStaff = async (hospitalId, data, invitedBy) => {
  const { email, fullName, role, vehicleNumber } = data;

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
    const driver = await prisma.ambulanceDriver.create({ data: { userId: user.id, hospitalId } });
    // Register the driver's ambulance so they can go online and be dispatched.
    if (vehicleNumber) {
      await prisma.ambulance.create({ data: { hospitalId, driverId: driver.id, vehicleNumber } });
    }
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
