import prisma from './src/prisma/client.js';
import * as authService from './src/services/auth.service.js';

async function testOtp() {
  try {
    // create a fake user
    const email = 'testotp@example.com';
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          fullName: 'Test OTP',
          passwordHash: 'dummy',
          isEmailVerified: false,
          authProvider: 'LOCAL',
          role: 'PATIENT'
        }
      });
    }

    // Mock sendVerificationEmail
    const originalSend = (await import('./src/services/email.service.js')).sendVerificationEmail;

    const otp = await authService.register({ fullName: 'Test OTP 2', email: 'testotp2@example.com', password: 'Password123' }).catch(e => {
       console.log("Register error (expected if exists)", e.message);
    });
    
    // We can just use token.service directly to generate OTP and then try to verify it.
    const { createVerificationToken } = await import('./src/services/token.service.js');
    const plainOtp = await createVerificationToken(user.id);
    console.log("Generated OTP:", plainOtp);

    // Now let's try to verify
    const result = await authService.verifyEmail(plainOtp, email);
    console.log("Verification Result:", !!result.user);
    
  } catch(e) {
    console.error("Test failed", e);
  } finally {
    process.exit(0);
  }
}

testOtp();
