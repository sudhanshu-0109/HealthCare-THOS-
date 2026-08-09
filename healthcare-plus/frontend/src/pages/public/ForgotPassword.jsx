/**
 * pages/public/ForgotPassword.jsx — Complete Forgot Password -> OTP Verification -> Set New Password flow.
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import AuthFormError from '../../components/auth/AuthFormError';
import OtpInput from '../../components/auth/OtpInput';
import * as authService from '../../services/auth.service';

const ForgotPassword = () => {
  const navigate = useNavigate();

  // Step state: 1 = Email Input, 2 = OTP + New Password Input, 3 = Success
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Resend Cooldown Timer
  const [resendCooldown, setResendCooldown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // UI Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Resend Timer Effect
  useEffect(() => {
    let timer;
    if (step === 2 && resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, resendCooldown]);

  // Step 1: Request Password Reset OTP
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setStep(2);
      setResendCooldown(60);
      setCanResend(false);
      setSuccessMessage(`If an account exists for ${email}, a 6-digit OTP code has been sent to your inbox.`);
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Reset Password with OTP
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit OTP code.');
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setError('Password must contain at least one uppercase letter, one lowercase letter, and one number.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword({ email, otp, newPassword });
      setStep(3);
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    if (!canResend) return;

    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      await authService.forgotPassword(email);
      setOtp('');
      setResendCooldown(60);
      setCanResend(false);
      setSuccessMessage(`A brand new password reset OTP has been sent to ${email}`);
    } catch (err) {
      setError(err.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8">

        <div className="text-center mb-6">
          <div className="text-4xl mb-3">🔑</div>
          <h1 className="text-2xl font-bold text-gray-900">
            {step === 3 ? 'Password Updated!' : 'Forgot Password'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {step === 1 && "Enter your email and we'll send you a password reset OTP"}
            {step === 2 && `Enter the 6-digit OTP sent to ${email} and choose a new password`}
            {step === 3 && 'Your password has been successfully updated'}
          </p>
        </div>

        {successMessage && step !== 3 && (
          <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-100 text-blue-900 text-xs mb-4 text-center font-medium">
            📧 {successMessage}
          </div>
        )}

        <AuthFormError message={error} />

        {/* STEP 1: Enter Email */}
        {step === 1 && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Registered Email Address
              </label>
              <input
                id="forgot-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full"
            >
              Send Reset OTP
            </Button>

            <p className="text-center text-xs text-gray-500 mt-4">
              Remembered your password?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium no-underline">
                Sign in →
              </Link>
            </p>
          </form>
        )}

        {/* STEP 2: OTP + New Password */}
        {step === 2 && (
          <form onSubmit={handleResetSubmit} className="space-y-4">
            <div>
              <label className="block text-center text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                6-Digit OTP Code
              </label>
              <OtpInput
                value={otp}
                onChange={setOtp}
                disabled={loading}
                error={Boolean(error)}
              />
            </div>

            <div>
              <label htmlFor="forgot-new-password" className="block text-sm font-medium text-gray-700 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  id="forgot-new-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="forgot-confirm-password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Confirm New Password
              </label>
              <input
                id="forgot-confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full"
            >
              Verify OTP & Reset Password
            </Button>

            <div className="text-center pt-3 border-t border-gray-100 space-y-2">
              <p className="text-xs text-gray-500">
                Didn&apos;t receive the OTP?
              </p>
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 underline focus:outline-none"
                >
                  Resend OTP Code
                </button>
              ) : (
                <p className="text-xs text-gray-400 font-medium">
                  Resend available in <span className="font-mono text-gray-700">{resendCooldown}s</span>
                </p>
              )}
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-gray-500 hover:text-gray-700 underline"
              >
                ← Change Email Address
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Success View */}
        {step === 3 && (
          <div className="text-center space-y-4">
            <div className="p-4 rounded-xl bg-green-50 border border-green-100 text-green-900 text-sm">
              ✅ Your password has been successfully reset. All existing sessions have been revoked for your security.
            </div>
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => navigate('/login', { replace: true })}
            >
              Sign In with New Password →
            </Button>
          </div>
        )}

      </div>
    </div>
  );
};

export default ForgotPassword;
