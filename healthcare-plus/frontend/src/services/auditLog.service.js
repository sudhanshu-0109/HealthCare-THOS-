/**
 * frontend/src/services/auditLog.service.js — Audit log API service.
 */
import api from './api';

export const getAuditLog = (params) => api.get('/audit-log', { params });
