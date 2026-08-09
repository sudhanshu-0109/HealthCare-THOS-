/**
 * services/email.service.js — Transactional email sender using Nodemailer.
 *
 * Configured with high-priority headers, plain-text fallback, and clean formatting
 * to maximize inbox delivery and prevent spam filtering.
 */

import nodemailer from 'nodemailer';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { env } from '../config/env.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const isEmailConfigured = Boolean(env.EMAIL_HOST && env.EMAIL_USER && env.EMAIL_PASSWORD);

const transporter = isEmailConfigured
  ? nodemailer.createTransport({
      host: env.EMAIL_HOST,
      port: env.EMAIL_PORT,
      secure: env.EMAIL_PORT === 465,
      auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 10000,
    })
  : null;

const renderTemplate = (templateName, vars) => {
  const templatePath = join(
    __dirname,
    '../templates/emails',
    `${templateName}.html`
  );
  let html = readFileSync(templatePath, 'utf-8');
  for (const [key, value] of Object.entries(vars)) {
    html = html.replaceAll(`{{${key}}}`, value);
  }
  return html;
};

const sendEmail = async ({ to, subject, text, html }) => {
  console.log(`\n📨 [EMAIL DISPATCH] ─────────────────────────────────────────`);
  console.log(`   Sender (From):    ${env.EMAIL_FROM || 'healthcare+ <sudhanshuranjan0109@gmail.com>'}`);
  console.log(`   Recipient (To):   ${to}`);
  console.log(`   Subject:          ${subject}`);
  console.log(`─────────────────────────────────────────────────────────────\n`);

  const otpMatch = html.match(/class="otp-code">(\d{6})</);
  if (otpMatch) console.log(`   [DEV OTP CODE]: ${otpMatch[1]}`);

  // 1. Primary: Nodemailer SMTP (Gmail SMTP)
  if (transporter) {
    try {
      const fromAddress = env.EMAIL_FROM || `"healthcare+" <${env.EMAIL_USER}>`;
      await transporter.sendMail({
        from: fromAddress,
        to,
        subject,
        text: text || 'Your healthcare+ verification code.',
        html,
        headers: {
          'X-Priority': '1 (Highest)',
          'X-MSMail-Priority': 'High',
          'Importance': 'High',
        },
      });
      console.log(`   ✅ [SMTP DISPATCH SUCCESS] Delivered to ${to}`);
      return;
    } catch (smtpErr) {
      console.error(`   ❌ [SMTP DISPATCH ERROR]:`, smtpErr.message);
    }
  }

  // 2. Fallback: Resend API (if SMTP is not configured)
  if (env.RESEND_API_KEY) {
    try {
      const resendFrom = env.EMAIL_FROM && !env.EMAIL_FROM.includes('gmail.com')
        ? env.EMAIL_FROM
        : 'healthcare+ <onboarding@resend.dev>';
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: resendFrom,
          to: [to],
          subject,
          text,
          html,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        console.log(`   ✅ [RESEND DISPATCH SUCCESS] ID: ${data.id}`);
        return;
      }
      console.warn(`   ⚠️ [RESEND DISPATCH NOTICE]:`, data);
    } catch (resendErr) {
      console.warn(`   ⚠️ [RESEND DISPATCH FAILED]:`, resendErr.message);
    }
  }
};

/**
 * Send 6-digit OTP verification email to user.
 * @param {{ email: string, fullName: string }} user
 * @param {string} otp — 6-digit OTP code
 */
export const sendVerificationEmail = async (user, otp) => {
  const verifyUrl = `${env.CLIENT_URL}/verify-email/${otp}`;
  const html = renderTemplate('verifyEmail', {
    fullName: user.fullName,
    otp,
    verifyUrl,
    year: String(new Date().getFullYear()),
  });

  const plainText = `Hi ${user.fullName},\n\nYour healthcare+ email verification code is: ${otp}\n\nThis code is valid for 10 minutes.\n\nVerify online: ${verifyUrl}\n\n- healthcare+ Team`;

  await sendEmail({
    to: user.email,
    subject: `Your healthcare+ Verification Code: ${otp}`,
    text: plainText,
    html,
  });
};

