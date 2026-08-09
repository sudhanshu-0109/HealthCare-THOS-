/**
 * middleware/authenticate.js — JWT authentication middleware.
 * Verifies Bearer token in Authorization header and attaches req.user.
 */

import { verifyAccessToken } from '../utils/jwt.js';
import { ApiError } from '../utils/ApiError.js';
import prisma from '../prisma/client.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Authentication token required.');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isEmailVerified: true,
        doctor: { select: { hospitalId: true, departmentId: true } },
        hospitalAdmin: { select: { hospitalId: true } },
        receptionist: { select: { hospitalId: true } },
        pharmacist: { select: { hospitalId: true } },
        labStaff: { select: { hospitalId: true } },
        ambulanceDriver: { select: { hospitalId: true } },
      },
    });

    if (!user) {
      throw ApiError.unauthorized('User account no longer exists.');
    }

    // Attach minimal user object onto req
    req.user = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      hospitalId: user.doctor?.hospitalId || user.hospitalAdmin?.hospitalId || user.receptionist?.hospitalId || user.pharmacist?.hospitalId || user.labStaff?.hospitalId || user.ambulanceDriver?.hospitalId || null,
      departmentId: user.doctor?.departmentId || null,
    };

    next();
  } catch (err) {
    next(err);
  }
};
