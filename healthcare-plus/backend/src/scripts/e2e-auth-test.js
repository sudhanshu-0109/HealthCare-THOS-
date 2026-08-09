/**
 * __tests__/e2e-auth-test.js — End-to-End Auth System Verification Script.
 * Tests complete signup -> OTP verify -> login -> logout -> forgot password -> reset OTP -> new password flow against real services.
 */

import http from 'http';
import app from '../app.js';
import prisma from '../prisma/client.js';

const PORT = 5099;
let server;

const request = async (path, method = 'GET', body = null, token = null) => {
  const res = await fetch(`http://localhost:${PORT}/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : null,
  });

  const json = await res.json();
  return { status: res.status, body: json };
};

async function runE2ETests() {
  console.log('🚀 Starting Authentication End-to-End Verification Tests...\n');

  // Start temporary test server
  await new Promise((resolve) => {
    server = http.createServer(app).listen(PORT, resolve);
  });

  const testEmail = `e2etest_${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  const newPassword = 'NewPassword456!';

  try {
    // 1. Register Account
    console.log('1️⃣ Registering new user account...');
    const regRes = await request('/auth/register', 'POST', {
      fullName: 'E2E Test User',
      email: testEmail,
      password: testPassword,
    });
    console.log(`   Status: ${regRes.status} — ${regRes.body.message}`);
    if (regRes.status !== 201) throw new Error('Registration failed');

    // 2. Fetch active 6-digit OTP from database for this test user
    const dbUser = await prisma.user.findUnique({
      where: { email: testEmail },
      include: { verificationTokens: true },
    });
    console.log(`   User created in DB: ${dbUser.email} (isEmailVerified: ${dbUser.isEmailVerified})`);

    // 3. Attempt Login BEFORE Verification -> Should fail
    console.log('\n2️⃣ Attempting login with unverified account...');
    const unverifiedLoginRes = await request('/auth/login', 'POST', {
      email: testEmail,
      password: testPassword,
    });
    console.log(`   Status: ${unverifiedLoginRes.status} — ${unverifiedLoginRes.body.message}`);
    if (unverifiedLoginRes.status !== 400) throw new Error('Unverified login should have been rejected');

    // 4. Verify OTP with WRONG code -> Should fail
    console.log('\n3️⃣ Submitting WRONG OTP (000000)...');
    const wrongOtpRes = await request('/auth/verify-otp', 'POST', {
      email: testEmail,
      otp: '000000',
    });
    console.log(`   Status: ${wrongOtpRes.status} — ${wrongOtpRes.body.message}`);
    if (wrongOtpRes.status !== 400) throw new Error('Wrong OTP should be rejected');

    // 5. Generate fresh OTP & Resend
    console.log('\n4️⃣ Requesting OTP resend...');
    // Delete previous token created 1s ago to bypass 60s cooldown for testing script
    await prisma.verificationToken.deleteMany({ where: { userId: dbUser.id } });
    const resendRes = await request('/auth/resend-verification', 'POST', { email: testEmail });
    console.log(`   Status: ${resendRes.status} — ${resendRes.body.message}`);

    // Get the newly generated OTP token from database
    const freshTokenRecord = await prisma.verificationToken.findFirst({
      where: { userId: dbUser.id },
    });

    // We hash the plain OTP to store it, but for our test script we can pull the latest plain token or generate a known test token directly:
    // Let's create a known 6-digit OTP '654321' directly for testing verify API
    const { hashToken } = await import('../utils/tokenGenerator.js');
    await prisma.verificationToken.deleteMany({ where: { userId: dbUser.id } });
    await prisma.verificationToken.create({
      data: {
        userId: dbUser.id,
        token: hashToken('654321'),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    // 6. Verify OTP with CORRECT code '654321' -> Should succeed & return tokens
    console.log('\n5️⃣ Submitting CORRECT OTP (654321)...');
    const verifyRes = await request('/auth/verify-otp', 'POST', {
      email: testEmail,
      otp: '654321',
    });
    console.log(`   Status: ${verifyRes.status} — ${verifyRes.body.message}`);
    if (verifyRes.status !== 200 || !verifyRes.body.data.accessToken) {
      throw new Error('Correct OTP verification failed');
    }

    const verifiedUserInDb = await prisma.user.findUnique({ where: { email: testEmail } });
    console.log(`   isEmailVerified in DB: ${verifiedUserInDb.isEmailVerified}`);

    // 7. Verify OTP AGAIN -> Should fail (single-use OTP policy)
    console.log('\n6️⃣ Re-submitting the SAME OTP (654321) again...');
    const reuseOtpRes = await request('/auth/verify-otp', 'POST', {
      email: testEmail,
      otp: '654321',
    });
    console.log(`   Status: ${reuseOtpRes.status} — ${reuseOtpRes.body.message}`);
    if (reuseOtpRes.status !== 400) throw new Error('Reusing OTP should be rejected');

    // 8. Login after verification -> Should succeed
    console.log('\n7️⃣ Logging in with verified credentials...');
    const loginRes = await request('/auth/login', 'POST', {
      email: testEmail,
      password: testPassword,
    });
    console.log(`   Status: ${loginRes.status} — ${loginRes.body.message}`);
    if (loginRes.status !== 200 || !loginRes.body.data.accessToken) {
      throw new Error('Verified login failed');
    }
    const { accessToken } = loginRes.body.data;

    // 9. Fetch Profile /auth/me
    console.log('\n8️⃣ Fetching authenticated user profile (/auth/me)...');
    const meRes = await request('/auth/me', 'GET', null, accessToken);
    console.log(`   Status: ${meRes.status} — User: ${meRes.body.data.user.fullName} (${meRes.body.data.user.role})`);

    // 10. Forgot Password request
    console.log('\n9️⃣ Initiating Forgot Password for ' + testEmail + '...');
    await prisma.passwordResetToken.deleteMany({ where: { userId: dbUser.id } });
    const forgotRes = await request('/auth/forgot-password', 'POST', { email: testEmail });
    console.log(`   Status: ${forgotRes.status} — ${forgotRes.body.message}`);

    // Set known reset OTP '987654'
    await prisma.passwordResetToken.deleteMany({ where: { userId: dbUser.id } });
    await prisma.passwordResetToken.create({
      data: {
        userId: dbUser.id,
        token: hashToken('987654'),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    // 11. Reset Password with OTP '987654'
    console.log('\n🔟 Resetting password with OTP (987654) and new password...');
    const resetRes = await request('/auth/reset-password', 'POST', {
      email: testEmail,
      otp: '987654',
      newPassword: newPassword,
    });
    console.log(`   Status: ${resetRes.status} — ${resetRes.body.message}`);

    // 12. Login with OLD password -> Should fail
    console.log('\n1️⃣1️⃣ Attempting login with OLD password...');
    const oldLoginRes = await request('/auth/login', 'POST', {
      email: testEmail,
      password: testPassword,
    });
    console.log(`   Status: ${oldLoginRes.status} — ${oldLoginRes.body.message}`);
    if (oldLoginRes.status !== 401) throw new Error('Old password login should be rejected');

    // 13. Login with NEW password -> Should succeed!
    console.log('\n1️⃣2️⃣ Logging in with NEW password...');
    const newLoginRes = await request('/auth/login', 'POST', {
      email: testEmail,
      password: newPassword,
    });
    console.log(`   Status: ${newLoginRes.status} — ${newLoginRes.body.message}`);
    if (newLoginRes.status !== 200) throw new Error('New password login failed');

    // Clean up test user
    await prisma.user.delete({ where: { email: testEmail } });

    console.log('\n🎉 ALL 12 END-TO-END AUTHENTICATION TESTS PASSED PERFECTLY!\n');
  } catch (err) {
    console.error('\n❌ E2E Verification Failed:', err);
    process.exit(1);
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

runE2ETests();
