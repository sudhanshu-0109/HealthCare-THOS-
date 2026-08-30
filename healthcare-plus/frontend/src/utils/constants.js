/**
 * constants.js — App-wide constants shared across the frontend.
 */

// API base URL — always use services/api.js instance, not this directly
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// User roles — mirrors backend Role enum
export const ROLES = {
  PATIENT: 'PATIENT',
  DOCTOR: 'DOCTOR',
  HOSPITAL_ADMIN: 'HOSPITAL_ADMIN',
  RECEPTIONIST: 'RECEPTIONIST',
  PHARMACIST: 'PHARMACIST',
  LAB_STAFF: 'LAB_STAFF',
  AMBULANCE_DRIVER: 'AMBULANCE_DRIVER',
  SUPER_ADMIN: 'SUPER_ADMIN',
};

// Role-to-home-route mapping (used in post-login redirect)
export const ROLE_HOME_ROUTES = {
  [ROLES.PATIENT]: '/health-hub',
  [ROLES.DOCTOR]: '/doctor/dashboard',
  [ROLES.HOSPITAL_ADMIN]: '/admin/dashboard',
  [ROLES.RECEPTIONIST]: '/receptionist/dashboard',
  [ROLES.PHARMACIST]: '/pharmacy/dashboard',
  [ROLES.LAB_STAFF]: '/lab/dashboard',
  [ROLES.AMBULANCE_DRIVER]: '/driver/dashboard',
  [ROLES.SUPER_ADMIN]: '/superadmin/dashboard',
};

// Crowd level display config
export const CROWD_LEVEL = {
  LOW: { label: 'Low queue', color: 'text-green-600', dot: '🟢' },
  MODERATE: { label: 'Moderate', color: 'text-yellow-600', dot: '🟡' },
  HIGH: { label: 'High load', color: 'text-orange-600', dot: '🟠' },
  CRITICAL: { label: 'Very busy', color: 'text-red-600', dot: '🔴' },
};

// Appointment status display config
export const APPOINTMENT_STATUS = {
  PENDING_PAYMENT: { label: 'Pending Payment', color: 'text-yellow-600 bg-yellow-50' },
  CONFIRMED: { label: 'Confirmed', color: 'text-green-600 bg-green-50' },
  CANCELLED: { label: 'Cancelled', color: 'text-red-600 bg-red-50' },
  IN_CONSULTATION: { label: 'In Consultation', color: 'text-blue-600 bg-blue-50' },
  COMPLETED: { label: 'Completed', color: 'text-gray-600 bg-gray-50' },
  NO_SHOW: { label: 'No Show', color: 'text-orange-600 bg-orange-50' },
};

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 10;
