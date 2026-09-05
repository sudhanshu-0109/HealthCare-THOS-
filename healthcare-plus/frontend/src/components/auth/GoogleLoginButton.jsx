/**
 * components/auth/GoogleLoginButton.jsx — Google OAuth button using @react-oauth/google.
 */

import { GoogleLogin } from '@react-oauth/google';
import * as authService from '../../services/auth.service';
import useAuthStore from '../../store/authStore';
import { ROLE_HOME_ROUTES } from '../../utils/constants';
import { useNavigate } from 'react-router-dom';

const GoogleLoginButton = ({ role = 'PATIENT', onError }) => {
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleSuccess = async (credentialResponse) => {
    if (!credentialResponse?.credential) {
      if (onError) onError('No credential received from Google. Please try again.');
      return;
    }
    try {
      const response = await authService.googleAuth({ idToken: credentialResponse.credential, role });
      const { user, accessToken } = response.data?.data || response.data;

      setAuth({ user, accessToken });
      const targetRoute = ROLE_HOME_ROUTES[user.role] || '/dashboard';
      navigate(targetRoute);
    } catch (err) {
      const data = err.response?.data;
      let msg = 'Google authentication failed.';
      if (typeof data?.message === 'string') {
        msg = data.message;
      } else if (typeof data?.error === 'string') {
        msg = data.error;
      } else if (err.message) {
        msg = err.message;
      }
      if (onError) onError(msg);
    }
  };

  const handleError = () => {
    const isTunnel = window.location.hostname.includes('trycloudflare.com') || window.location.hostname.includes('loca.lt');
    if (isTunnel) {
      if (onError) onError(`Google Sign-In: The tunnel URL (${window.location.origin}) is not registered in Google Cloud Console. Please open http://localhost:5173 or add this tunnel URL to Authorized JavaScript Origins.`);
    } else {
      if (onError) onError('Google Sign-In popup was closed or origin is not authorized in Google Cloud Console.');
    }
  };

  if (!clientId) {
    // Fallback UI when VITE_GOOGLE_CLIENT_ID is not configured in .env
    return (
      <button
        type="button"
        onClick={() => {
          if (onError) onError('Google OAuth client ID is not configured in environment variables.');
        }}
        className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </button>
    );
  }

  return (
    <div className="w-full flex justify-center">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={handleError}
        shape="rectangular"
        theme="outline"
        size="large"
        text="continue_with"
      />
    </div>
  );
};

export default GoogleLoginButton;
