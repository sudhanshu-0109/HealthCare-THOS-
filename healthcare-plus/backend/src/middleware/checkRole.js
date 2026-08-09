/**
 * middleware/checkRole.js — Role-based access control (RBAC) middleware factory.
 *
 * Usage:
 *   router.get('/admin', authenticate, checkRole('HOSPITAL_ADMIN', 'SUPER_ADMIN'), handler);
 */

import { ApiError } from '../utils/ApiError.js';

export const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required before checking permissions.'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Access denied. Role '${req.user.role}' is not authorized to access this resource.`
        )
      );
    }

    next();
  };
};
