/**
 * services/followUp.service.js — Follow-up recommendations (Phase 8).
 */

import prisma from '../prisma/client.js';
import { ApiError } from '../utils/ApiError.js';
import * as appointmentsService from './appointments.service.js';

const FOLLOW_UP_SELECT = {
  id: true,
  consultationId: true,
  patientId: true,
  doctorId: true,
  recommendedDate: true,
  reason: true,
  status: true,
  bookedAppointmentId: true,
  createdAt: true,
  doctor: {
    select: {
      id: true,
      user: { select: { fullName: true } },
      specialization: true,
      hospital: { select: { id: true, name: true, city: true } }
    }
  }
};

/**
 * Recommend a follow-up date for a consultation.
 */
export const recommendFollowUp = async (consultationId, { recommendedDate, reason }, doctorId) => {
  const consultation = await prisma.consultation.findUnique({
    where: { id: consultationId }
  });
  if (!consultation) throw ApiError.notFound('Consultation not found.');
  if (consultation.doctorId !== doctorId) throw ApiError.forbidden('Not your consultation.');

  const existing = await prisma.followUpRecommendation.findUnique({ where: { consultationId } });
  if (existing) throw ApiError.conflict('A follow-up recommendation already exists for this consultation.');

  return prisma.followUpRecommendation.create({
    data: {
      consultationId,
      patientId: consultation.patientId,
      doctorId,
      recommendedDate: new Date(recommendedDate),
      reason: reason || null,
      status: 'PENDING'
    },
    select: FOLLOW_UP_SELECT
  });
};

/**
 * Book a follow-up appointment based on a recommendation.
 * Bridges into appointments.service.js initiateBooking.
 */
export const bookFollowUp = async (followUpId, { scheduledTime }, patientId) => {
  const followUp = await prisma.followUpRecommendation.findUnique({
    where: { id: followUpId }
  });
  if (!followUp) throw ApiError.notFound('Follow-up recommendation not found.');
  if (followUp.patientId !== patientId) throw ApiError.forbidden('Not your follow-up recommendation.');
  if (followUp.status !== 'PENDING') throw ApiError.badRequest(`Cannot book follow-up in status: ${followUp.status}`);

  // Initiate regular booking
  const bookingData = await appointmentsService.initiateBooking({
    patientId,
    doctorId: followUp.doctorId,
    scheduledDate: followUp.recommendedDate, // User can't change the date here, only time
    scheduledTime
  });

  // Mark follow-up as booked
  const updatedFollowUp = await prisma.followUpRecommendation.update({
    where: { id: followUpId },
    data: {
      status: 'BOOKED',
      bookedAppointmentId: bookingData.appointment.id
    },
    select: FOLLOW_UP_SELECT
  });

  return { followUp: updatedFollowUp, ...bookingData };
};

/**
 * Dismiss a follow-up recommendation without booking.
 */
export const dismissFollowUp = async (followUpId, patientId) => {
  const followUp = await prisma.followUpRecommendation.findUnique({
    where: { id: followUpId }
  });
  if (!followUp) throw ApiError.notFound('Follow-up recommendation not found.');
  if (followUp.patientId !== patientId) throw ApiError.forbidden('Not your follow-up recommendation.');
  if (followUp.status !== 'PENDING') throw ApiError.badRequest(`Cannot dismiss follow-up in status: ${followUp.status}`);

  return prisma.followUpRecommendation.update({
    where: { id: followUpId },
    data: { status: 'DISMISSED' },
    select: FOLLOW_UP_SELECT
  });
};

/**
 * Get all follow-up recommendations for a patient.
 */
export const getMyFollowUps = async (patientId) => {
  return prisma.followUpRecommendation.findMany({
    where: { patientId },
    select: FOLLOW_UP_SELECT,
    orderBy: { createdAt: 'desc' }
  });
};
