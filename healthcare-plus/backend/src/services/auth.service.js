/**
 * services/auth.service.js — Core authentication business logic with strict 6-digit OTP policies.
 */

import { OAuth2Client } from 'google-auth-library';
import prisma from '../prisma/client.js';
import { ApiError } from '../utils/ApiError.js';
import { hashPassword, comparePassword } from '../utils/hash.js';
import { env } from '../config/env.js';
import {
  createVerificationToken,
  findVerificationToken,
  deleteVerificationToken,
  createPasswordResetToken,
  findPasswordResetToken,
  markResetTokenUsed,
  issueTokenPair,
  revokeRefreshToken,
  revokeAllRefreshTokens,
  createInviteToken,
  findInviteToken,
  deleteInviteToken,
} from './token.service.js';
import { sendVerificationEmail, sendPasswordResetEmail, sendInviteEmail } from './email.service.js';

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds cooldown

/**
 * Register a new PATIENT user and send 6-digit OTP.
 */
export const register = async ({ email, password, fullName, role = 'PATIENT' }) => {
  if (role !== 'PATIENT') {
    throw ApiError.forbidden('Public registration is restricted to patients only.');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existingUser) {
    throw ApiError.conflict('An account already exists with this email. Please login instead.');
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash,
      fullName: fullName.trim(),
      role: 'PATIENT',
      isEmailVerified: false,
      authProvider: 'LOCAL',
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      isEmailVerified: true,
      createdAt: true,
    },
  });

  // Generate & send fresh 6-digit OTP
  const otp = await createVerificationToken(user.id);
  await sendVerificationEmail(user, otp);

  return user;
};

/**
 * Create a staff user (Doctor, Lab Staff, etc) with a default password.
 */
export const createStaffUser = async ({ email, fullName, role, hospitalId, invitedBy }) => {
  if (role === 'PATIENT' || role === 'SUPER_ADMIN') {
    throw ApiError.forbidden('Cannot invite PATIENT or SUPER_ADMIN roles.');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existingUser) {
    throw ApiError.conflict('An account with this email address already exists.');
  }

  const defaultPassword = 'Passwor123!';
  const passwordHash = await hashPassword(defaultPassword);

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      fullName: fullName.trim(),
      role,
      passwordHash,
      isEmailVerified: true,
      authProvider: 'LOCAL',
      status: 'ACTIVE',
    }
  });

  // Fetch hospital name for the email
  let hospitalName = 'HealthCare+';
  if (hospitalId) {
    const hospital = await prisma.hospital.findUnique({ where: { id: hospitalId } });
    if (hospital) hospitalName = hospital.name;
  }

  const { sendStaffWelcomeEmail } = await import('./email.service.js');
  await sendStaffWelcomeEmail(user, defaultPassword, hospitalName);

  return user;
};

/**
 * Accept invite and set password
 */
export const acceptInvite = async ({ token, password }) => {
  if (!token) {
    throw ApiError.badRequest('Invite token is required.');
  }

  const tokenRecord = await findInviteToken(token);
  if (!tokenRecord) {
    throw ApiError.badRequest('Invalid or expired invite link.');
  }

  if (tokenRecord.expiresAt < new Date()) {
    await deleteInviteToken(tokenRecord.id);
    throw ApiError.badRequest('Invite link has expired. Please contact your administrator.');
  }

  const passwordHash = await hashPassword(password);

  await prisma.user.update({
    where: { id: tokenRecord.userId },
    data: { passwordHash, status: 'ACTIVE' },
  });

  await deleteInviteToken(tokenRecord.id);

  return { message: 'Password set successfully. You can now log in.' };
};

/**
 * Log in with email and password.
 */
export const login = async ({ email, password, role }) => {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: {
      hospitalAdmin: { include: { hospital: true } },
      doctor: { include: { hospital: true } },
      receptionist: { include: { hospital: true } },
      pharmacist: { include: { hospital: true } },
      labStaff: { include: { hospital: true } },
      ambulanceDriver: { include: { hospital: true } },
    }
  });
  if (!user) {
    throw ApiError.badRequest('No account found with this email. Please create an account first.', {
      accountExists: false,
    });
  }

  if (user.status === 'INVITED') {
    throw ApiError.forbidden('Please set your password using the invite link sent to your email.');
  }
  if (user.status === 'DEACTIVATED') {
    throw ApiError.forbidden('This account has been deactivated. Contact your hospital administrator.');
  }

  if (user.authProvider === 'GOOGLE' && !user.passwordHash) {
    throw ApiError.badRequest(
      'This account was created using Google Sign-In. Please click "Continue with Google" to log in.'
    );
  }

  const isPasswordValid = await comparePassword(password, user.passwordHash || '');
  if (!isPasswordValid) {
    throw ApiError.unauthorized('Invalid email or password.');
  }

  if (role && user.role !== role) {
    throw ApiError.forbidden('The selected role does not match this account.', { code: 'ROLE_MISMATCH' });
  }

  // Update last login timestamp
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const tokens = await issueTokenPair(user);

  let hospitalId = null;
  let hospitalName = null;
  const profile = user.hospitalAdmin || user.doctor || user.receptionist || user.pharmacist || user.labStaff || user.ambulanceDriver;
  if (profile && profile.hospital) {
    hospitalId = profile.hospitalId;
    hospitalName = profile.hospital.name;
  }

  const safeUser = {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    status: user.status,
    isEmailVerified: user.isEmailVerified,
    hospitalId,
    hospitalName,
  };

  return { user: safeUser, ...tokens };
};

