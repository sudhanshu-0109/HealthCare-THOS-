/**
 * notFound.js — Catches requests to undefined routes and forwards a 404 ApiError.
 * Must be mounted AFTER all route definitions and BEFORE the errorHandler.
 */

import { ApiError } from '../utils/ApiError.js';

export const notFound = (req, res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};
