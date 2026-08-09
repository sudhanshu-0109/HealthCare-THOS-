/**
 * routes/auth.routes.js — Authentication routes.
 */

import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';
import { authLimiter, strictLimiter } from '../middleware/rateLimiter.js';
import * as authController from '../controllers/auth.controller.js';

const router = Router();

router.post(
  '/register',
  authLimiter,
  validate(authController.registerSchema),
  authController.register
);

router.post(
  '/login',
  authLimiter,
  validate(authController.loginSchema),
  authController.login
);

router.post(
  '/accept-invite',
  authLimiter,
  validate(authController.acceptInviteSchema),
  authController.acceptInvite
);

router.post(
  '/verify-otp',
  authLimiter,
  validate(authController.verifyOtpSchema),
  authController.verifyOtp
);

router.get('/verify-email/:token', authController.verifyOtp);

router.post(
  '/resend-verification',
  strictLimiter,
  validate(authController.resendVerificationSchema),
  authController.resendVerification
);

router.post(
  '/google',
  authLimiter,
  validate(authController.googleAuthSchema),
  authController.googleAuth
);

router.post(
  '/forgot-password',
  strictLimiter,
  validate(authController.forgotPasswordSchema),
  authController.forgotPassword
);

router.post(
  '/verify-reset-otp',
  strictLimiter,
  validate(authController.verifyResetOtpSchema),
  authController.verifyResetOtp
);

router.post(
  '/reset-password',
  strictLimiter,
  validate(authController.resetPasswordSchema),
  authController.resetPassword
);

router.post(
  '/change-password',
  authenticate,
  validate(authController.changePasswordSchema),
  authController.changePassword
);

router.post('/logout', authController.logout);

router.get('/me', authenticate, authController.me);

router.post('/refresh-token', authController.refreshToken);

export default router;
