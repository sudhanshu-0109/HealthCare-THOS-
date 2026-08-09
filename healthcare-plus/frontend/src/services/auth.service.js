/**
 * services/auth.service.js — Axios API calls for authentication.
 */

import api from './api';

export const register = (data) => api.post('/auth/register', data);

export const login = (credentials) => api.post('/auth/login', credentials);

export const acceptInvite = (data) => api.post('/auth/accept-invite', data);

export const verifyOtp = (data) => api.post('/auth/verify-otp', data);

export const verifyEmail = (token) => api.get(`/auth/verify-email/${token}`);

export const resendVerification = (email) => api.post('/auth/resend-verification', { email });

export const googleAuth = (idToken) => api.post('/auth/google', { idToken });

export const forgotPassword = (email) => api.post('/auth/forgot-password', { email });

export const verifyResetOtp = (data) => api.post('/auth/verify-reset-otp', data);

export const resetPassword = (data) => api.post('/auth/reset-password', data);

export const changePassword = (data) => api.post('/auth/change-password', data);

export const logout = (refreshToken) => api.post('/auth/logout', { refreshToken });

export const getCurrentUser = () => api.get('/auth/me');

export const refreshToken = () => api.post('/auth/refresh-token');
