/**
 * utils/tokenGenerator.js — Cryptographically secure random token & OTP generator.
 */

import crypto from 'crypto';

/**
 * Generate a 6-digit numeric OTP code (e.g., "482915").
 * @returns {string} 6-digit numeric string
 */
export const generateNumericOTP = () => {
  const number = crypto.randomInt(100000, 999999);
  return number.toString();
};

/**
 * Generate a cryptographically secure random hex token.
 * @param {number} bytes — number of random bytes (default: 32 → 64 char hex string)
 * @returns {string} hex-encoded random token
 */
export const generateSecureToken = (bytes = 32) =>
  crypto.randomBytes(bytes).toString('hex');

/**
 * Hash a token or OTP for safe database storage.
 * @param {string} token — plain token or OTP
 * @returns {string} SHA-256 hex hash
 */
export const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');
