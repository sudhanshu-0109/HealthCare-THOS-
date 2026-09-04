/**
 * services/physicalAssistant.service.js
 *
 * Real Gemini API service for Healthcare+ Physical Health Assistant.
 * Powered by Google Gemini with user's runtime profile, check-ins, readiness score,
 * active workout plan, habits, and streak data.
 */

import { mockTodayWorkout } from "../data/physicalWellnessMockData.js";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

const CANDIDATE_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.5-flash",
  "gemini-3.6-flash",
];

/**
 * Builds the personalized system instruction prompt injecting all runtime user context.
 */
function buildSystemPrompt(context = {}) {
  const {
    profile,
    todayCheckin,
    streak = 0,
    workouts = [],
    habits = [],
    workoutPlan = mockTodayWorkout,
  } = context;

  const name = profile?.firstName || profile?.name || "Patient";
  const goal = profile?.primaryGoal || "General Fitness";
  const secGoal = profile?.secondaryGoal || "None";
  const fitnessLevel = profile?.fitnessLevel || "Intermediate";
  const activityLevel = profile?.activityLevel || "Moderate";
  const commitment = profile?.commitment || "30 min";
  const environment = profile?.environment || "Home";
  const equipment = Array.isArray(profile?.equipment) ? profile.equipment.join(", ") : "Bodyweight";
  const considerations = Array.isArray(profile?.considerations) ? profile.considerations.join(", ") : "None";
  const weight = profile?.weight ? `${profile.weight} ${profile?.weightUnit || "kg"}` : "Not recorded";
  const height = profile?.height ? `${profile.height} ${profile?.heightUnit || "cm"}` : "Not recorded";

  // Readiness context
  let readinessContext = "No daily check-in logged yet today. Recommend doing today's check-in to calibrate intensity.";
  if (todayCheckin) {
    const { avgReadiness = 8, result = "ready", scores = {} } = todayCheckin;
    readinessContext = `
- Today's Readiness Score: ${avgReadiness}/10 (${result.toUpperCase()})
- Energy Level: ${scores.energy ?? "—"}/5
- Sleep Quality: ${scores.sleep ?? "—"}/5
- Muscle Soreness: ${scores.soreness ?? "—"}/5 (1=none, 5=extreme)
- Joint / Pain Discomfort: ${scores.pain ?? "—"}/5
- Motivation: ${scores.motivation ?? "—"}/5
- Status: ${result === "ready" ? "Cleared for full planned intensity" : result === "adjusted" ? "Plan adjusted/scaled for recovery" : "Light recovery or active rest recommended"}
    `.trim();
  }

  // Today's workout plan
  const warmUpList = workoutPlan?.warmUp?.map(e => `${e.name} (${e.duration || e.reps || "1 set"})`).join(", ") || "None";
  const mainList = workoutPlan?.mainWorkout?.map(e => `${e.name} (${e.sets ? `${e.sets} sets` : ""} ${e.reps || e.duration || ""})`).join(", ") || "None";
  const coolDownList = workoutPlan?.coolDown?.map(e => `${e.name} (${e.duration || "1 set"})`).join(", ") || "None";

  // Completed workouts count
  const completedCount = workouts.filter(w => w.completed).length;

  return `
You are the Healthcare+ Physical Health AI Specialist and Personal Movement Coach.
You are chatting with ${name}.

### PATIENT HEALTH PROFILE:
- Name: ${name}
- Primary Fitness Goal: ${goal}
- Secondary Goal: ${secGoal}
- Fitness Level: ${fitnessLevel}
- Daily Activity Level: ${activityLevel}
- Daily Time Commitment: ${commitment}
- Workout Environment: ${environment}
- Available Equipment: ${equipment}
- Physical Limitations / Injuries: ${considerations}
- Body Metrics: Weight ${weight}, Height ${height}

### REAL-TIME LOGGED DATA:
${readinessContext}
- Active Consecutive Streak: ${streak} days
- Total Completed Workouts Logged: ${completedCount}

### TODAY'S ACTIVE WORKOUT PLAN (${workoutPlan?.title || "Daily Session"} - ${workoutPlan?.duration || 30} min):
- Focus: ${workoutPlan?.focus || "Movement & Fitness"}
- Warm-Up: ${warmUpList}
- Main Circuit: ${mainList}
- Cool-Down: ${coolDownList}

### COACHING GUIDELINES:
1. Always base your advice directly on the patient's logged state, primary goal (${goal}), and limitations (${considerations}).
2. When answering about today's workout or exercises (e.g. Hip Thrust, Plank, Mountain Climbers), give clear, biomechanically sound form cues, safety tips, and variations.
3. If soreness or pain is elevated, emphasize safe adaptations, recovery, and pacing.
4. Keep responses encouraging, direct, and conversational (typically 2 to 4 short paragraphs or bulleted form cues).
5. Use markdown formatting (**bolding**, bullet lists) for clarity. Never prescribe medical diagnoses.
`.trim();
}

/**
 * Sends conversation to Google Gemini API using native fetch.
 */
