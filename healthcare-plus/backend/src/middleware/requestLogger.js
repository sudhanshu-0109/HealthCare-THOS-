/**
 * requestLogger.js — HTTP request logging middleware.
 * Provides structured console logging in development. In production,
 * this is bypassed (morgan is used conditionally in app.js instead).
 */

export const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} → ${res.statusCode} (${duration}ms)`;

    if (res.statusCode >= 500) {
      console.error(log);
    } else if (res.statusCode >= 400) {
      console.warn(log);
    } else {
      console.log(log);
    }
  });

  next();
};
