/**
 * middleware/validate.js — Request body validation middleware using Zod.
 *
 * Usage:
 *   router.post('/login', validate(loginSchema), loginController);
 */

import { ApiError } from '../utils/ApiError.js';

export const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse(req.body);
    req.body = parsed; // Use parsed & sanitized data
    next();
  } catch (err) {
    if (err.errors) {
      const formattedErrors = err.errors.reduce((acc, curr) => {
        const field = curr.path.join('.');
        acc[field] = curr.message;
        return acc;
      }, {});

      return next(ApiError.badRequest('Validation failed', formattedErrors));
    }
    next(err);
  }
};
