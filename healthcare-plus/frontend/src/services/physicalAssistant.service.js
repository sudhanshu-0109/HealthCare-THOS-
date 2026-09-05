/**
 * services/physicalAssistant.service.js
 *
 * Real Gemini API service for Healthcare+ Physical Health Assistant.
 * Powered by Google Gemini with user's runtime profile, check-ins, readiness score,
 * active workout plan, habits, and streak data.
 */

import { mockTodayWorkout } from "../data/physicalWellnessMockData.js";

function getApiKey() {
  return (
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_GEMINI_API_KEY) ||
    (typeof process !== "undefined" && process.env?.VITE_GEMINI_API_KEY) ||
    ""
  );
}

const CANDIDATE_MODELS = [
  "gemini-3.5-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash-lite",
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
    biometrics = [],
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

  // Biometrics & Date context
  const latestBio = biometrics[0] || null;
  const weight = latestBio?.weight ? `${latestBio.weight} ${latestBio.weightUnit || "kg"}` : (profile?.weight ? `${profile.weight} ${profile?.weightUnit || "kg"}` : "Not recorded");
  const height = latestBio?.height ? `${latestBio.height} ${latestBio.heightUnit || "cm"}` : (profile?.height ? `${profile.height} ${profile?.heightUnit || "cm"}` : "Not recorded");
  const bmi = latestBio?.bmi ? `${latestBio.bmi} (${latestBio.category || "Normal"})` : (profile?.bmi ? `${profile.bmi} (${profile?.bmiCategory || "Normal"})` : "Calculated from weight and height");

  const now = new Date();
  const dayName = now.toLocaleDateString("en-US", { weekday: "long" });
  const dateStr = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

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
You are the Healthcare+ Physical Health AI Specialist, Clinical Nutritionist, and Personal Movement Coach.
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
- Body Metrics: Weight ${weight}, Height ${height}, BMI: ${bmi}
- Today's Date & Day: ${dayName}, ${dateStr}

### REAL-TIME LOGGED DATA:
${readinessContext}
- Active Consecutive Streak: ${streak} days
- Total Completed Workouts Logged: ${completedCount}

### TODAY'S ACTIVE WORKOUT PLAN (${workoutPlan?.title || "Daily Session"} - ${workoutPlan?.duration || 30} min):
- Focus: ${workoutPlan?.focus || "Movement & Fitness"}
- Warm-Up: ${warmUpList}
- Main Circuit: ${mainList}
- Cool-Down: ${coolDownList}

### COACHING & INDIAN DIET GENERATION PROTOCOL:
1. When asked about exercises or workout plan, give clear, biomechanically sound form cues, safety tips, and adaptations based on readiness.
2. CRITICAL - INDIAN DIET GENERATION IN TABULAR FORMAT:
   When the user asks for a diet plan, meal recommendations, or food advice:
   - You MUST generate an authentic, wholesome, nutrient-dense INDIAN Diet Plan calibrated to ${name}'s ${goal} goal, Weight (${weight}), BMI (${bmi}), and today's readiness (${todayCheckin?.avgReadiness || 8}/10).
   - Format the plan in a **clean MARKDOWN TABLE** with EXACTLY these 5 columns:
     | Meal & Timing | Indian Dish | Portion / Ingredients | Calories & Protein | Target Purpose |
   - Cover: Early Morning (7:00 AM), Breakfast (8:30 AM), Mid-Morning (11:00 AM), Lunch (1:15 PM), Pre/Post-Workout Snack (5:00 PM), Dinner (8:00 PM), and Bedtime Recovery (10:00 PM).
   - NON-REPETITIVE ROTATION: Today is ${dayName}. You MUST provide a menu specific to today's rotation. Use varied healthy Indian staples (Moong dal chilla, Besan chilla, Vegetable Poha, Idli-sambar, Ragi dosa, Rajma, Chana dal palak, Paneer bhurji, Jowar/Bajra roti, Khichdi, Makhana, Chaas, Sattu, Sprouts chaat, Turmeric golden milk). Do NOT repeat identical meals daily.
   - SORENESS / READINESS ADAPTATION: If soreness is high or readiness is adjusted, prioritize anti-inflammatory spices (turmeric, ginger, cumin), magnesium (nuts/seeds), and hydration.
   - Include a concise summary below the table with:
     * Daily Target Calories (kcal) & Target Protein (g)
     * Daily Water/Hydration Goal (in Litres)
     * Key Indian nutrition tip tailored to today's workout.
3. Keep responses encouraging, well-structured, and formatted with clean markdown (**bolding**, tables, bullet lists).
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

  // Try candidate models in order with a 25-second timeout
  let lastError = null;
  const isDietQuery = /diet|meal|food|nutrition|khana|eating/i.test(userMessage);

  const apiKey = getApiKey();

  for (const model of CANDIDATE_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

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
            maxOutputTokens: 4000,
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
      const cand = data?.candidates?.[0];
      const text = cand?.content?.parts?.[0]?.text;

      // If user requested a diet plan, strictly ensure the generated table is complete and not truncated
      if (isDietQuery) {
        const pipeCount = (text?.match(/\|/g) || []).length;
        const hasFullTable = text && pipeCount >= 15;
        const isTruncated = cand?.finishReason === "MAX_TOKENS" || (text && text.length < 400 && !hasFullTable);

        if (!hasFullTable || isTruncated) {
          console.warn(`[PhysicalAssistant] Gemini model ${model} provided incomplete diet response (pipes: ${pipeCount}, finishReason: ${cand?.finishReason}). Serving complete rotated Indian diet plan.`);
          return generateLocalIndianDietPlan(context);
        }
      }

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
 * 7-Day Rotated Authentic Healthy Indian Diet Plans
 * Tailored to user's Goal, Weight, BMI, and Today's Check-in Readiness in a 5-column Markdown Table.
 */
export function generateLocalIndianDietPlan(context = {}) {
  const {
    profile,
    user,
    todayCheckin,
    biometrics = [],
    workoutPlan = mockTodayWorkout,
  } = context;

  const now = new Date();
  const dayIndex = now.getDay(); // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayName = dayNames[dayIndex];
  const dateStr = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const name = user?.name || user?.firstName || profile?.firstName || profile?.name || "Patient";
  const goal = user?.fitnessGoal || profile?.primaryGoal || "General Fitness";
  const latestBio = biometrics[0] || null;
  const weightNum = parseFloat(latestBio?.weight || profile?.weight || 70);
  const weightUnit = latestBio?.weightUnit || profile?.weightUnit || "kg";
  const heightNum = parseFloat(latestBio?.height || profile?.height || 175);
  const heightUnit = latestBio?.heightUnit || profile?.heightUnit || "cm";
  const bmiNum = latestBio?.bmi || profile?.bmi || (weightNum && heightNum ? Math.round((weightNum / Math.pow(heightNum / 100, 2)) * 10) / 10 : null);
  const bmiCat = latestBio?.category || profile?.bmiCategory || (bmiNum ? (bmiNum < 18.5 ? "Underweight" : bmiNum < 25 ? "Healthy Weight" : bmiNum < 30 ? "Overweight" : "Obese") : "Normal");

  // Calorie & protein targets adapted to Goal and Weight
  let targetCalories = Math.round(weightNum * 26);
  let targetProtein = Math.round(weightNum * 1.5);
  if (goal.includes("Weight Loss") || goal.includes("Fat")) {
    targetCalories = Math.round(weightNum * 22);
    targetProtein = Math.round(weightNum * 1.6);
  } else if (goal.includes("Weight Gain") || goal.includes("Muscle")) {
    targetCalories = Math.round(weightNum * 31);
    targetProtein = Math.round(weightNum * 1.8);
  } else if (goal.includes("Strength")) {
    targetCalories = Math.round(weightNum * 28);
    targetProtein = Math.round(weightNum * 1.7);
  }

  const readinessScore = todayCheckin?.avgReadiness ?? 8;
  const soreness = todayCheckin?.scores?.soreness ?? 2;
  const readinessResult = todayCheckin?.result || "ready";

  // 7 distinct rotating menus for each day of the week
  const menusByDay = [
    // Sunday (0) - Surya Namaskar & Revitalization
    {
      theme: "Surya Namaskar & Metabolism Revitalizer",
      meals: [
        { meal: "Early Morning (7:00 AM)", dish: "Lemon Jeera Water + Soaked Almonds", portion: "1 warm glass + 6 soaked almonds, 2 walnuts", macros: "55 kcal · 2g Protein", purpose: "Awakens digestive agni & cellular hydration" },
        { meal: "Breakfast (8:30 AM)", dish: "Sprouted Moong Dal Chilla with Mint Chutney", portion: "2 chillas with 50g grated paneer stuffing + coriander dip", macros: "340 kcal · 18g Protein", purpose: "Clean complex carbs & sustained morning vitality" },
        { meal: "Mid-Morning (11:00 AM)", dish: "Tender Coconut Water & Pomegranate", portion: "1 coconut water + 1 small cup fresh pomegranate seeds", macros: "120 kcal · 1g Protein", purpose: "Natural potassium, electrolyte restoration & antioxidant boost" },
        { meal: "Lunch (1:15 PM)", dish: "Multigrain Rotis + Palak Dal + Kachumber + Dahi", portion: "2 Jowar-wheat rotis + 1 bowl spinach dal + 1 katori dahi + salad", macros: "520 kcal · 24g Protein", purpose: "Complete amino acid profile & steady glycogen replenishment" },
        { meal: "Pre/Post Workout (5:00 PM)", dish: "Roasted Makhana with Turmeric & Chaas", portion: "1 bowl roasted foxnuts in light olive oil + 1 glass cold chaas", macros: "150 kcal · 6g Protein", purpose: "Light pre-workout mineral fuel without stomach heaviness" },
        { meal: "Dinner (8:00 PM)", dish: "Moong Dal & Vegetable Khichdi + Mint Raita", portion: "1.5 katori warm khichdi with 1 tsp A2 cow ghee + roasted papad", macros: "380 kcal · 15g Protein", purpose: "Easy nocturnal digestion & restorative gut rest" },
        { meal: "Bedtime (10:00 PM)", dish: "Golden Haldi Doodh (Turmeric Milk)", portion: "1 cup warm low-fat milk + raw turmeric, black pepper & cinnamon", macros: "90 kcal · 4g Protein", purpose: "Curcumin anti-inflammatory joint recovery & deep sleep" },
      ],
    },
    // Monday (1) - Mindful Kickstart & Lean Protein
    {
      theme: "Mindful Kickstart & Lean Protein Focus",
      meals: [
        { meal: "Early Morning (7:00 AM)", dish: "Methi (Fenugreek) Water + Soaked Nuts", portion: "1 glass overnight methi water + 5 almonds, 1 walnut", macros: "45 kcal · 2g Protein", purpose: "Glycemic stabilization & digestive cleansing" },
        { meal: "Breakfast (8:30 AM)", dish: "Vegetable Poha with Peanuts & Boiled Eggs/Sprouts", portion: "1 medium plate flattened rice loaded with peas, carrots + 2 egg whites (or sprouts)", macros: "350 kcal · 16g Protein", purpose: "Slow-release carbs & bioavailable morning protein" },
        { meal: "Mid-Morning (11:00 AM)", dish: "Spiced Buttermilk (Chaas) with Jeera & Mint", portion: "1 tall glass fresh chaas with roasted cumin & rock salt", macros: "60 kcal · 4g Protein", purpose: "Probiotic microbiome cooling & hydration" },
        { meal: "Lunch (1:15 PM)", dish: "Whole Wheat Phulkas + Rajma Masala + Jeera Rice", portion: "2 phulkas + 1 bowl slow-cooked rajma + 1/2 cup brown jeera rice + beetroot salad", macros: "530 kcal · 22g Protein", purpose: "High plant protein, iron, and sustained stamina" },
        { meal: "Pre/Post Workout (5:00 PM)", dish: "Kala Chana Chaat with Lemon & Coriander", portion: "1 cup boiled black chickpeas tossed with onion, tomato, lemon", macros: "160 kcal · 8g Protein", purpose: "Pre-workout endurance and natural muscle fueling" },
        { meal: "Dinner (8:00 PM)", dish: "Tawa Paneer Tikka (or Chicken Breast) + Missi Roti", portion: "100g paneer or grilled chicken + capsicum, onions + 1 missi roti + salad", macros: "410 kcal · 23g Protein", purpose: "Nighttime muscle protein synthesis & low insulin spike" },
        { meal: "Bedtime (10:00 PM)", dish: "Warm Ashwagandha or Cardamom Milk", portion: "1 cup warm milk with cardamom and pinch of ashwagandha", macros: "85 kcal · 4g Protein", purpose: "Cortisol regulation and nervous system relaxation" },
      ],
    },
    // Tuesday (2) - High-Fiber Millets & Power
    {
      theme: "High-Fiber Millets & Joint Endurance",
      meals: [
        { meal: "Early Morning (7:00 AM)", dish: "Cinnamon Warm Water + Soaked Chia Seeds", portion: "1 glass warm water with Ceylon cinnamon + 1 tsp chia seeds", macros: "50 kcal · 2g Protein", purpose: "Insulin sensitivity & long-lasting cellular hydration" },
        { meal: "Breakfast (8:30 AM)", dish: "Besan Chilla with Grated Paneer + Green Chutney", portion: "2 gram-flour chillas with 40g paneer inside + coriander mint chutney", macros: "330 kcal · 17g Protein", purpose: "High satiety & clean legume-based morning protein" },
        { meal: "Mid-Morning (11:00 AM)", dish: "Crisp Guava or Green Apple + Walnut Halves", portion: "1 seasonal guava with pinch of rock salt + 3 walnut halves", macros: "120 kcal · 2g Protein", purpose: "Vitamin C collagen support & brain polyphenols" },
        { meal: "Lunch (1:15 PM)", dish: "Bajra (Pearl Millet) Roti + Chana Dal Lauki + Bhindi", portion: "1 Bajra bhakri with 1/2 tsp ghee + 1 bowl chana dal with bottle gourd + stir-fried bhindi", macros: "490 kcal · 20g Protein", purpose: "Mineral-rich millets & slow-burning complex carbs" },
        { meal: "Pre/Post Workout (5:00 PM)", dish: "Roasted Chana + 1 Small Banana", portion: "35g roasted bengal gram + 1 ripe banana", macros: "170 kcal · 6g Protein", purpose: "Potassium, magnesium & quick muscular energy" },
        { meal: "Dinner (8:00 PM)", dish: "Yellow Moong Dal Tadka + 2 Soft Phulkas + Tofu/Soya", portion: "1 bowl yellow dal + 2 phulkas + 75g tofu or soya chunks sabzi + carrot salad", macros: "430 kcal · 25g Protein", purpose: "Lean protein recovery and low nocturnal digestive burden" },
        { meal: "Bedtime (10:00 PM)", dish: "Warm Turmeric Golden Milk", portion: "1 cup warm milk with turmeric, black pepper & saffron strand", macros: "90 kcal · 4g Protein", purpose: "Tissue repair and deep restorative sleep" },
      ],
    },
    // Wednesday (3) - South Indian Power & Gut Ferments
    {
      theme: "South Indian Power & Fermented Gut Biome",
      meals: [
        { meal: "Early Morning (7:00 AM)", dish: "Warm Cumin Water + Soaked Almonds", portion: "1 cup boiled jeera water + 6 soaked, peeled almonds", macros: "45 kcal · 2g Protein", purpose: "Stimulates bile flow and calms morning acidity" },
        { meal: "Breakfast (8:30 AM)", dish: "Steamed Ragi/Oats Idlis + Drumstick Sambar", portion: "3 steamed idlis with 1 large bowl vegetable sambar + coconut flax chutney", macros: "340 kcal · 14g Protein", purpose: "High calcium, iron, and live gut microbiome support" },
        { meal: "Mid-Morning (11:00 AM)", dish: "Ginger-Curry Leaf Chaas", portion: "1 tall glass fresh buttermilk churned with ginger, curry leaves & hing", macros: "55 kcal · 3g Protein", purpose: "Natural gut cooling & electrolyte replenishment" },
        { meal: "Lunch (1:15 PM)", dish: "Multigrain Chapatis + Panchmel Dal + Methi Sabzi", portion: "2 chapatis + 1 bowl mixed 5-lentil dal + 1 katori brown rice + fresh methi aloo", macros: "510 kcal · 21g Protein", purpose: "Balanced amino acid spectrum & micronutrient absorption" },
        { meal: "Pre/Post Workout (5:00 PM)", dish: "Sprouted Moong Chaat with Pomegranate", portion: "1 bowl steamed sprouts with lemon, pink salt, tomato & pomegranate", macros: "130 kcal · 7g Protein", purpose: "Enzyme-rich pre-workout vitality and clean energy" },
        { meal: "Dinner (8:00 PM)", dish: "Vegetable Dalia Khichdi + Crumbled Paneer/Egg", portion: "1.5 katori broken wheat dalia with diced veggies + 50g paneer or 2 boiled eggs", macros: "380 kcal · 19g Protein", purpose: "High fiber, gentle on intestines, promotes restful night" },
        { meal: "Bedtime (10:00 PM)", dish: "Warm Milk with Nutmeg (Jaiphal)", portion: "1 cup warm milk with a pinch of freshly grated nutmeg", macros: "85 kcal · 4g Protein", purpose: "Natural sleep inducer & nervous system soothing" },
      ],
    },
    // Thursday (4) - Plant Power & Functional Soya/Paneer
    {
      theme: "Functional Greens & High-Protein Power",
      meals: [
        { meal: "Early Morning (7:00 AM)", dish: "Ajwain-Methi Infusion + Soaked Walnuts", portion: "1 glass warm infused ajwain water + 2 whole walnuts", macros: "50 kcal · 2g Protein", purpose: "Anti-inflammatory joint lubrication & anti-bloat" },
        { meal: "Breakfast (8:30 AM)", dish: "Masala Vegetable Oats Khichdi + Boiled Egg/Sprouts", portion: "1 bowl rolled oats cooked with carrots, beans, peas + 1 whole boiled egg (or sprouts)", macros: "330 kcal · 16g Protein", purpose: "Beta-glucan heart health & sustained glycemic curve" },
        { meal: "Mid-Morning (11:00 AM)", dish: "Fresh Papaya Slices + Roasted Pumpkin Seeds", portion: "1 medium bowl ripe papaya + 1 tbsp pumpkin seeds", macros: "130 kcal · 4g Protein", purpose: "Papain enzymes for optimal protein assimilation & zinc" },
        { meal: "Lunch (1:15 PM)", dish: "Jowar Rotis + Soya Matar Curry (or Chicken) + Baingan", portion: "2 Jowar rotis + 1 bowl protein-rich soya curry + smoked baingan bharta + cucumber", macros: "520 kcal · 26g Protein", purpose: "High-density protein for muscular rebuilding" },
        { meal: "Pre/Post Workout (5:00 PM)", dish: "Desi Sattu Energy Drink", portion: "2 tbsp roasted chana sattu stirred in chilled water with lemon & jeera", macros: "140 kcal · 8g Protein", purpose: "Authentic Indian workout fuel & heat dissipation" },
        { meal: "Dinner (8:00 PM)", dish: "Soft Whole Wheat Phulkas + Paneer Bhurji + Clear Soup", portion: "2 phulkas + 100g spiced paneer bhurji with capsicum + 1 bowl warm vegetable broth", macros: "420 kcal · 22g Protein", purpose: "Nighttime amino acid replenishment with light digestion" },
        { meal: "Bedtime (10:00 PM)", dish: "Warm Turmeric Golden Milk", portion: "1 cup warm milk + haldi, black pepper & cardamom", macros: "90 kcal · 4g Protein", purpose: "Muscular recovery and cellular repair during deep REM" },
      ],
    },
    // Friday (5) - Vitality, Strength & Active Recovery
    {
      theme: "Strength, High Vitality & Recovery Matrix",
      meals: [
        { meal: "Early Morning (7:00 AM)", dish: "Warm Lemon Water with Pink Salt + Almonds & Date", portion: "1 glass warm lemon water + 6 soaked almonds + 1 Medjool date", macros: "65 kcal · 2g Protein", purpose: "Natural minerals, adrenal nourishment & electrolyte charge" },
        { meal: "Breakfast (8:30 AM)", dish: "Stuffed Paneer Methi Paratha + Fresh Dahi", portion: "1 whole wheat paratha stuffed with fresh paneer & fenugreek + 1 katori curd", macros: "360 kcal · 18g Protein", purpose: "Bioavailable calcium, bone density & athletic energy" },
        { meal: "Mid-Morning (11:00 AM)", dish: "Fresh Tender Coconut Water or Mint Chaas", portion: "1 whole coconut water or tall glass mint spiced buttermilk", macros: "60 kcal · 2g Protein", purpose: "Rehydrates muscle fibers and prevents midday fatigue" },
        { meal: "Lunch (1:15 PM)", dish: "Multigrain Rotis + Chana Masala + Brown Rice + Boondi Raita", portion: "2 rotis + 1 bowl chickpea masala + 1/2 katori brown rice + boondi raita + salad", macros: "540 kcal · 23g Protein", purpose: "Complex carbohydrate loading & deep muscle protein synthesis" },
        { meal: "Pre/Post Workout (5:00 PM)", dish: "Boiled Egg White Chaat OR Sprouted Moong Bhel", portion: "3 boiled egg whites (or 1 bowl sprouts) with chaat masala, lemon & onion", macros: "130 kcal · 12g Protein", purpose: "Rapidly absorbed amino acids directly into muscle tissue" },
        { meal: "Dinner (8:00 PM)", dish: "Lauki Moong Dal + 2 Phulkas + Jeera Aloo-Methi", portion: "1 large bowl bottle gourd yellow dal + 2 soft phulkas + lightly spiced methi sabzi", macros: "380 kcal · 17g Protein", purpose: "Anti-inflammatory, light on stomach, maximizes sleep quality" },
        { meal: "Bedtime (10:00 PM)", dish: "Warm Golden Haldi Doodh with Cinnamon", portion: "1 cup warm low-fat milk + pure turmeric, black pepper & cinnamon", macros: "90 kcal · 4g Protein", purpose: "Decreases DOMS (delayed onset muscle soreness) & deep sleep" },
      ],
    },
    // Saturday (6) - Weekend Rejuvenation & Detox
    {
      theme: "Weekend Rejuvenation & Cellular Detox",
      meals: [
        { meal: "Early Morning (7:00 AM)", dish: "Ginger-Tulsi Herbal Infusion + Soaked Almonds", portion: "1 cup freshly brewed ginger tulsi tea + 5 soaked almonds", macros: "40 kcal · 2g Protein", purpose: "Flushes metabolic waste and boosts immune defenses" },
        { meal: "Breakfast (8:30 AM)", dish: "Vegetable Upma with Peanuts + Vegetable Sambar", portion: "1 plate roasted semolina upma with carrots, peas, peanuts + 1 katori sambar", macros: "330 kcal · 12g Protein", purpose: "Comforting, high B-vitamins, and easy morning digestion" },
        { meal: "Mid-Morning (11:00 AM)", dish: "Seasonal Indian Fruit Bowl (Guava / Apple / Mosambi)", portion: "1 bowl sliced fruits sprinkled with chaat masala and black salt", macros: "110 kcal · 1g Protein", purpose: "Vitamin C and hydration for collagen and connective tissue" },
        { meal: "Lunch (1:15 PM)", dish: "Jowar Bhakri + Yellow Dal Tadka + Bhindi + Dahi", portion: "2 Jowar bhakris + 1 bowl arhar/toor dal + sautéed bhindi + 1 katori fresh dahi", macros: "500 kcal · 20g Protein", purpose: "Gluten-free ancient grains for steady glycemic endurance" },
        { meal: "Pre/Post Workout (5:00 PM)", dish: "Roasted Makhana & Peanut Mix + Nimbu Paani", portion: "1 bowl roasted foxnuts and peanuts + 1 glass fresh lemon water with rock salt", macros: "160 kcal · 7g Protein", purpose: "Electrolyte replenishment and crisp satisfying energy" },
        { meal: "Dinner (8:00 PM)", dish: "Grilled Paneer/Soya Stir-Fry + 1 Roti + Dal Soup", portion: "100g paneer or soya chunks with bell peppers & broccoli + 1 roti + lentil broth", macros: "410 kcal · 24g Protein", purpose: "Concentrated nighttime protein for structural recovery" },
        { meal: "Bedtime (10:00 PM)", dish: "Warm Turmeric Golden Milk", portion: "1 cup warm milk with turmeric and pinch of cardamom", macros: "90 kcal · 4g Protein", purpose: "Full body neuromuscular relaxation and recovery" },
      ],
    },
  ];

  const currentMenu = menusByDay[dayIndex];

  // Markdown table construction
  let tableMarkdown = `| Meal & Timing | Indian Dish | Portion / Ingredients | Calories & Protein | Target Purpose |\n`;
  tableMarkdown += `| :--- | :--- | :--- | :--- | :--- |\n`;
  currentMenu.meals.forEach(m => {
    tableMarkdown += `| **${m.meal}** | ${m.dish} | ${m.portion} | **${m.macros}** | ${m.purpose} |\n`;
  });

  // Readiness adjustment notes
  let readinessTip = `Your readiness is optimal (**${readinessScore}/10**) — this balanced Indian menu fuels today's active workout!`;
  if (readinessResult === "adjusted" || soreness >= 3) {
    readinessTip = `Your readiness was logged at **${readinessScore}/10** with soreness at **${soreness}/5**. We've prioritized anti-inflammatory turmeric, ginger, and extra hydration to fast-track joint and muscle recovery.`;
  } else if (readinessResult === "recovery") {
    readinessTip = `Today is a recovery day (**${readinessScore}/10**). The menu prioritizes gentle, nourishing foods (moong dal, light khichdi, chaas) so your body focuses energy on repair rather than heavy digestion.`;
  }

  const workoutNote = workoutPlan?.title ? `Tailored to complement today's **${workoutPlan.title}** (${workoutPlan.duration || 30} min session).` : "";

  return `### 🥗 Personalized Indian Diet Plan for Today (${dayName}, ${dateStr})

Hi ${name}! Here is your personalized, freshly rotated daily Indian meal plan. It is specifically calibrated to your **${goal}** goal, current weight (**${weightNum} ${weightUnit}**), BMI (**${bmiNum ? `${bmiNum} · ${bmiCat}` : "Balanced"}**), and today's readiness score (**${readinessScore}/10**).

> **Today's Theme: ${currentMenu.theme}**  
> *${readinessTip} ${workoutNote}*

${tableMarkdown}

### 📊 Daily Nutritional Blueprint & Targets:
- **🎯 Target Calorie Intake:** ~${targetCalories} kcal (calibrated for ${goal})
- **💪 Target Daily Protein:** ~${targetProtein}g (approx. ${(targetProtein / weightNum).toFixed(1)}g per kg bodyweight)
- **💧 Hydration Blueprint:** Minimum **2.8 – 3.2 Litres** (water, chaas, jeera water, tender coconut water)
- **🌿 Indian Spices Benefit:** Haldi (curcumin) + Kalimirch (piperine) at bedtime drastically reduces muscular soreness.
- **🔄 Variety Assurance:** Tomorrow (${dayNames[(dayIndex + 1) % 7]}) your menu will rotate to a fresh regional menu to prevent monotony and ensure complete micronutrient diversity.`;
}

/**
 * Intelligent contextual fallback utilizing the patient's actual logged data and plan.
 */
function getContextualFallback(text = "", context = {}) {
  const lower = text.toLowerCase();
  const { profile, todayCheckin, streak = 0, workoutPlan = mockTodayWorkout } = context;
  const goal = profile?.primaryGoal || "General Fitness";
  const name = profile?.firstName || "there";

  // Check for diet / nutrition / Indian food queries
  if (
    lower.includes("diet") ||
    lower.includes("meal") ||
    lower.includes("food") ||
    lower.includes("nutrition") ||
    lower.includes("eating") ||
    lower.includes("breakfast") ||
    lower.includes("lunch") ||
    lower.includes("dinner") ||
    lower.includes("khana") ||
    lower.includes("calorie")
  ) {
    return generateLocalIndianDietPlan(context);
  }

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
