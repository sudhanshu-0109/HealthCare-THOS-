/**
 * components/auth/AuthBootstrap.jsx — Revalidates the session on app load.
 *
 * The auth store is persisted in localStorage, which the user can edit. On startup,
 * if a token is present we call GET /auth/me to re-sync the authoritative user/role
 * from the server before rendering the protected app. If the token is expired the
 * api interceptor transparently refreshes it; if that fails it clears auth and
 * redirects to /login. Any other error leaves the persisted session untouched.
 */

import { useEffect, useState } from 'react';
import useAuthStore from '../../store/authStore';
import * as authService from '../../services/auth.service';

const AuthBootstrap = ({ children }) => {
  // If there's no session token there's nothing to revalidate — render immediately.
  const [ready, setReady] = useState(() => {
    // Purge legacy permanent localStorage auth tokens
    try {
      localStorage.removeItem('hc_token');
      localStorage.removeItem('hc_user');
      localStorage.removeItem('healthcare-plus-auth');
    } catch {}
    return !sessionStorage.getItem('hc_token');
  });
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    if (ready) return;
    let mounted = true;

    (async () => {
      try {
        const res = await authService.getCurrentUser();
        const user = res?.data?.user;
        if (mounted && user) {
          // Re-read the token: the interceptor may have refreshed it during this call.
          const freshToken = sessionStorage.getItem('hc_token');
          setAuth({ user, accessToken: freshToken });
        }
      } catch {
        // 401 → interceptor already handled refresh/redirect. Other errors: keep state.
      } finally {
        if (mounted) setReady(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [ready, setAuth]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-teal-600" />
      </div>
    );
  }

  return children;
};

export default AuthBootstrap;
