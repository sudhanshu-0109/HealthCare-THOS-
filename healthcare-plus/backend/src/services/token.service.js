/**
 * services/token.service.js — DB-backed auth token & OTP lifecycle management.
 */

import prisma from '../prisma/client.js';
import { generateNumericOTP, hashToken } from '../utils/tokenGenerator.js';
import { signAccessToken, signRefreshToken } from '../utils/jwt.js';

// ── Verification OTP ──────────────────────────────────────────────────────

/**
 * Create a new 6-digit email verification OTP (15 min expiry).
 * @param {string} userId
 * @returns {string} 6-digit OTP code (plain string)
 */
export const createVerificationToken = async (userId) => {
  await prisma.verificationToken.deleteMany({ where: { userId } });

  const otp = generateNumericOTP();
  const hashed = hashToken(otp);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

  await prisma.verificationToken.create({
    data: { userId, token: hashed, expiresAt },
  });

  return otp; // Return 6-digit OTP code
};

/**
 * Find and validate a verification OTP or Token.
 * @param {string} plainOtpOrToken
 */
export const findVerificationToken = async (plainOtpOrToken) => {
  const hashed = hashToken(plainOtpOrToken.trim());
  return prisma.verificationToken.findUnique({
    where: { token: hashed },
    include: { user: true },
  });
};

/**
 * Delete a verification token after use.
 * @param {string} id
 */
export const deleteVerificationToken = async (id) => {
  await prisma.verificationToken.delete({ where: { id } });
};

// ── Password Reset OTP ────────────────────────────────────────────────────

/**
 * Create a new 6-digit password reset OTP (15 min expiry).
 * @param {string} userId
 * @returns {string} 6-digit OTP code
 */
export const createPasswordResetToken = async (userId) => {
  await prisma.passwordResetToken.deleteMany({ where: { userId } });

  const otp = generateNumericOTP();
  const hashed = hashToken(otp);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

  await prisma.passwordResetToken.create({
    data: { userId, token: hashed, expiresAt },
  });

  return otp;
};

/**
 * Find a password reset OTP.
 * @param {string} plainOtpOrToken
 */
export const findPasswordResetToken = async (plainOtpOrToken) => {
  const hashed = hashToken(plainOtpOrToken.trim());
  return prisma.passwordResetToken.findUnique({
    where: { token: hashed },
    include: { user: true },
  });
};

/**
 * Mark a reset token as used.
 * @param {string} id
 */
export const markResetTokenUsed = async (id) => {
  await prisma.passwordResetToken.update({
    where: { id },
    data: { usedAt: new Date() },
  });
};

// ── Invite Token ─────────────────────────────────────────────────────────

export const createInviteToken = async (userId, invitedBy) => {
  const { randomBytes } = await import('crypto');
  const rawToken = randomBytes(32).toString('hex');
  const hashed = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours

  await prisma.inviteToken.create({
    data: { userId, token: hashed, invitedBy, expiresAt },
  });

  return rawToken;
};

export const findInviteToken = async (plainToken) => {
  const hashed = hashToken(plainToken.trim());
  return prisma.inviteToken.findUnique({
    where: { token: hashed },
    include: { user: true },
  });
};

export const deleteInviteToken = async (id) => {
  await prisma.inviteToken.delete({ where: { id } });
};

// ── Refresh Token ─────────────────────────────────────────────────────────

export const issueTokenPair = async (user) => {
  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const refreshToken = signRefreshToken({ sub: user.id });

  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30d

  await prisma.refreshToken.create({
    data: { userId: user.id, tokenHash, expiresAt },
  });

  return { accessToken, refreshToken };
};

export const rotateRefreshToken = async (plainRefreshToken) => {
  const tokenHash = hashToken(plainRefreshToken);

  const record = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!record || record.revokedAt || record.expiresAt < new Date()) {
    if (record) {
      await prisma.refreshToken.updateMany({
        where: { userId: record.userId },
        data: { revokedAt: new Date() },
      });
    }
    const { ApiError } = await import('../utils/ApiError.js');
    throw ApiError.unauthorized('Refresh token is invalid or has been revoked. Please log in again.');
  }

  await prisma.refreshToken.update({
    where: { id: record.id },
    data: { revokedAt: new Date() },
  });

  const { accessToken, refreshToken: newRefreshToken } = await issueTokenPair(record.user);

  return { accessToken, refreshToken: newRefreshToken, user: record.user };
};

export const revokeRefreshToken = async (plainRefreshToken) => {
  const tokenHash = hashToken(plainRefreshToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash },
    data: { revokedAt: new Date() },
  });
};

export const revokeAllRefreshTokens = async (userId) => {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
};
