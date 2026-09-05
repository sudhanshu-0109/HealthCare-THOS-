/**
 * controllers/auth.controller.js — Auth request handlers & validation schemas.
 */

import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as authService from '../services/auth.service.js';
import { rotateRefreshToken } from '../services/token.service.js';

// ── Validation Schemas ───────────────────────────────────────────────────

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters long'),
  email: z.string().trim().toLowerCase().email('Invalid email address format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  role: z.enum(['PATIENT']).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address format'),
  password: z.string().min(1, 'Password is required'),
  role: z.enum(['PATIENT', 'DOCTOR', 'HOSPITAL_ADMIN', 'RECEPTIONIST', 'PHARMACIST', 'LAB_STAFF', 'AMBULANCE_DRIVER', 'SUPER_ADMIN']).optional(),
});

export const acceptInviteSchema = z.object({
  token: z.string().min(1, 'Invite token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const resendVerificationSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address format'),
});

export const verifyOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address format').optional(),
  otp: z.string().trim().min(6, '6-digit OTP code is required'),
});

export const googleAuthSchema = z.object({
  idToken: z.union([
    z.string(),
    z.record(z.any()),
  ]).optional(),
  role: z.enum(['PATIENT', 'DOCTOR', 'HOSPITAL_ADMIN', 'RECEPTIONIST', 'PHARMACIST', 'LAB_STAFF', 'AMBULANCE_DRIVER', 'SUPER_ADMIN']).optional(),
  credential: z.string().optional(),
}).transform((data) => {
  let token = data.idToken;
  let role = data.role;
  if (typeof token === 'object' && token !== null) {
    if (token.role && !role) role = token.role;
    token = token.idToken || token.credential || '';
  }
  if (!token && data.credential) {
    token = data.credential;
  }
  return {
    idToken: typeof token === 'string' ? token : '',
    role: role || 'PATIENT',
  };
}).refine((data) => typeof data.idToken === 'string' && data.idToken.length > 0, {
  message: 'Google ID token is required',
  path: ['idToken'],
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address format'),
});

export const verifyResetOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address format').optional(),
  otp: z.string().trim().min(6, '6-digit OTP code is required'),
});

export const resetPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address format').optional(),
  otp: z.string().trim().optional(),
  token: z.string().trim().optional(),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters long')
    .regex(/[A-Z]/, 'New password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'New password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'New password must contain at least one number'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters long')
    .regex(/[A-Z]/, 'New password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'New password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'New password must contain at least one number'),
});

// ── Cookie Helper ─────────────────────────────────────────────────────────

const setRefreshTokenCookie = (res, refreshToken) => {
  if (!refreshToken) return;
  res.cookie('hc_refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
};

const clearRefreshTokenCookie = (res) => {
  res.clearCookie('hc_refresh_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
};

// ── Controllers ───────────────────────────────────────────────────────────

export const register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);
  res.status(201).json({
    success: true,
    message: 'Registration successful! A 6-digit OTP code has been sent to your email.',
    data: { user },
  });
});

export const login = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.login(req.body);
  setRefreshTokenCookie(res, refreshToken);
  // Refresh token is delivered only via the httpOnly cookie — never echoed to JS.
  res.status(200).json({
    success: true,
    message: 'Login successful.',
    data: { user, accessToken },
  });
});

export const acceptInvite = asyncHandler(async (req, res) => {
  const result = await authService.acceptInvite(req.body);
  res.status(200).json({
    success: true,
    message: result.message,
  });
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const plainOtp = req.body.otp || req.params.token;
  const email = req.body.email;
  const result = await authService.verifyEmail(plainOtp, email);

  if (result.refreshToken) {
    setRefreshTokenCookie(res, result.refreshToken);
  }

  res.status(200).json({
    success: true,
    message: result.message,
    data: result.user ? { user: result.user, accessToken: result.accessToken } : null,
  });
});

export const resendVerification = asyncHandler(async (req, res) => {
  const result = await authService.resendVerification(req.body.email);
  res.status(200).json({
    success: true,
    message: result.message,
  });
});

export const googleAuth = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.googleAuth(req.body);
  setRefreshTokenCookie(res, refreshToken);
  // Refresh token is delivered only via the httpOnly cookie — never echoed to JS.
  res.status(200).json({
    success: true,
    message: 'Google authentication successful.',
    data: { user, accessToken },
  });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.forgotPassword(req.body.email);
  res.status(200).json({
    success: true,
    message: result.message,
  });
});

export const verifyResetOtp = asyncHandler(async (req, res) => {
  const result = await authService.verifyResetOtp(req.body);
  res.status(200).json({
    success: true,
    message: result.message,
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const result = await authService.resetPassword(req.body);
  res.status(200).json({
    success: true,
    message: result.message,
  });
});

export const changePassword = asyncHandler(async (req, res) => {
  const result = await authService.changePassword({
    userId: req.user.id,
    ...req.body,
  });
  res.status(200).json({
    success: true,
    message: result.message,
  });
});

export const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.hc_refresh_token || req.body?.refreshToken;
  await authService.logout(refreshToken);
  clearRefreshTokenCookie(res);
  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
});

export const me = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user.id);
  res.status(200).json({
    success: true,
    data: { user },
  });
});

export const refreshToken = asyncHandler(async (req, res) => {
  const plainRefreshToken = req.cookies?.hc_refresh_token || req.body?.refreshToken;
  if (!plainRefreshToken) {
    return res.status(401).json({
      success: false,
      message: 'Refresh token required.',
    });
  }

  const { accessToken, refreshToken: newRefreshToken, user } = await rotateRefreshToken(
    plainRefreshToken
  );

  setRefreshTokenCookie(res, newRefreshToken);

  // Rotated refresh token is delivered only via the httpOnly cookie — never echoed to JS.
  res.status(200).json({
    success: true,
    data: {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
    },
  });
});
