/**
 * controllers/trustedContacts.controller.js — Trusted contact CRUD.
 * Consent Level 1 required.
 * Server enforces notificationPolicy enum — never trust frontend values.
 */

import prisma from '../../../prisma/client.js';
import { asyncHandler } from '../../../utils/asyncHandler.js';
import { ApiError } from '../../../utils/ApiError.js';

const VALID_POLICIES = ['NEVER', 'ASK_FIRST', 'APPROVED_EMERGENCY_ONLY'];

/**
 * POST /api/mental-health/trusted-contacts
 */
export const addTrustedContact = asyncHandler(async (req, res) => {
  const profileId = req.mentalHealthProfile.id;
  const { name, relationship, phone, notificationPolicy = 'ASK_FIRST' } = req.body;

  if (!name?.trim()) throw ApiError.badRequest('name is required');
  if (!relationship?.trim()) throw ApiError.badRequest('relationship is required');
  if (!phone?.trim()) throw ApiError.badRequest('phone is required');
  if (!VALID_POLICIES.includes(notificationPolicy)) {
    throw ApiError.badRequest(`notificationPolicy must be one of: ${VALID_POLICIES.join(', ')}`);
  }

  // Max 5 trusted contacts per user
  const count = await prisma.trustedContact.count({ where: { profileId } });
  if (count >= 5) throw ApiError.conflict('Maximum 5 trusted contacts allowed');

  const contact = await prisma.trustedContact.create({
    data: { profileId, name: name.trim(), relationship: relationship.trim(), phone: phone.trim(), notificationPolicy },
  });

  res.status(201).json({ success: true, data: contact });
});

/**
 * GET /api/mental-health/trusted-contacts
 */
export const getTrustedContacts = asyncHandler(async (req, res) => {
  const profileId = req.mentalHealthProfile.id;
  const contacts = await prisma.trustedContact.findMany({
    where: { profileId },
    orderBy: { createdAt: 'asc' },
  });
  res.json({ success: true, data: contacts });
});

/**
 * DELETE /api/mental-health/trusted-contacts/:id
 */
export const removeTrustedContact = asyncHandler(async (req, res) => {
  const profileId = req.mentalHealthProfile.id;
  const contact = await prisma.trustedContact.findFirst({
    where: { id: req.params.id, profileId },
  });
  if (!contact) throw ApiError.notFound('Trusted contact not found');

  await prisma.trustedContact.delete({ where: { id: contact.id } });
  res.json({ success: true, data: { deleted: true } });
});

/**
 * PATCH /api/mental-health/trusted-contacts/:id
 * Update a trusted contact's notification policy.
 */
export const updateTrustedContact = asyncHandler(async (req, res) => {
  const profileId = req.mentalHealthProfile.id;
  const { notificationPolicy } = req.body;

  if (!VALID_POLICIES.includes(notificationPolicy)) {
    throw ApiError.badRequest(`notificationPolicy must be one of: ${VALID_POLICIES.join(', ')}`);
  }

  const contact = await prisma.trustedContact.findFirst({
    where: { id: req.params.id, profileId },
  });
  if (!contact) throw ApiError.notFound('Trusted contact not found');

  const updated = await prisma.trustedContact.update({
    where: { id: contact.id },
    data: { notificationPolicy },
  });

  res.json({ success: true, data: updated });
});