/**
 * Send password reset OTP email.
 * @param {{ email: string, fullName: string }} user
 * @param {string} otp — 6-digit OTP code
 */
export const sendPasswordResetEmail = async (user, otp) => {
  const resetUrl = `${env.CLIENT_URL}/reset-password/${otp}`;
  const html = renderTemplate('resetPassword', {
    fullName: user.fullName,
    otp,
    resetUrl,
    year: String(new Date().getFullYear()),
  });

  const plainText = `Hi ${user.fullName},\n\nYour healthcare+ password reset code is: ${otp}\n\nThis code is valid for 10 minutes.\n\nReset password online: ${resetUrl}\n\n- healthcare+ Team`;

  await sendEmail({
    to: user.email,
    subject: `Reset Your healthcare+ Password: ${otp}`,
    text: plainText,
    html,
  });
};

/**
 * Send staff invite email.
 * @param {{ email: string, fullName: string, role: string }} user
 * @param {string} token — Invite token
 */
export const sendInviteEmail = async (user, token) => {
  const inviteUrl = `${env.CLIENT_URL}/accept-invite/${token}`;
  
  const plainText = `Hi ${user.fullName},\n\nYou have been invited to join healthcare+ as a ${user.role}.\n\nPlease set your password to activate your account: ${inviteUrl}\n\n- healthcare+ Team`;
  
  let html;
  try {
    html = renderTemplate('invite', {
      fullName: user.fullName,
      role: user.role,
      inviteUrl,
      year: String(new Date().getFullYear()),
    });
  } catch(e) {
    html = `<p>Hi ${user.fullName},</p><p>You have been invited to join healthcare+ as a ${user.role}.</p><p><a href="${inviteUrl}">Click here to set your password and activate your account.</a></p>`;
  }

  await sendEmail({
    to: user.email,
    subject: `You've been invited to healthcare+`,
    text: plainText,
    html,
  });
};

/**
 * Send a transactional notification email (Phase 15 — 4 high-value event types only).
 * @param {{ email: string, fullName: string }} user
 * @param {{ title: string, message: string, type: string }} notif
 */
export const sendGenericNotificationEmail = async (user, { title, message, type }) => {
  const typeLabels = {
    APPOINTMENT_CONFIRMED: 'Appointment Update',
    PAYMENT_RESULT: 'Payment Update',
    LAB_REPORT_READY: 'Lab Report Ready',
    PASSPORT_ACCESS_CHANGED: 'Health Passport Security Alert',
  };
  const label = typeLabels[type] || 'Notification';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${label} — healthcare+</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#1a73e8,#0d47a1);padding:32px 40px;">
              <h1 style="color:#fff;font-size:22px;margin:0;letter-spacing:-0.5px;">healthcare+</h1>
              <p style="color:rgba(255,255,255,0.75);margin:6px 0 0;font-size:13px;">${label}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 40px;">
              <p style="color:#555;margin:0 0 8px;font-size:14px;">Hi ${user.fullName || 'there'},</p>
              <h2 style="color:#1a1a2e;font-size:20px;margin:0 0 16px;font-weight:600;">${title}</h2>
              <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 28px;">${message}</p>
              <hr style="border:none;border-top:1px solid #eee;margin:0 0 24px;" />
              <p style="color:#888;font-size:12px;margin:0;">This is an automated notification from healthcare+. Please do not reply to this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const plainText = `Hi ${user.fullName || 'there'},\n\n${title}\n\n${message}\n\n— healthcare+ Team`;

  await sendEmail({
    to: user.email,
    subject: `${label}: ${title}`,
    text: plainText,
    html,
  });
};

