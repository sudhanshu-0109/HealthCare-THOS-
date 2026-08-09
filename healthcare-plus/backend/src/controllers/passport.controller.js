/**
 * controllers/passport.controller.js — Healthcare Passport endpoints (Phase 7).
 */

import * as passportService from '../services/passport.service.js';
import prisma from '../prisma/client.js';
import { ApiError } from '../utils/ApiError.js';

export const getMyPassport = async (req, res) => {
  const data = await passportService.getOrCreatePassport(req.user.id);
  res.json({ success: true, data });
};

export const updateMyPassport = async (req, res) => {
  const data = await passportService.updatePassport(req.user.id, req.body);
  res.json({ success: true, data });
};

export const getMyTimeline = async (req, res) => {
  const { eventType, from, to, page, limit } = req.query;
  const data = await passportService.getTimeline(req.user.id, {
    eventType,
    from,
    to,
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
  });
  res.json({ success: true, data });
};

export const grantConsent = async (req, res) => {
  const { hospitalId, doctorId } = req.body;
  const data = await passportService.grantConsent(req.user.id, { hospitalId, doctorId });
  res.status(201).json({ success: true, data });
};

export const revokeConsent = async (req, res) => {
  await passportService.revokeConsent(req.user.id, req.params.id);
  res.json({ success: true, message: 'Consent revoked.' });
};

/**
 * Doctor-facing: get a patient's passport (consent-gated).
 */
export const getDoctorViewPassport = async (req, res) => {
  const { patientId } = req.params;

  // Get the doctor's profile ID for consent check
  const doctor = await prisma.doctor.findUnique({ where: { userId: req.user.id }, select: { id: true } });
  if (!doctor) throw ApiError.forbidden('No doctor profile found.');

  const hasConsent = await passportService.checkDoctorConsent(patientId, doctor.id);
  if (!hasConsent) {
    throw ApiError.forbidden('You do not have consent to view this patient\'s passport. Ask the patient to grant access.');
  }

  const data = await passportService.getOrCreatePassport(patientId);
  res.json({ success: true, data });
};
