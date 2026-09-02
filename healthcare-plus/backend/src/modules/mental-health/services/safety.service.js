/**
 * services/safety.service.js — Dual-layer safety engine (Section 7 of spec).
 *
 * Architecture:
 *   Stage 1: Fast rule-based keyword classifier (synchronous, no AI)
 *   Stage 2: Gemini structured AI classifier
 *   Final:   The MORE CAUTIOUS of the two signals wins — never the less cautious.
 *
 * All risk assessments are logged to AIRiskAssessment regardless of level.
 * This service sits in front of the conversation service and is NEVER optional.
 */

import prisma from '../../../prisma/client.js';
import { classifyRisk } from './gemini.service.js';

// ── Risk level ordering (higher index = more cautious) ────────────────────────
const RISK_ORDER = { GREEN: 0, YELLOW: 1, ORANGE: 2, RED: 3 };

/**
 * Return the more cautious of two risk levels.
 */
function moreConservative(levelA, levelB) {
  return RISK_ORDER[levelA] >= RISK_ORDER[levelB] ? levelA : levelB;
}

// ── Stage 1: Rule-based keyword classifier ────────────────────────────────────
//
// Keyword lists ordered from most critical to least.
// This runs synchronously before any AI call.

const RED_PATTERNS = [
  /\b(kill\s+myself|end\s+my\s+life|take\s+my\s+life|suicide|suicidal|want\s+to\s+die)\b/i,
  /\b(hurt\s+myself|harm\s+myself|self.?harm|cut\s+myself|cutting\s+myself)\b/i,
  /\b(plan\s+to|going\s+to|will)\s+(kill|end|hurt|harm)\s+(myself|my\s+life)\b/i,
  /\b(already\s+hurt|already\s+harmed|just\s+cut|already\s+taken)\b/i,
  /\b(hurt\s+someone|harm\s+someone|kill\s+someone)\b/i,
  /\b(overdose|pills\s+to\s+die|starve\s+myself\s+to\s+death)\b/i,
];

const ORANGE_PATTERNS = [
  /\b(want\s+to\s+disappear|wish\s+I\s+wasn.?t\s+here|shouldn.?t\s+be\s+alive)\b/i,
  /\b(can.?t\s+go\s+on|can.?t\s+take\s+it\s+anymore|no\s+reason\s+to\s+live)\b/i,
  /\b(everyone\s+would\s+be\s+better\s+off|better\s+off\s+without\s+me)\b/i,
  /\b(no\s+way\s+out|trapped|hopeless|worthless|nothing\s+matters\s+anymore)\b/i,
];

const YELLOW_PATTERNS = [
  /\b(don.?t\s+feel\s+like\s+myself|not\s+myself\s+lately|feel\s+empty)\b/i,
  /\b(completely\s+alone|nobody\s+cares|no\s+one\s+cares)\b/i,
  /\b(can.?t\s+see\s+the\s+point|what.?s\s+the\s+point|nothing\s+matters)\b/i,
];

/**
 * Classify risk using keyword patterns only.
 * @param {string} text
 * @returns {'GREEN'|'YELLOW'|'ORANGE'|'RED'}
 */
function ruleBasedClassify(text) {
  if (RED_PATTERNS.some((p) => p.test(text))) return 'RED';
  if (ORANGE_PATTERNS.some((p) => p.test(text))) return 'ORANGE';
  if (YELLOW_PATTERNS.some((p) => p.test(text))) return 'YELLOW';
  return 'GREEN';
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Run the full dual-layer safety assessment on a user message.
 * Always logs an AIRiskAssessment record regardless of outcome.
 *
 * @param {string} conversationId - The AIConversation.id
 * @param {string} userMessage - Raw user text to assess
 * @param {string} [contextSummary] - Recent conversation context for AI classifier
 * @returns {Promise<{
 *   riskLevel: string,
 *   requiresEscalation: boolean,
 *   ruleBasedLevel: string,
 *   aiClassifiedLevel: string,
 * }>}
 */
export async function assessRisk(conversationId, userMessage, contextSummary = '') {
  // Stage 1: fast synchronous rule-based check
  const ruleBasedLevel = ruleBasedClassify(userMessage);

  // Stage 2: Gemini AI classifier (always runs — even if rule-based is RED,
  // we still want the AI assessment logged for audit completeness)
  const aiResult = await classifyRisk(userMessage, contextSummary);
  const aiClassifiedLevel = aiResult.riskLevel;

  // Final: take the more conservative of the two signals
  const finalLevel = moreConservative(ruleBasedLevel, aiClassifiedLevel);
  const requiresEscalation = finalLevel === 'RED';

  // Always log — regardless of level — for audit trail
  await prisma.aIRiskAssessment.create({
    data: {
      conversationId,
      inputText: userMessage,
      ruleBasedLevel,
      aiClassifiedLevel,
      finalLevel,
      requiresEscalation,
      aiReasoning: aiResult.reasoning,
      promptVersion: aiResult.promptVersion,
      modelVersion: aiResult.modelVersion,
    },
  });

  return { riskLevel: finalLevel, requiresEscalation, ruleBasedLevel, aiClassifiedLevel };
}

/**
 * Quick rule-based-only check for check-in free text notes.
 * (No AI call, no DB write — just a fast scan before storing a note)
 * @param {string} text
 * @returns {'GREEN'|'YELLOW'|'ORANGE'|'RED'}
 */
export function quickRiskScan(text) {
  return ruleBasedClassify(text);
}
