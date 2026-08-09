/**
 * pages/public/ResetPassword.jsx — Password reset completion page.
 */

import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import AuthFormError from '../../components/auth/AuthFormError';
import * as authService from '../../services/auth.service';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!newPassword || newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
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
      await authService.resetPassword({ token, newPassword });
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Password reset failed. Link may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8">

        <div className="text-center mb-6">
          <div className="text-4xl mb-3">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
          <p className="text-gray-500 text-sm mt-1">Create a new secure password for your account</p>
        </div>

        <AuthFormError message={error} />

        {success ? (
          <div className="text-center space-y-4">
            <div className="p-4 rounded-xl bg-green-50 border border-green-100 text-green-900 text-sm">
              ✅ Password reset successfully! All previous sessions have been revoked.
            </div>
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => navigate('/login', { replace: true })}
            >
              Sign In Now →
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Password */}
            <div>
              <label htmlFor="reset-new-password" className="block text-sm font-medium text-gray-700 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  id="reset-new-password"
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

            {/* Confirm Password */}
            <div>
              <label htmlFor="reset-confirm-password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Confirm New Password
              </label>
              <input
                id="reset-confirm-password"
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
              Reset Password
            </Button>

            <p className="text-center text-xs text-gray-500 mt-4">
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium no-underline">
                ← Back to Login
              </Link>
            </p>
          </form>
        )}

      </div>
    </div>
  );
};

export default ResetPassword;
