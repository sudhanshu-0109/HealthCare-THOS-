/**
 * __tests__/auth.test.js — Auth module unit & integration tests.
 */

import { describe, test, expect, jest } from '@jest/globals';
import { hashPassword, comparePassword } from '../utils/hash.js';
import { signAccessToken, verifyAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { generateSecureToken, hashToken } from '../utils/tokenGenerator.js';
import { checkRole } from '../middleware/checkRole.js';
import { registerSchema, loginSchema, resetPasswordSchema } from '../controllers/auth.controller.js';

describe('Auth Unit & Integration Tests', () => {

  // ── Password Hashing Tests ─────────────────────────────────────────────
  describe('Password Hashing (hash.js)', () => {
    test('should hash password and verify correctly', async () => {
      const password = 'Password123!';
      const hash = await hashPassword(password);

      expect(hash).not.toBe(password);
      expect(hash).toMatch(/^\$2[ayb]\$.{56}$/); // bcrypt hash format

      const isValid = await comparePassword(password, hash);
      expect(isValid).toBe(true);

      const isInvalid = await comparePassword('WrongPassword', hash);
      expect(isInvalid).toBe(false);
    });
  });

  // ── JWT Tests ───────────────────────────────────────────────────────────
  describe('JWT Access & Refresh Tokens (jwt.js)', () => {
    test('should sign and verify access token correctly', () => {
      const payload = { sub: 'user-123', role: 'PATIENT' };
      const token = signAccessToken(payload);

      expect(typeof token).toBe('string');

      const decoded = verifyAccessToken(token);
      expect(decoded.sub).toBe('user-123');
      expect(decoded.role).toBe('PATIENT');
      expect(decoded.iss).toBe('healthcare-plus');
    });

    test('should sign and verify refresh token correctly', () => {
      const payload = { sub: 'user-456' };
      const token = signRefreshToken(payload);

      expect(typeof token).toBe('string');

      const decoded = verifyRefreshToken(token);
      expect(decoded.sub).toBe('user-456');
      expect(decoded.aud).toBe('healthcare-plus-refresh');
    });

    test('should throw 401 ApiError for invalid token', () => {
      expect(() => verifyAccessToken('invalid.jwt.token')).toThrow();
    });
  });

  // ── Token Generator Tests ───────────────────────────────────────────────
  describe('Secure Token Generator (tokenGenerator.js)', () => {
    test('should generate secure random hex token and hash it', () => {
      const token = generateSecureToken(32);
      expect(token).toHaveLength(64); // 32 bytes = 64 hex chars

      const hash = hashToken(token);
      expect(hash).toHaveLength(64); // SHA-256 = 64 hex chars
      expect(hash).not.toBe(token);

      // Deterministic hash check
      expect(hashToken(token)).toBe(hash);
    });
  });

  // ── RBAC Middleware Tests ───────────────────────────────────────────────
  describe('checkRole Middleware (checkRole.js)', () => {
    test('should call next() if user role is allowed', () => {
      const req = { user: { role: 'PATIENT' } };
      const res = {};
      const next = jest.fn();

      const middleware = checkRole('PATIENT', 'SUPER_ADMIN');
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    test('should pass 403 ApiError if user role is not allowed', () => {
      const req = { user: { role: 'PATIENT' } };
      const res = {};
      const next = jest.fn();

      const middleware = checkRole('HOSPITAL_ADMIN', 'SUPER_ADMIN');
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
        })
      );
    });

    test('should pass 401 ApiError if req.user is missing', () => {
      const req = {};
      const res = {};
      const next = jest.fn();

      const middleware = checkRole('PATIENT');
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
        })
      );
    });
  });

  // ── Zod Schema Validation Tests ─────────────────────────────────────────
  describe('Zod Validation Schemas', () => {
    test('registerSchema should validate valid input and reject invalid password', () => {
      const valid = {
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        password: 'Password123!',
      };
      expect(() => registerSchema.parse(valid)).not.toThrow();

      const invalidPassword = {
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        password: 'weak',
      };
      expect(() => registerSchema.parse(invalidPassword)).toThrow();
    });

    test('loginSchema should validate valid email & password', () => {
      const valid = { email: 'user@example.com', password: 'secret' };
      expect(() => loginSchema.parse(valid)).not.toThrow();

      const invalidEmail = { email: 'invalid-email', password: 'secret' };
      expect(() => loginSchema.parse(invalidEmail)).toThrow();
    });

    test('resetPasswordSchema should enforce password complexity', () => {
      const valid = { token: 'valid-token-123', newPassword: 'NewPassword123!' };
      expect(() => resetPasswordSchema.parse(valid)).not.toThrow();

      const weakNewPassword = { token: 'valid-token-123', newPassword: 'simple' };
      expect(() => resetPasswordSchema.parse(weakNewPassword)).toThrow();
    });
  });

});