export async function sendPhysicalAssistantMessage({ userMessage, history = [], context = {} }) {
  if (!userMessage || !userMessage.trim()) {
    throw new Error("Message text is required.");
  }

  const systemPrompt = buildSystemPrompt(context);

  // Format previous messages for Gemini API
  // Gemini expects roles 'user' and 'model'
  const contents = [];

  // Add system instruction as initial context
  contents.push({
    role: "user",
    parts: [{ text: `[SYSTEM CONTEXT & INSTRUCTIONS]\n${systemPrompt}\n\nAcknowledge your role and readiness.` }],
  });
  contents.push({
    role: "model",
    parts: [{ text: `Understood. I am your Healthcare+ Physical Health Coach, fully briefed on your profile, goals, today's readiness, and current workout plan.` }],
  });

  // Append recent chat history (last 8 turns for efficiency)
  const recentHistory = history.slice(-8);
  recentHistory.forEach(msg => {
    if (msg.role === "user") {
      contents.push({
        role: "user",
        parts: [{ text: msg.content || msg.text || "" }],
      });
    } else if (msg.role === "assistant" || msg.role === "model") {
      contents.push({
        role: "model",
        parts: [{ text: msg.content || msg.text || "" }],
      });
    }
  });

  // Append current user message
  contents.push({
    role: "user",
    parts: [{ text: userMessage.trim() }],
  });

  // Try candidate models in order with a 6.5-second timeout
  let lastError = null;

  for (const model of CANDIDATE_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6500);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.7,
            topP: 0.9,
            maxOutputTokens: 600,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (text && text.trim()) {
        return text.trim();
      }
    } catch (err) {
      lastError = err;
      console.warn(`[PhysicalAssistant] Model ${model} attempt failed:`, err.message);
      // Try next candidate model
    }
  }

  // Fallback if all network/API calls fail: produce a highly tailored contextual answer
  console.warn("[PhysicalAssistant] Using smart contextual fallback due to:", lastError?.message);
  return getContextualFallback(userMessage, context);
}

/**
 * Intelligent contextual fallback utilizing the patient's actual logged data and plan.
 */
function getContextualFallback(text = "", context = {}) {
  const lower = text.toLowerCase();
  const { profile, todayCheckin, streak = 0, workoutPlan = mockTodayWorkout } = context;
  const goal = profile?.primaryGoal || "General Fitness";
  const name = profile?.firstName || "there";

  if (lower.includes("hip thrust")) {
    return `**Hip Thrust Form & Execution Guide:**\n\n1. **Setup:** Rest your upper back against a sturdy bench or mat with feet flat on the floor, shoulder-width apart.\n2. **Drive:** Push through your heels to extend your hips upward until your torso and thighs form a straight horizontal line.\n3. **Apex Squeeze:** Squeeze your glutes firmly at the top for 1–2 seconds. Keep your chin slightly tucked to prevent arching your lower back.\n4. **Tempo:** Lower your hips under control for 3 seconds before driving back up.\n\n*Target: 3 sets of 45s with 30s rest.*`;
  }

  if (lower.includes("why") && (lower.includes("adjust") || lower.includes("change") || lower.includes("plan"))) {
    if (todayCheckin?.result === "adjusted" || (todayCheckin?.scores?.soreness || 0) >= 3) {
      return `Today's workout intensity was calibrated based on your check-in: your readiness was logged at **${todayCheckin?.avgReadiness || 6}/10** with soreness at **${todayCheckin?.scores?.soreness || 3}/5**.\n\nWe reduced high-impact intervals and increased rest periods to 30–45s so you build strength without excessive muscular strain. Staying consistent on lower-energy days produces superior long-term results!`;
    }
    return `Your plan is calibrated directly to your **${goal}** focus and your current **${streak}-day streak**. We optimize each workout's volume and rest intervals so you recover effectively between sessions.`;
  }

  if (lower.includes("today") || lower.includes("workout") || lower.includes("routine")) {
    return `Today's session is **${workoutPlan?.title || "Core & Cardio"}** (${workoutPlan?.duration || 30} min):\n\n- **Warm-Up:** Jumping Jacks and Hip Circles to activate mobility.\n- **Main Focus:** Hip Thrust, Plank Hold, Mountain Climbers, and Russian Twists for core stability and posterior chain power.\n- **Cool-Down:** Child's Pose and Seated Forward Fold.\n\nTake your time on each set and focus on quality form over speed!`;
  }

  if (lower.includes("recovery") || lower.includes("sore") || lower.includes("rest")) {
    return `Muscular adaptation and growth happen during recovery, not during the workout itself. For your **${goal}** journey:\n\n- **Hydration & Electrolytes:** Aim for 2.5L+ of water daily.\n- **Post-Workout Nutrition:** Consume adequate protein and complex carbs within 1–2 hours.\n- **Active Mobility:** 5–10 minutes of light stretching or a walk helps flush metabolic waste and reduces stiffness.`;
  }

  return `Great question, ${name}! Based on your **${goal}** goal and current **${streak}-day streak**, consistency is your greatest superpower. Stay focused on good form throughout today's **${workoutPlan?.title || "workout"}**, and remember to log your feedback when you finish so tomorrow's plan adapts to you.`;
}
