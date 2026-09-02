/**
 * controllers/conversation.controller.js — AI Wellness Companion conversation endpoints.
 * Requires LEVEL_2 consent (enforced in middleware before these handlers).
 */

import { asyncHandler } from '../../../utils/asyncHandler.js';
import { ApiError } from '../../../utils/ApiError.js';
import {
  startConversation,
  listConversations,
  getConversation,
  sendMessage,
} from '../services/conversation.service.js';

/**
 * POST /api/mental-health/conversations
 * Start a new conversation session.
 */
export const createConversation = asyncHandler(async (req, res) => {
  const profileId = req.mentalHealthProfile.id;
  const conversation = await startConversation(profileId);
  res.status(201).json({ success: true, data: conversation });
});

/**
 * GET /api/mental-health/conversations
 * List recent conversations for the user.
 */
export const getConversations = asyncHandler(async (req, res) => {
  const profileId = req.mentalHealthProfile.id;
  const conversations = await listConversations(profileId);
  res.json({ success: true, data: conversations });
});

/**
 * GET /api/mental-health/conversations/:id
 * Get a specific conversation with its messages.
 */
export const getConversationById = asyncHandler(async (req, res) => {
  const profileId = req.mentalHealthProfile.id;
  const conversation = await getConversation(req.params.id, profileId);
  if (!conversation) throw ApiError.notFound('Conversation not found');
  res.json({ success: true, data: conversation });
});

/**
 * POST /api/mental-health/conversations/:id/messages
 * Send a user message and receive an AI response.
 * Response type is either 'wellness' or 'safety_screen'.
 *
 * A 'safety_screen' response MUST be rendered as a crisis screen on the frontend.
 * The frontend must never render it as a chat bubble.
 */
export const postMessage = asyncHandler(async (req, res) => {
  const profileId = req.mentalHealthProfile.id;
  const { message } = req.body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    throw ApiError.badRequest('Message is required');
  }

  if (message.trim().length > 2000) {
    throw ApiError.badRequest('Message is too long (max 2000 characters)');
  }

  const response = await sendMessage(profileId, req.params.id, message.trim());
  res.json({ success: true, data: response });
});
