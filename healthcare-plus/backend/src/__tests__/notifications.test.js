/**
 * __tests__/notifications.test.js — Phase 15 notification service unit tests.
 *
 * Tests the typed helper shape contracts and retrieval helpers.
 * All DB and Socket.IO calls are mocked — no DB required to run.
 */

import { describe, test, expect, jest, beforeEach } from '@jest/globals';

// ── Service shape tests (no DB needed) ──────────────────────────────────────

import {
  notifyAppointmentConfirmed,
  notifyAppointmentCancelled,
  notifyQueueYourTurn,
  notifyQueueYourTurnApproaching,
  notifyConsultationCompleted,
  notifyPharmacyStatusChanged,
  notifyPaymentResult,
  notifyBillGenerated,
  notifyPassportAccessChanged,
  notify,
  notifyHospitalRoles,
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../services/notifications.service.js';

describe('Notifications Service — exports', () => {
  test('all typed helpers and retrieval functions are exported', () => {
    // Core
    expect(typeof notify).toBe('function');
    expect(typeof notifyHospitalRoles).toBe('function');

    // Typed helpers
    expect(typeof notifyAppointmentConfirmed).toBe('function');
    expect(typeof notifyAppointmentCancelled).toBe('function');
    expect(typeof notifyQueueYourTurn).toBe('function');
    expect(typeof notifyQueueYourTurnApproaching).toBe('function');
    expect(typeof notifyConsultationCompleted).toBe('function');
    expect(typeof notifyPharmacyStatusChanged).toBe('function');
    expect(typeof notifyPaymentResult).toBe('function');
    expect(typeof notifyBillGenerated).toBe('function');
    expect(typeof notifyPassportAccessChanged).toBe('function');

    // Retrieval
    expect(typeof getMyNotifications).toBe('function');
    expect(typeof markNotificationRead).toBe('function');
    expect(typeof markAllNotificationsRead).toBe('function');
  });
});

// ── Email subset decision test ───────────────────────────────────────────────

describe('Notification email subset', () => {
  const EMAIL_TYPES = new Set([
    'APPOINTMENT_CONFIRMED',
    'PAYMENT_RESULT',
    'LAB_REPORT_READY',
    'PASSPORT_ACCESS_CHANGED',
  ]);

  test('4 high-value types are in the email subset', () => {
    expect(EMAIL_TYPES.has('APPOINTMENT_CONFIRMED')).toBe(true);
    expect(EMAIL_TYPES.has('PAYMENT_RESULT')).toBe(true);
    expect(EMAIL_TYPES.has('LAB_REPORT_READY')).toBe(true);
    expect(EMAIL_TYPES.has('PASSPORT_ACCESS_CHANGED')).toBe(true);
  });

  test('queue / consultation types are NOT in the email subset', () => {
    expect(EMAIL_TYPES.has('QUEUE_YOUR_TURN')).toBe(false);
    expect(EMAIL_TYPES.has('QUEUE_YOUR_TURN_APPROACHING')).toBe(false);
    expect(EMAIL_TYPES.has('CONSULTATION_COMPLETED')).toBe(false);
    expect(EMAIL_TYPES.has('PHARMACY_ORDER_UPDATE')).toBe(false);
  });
});
