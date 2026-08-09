/**
 * ApiError.js — Custom error class for consistent API error handling.
 *
 * Usage:
 *   throw ApiError.notFound('Hospital not found');
 *   throw new ApiError(422, 'Validation failed', validationErrors);
 */

export class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Human-readable error message
   * @param {any} [details] - Optional extra details (validation errors, etc.)
   */
  constructor(statusCode, message, details = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
    // Maintains proper stack trace (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  // ─── Static factory helpers ───────────────────────────────────────────────

  /** 400 Bad Request */
  static badRequest(message, details = null) {
    return new ApiError(400, message, details);
  }

  /** 401 Unauthorized */
  static unauthorized(message = 'Authentication required') {
    return new ApiError(401, message);
  }

  /** 403 Forbidden */
  static forbidden(message = 'You do not have permission to perform this action') {
    return new ApiError(403, message);
  }

  /** 404 Not Found */
  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }

  /** 409 Conflict */
  static conflict(message, details = null) {
    return new ApiError(409, message, details);
  }

  /** 422 Unprocessable Entity */
  static unprocessable(message, details = null) {
    return new ApiError(422, message, details);
  }

  /** 500 Internal Server Error */
  static internal(message = 'Internal server error') {
    return new ApiError(500, message);
  }
}