/**
 * Verify email using 6-digit OTP code.
 * Rejects invalid or expired OTPs and auto-logs in verified user.
 */
export const verifyEmail = async (plainOtpOrToken, email = null) => {
  if (!plainOtpOrToken) {
    throw ApiError.badRequest('OTP code is required.');
  }

  const tokenRecord = await findVerificationToken(plainOtpOrToken);

  if (!tokenRecord) {
    throw ApiError.badRequest('Invalid OTP. Please try again.');
  }

  if (tokenRecord.expiresAt < new Date()) {
    await deleteVerificationToken(tokenRecord.id);
    throw ApiError.badRequest('OTP has expired. Please request a new OTP.');
  }

  if (email && tokenRecord.user.email.toLowerCase() !== email.trim().toLowerCase()) {
    throw ApiError.badRequest('Invalid OTP for this email address. Please check your email.');
  }

  const updatedUser = await prisma.user.update({
    where: { id: tokenRecord.userId },
    data: { isEmailVerified: true, lastLoginAt: new Date() },
  });

  // Delete token immediately so it cannot be reused
  await deleteVerificationToken(tokenRecord.id);

  // Auto-login upon verification
  const tokens = await issueTokenPair(updatedUser);

  const safeUser = {
    id: updatedUser.id,
    email: updatedUser.email,
    fullName: updatedUser.fullName,
    role: updatedUser.role,
    isEmailVerified: updatedUser.isEmailVerified,
  };

  return {
    message: 'Email address verified successfully.',
    user: safeUser,
    ...tokens,
  };
};

/**
 * Resend email verification OTP with 60-second cooldown policy.
 */
export const resendVerification = async (email) => {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: { verificationTokens: { orderBy: { createdAt: 'desc' }, take: 1 } },
  });

  if (user && !user.isEmailVerified) {
    const latestToken = user.verificationTokens[0];
    if (latestToken && Date.now() - new Date(latestToken.createdAt).getTime() < RESEND_COOLDOWN_MS) {
      const waitSeconds = Math.ceil(
        (RESEND_COOLDOWN_MS - (Date.now() - new Date(latestToken.createdAt).getTime())) / 1000
      );
      throw ApiError.badRequest(`Please wait ${waitSeconds} seconds before requesting a new OTP.`);
    }

    // Generate brand new OTP & invalidate previous ones
    const otp = await createVerificationToken(user.id);
    await sendVerificationEmail(user, otp);
  }

  return { message: 'If an unverified account with that email exists, a new 6-digit OTP has been sent.' };
};

/**
 * Google OAuth authentication.
 */
export const googleAuth = async ({ idToken, role }) => {
  let ticket;
  try {
    ticket = await googleClient.verifyIdToken({
      idToken,
      audience: env.GOOGLE_CLIENT_ID,
    });
  } catch (err) {
    throw ApiError.unauthorized('Google authentication failed. Invalid token.');
  }

  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    throw ApiError.badRequest('Could not retrieve email from Google profile.');
  }

  const { sub: googleId, email, name: fullName } = payload;
  const normalizedEmail = email.trim().toLowerCase();

  let user = await prisma.user.findUnique({ where: { googleId } });

  if (!user) {
    user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (user) {
      if (role && user.role !== role) {
        throw ApiError.forbidden('The selected role does not match this account.', { code: 'ROLE_MISMATCH' });
      }

      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId,
          authProvider: user.passwordHash ? 'BOTH' : 'GOOGLE',
          isEmailVerified: true,
          lastLoginAt: new Date(),
        },
      });
    } else {
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          fullName: fullName || 'Google User',
          role: 'PATIENT',
          googleId,
          authProvider: 'GOOGLE',
          isEmailVerified: true,
          lastLoginAt: new Date(),
        },
      });
    }
  } else {
    if (role && user.role !== role) {
      throw ApiError.forbidden('The selected role does not match this account.', { code: 'ROLE_MISMATCH' });
    }

    user = await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
  }

  const tokens = await issueTokenPair(user);

  const safeUser = {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
  };

  return { user: safeUser, ...tokens };
};

