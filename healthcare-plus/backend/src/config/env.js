/**
 * env.js — Load and validate required environment variables at boot.
 */

import dotenv from 'dotenv';
dotenv.config();

const required = [
  'PORT',
  'DATABASE_URL',
  'JWT_SECRET',
  'CLIENT_URL',
  'JWT_REFRESH_SECRET',
];

const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  throw new Error(
    `[healthcare+ API] Missing required environment variables:\n  ${missing.join('\n  ')}\n\nPlease copy backend/.env.example to backend/.env and fill in all required values.`
  );
}

export const env = {
  PORT: parseInt(process.env.PORT, 10) || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL,
  DATABASE_URL: process.env.DATABASE_URL,

  // JWT
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',

  // Google OAuth
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',

  // Email SMTP (supports both SMTP_* and EMAIL_* keys)
  EMAIL_HOST: process.env.SMTP_HOST || process.env.EMAIL_HOST || 'smtp.gmail.com',
  EMAIL_PORT: parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT, 10) || 587,
  EMAIL_USER: process.env.SMTP_USER || process.env.EMAIL_USER || '',
  EMAIL_PASSWORD: process.env.SMTP_PASS || process.env.EMAIL_PASSWORD || '',
  EMAIL_FROM: process.env.EMAIL_FROM || (process.env.EMAIL_USER ? `healthcare+ <${process.env.EMAIL_USER}>` : 'healthcare+ <no-reply@healthcareplus.local>'),

  RESEND_API_KEY: process.env.RESEND_API_KEY || '',

  // OTP Policy
  OTP_TTL_MINUTES: parseInt(process.env.OTP_TTL_MINUTES, 10) || 10,

  // External Services placeholders
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || '',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  AI_API_KEY: process.env.AI_API_KEY || '',
};
