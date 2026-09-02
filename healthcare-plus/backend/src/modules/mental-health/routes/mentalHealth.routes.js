/**
 * routes/mentalHealth.routes.js — Mental Wellness Ecosystem API routes.
 *
 * Middleware chain per route:
 *   authenticate → checkRole('PATIENT') → consentCheck(level) → [aiLimiter] → controller
 *
 * Consent levels (Section 16):
 *   LEVEL_1: Wellness tracking — check-ins, activities, progress, trusted contacts
 *   LEVEL_2: AI Companion — conversations, recommendations
 *   LEVEL_3: Professional Care (Phase 4 — stubbed here)
 *
 * ensureProfile: used on profile endpoints — no consent required, just ensures
 * the MentalHealthProfile row exists.
 */

import { Router } from 'express';
import { authenticate } from '../../../middleware/authenticate.js';
import { checkRole } from '../../../middleware/checkRole.js';
import { aiLimiter } from '../../../middleware/rateLimiter.js';
import { requireConsent, ensureProfile } from '../middleware/consentCheck.js';

// Controllers
import { getProfile, updateConsent } from '../controllers/profile.controller.js';
import { submitCheckIn, getCheckInHistory } from '../controllers/checkin.controller.js';
import {
  createConversation,
  getConversations,
  getConversationById,
  postMessage,
} from '../controllers/conversation.controller.js';
import { getProgress } from '../controllers/progress.controller.js';
import {
  getWellnessContent,
  startActivity,
  completeActivity,
  getPrograms,
  enrollInProgram,
} from '../controllers/activities.controller.js';
import { getPersonalizedRecommendations } from '../controllers/recommendations.controller.js';
import { recordAction } from '../controllers/crisis.controller.js';
import {
  addTrustedContact,
  getTrustedContacts,
  removeTrustedContact,
  updateTrustedContact,
} from '../controllers/trustedContacts.controller.js';

const router = Router();

// All mental health routes require authentication + PATIENT role
router.use(authenticate, checkRole('PATIENT'));

// ── Profile & Consent ──────────────────────────────────────────────────────────
// No consent level required for the profile endpoint itself (how else would you set consent?)
router.get('/profile', ensureProfile, getProfile);
router.patch('/profile/consent', ensureProfile, updateConsent);

// ── Check-ins (LEVEL_1) ────────────────────────────────────────────────────────
router.post('/check-ins', requireConsent('LEVEL_1'), submitCheckIn);
router.get('/check-ins', requireConsent('LEVEL_1'), getCheckInHistory);

// ── AI Conversations (LEVEL_2) ─────────────────────────────────────────────────
router.post('/conversations', requireConsent('LEVEL_2'), createConversation);
router.get('/conversations', requireConsent('LEVEL_2'), getConversations);
router.get('/conversations/:id', requireConsent('LEVEL_2'), getConversationById);
// AI message endpoint: apply AI rate limiter on top of consent check
router.post('/conversations/:id/messages', requireConsent('LEVEL_2'), aiLimiter, postMessage);

// ── Progress (LEVEL_1) ─────────────────────────────────────────────────────────
router.get('/progress', requireConsent('LEVEL_1'), getProgress);

// ── Recommendations (LEVEL_2) ──────────────────────────────────────────────────
router.get('/recommendations', requireConsent('LEVEL_2'), getPersonalizedRecommendations);

// ── Activities & Programs (LEVEL_1) ───────────────────────────────────────────
router.get('/activities/content', requireConsent('LEVEL_1'), getWellnessContent);
router.post('/activities/:id/start', requireConsent('LEVEL_1'), startActivity);
router.post('/activities/:id/complete', requireConsent('LEVEL_1'), completeActivity);
router.get('/programs', requireConsent('LEVEL_1'), getPrograms);
router.post('/programs/:id/enroll', requireConsent('LEVEL_1'), enrollInProgram);

// ── Crisis flow (LEVEL_1) ──────────────────────────────────────────────────────
router.post('/crisis/action', requireConsent('LEVEL_1'), recordAction);

// ── Trusted Contacts (LEVEL_1) ─────────────────────────────────────────────────
router.post('/trusted-contacts', requireConsent('LEVEL_1'), addTrustedContact);
router.get('/trusted-contacts', requireConsent('LEVEL_1'), getTrustedContacts);
router.patch('/trusted-contacts/:id', requireConsent('LEVEL_1'), updateTrustedContact);
router.delete('/trusted-contacts/:id', requireConsent('LEVEL_1'), removeTrustedContact);

export default router;
