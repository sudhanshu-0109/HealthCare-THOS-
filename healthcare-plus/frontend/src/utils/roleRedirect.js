/**
 * roleRedirect.js — Post-login role → home-route map.
 *
 * Single source of truth lives in constants.js (ROLE_HOME_ROUTES). This module
 * re-exports it under the ROLE_HOME_ROUTE alias so existing imports keep working
 * without a second, divergent copy of the map. (A previous duplicate here sent
 * RECEPTIONIST to /admin/dashboard, which is HOSPITAL_ADMIN-only and bounced
 * receptionists to /unauthorized.)
 */
export { ROLE_HOME_ROUTES as ROLE_HOME_ROUTE } from './constants';
