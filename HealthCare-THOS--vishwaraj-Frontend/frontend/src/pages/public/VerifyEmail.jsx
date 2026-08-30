/**
 * pages/public/VerifyEmail.jsx — 6-Digit OTP & URL token email verification page.
 */

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as authService from '../../services/auth.service';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';

const VerifyEmail = () => {
  const { token } = useParams();
  const [otpInput, setOtpInput] = useState('');
  const [loading, setLoading] = useState(Boolean(token));
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const [resendEmail, setResendEmail] = useState('');
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const verifyByToken = async () => {
      try {
        await authService.verifyEmail(token);
        if (isMounted) {
          setSuccess(true);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Verification failed. OTP code or link may be invalid/expired.');
          setLoading(false);
        }
      }
    };

    if (token) {
      verifyByToken();
    }

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!otpInput || otpInput.trim().length !== 6) {
      setError('Please enter a valid 6-digit numeric OTP code.');
      return;
    }

    setSubmitting(true);
    try {
      await authService.verifyEmail(otpInput.trim());
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Invalid or expired 6-digit OTP code.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async (e) => {
    e.preventDefault();
    if (!resendEmail) return;

    setResendLoading(true);
    try {
      await authService.resendVerification(resendEmail);
      setResendSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to resend verification email.');
    } finally {
      setResendLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 bg-gray-50">
        <div className="text-center">
          <Loader size="lg" />
          <p className="mt-4 text-sm text-gray-600">Verifying your email address...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">

        {success ? (
          <>
            <div className="text-5xl mb-4">🎉</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h1>
            <p className="text-gray-500 text-sm mb-6">
              Your email address has been successfully verified. Welcome to healthcare+!
            </p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center w-full px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg no-underline transition text-sm"
            >
              Sign In to Your Account →
            </Link>
          </>
        ) : (
          <>
            <div className="text-4xl mb-3">✉️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Verify Email</h1>
            <p className="text-gray-500 text-xs mb-6">
              Enter the 6-digit OTP code sent to your email inbox
            </p>

            {error && (
              <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs mb-4 text-left">
                ⚠️ {error}
              </div>
            )}

            {/* OTP Input Form */}
            <form onSubmit={handleOtpSubmit} className="space-y-4 mb-6">
              <div>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit OTP"
                  className="w-full text-center text-2xl font-mono tracking-widest py-3 px-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={submitting}
                className="w-full"
              >
                Verify OTP Code
              </Button>
            </form>

            {resendSuccess ? (
              <div className="p-3.5 rounded-lg bg-green-50 text-green-800 text-xs mb-4">
                ✅ A new 6-digit OTP has been sent to your email address.
              </div>
            ) : (
              <form onSubmit={handleResend} className="text-left space-y-3 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 text-center">
                  Didn&apos;t get the OTP? Request a new one:
                </p>
                <input
                  type="email"
                  required
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={resendLoading}
                  className="w-full py-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-medium rounded-lg transition disabled:opacity-50"
                >
                  {resendLoading ? 'Sending...' : 'Resend 6-Digit OTP'}
                </button>
              </form>
            )}

            <div className="mt-6 pt-4 border-t border-gray-100">
              <Link to="/login" className="text-xs text-blue-600 hover:text-blue-700 font-medium no-underline">
                ← Return to Sign In
              </Link>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default VerifyEmail;
