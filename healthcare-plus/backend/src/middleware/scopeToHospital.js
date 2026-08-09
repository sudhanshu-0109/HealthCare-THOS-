/**
 * middleware/scopeToHospital.js — RBAC hospital isolation middleware.
 * Enforces that requests for hospital-owned resources are scoped to the authenticated
 * user's hospital. Super Admins are exempt but must explicitly pass hospital context
 * if modifying hospital-specific data.
 */

import { ApiError } from '../utils/ApiError.js';

export const scopeToHospital = (req, res, next) => {
  if (!req.user) {
    return next(ApiError.unauthorized('Authentication required to verify hospital scope.'));
  }

  const { role, hospitalId } = req.user;

  // SUPER_ADMIN is exempt from implicit scoping.
  // They manage data across hospitals and must provide explicit context (e.g. body.hospitalId or params).
  if (role === 'SUPER_ADMIN') {
    req.hospitalId = null;
    return next();
  }

  // For hospital-scoped roles, they MUST belong to a hospital.
  const scopedRoles = [
    'HOSPITAL_ADMIN',
    'RECEPTIONIST',
    'PHARMACIST',
    'LAB_STAFF',
    'DOCTOR',
    'AMBULANCE_DRIVER'
  ];

  if (scopedRoles.includes(role)) {
    if (!hospitalId) {
      return next(ApiError.forbidden('Your account is not linked to any specific hospital.'));
    }
    
    // Attach the verified hospital scope to the request
    // All subsequent controllers/services must use this `req.hospitalId` for DB queries
    // to guarantee cross-hospital isolation.
    req.hospitalId = hospitalId;
    return next();
  }

  // PATIENT role typically doesn't use this middleware, but if they hit a scoped route:
  return next(ApiError.forbidden('You do not have permission to access hospital-scoped resources.'));
};
