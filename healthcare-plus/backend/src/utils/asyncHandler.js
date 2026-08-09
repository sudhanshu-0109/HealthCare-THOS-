/**
 * asyncHandler.js — Wraps async route handlers to forward rejected promises
 * to Express's next() error handler, eliminating try/catch boilerplate.
 *
 * Usage:
 *   router.get('/example', asyncHandler(async (req, res) => {
 *     const data = await someAsyncOperation();
 *     res.json({ success: true, data });
 *   }));
 */

/**
 * @param {Function} fn - Async route handler function
 * @returns {Function} Express middleware that catches async errors
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
