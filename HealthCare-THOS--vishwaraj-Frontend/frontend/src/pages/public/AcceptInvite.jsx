import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Button from '../../components/common/Button';
import AuthFormError from '../../components/auth/AuthFormError';
import * as authService from '../../services/auth.service';

const AcceptInvite = () => {
  const { token } = useParams();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await authService.acceptInvite({ token, password });
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to accept invite.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-gray-50">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="text-4xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invite Accepted!</h2>
          <p className="text-gray-600 mb-6">Your password has been set and your account is now active.</p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition no-underline"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">👋</div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome to healthcare+</h1>
          <p className="text-gray-500 text-sm mt-1">Set your password to activate your staff account</p>
        </div>

        <AuthFormError message={error} />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
          
          <div className="pt-2">
            <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
              Activate Account
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AcceptInvite;
