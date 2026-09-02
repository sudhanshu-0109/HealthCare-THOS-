/**
 * services/mentalHealth.service.js — Mental Wellness API service layer.
 * Follows the same pattern as other service files in this directory.
 */

import api from './api.js';

const BASE = '/mental-health';

// ── Profile & Consent ──────────────────────────────────────────────────────────
export const getProfile = () => api.get(`${BASE}/profile`);
export const updateConsent = (consentLevel) => api.patch(`${BASE}/profile/consent`, { consentLevel });

// ── Check-ins ─────────────────────────────────────────────────────────────────
export const submitCheckIn = (data) => api.post(`${BASE}/check-ins`, data);
export const getCheckInHistory = (limit = 30) => api.get(`${BASE}/check-ins?limit=${limit}`);

// ── AI Conversations ──────────────────────────────────────────────────────────
export const createConversation = () => api.post(`${BASE}/conversations`);
export const getConversations = () => api.get(`${BASE}/conversations`);
export const getConversation = (id) => api.get(`${BASE}/conversations/${id}`);
export const sendMessage = (conversationId, message) =>
  api.post(`${BASE}/conversations/${conversationId}/messages`, { message });

// ── Progress ──────────────────────────────────────────────────────────────────
export const getProgress = () => api.get(`${BASE}/progress`);

// ── Recommendations ───────────────────────────────────────────────────────────
export const getRecommendations = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return api.get(`${BASE}/recommendations${qs ? '?' + qs : ''}`);
};

// ── Activities & Programs ─────────────────────────────────────────────────────
export const getWellnessContent = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return api.get(`${BASE}/activities/content${qs ? '?' + qs : ''}`);
};
export const startActivity = (contentId) => api.post(`${BASE}/activities/${contentId}/start`);
export const completeActivity = (contentId, data) => api.post(`${BASE}/activities/${contentId}/complete`, data);
export const getPrograms = () => api.get(`${BASE}/programs`);
export const enrollInProgram = (programId) => api.post(`${BASE}/programs/${programId}/enroll`);

// ── Crisis ────────────────────────────────────────────────────────────────────
export const recordCrisisAction = (actionType, metadata, resolve = false) =>
  api.post(`${BASE}/crisis/action`, { actionType, metadata, resolve });

// ── Trusted Contacts ──────────────────────────────────────────────────────────
export const getTrustedContacts = () => api.get(`${BASE}/trusted-contacts`);
export const addTrustedContact = (data) => api.post(`${BASE}/trusted-contacts`, data);
export const updateTrustedContact = (id, data) => api.patch(`${BASE}/trusted-contacts/${id}`, data);
export const removeTrustedContact = (id) => api.delete(`${BASE}/trusted-contacts/${id}`);
