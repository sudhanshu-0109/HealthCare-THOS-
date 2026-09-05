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
import { isDemoPatient } from '../../data/wellnessMockData';

function purgeLegacyUnscopedWellness() {
  try {
    const LEGACY_KEYS = [
      'mw_checkin_dates', 'mw_checkin_history', 'mw_today_checkin', 'mw_progress_cache',
      'mw_activity_log', 'mw_program_completed_days', 'mw_program_progress',
      'pw_onboarded_v2', 'pw_onboarded', 'pw_profile_v2', 'pw_profile',
      'pw_checkins_v2', 'pw_checkins', 'pw_workouts_v2', 'pw_workouts',
      'pw_habit_defs_v2', 'pw_habit_defs', 'pw_habit_logs_v2', 'pw_habit_logs',
      'pw_biometrics_history_v2', 'pw_biometrics', 'pw_today_workout_progress_v2',
    ];
    LEGACY_KEYS.forEach(k => localStorage.removeItem(k));
  } catch {}
}

const AuthBootstrap = ({ children }) => {
  // If there's no session token there's nothing to revalidate — render immediately.
  const [ready, setReady] = useState(() => {
    // Purge legacy permanent localStorage auth tokens and un-scoped wellness data
    try {
      localStorage.removeItem('hc_token');
      localStorage.removeItem('hc_user');
      localStorage.removeItem('healthcare-plus-auth');
      purgeLegacyUnscopedWellness();
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
          if (!isDemoPatient(user)) {
            purgeLegacyUnscopedWellness();
          }
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
