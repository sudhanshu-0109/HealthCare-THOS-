/**
 * controllers/onlineSession.controller.js — HTTP handlers for online session lifecycle (Phase 16).
 */

import { asyncHandler as catchAsync } from '../utils/asyncHandler.js';
import * as onlineSessionService from '../services/onlineSession.service.js';

/**
 * GET /online-sessions/:appointmentId
 * Accessible by both patient (own appointment) and doctor.
 */
export const getSession = catchAsync(async (req, res) => {
  const session = await onlineSessionService.getSession(
    req.params.appointmentId,
    req.user.id
  );
  res.json({ success: true, data: session });
});

/**
 * POST /online-sessions/:appointmentId/join
 * Patient or doctor enters the waiting room.
 */
export const joinSession = catchAsync(async (req, res) => {
  const result = await onlineSessionService.joinSession(
    req.params.appointmentId,
    req.user.id
  );
  res.json({ success: true, data: result });
});

/**
 * POST /online-sessions/:appointmentId/start
 * Doctor starts the live call — creates Consultation record.
 */
export const startSession = catchAsync(async (req, res) => {
  const session = await onlineSessionService.startSession(
    req.params.appointmentId,
    req.user.id
  );
  res.json({ success: true, data: session });
});

/**
 * POST /online-sessions/:appointmentId/end
 * Doctor ends the live call.
 */
export const endSession = catchAsync(async (req, res) => {
  const session = await onlineSessionService.endSession(
    req.params.appointmentId,
    req.user.id,
    req.body.reason ?? null
  );
  res.json({ success: true, data: session });
});

/**
 * GET /online-sessions/doctor/stats
 * Doctor-only: summary stats for online appointment dashboard card.
 */
export const getDoctorOnlineStats = catchAsync(async (req, res) => {
  const stats = await onlineSessionService.getDoctorOnlineStats(
    req.user.id,
    req.user.hospitalId
  );
  res.json({ success: true, data: stats });
});