/**
 * Forgot password request — sends 6-digit OTP with 60-second cooldown policy.
 */
export const forgotPassword = async (email) => {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: { passwordResetTokens: { orderBy: { createdAt: 'desc' }, take: 1 } },
  });

  if (user) {
    const latestToken = user.passwordResetTokens[0];
    if (latestToken && Date.now() - new Date(latestToken.createdAt).getTime() < RESEND_COOLDOWN_MS) {
      const waitSeconds = Math.ceil(
        (RESEND_COOLDOWN_MS - (Date.now() - new Date(latestToken.createdAt).getTime())) / 1000
      );
      throw ApiError.badRequest(`Please wait ${waitSeconds} seconds before requesting a new OTP.`);
    }

    const otp = await createPasswordResetToken(user.id);
    await sendPasswordResetEmail(user, otp);
  }

  return { message: 'If an account with that email exists, a password reset OTP has been sent.' };
};

/**
 * Verify Password Reset OTP before allowing password change.
 */
export const verifyResetOtp = async ({ email, otp }) => {
  if (!otp) {
    throw ApiError.badRequest('OTP code is required.');
  }

  const tokenRecord = await findPasswordResetToken(otp);

  if (!tokenRecord) {
    throw ApiError.badRequest('Invalid OTP. Please try again.');
  }

  if (tokenRecord.usedAt || tokenRecord.expiresAt < new Date()) {
    throw ApiError.badRequest('OTP has expired. Please request a new OTP.');
  }

  if (email && tokenRecord.user.email.toLowerCase() !== email.trim().toLowerCase()) {
    throw ApiError.badRequest('Invalid OTP for this email address.');
  }

  return { message: 'OTP verified successfully.', otp };
};

/**
 * Reset password using OTP & newPassword.
 */
export const resetPassword = async ({ email, otp, token, newPassword }) => {
  const plainOtp = otp || token;
  if (!plainOtp) {
    throw ApiError.badRequest('OTP code is required.');
  }

  const tokenRecord = await findPasswordResetToken(plainOtp);

  if (!tokenRecord) {
    throw ApiError.badRequest('Invalid OTP. Please try again.');
  }

  if (tokenRecord.usedAt || tokenRecord.expiresAt < new Date()) {
    throw ApiError.badRequest('OTP has expired. Please request a new OTP.');
  }

  if (email && tokenRecord.user.email.toLowerCase() !== email.trim().toLowerCase()) {
    throw ApiError.badRequest('Invalid OTP for this email address.');
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: tokenRecord.userId },
    data: { passwordHash, isEmailVerified: true },
  });

  // Invalidate OTP immediately and revoke all user sessions
  await markResetTokenUsed(tokenRecord.id);
  await revokeAllRefreshTokens(tokenRecord.userId);

  return { message: 'Password has been reset successfully. Please log in with your new password.' };
};

/**
 * Change password for authenticated user.
 */
export const changePassword = async ({ userId, currentPassword, newPassword }) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user || !user.passwordHash) {
    throw ApiError.badRequest('Password change not allowed for Google-only accounts.');
  }

  const isValid = await comparePassword(currentPassword, user.passwordHash);
  if (!isValid) {
    throw ApiError.badRequest('Current password is incorrect.');
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  await revokeAllRefreshTokens(userId);

  return { message: 'Password changed successfully.' };
};

/**
 * Logout user (revoke refresh token).
 */
export const logout = async (refreshToken) => {
  if (refreshToken) {
    await revokeRefreshToken(refreshToken);
  }
  return { message: 'Logged out successfully.' };
};

/**
 * Get current user profile.
 */
export const getCurrentUser = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      status: true,
      isEmailVerified: true,
      authProvider: true,
      createdAt: true,
      lastLoginAt: true,
      doctor: { select: { id: true, hospitalId: true, departmentId: true, specialization: true, hospital: { select: { name: true } } } },
      hospitalAdmin: { select: { id: true, hospitalId: true, hospital: { select: { name: true } } } },
      receptionist: { select: { id: true, hospitalId: true, hospital: { select: { name: true } } } },
      pharmacist: { select: { id: true, hospitalId: true, hospital: { select: { name: true } } } },
      labStaff: { select: { id: true, hospitalId: true, hospital: { select: { name: true } } } },
      ambulanceDriver: { select: { id: true, hospitalId: true, hospital: { select: { name: true } } } },
    },
  });

  if (!user) {
    throw ApiError.notFound('User not found.');
  }

  let hospitalId = null;
  let hospitalName = null;
  const profile = user.hospitalAdmin || user.doctor || user.receptionist || user.pharmacist || user.labStaff || user.ambulanceDriver;
  if (profile && profile.hospital) {
    hospitalId = profile.hospitalId;
    hospitalName = profile.hospital.name;
  }
  
  return { ...user, hospitalId, hospitalName };
};
