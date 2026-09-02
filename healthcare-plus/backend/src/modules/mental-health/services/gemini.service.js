/**
 * services/gemini.service.js — Gemini 1.5 Flash wrapper for Mental Wellness.
 *
 * Responsibilities:
 * - Initialize the Gemini client once (singleton)
 * - generateWellnessResponse: multi-turn conversation with structured JSON output
 * - classifyRisk: single-turn risk classification with structured JSON output
 * - Schema validation with Zod on every response — fails closed on violation
 * - Logs model + prompt version with every call for audit
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { env } from '../../../config/env.js';
import { WELLNESS_SYSTEM_PROMPT, WELLNESS_PROMPT_VERSION } from '../prompts/wellness.prompt.js';
import { RISK_SYSTEM_PROMPT, RISK_PROMPT_VERSION } from '../prompts/risk.prompt.js';

export const MODEL_VERSION = 'gemini-3.6-flash';

// ── Gemini client (lazy singleton) ────────────────────────────────────────────
let _genAI = null;
function getGenAI() {
  if (!_genAI) {
    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set. Please add it to backend/.env');
    }
    _genAI = new GoogleGenerativeAI(apiKey);
  }
  return _genAI;
}

// ── Zod schemas for structured output validation ─────────────────────────────

const EMOTION_TYPES = ['CALM', 'HAPPY', 'NEUTRAL', 'SAD', 'LOW', 'STRESSED', 'OVERWHELMED', 'ANXIOUS', 'ANGRY', 'LONELY', 'FRUSTRATED'];
const INTENT_TYPES = ['SLEEP_SUPPORT', 'STRESS_SUPPORT', 'FOCUS_SUPPORT', 'SOCIAL_SUPPORT', 'RELAXATION', 'MEDITATION', 'REFLECTION', 'PROFESSIONAL_SUPPORT', 'GENERAL'];
const RISK_LEVELS = ['GREEN', 'YELLOW', 'ORANGE', 'RED'];
const CONTENT_TYPES = ['BREATHING', 'MEDITATION', 'MINDFULNESS', 'SLEEP_SOUND', 'SLEEP_STORY', 'RELAXATION_MUSIC', 'GRATITUDE', 'GROUNDING', 'FOCUS', 'WELLNESS_PROGRAM'];

const WellnessResponseSchema = z.object({
  reply: z.string().min(1),
  emotion: z.object({
    primary: z.enum(EMOTION_TYPES),
    secondary: z.array(z.enum(EMOTION_TYPES)).default([]),
    intensity: z.number().int().min(1).max(10),
  }),
  intent: z.enum(INTENT_TYPES),
  risk: z.object({
    level: z.enum(RISK_LEVELS),
    requiresEscalation: z.boolean(),
  }),
  recommendation: z.object({
    categories: z.array(z.enum(CONTENT_TYPES)).default([]),
  }),
});

const RiskResponseSchema = z.object({
  riskLevel: z.enum(RISK_LEVELS),
  requiresEscalation: z.boolean(),
  reasoning: z.string(),
});

// ── Safe fallback responses (used when schema validation fails) ───────────────

const SAFE_WELLNESS_FALLBACK = {
  reply: "I'm here with you. It sounds like things might be feeling heavy right now. Would you like to try a short breathing exercise together?",
  emotion: { primary: 'NEUTRAL', secondary: [], intensity: 5 },
  intent: 'GENERAL',
  risk: { level: 'GREEN', requiresEscalation: false },
  recommendation: { categories: ['BREATHING'] },
};

// Fallback for risk classifier failures — always err on the side of caution
const SAFE_RISK_FALLBACK = {
  riskLevel: 'YELLOW',
  requiresEscalation: false,
  reasoning: 'Risk classification unavailable — defaulting to YELLOW for safety',
};

/**
 * Parse JSON from a Gemini response that may have markdown code fences.
 */
function parseGeminiJSON(text) {
  // Strip markdown code fences if present
  const stripped = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
  return JSON.parse(stripped);
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Generate a structured wellness response from the AI Companion.
 * @param {Array} conversationHistory - Array of {role, parts} objects (Gemini format)
 * @param {string} userMessage - The latest user message
 * @returns {Promise<{parsed: object, promptVersion: string, modelVersion: string}>}
 */
export async function generateWellnessResponse(conversationHistory, userMessage) {
  try {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({
      model: MODEL_VERSION,
      systemInstruction: WELLNESS_SYSTEM_PROMPT,
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.7,
        maxOutputTokens: 800,
      },
    });

    const chat = model.startChat({ history: conversationHistory });
    const result = await chat.sendMessage(userMessage);
    const text = result.response.text();

    let raw;
    try {
      raw = parseGeminiJSON(text);
    } catch {
      console.error('[GeminiService] JSON parse failed for wellness response:', text);
      return { parsed: SAFE_WELLNESS_FALLBACK, promptVersion: WELLNESS_PROMPT_VERSION, modelVersion: MODEL_VERSION };
    }

    const validated = WellnessResponseSchema.safeParse(raw);
    if (!validated.success) {
      console.error('[GeminiService] Schema validation failed for wellness response:', validated.error.issues);
      return { parsed: SAFE_WELLNESS_FALLBACK, promptVersion: WELLNESS_PROMPT_VERSION, modelVersion: MODEL_VERSION };
    }

    return { parsed: validated.data, promptVersion: WELLNESS_PROMPT_VERSION, modelVersion: MODEL_VERSION };
  } catch (err) {
    console.error('[GeminiService] generateWellnessResponse error:', err.message);
    return { parsed: SAFE_WELLNESS_FALLBACK, promptVersion: WELLNESS_PROMPT_VERSION, modelVersion: MODEL_VERSION };
  }
}

/**
 * Classify risk level for a user message using the safety classifier.
 * This runs BEFORE the wellness response generator.
 * @param {string} userMessage
 * @param {string} [contextSummary] - brief context of recent conversation
 * @returns {Promise<{riskLevel, requiresEscalation, reasoning, promptVersion, modelVersion}>}
 */
export async function classifyRisk(userMessage, contextSummary = '') {
  try {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({
      model: MODEL_VERSION,
      systemInstruction: RISK_SYSTEM_PROMPT,
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1, // Low temperature for consistent safety classification
        maxOutputTokens: 200,
      },
    });

    const prompt = contextSummary
      ? `Recent context: "${contextSummary}"\n\nNew message to classify: "${userMessage}"`
      : `Message to classify: "${userMessage}"`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    let raw;
    try {
      raw = parseGeminiJSON(text);
    } catch {
      console.error('[GeminiService] JSON parse failed for risk response:', text);
      return { ...SAFE_RISK_FALLBACK, promptVersion: RISK_PROMPT_VERSION, modelVersion: MODEL_VERSION };
    }

    const validated = RiskResponseSchema.safeParse(raw);
    if (!validated.success) {
      console.error('[GeminiService] Schema validation failed for risk response:', validated.error.issues);
      return { ...SAFE_RISK_FALLBACK, promptVersion: RISK_PROMPT_VERSION, modelVersion: MODEL_VERSION };
    }

    return { ...validated.data, promptVersion: RISK_PROMPT_VERSION, modelVersion: MODEL_VERSION };
  } catch (err) {
    console.error('[GeminiService] classifyRisk error:', err.message);
    return { ...SAFE_RISK_FALLBACK, promptVersion: RISK_PROMPT_VERSION, modelVersion: MODEL_VERSION };
  }
}
