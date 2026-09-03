/**
 * services/conversation.service.js — AI Companion conversation orchestration.
 *
 * Call graph (enforced order — never bypassable):
 *   1. Consent check (LEVEL_2) — done in middleware before this service
 *   2. Safety gate (assessRisk) — ALWAYS first
 *   3a. If RED → crisis.service (never Gemini wellness call)
 *   3b. If GREEN/YELLOW/ORANGE → Gemini wellness response
 *   4. Recommendation engine
 *   5. Persist message + risk assessment
 *   6. Return structured response
 */

import prisma from '../../../prisma/client.js';
import { assessRisk } from './safety.service.js';
import { generateWellnessResponse } from './gemini.service.js';
import { extractMoodMetadata } from './mood.service.js';
import { extractIntent } from './intent.service.js';
import { getRecommendations, logRecommendationsShown } from './recommendation.service.js';
import { buildConversationHistory } from '../prompts/wellness.prompt.js';
import { createRiskEvent } from './crisis.service.js';

const CONTEXT_MESSAGE_LIMIT = 10; // how many recent messages to include for context

/**
 * Start a new AI conversation session.
 * @param {string} profileId — MentalHealthProfile.id
 * @returns {Promise<object>} — created AIConversation
 */
export async function startConversation(profileId) {
  return prisma.aIConversation.create({
    data: { profileId },
    select: { id: true, profileId: true, createdAt: true, isActive: true },
  });
}

/**
 * List recent conversations for a user.
 * @param {string} profileId
 * @returns {Promise<object[]>}
 */
export async function listConversations(profileId) {
  return prisma.aIConversation.findMany({
    where: { profileId },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      id: true,
      title: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { messages: true } },
    },
  });
}

/**
 * Get a conversation with its messages.
 * @param {string} conversationId
 * @param {string} profileId — for ownership check
 */
export async function getConversation(conversationId, profileId) {
  return prisma.aIConversation.findFirst({
    where: { id: conversationId, profileId },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
    },
  });
}

/**
 * Send a message and get an AI response.
 *
 * Returns either:
 *   { type: 'wellness', reply, emotion, intent, riskLevel, recommendations }
 *   { type: 'safety_screen', riskLevel, resources, trustedContactOption }
 *
 * @param {string} profileId
 * @param {string} conversationId
 * @param {string} userMessage
 * @returns {Promise<object>}
 */
export async function sendMessage(profileId, conversationId, userMessage) {
  // Verify conversation belongs to this profile
  const conversation = await prisma.aIConversation.findFirst({
    where: { id: conversationId, profileId, isActive: true },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        take: CONTEXT_MESSAGE_LIMIT,
      },
    },
  });

  if (!conversation) {
    throw Object.assign(new Error('Conversation not found or inactive'), { statusCode: 404 });
  }

  // Build context summary for AI classifier
  const recentText = conversation.messages
    .slice(-3)
    .map((m) => `${m.role}: ${m.content}`)
    .join(' | ');

  // ── Execute Safety Assessment & Wellness Response in Parallel for maximum speed ──
  const history = buildConversationHistory(conversation.messages);
  const [safety, wellnessResult] = await Promise.all([
    assessRisk(conversationId, userMessage, recentText),
    generateWellnessResponse(history, userMessage),
  ]);

  // Store the user message regardless of outcome
  await prisma.aIConversationMessage.create({
    data: {
      conversationId,
      role: 'user',
      content: userMessage,
      riskLevel: safety.riskLevel,
    },
  });

  // ── RED PATH: Crisis flow — stop normal AI, return safety screen ───────────
  if (safety.requiresEscalation) {
    // Log risk event (append-only)
    await createRiskEvent(profileId, 'RED', userMessage, conversationId);

    // Deactivate the conversation so it cannot continue normally
    await prisma.aIConversation.update({
      where: { id: conversationId },
      data: { isActive: false },
    });

    return buildCrisisScreen();
  }

  // ── SAFE PATH: Process wellness response ───────────────────────────────────
  const { parsed: aiResponse, promptVersion, modelVersion } = wellnessResult;

  const mood = extractMoodMetadata(aiResponse);
  const intent = extractIntent(aiResponse);
  const aiCategories = aiResponse.recommendation?.categories || [];

  // If AI also flags ORANGE/RED (secondary safety check on output)
  const aiRiskLevel = aiResponse.risk?.level || 'GREEN';
  const finalRiskLevel = moreConservative(safety.riskLevel, aiRiskLevel);

  if (finalRiskLevel === 'RED') {
    await createRiskEvent(profileId, 'RED', userMessage, conversationId);
    await prisma.aIConversation.update({ where: { id: conversationId }, data: { isActive: false } });
    return buildCrisisScreen();
  }

  // Log risk event for ORANGE level
  if (finalRiskLevel === 'ORANGE') {
    await createRiskEvent(profileId, 'ORANGE', userMessage, conversationId);
  }

  // Store assistant message
  await prisma.aIConversationMessage.create({
    data: {
      conversationId,
      role: 'assistant',
      content: aiResponse.reply,
      emotion: mood.primary,
      emotionIntensity: mood.intensity,
      intent,
      riskLevel: finalRiskLevel,
      promptVersion,
      modelVersion,
    },
  });

  // Update conversation title from first user message
  if (conversation.messages.length === 0 && !conversation.title) {
    const title = userMessage.length > 50 ? userMessage.slice(0, 47) + '...' : userMessage;
    await prisma.aIConversation.update({ where: { id: conversationId }, data: { title } });
  }

  // Get recommendations
  const recommendations = await getRecommendations(profileId, {
    emotion: mood.primary,
    intent,
    aiCategories,
    limit: 3,
  });

  await logRecommendationsShown(profileId, recommendations);

  return {
    type: 'wellness',
    reply: aiResponse.reply,
    emotion: mood,
    intent,
    riskLevel: finalRiskLevel,
    recommendations: recommendations.map((r) => ({
      id: r.id,
      type: r.type,
      title: r.title,
      description: r.description,
      duration: r.duration,
      imageUrl: r.imageUrl,
    })),
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function moreConservative(a, b) {
  const order = { GREEN: 0, YELLOW: 1, ORANGE: 2, RED: 3 };
  return order[a] >= order[b] ? a : b;
}

function buildCrisisScreen() {
  return {
    type: 'safety_screen',
    riskLevel: 'RED',
    message: "I can hear that you're going through something really difficult right now. Please know you're not alone — there are people who care about you and want to help.",
    resources: [
      { name: 'iCall (India)', number: '9152987821', description: 'Free counseling helpline' },
      { name: 'Vandrevala Foundation', number: '1860-2662-345', description: '24/7 mental health helpline' },
      { name: 'AASRA', number: '9820466627', description: 'Crisis intervention helpline' },
      { name: 'Emergency Services', number: '112', description: 'National emergency number' },
    ],
    trustedContactOption: true,
    professionalSupportOption: true,
  };
}
