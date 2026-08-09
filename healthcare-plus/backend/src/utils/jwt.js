/**
 * utils/jwt.js — JWT sign and verify utilities.
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env.js';
import { ApiError } from './ApiError.js';

// ── Access Token ──────────────────────────────────────────────────────────

/**
 * Sign an access token.
 * @param {{ sub: string, role: string }} payload
 * @returns {string}
 */
export const signAccessToken = (payload) =>
  jwt.sign(
    { ...payload, jti: crypto.randomUUID() },
    env.JWT_SECRET,
    {
      expiresIn: env.JWT_EXPIRES_IN || '15m',
      issuer: 'healthcare-plus',
      audience: 'healthcare-plus-client',
    }
  );

/**
 * Verify an access token.
 * @param {string} token
 * @returns {{ sub: string, role: string, iat: number, exp: number }}
 * @throws {ApiError} 401 on invalid/expired
 */
export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, env.JWT_SECRET, {
      issuer: 'healthcare-plus',
      audience: 'healthcare-plus-client',
    });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Access token has expired. Please refresh your session.');
    }
    throw ApiError.unauthorized('Invalid or malformed access token.');
  }
};

// ── Refresh Token ─────────────────────────────────────────────────────────

/**
 * Sign a refresh token with guaranteed unique UUID payload.
 * @param {{ sub: string }} payload
 * @returns {string}
 */
export const signRefreshToken = (payload) =>
  jwt.sign(
    { ...payload, jti: crypto.randomUUID() },
    env.JWT_REFRESH_SECRET,
    {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN || '30d',
      issuer: 'healthcare-plus',
      audience: 'healthcare-plus-refresh',
    }
  );

/**
 * Verify a refresh token.
 * @param {string} token
 * @returns {{ sub: string, iat: number, exp: number }}
 * @throws {ApiError} 401 on invalid/expired
 */
export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET, {
      issuer: 'healthcare-plus',
      audience: 'healthcare-plus-refresh',
    });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Refresh token has expired. Please log in again.');
    }
    throw ApiError.unauthorized('Invalid or malformed refresh token.');
  }
};
