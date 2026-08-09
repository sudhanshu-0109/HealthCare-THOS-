/**
 * frontend/src/services/analytics.service.js — Analytics API service.
 */
import api from './api';

export const getDashboardSummary = () => api.get('/analytics/dashboard');
export const getAppointmentTrends = (params) => api.get('/analytics/appointments', { params });
export const getDepartmentUsage = (params) => api.get('/analytics/departments', { params });
export const getDoctorActivity = (params) => api.get('/analytics/doctors', { params });
export const getQueueLoadStats = (params) => api.get('/analytics/queue-load', { params });
export const getEmergencyStats = (params) => api.get('/analytics/emergency', { params });
