/**
 * pages/patient/WellnessCompanion.jsx
 *
 * Mental Wellness — AI Companion page.
 * Route: /health-hub/mental-wellness/companion
 *
 * Features:
 *  - AI chat interface with real API wiring and smart fallback
 *  - IN-CHAT EXERCISE CARDS: AI suggests exercises with a "Start" button inside the chat bubble
 *  - Click opens ActivityPlayer full-screen overlay for the exact duration (2 min, 3 min, 4 min, etc.)
 *  - Completing an exercise from chat logs to localStorage (mw_activity_log) with exact timestamp
 *    and sends a celebratory follow-up into chat
 *  - Quick Tools sidebar directly triggers exercises with their exact timers
 *  - Interactive Box Breathing widget, Live Context, and Professional Support
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import * as mhService from '../../services/mentalHealth.service';
import ActivityPlayer from '../../components/mentalWellness/ActivityPlayer';
import {
  MOODS,
  SUGGESTION_CHIPS,
  QUICK_TOOLS,
  CATEGORY_ICONS,
  loadTodayCheckIn,
  loadActivityLog,
  calculateStreak,
  appendActivityLog,
} from '../../data/wellnessMockData';

// ── Smart fallback intent & exercise recommendation matcher ──────────────────

function getExerciseRecommendation(userText, checkIn) {
  const text = (userText || '').toLowerCase();
  const mot = Number(checkIn?.motivation ?? 5);
  const str = Number(checkIn?.stressLevel ?? checkIn?.stress ?? 5);
  const ene = Number(checkIn?.energy ?? 5);

  // 1. Motivation / Procrastination / Inertia / Stuck
  if (text.includes('motivat') || text.includes('procrastinat') || text.includes('lazy') || text.includes('stuck') || text.includes('inertia') || text.includes('drive') || text.includes('start')) {
    const prefix = checkIn ? `I hear you completely. Looking at your live check-in, your motivation is currently sitting at **${mot}/10**${ene >= 6 ? ` while your physical energy is high (${ene}/10)` : ''}. When motivation is low, demanding big results triggers cognitive resistance.` : "When motivation drops, forcing yourself to take on massive tasks only creates resistance.";
    return {
      reply: `${prefix}\n\nThe secret is taking one low-barrier micro-step to dissolve inertia and spark dopamine. I've set up this 5-minute momentum reset for you below:`,
      recommendations: [{
        id: 'rec_mot_ignite',
        title: 'Overcoming Inertia: Micro-Momentum',
        type: 'FOCUS',
        durationMin: 5,
        category: 'Focus',
        icon: 'target',
      }],
    };
  }

  // 2. Anxiety / Stress / Overwhelm / Panic
  if (text.includes('anxious') || text.includes('anxiety') || text.includes('panic') || text.includes('overwhelm') || text.includes('stress') || text.includes('nervous') || text.includes('tension')) {
    const stressNote = checkIn ? ` I see your tension level is logged at **${str}/10** today, which can trigger fight-or-flight reactions that cloud clarity.` : '';
    return {
      reply: `I understand how exhausting stress and anxiety can feel.${stressNote} You don't have to carry this alone. Grounding your nervous system right now will help stop the cortisol spiral — try this exercise below:`,
      recommendations: [{
        id: 'rec_gr',
        title: str >= 7 ? '4-7-8 Breathing Reset' : 'Grounding 5-4-3-2-1',
        type: str >= 7 ? 'BREATHING' : 'GROUNDING',
        durationMin: str >= 7 ? 4 : 3,
        category: str >= 7 ? 'Breathwork' : 'Anxiety',
        icon: str >= 7 ? 'air' : 'spa',
      }],
    };
  }

  // 3. Sleep / Tired / Night
  if (text.includes('sleep') || text.includes('insomnia') || text.includes('tired') || text.includes('night') || text.includes('bed') || text.includes('rest')) {
    return {
      reply: "Winding down before sleep is essential for nervous system restoration. Giving your mind a signal that it's safe to power down can quiet racing thoughts.",
      recommendations: [{
        id: 'rec_sl',
        title: 'Sleep Wind-down Session',
        type: 'SLEEP_SOUND',
        durationMin: 20,
        category: 'Sleep',
        icon: 'bedtime',
      }],
    };
  }

  // 4. Breathwork / Reset / Box breathing
  if (text.includes('breath') || text.includes('reset') || text.includes('calm') || text.includes('box') || text.includes('inhale')) {
    return {
      reply: "Controlled breathing is one of the fastest ways to activate your body's relaxation response. Let's do a 4-7-8 breathing session together.",
      recommendations: [{
        id: 'rec_br',
        title: '4-7-8 Breathing Reset',
        type: 'BREATHING',
        durationMin: 4,
        category: 'Breathwork',
        icon: 'air',
      }],
    };
  }

  // 5. Meditation / Mindfulness / Peace
  if (text.includes('meditat') || text.includes('mindful') || text.includes('peace') || text.includes('center')) {
    return {
      reply: "Taking even a few quiet minutes creates space between what you feel and how you respond. Here is a centered 10-minute meditation session.",
      recommendations: [{
        id: 'rec_med',
        title: 'Daily Mindfulness Meditation',
        type: 'MEDITATION',
        durationMin: 10,
        category: 'Meditation',
        icon: 'self_improvement',
      }],
    };
  }

  // 6. Journaling / Gratitude / Purpose / Reflect
  if (text.includes('journal') || text.includes('gratitude') || text.includes('write') || text.includes('reflect') || text.includes('purpose')) {
    return {
      reply: "Reflecting on small positive anchors can shift how you carry your day and reconnect you with your intrinsic purpose. Try this guided 7-minute practice.",
      recommendations: [{
        id: 'rec_grt',
        title: 'Gratitude & Purpose Reflection',
        type: 'GRATITUDE',
        durationMin: 7,
        category: 'Journaling',
        icon: 'edit_note',
      }],
    };
  }

  // 7. Movement / Stretch / Shoulder
  if (text.includes('stretch') || text.includes('body') || text.includes('shoulder') || text.includes('walk') || text.includes('exercise')) {
    return {
      reply: "Physical tension often mirrors emotional strain. Taking 5 minutes for gentle somatic movement will help release accumulated stress.",
      recommendations: [{
        id: 'rec_mv',
        title: 'Shoulder & Body Release',
        type: 'MINDFULNESS',
        durationMin: 5,
        category: 'Movement',
        icon: 'fitness_center',
      }],
    };
  }
  return null;
}

// State-aware fallback general AI responses
function getGeneralAiResponse(checkIn, idx = 0) {
  const mot = Number(checkIn?.motivation ?? 5);
  const str = Number(checkIn?.stressLevel ?? checkIn?.stress ?? 5);
  const ene = Number(checkIn?.energy ?? 5);

  if (mot <= 4 && ene >= 6) {
    return `Thank you for sharing that with me. I see you have high physical energy (${ene}/10) today, but motivation is feeling low (${mot}/10). When you're feeling unmotivated, break your next task down to the absolute smallest 2-minute step. Would you like to try a quick focus reset below?`;
  }
  if (mot <= 4) {
    return `I hear you. With your motivation logged at ${mot}/10 today, remember that you don't need to force peak productivity. Doing just one micro-task is more than enough to maintain momentum. How can I support you right now?`;
  }
  if (str >= 6) {
    return `Thank you for checking in with me. Your stress level is elevated today (${str}/10). Remember that taking a slow, deep breath right now will signal to your nervous system that you are safe. Let's do a quick breathing reset whenever you are ready.`;
  }
  if (ene <= 4) {
    return `I hear you. With energy at ${ene}/10 today, giving your mind and body permission to rest is the most productive choice you can make. How are you feeling physically?`;
  }

  const responses = [
    "Thank you for sharing that with me. Acknowledging how you feel is always the first step. Would you like to try a calming breathing exercise together right now?",
    "I hear you. Whatever you're experiencing is completely valid. Taking a mindful moment can help bring balance back.",
    "Your awareness of what's going on inside is powerful. Small, consistent moments of rest help rebuild resilience.",
  ];
  return responses[idx % responses.length];
}

// ── BreathingWidget ───────────────────────────────────────────────────────────

function BreathingWidget() {
  const [phase,  setPhase]  = useState('inhale');
  const [count,  setCount]  = useState(4);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!active) return;
    const durations = { inhale: 4, hold: 7, exhale: 8 };
    const phases    = ['inhale', 'hold', 'exhale'];
    let currentPhaseIdx  = phases.indexOf(phase);
    let currentCount     = durations[phases[currentPhaseIdx]];

    const tick = setInterval(() => {
      currentCount--;
      setCount(currentCount);
      if (currentCount <= 0) {
        currentPhaseIdx = (currentPhaseIdx + 1) % phases.length;
        currentCount    = durations[phases[currentPhaseIdx]];
        setPhase(phases[currentPhaseIdx]);
        setCount(currentCount);
      }
    }, 1000);

    return () => clearInterval(tick);
  }, [active, phase]);

  const phaseLabel = { inhale: 'Inhale', hold: 'Hold', exhale: 'Exhale' };

  return (
    <div className="p-5 rounded-2xl bg-white border border-[rgba(188,201,200,0.45)] mw-soft-shadow">
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-[#006a67] msym-sm">air</span>
        <h3 className="font-display font-semibold text-[#171d1c] text-sm">Box Breathing</h3>
        <span className="ml-auto text-xs text-[#3c4948]">4-7-8</span>
      </div>
      <div className="flex flex-col items-center gap-4">
        <div className="relative flex items-center justify-center w-24 h-24">
          <div className={`absolute inset-0 rounded-full bg-[#006a67]/8 ${active ? 'mw-animate-breath' : ''}`} />
          <div
            className={`absolute inset-3 rounded-full bg-[#006a67]/15 ${active ? 'mw-animate-breath' : ''}`}
            style={{ animationDelay: '0.25s' }}
          />
          <div
            className={`absolute inset-6 rounded-full bg-[#006a67]/25 ${active ? 'mw-animate-breath' : ''}`}
            style={{ animationDelay: '0.5s' }}
          />
          <div className="w-6 h-6 rounded-full bg-[#006a67] flex-shrink-0 relative z-10" />
        </div>
        {active && (
          <div className="text-center">
            <p className="font-display font-bold text-[#006a67] text-lg leading-none">{phaseLabel[phase]}</p>
            <p className="text-3xl font-display font-extrabold text-[#171d1c] tabular-nums leading-none mt-1">{count}</p>
          </div>
        )}
        <button
          onClick={() => { setActive(a => !a); setPhase('inhale'); setCount(4); }}
          className={`w-full py-2.5 rounded-full text-sm font-display font-semibold transition-all ${
            active
              ? 'bg-[#e9efee] text-[#3c4948] hover:bg-[#e4e9e8]'
              : 'bg-[#006a67] text-white hover:bg-[#00514f]'
          }`}
        >
          {active ? 'Pause' : 'Start Breathing'}
        </button>
      </div>
    </div>
  );
}

// ── LiveContext ───────────────────────────────────────────────────────────────

function LiveContext({ lastCheckIn }) {
  const navigate = useNavigate();

  // Resolve mood details
  const moodObj = MOODS.find(m =>
    m.id === lastCheckIn?.mood ||
    m.score === lastCheckIn?.moodScore ||
    m.id === String(lastCheckIn?.mood || '').toLowerCase()
  );

  const moodLabel = moodObj?.label || (typeof lastCheckIn?.mood === 'string' ? lastCheckIn.mood : 'Good');
  const moodScore = moodObj?.score || lastCheckIn?.moodScore || 4;
  const moodBar   = Math.min(100, Math.max(15, Math.round((moodScore / 6) * 100)));

  const energy = Number(lastCheckIn?.energy ?? 5);
  const stress = Number(lastCheckIn?.stressLevel ?? lastCheckIn?.stress ?? 5);
  const motivation = Number(lastCheckIn?.motivation ?? 5);
  const hasCheckIn = !!lastCheckIn;

  return (
    <div className="p-5 rounded-2xl bg-white border border-[rgba(188,201,200,0.45)] mw-soft-shadow">
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-[#006a67] msym-sm filled">radio_button_checked</span>
        <h3 className="font-display font-semibold text-[#171d1c] text-sm">Live Context</h3>
        <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-medium ${
          hasCheckIn ? 'text-[#006a67] bg-[#006a67]/10' : 'text-[#3c4948] bg-[#e9efee]'
        }`}>
          {hasCheckIn ? 'Today' : 'Pending'}
        </span>
      </div>

      {hasCheckIn ? (
        <div className="space-y-3">
          {[
            { label: 'Mood',       value: moodLabel,          icon: moodObj?.icon || 'balance', isMat: true,  bar: moodBar,          color: 'bg-[#006a67]' },
            { label: 'Energy',     value: `${energy}/10`,     icon: 'bolt',                     isMat: true,  bar: energy * 10,      color: 'bg-amber-500' },
            { label: 'Stress',     value: `${stress}/10`,     icon: 'cyclone',                  isMat: true,  bar: stress * 10,      color: 'bg-rose-500' },
            { label: 'Motivation', value: `${motivation}/10`, icon: 'target',                   isMat: true,  bar: motivation * 10,  color: 'bg-teal-600' },
          ].map((item) => (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[#3c4948]">{item.label}</span>
                <span className="text-xs font-semibold text-[#171d1c] font-display flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-[#006a67]">
                    {item.icon}
                  </span>
                  <span>{item.value}</span>
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-[#e4e9e8] overflow-hidden">
                <div
                  className={`h-full rounded-full ${item.color} transition-all duration-300`}
                  style={{ width: `${item.bar}%` }}
                />
              </div>
            </div>
          ))}

          {/* Dynamic Need & Target Focus Banner */}
          <div className="mt-3.5 pt-3 border-t border-[#e4e9e8]">
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-[#eef7f6] border border-[#d3ebe8]">
              <span className="material-symbols-outlined text-[#006a67] text-[16px] mt-0.5 flex-shrink-0">
                psychology
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#006a67] font-display">Target Focus</p>
                <p className="text-xs text-[#204a48] font-medium leading-tight mt-0.5">
                  {stress >= 7 ? 'High Stress Decompression'
                    : (motivation <= 4 && energy >= 6) ? 'Dissolving Inertia & Sparking Drive'
                    : (motivation <= 4 && stress >= 6) ? 'Stress & Avoidance Reset'
                    : motivation <= 4 ? 'Gentle Motivation Spark'
                    : energy <= 4 ? 'Restorative Energy Recharge'
                    : 'Peak Flow & Alignment'}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-2">
          <p className="text-xs text-[#3c4948] mb-2.5">No check-in completed yet today.</p>
          <button
            onClick={() => navigate('/health-hub/mental-wellness')}
            className="text-xs text-[#006a67] font-semibold hover:underline font-display"
          >
            Check in on Home →
          </button>
        </div>
      )}
    </div>
  );
}

// ── ProfessionalSupport ───────────────────────────────────────────────────────

function ProfessionalSupport() {
  return (
    <div className="p-5 rounded-2xl bg-white border border-[rgba(188,201,200,0.45)] mw-soft-shadow">
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-[#3c4948] msym-sm">local_hospital</span>
        <h3 className="font-display font-semibold text-[#171d1c] text-sm">Professional Support</h3>
      </div>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-[#f7dcb4] flex items-center justify-center flex-shrink-0">
          <span className="font-display font-bold text-[#745f40] text-sm">AP</span>
        </div>
        <div>
          <p className="font-display font-semibold text-[#171d1c] text-sm">Dr. Aisha Patel</p>
          <p className="text-xs text-[#3c4948]">Therapist · Available today</p>
        </div>
        <div className="w-2 h-2 rounded-full bg-[#006a67] ml-auto flex-shrink-0" />
      </div>
      <button className="w-full mw-btn-outline text-xs mb-2">
        Schedule Session
      </button>
      <button
        onClick={() => { window.location.href = 'tel:9152987821'; }}
        className="w-full text-[#3c4948] text-xs font-medium py-2 hover:text-[#171d1c] transition-colors"
      >
        Crisis resources →
      </button>
    </div>
  );
}

// ── Contextual AI Pre-Message Generator based on Live State & Check-in ────────

export function buildContextualGreeting({ checkIn, firstName = 'there', recentActivities = [], streak = 0 }) {
  const time = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

  const lastActivity = recentActivities?.[0];
  const isRecentActivity = lastActivity && (Date.now() - new Date(lastActivity.startedAt).getTime() < 3 * 3600 * 1000);

  // 1. If user HAS a check-in logged today
  if (checkIn) {
    const moodObj = MOODS.find(m =>
      m.id === checkIn.mood ||
      m.score === checkIn.moodScore ||
      m.id === String(checkIn.mood || '').toLowerCase()
    );
    const moodLabel = moodObj?.label || (typeof checkIn.mood === 'string' ? checkIn.mood : 'balanced');
    const moodId = (moodObj?.id || String(checkIn.mood || '')).toLowerCase();
    const stress = Number(checkIn.stressLevel ?? checkIn.stress ?? 5);
    const energy = Number(checkIn.energy ?? 5);
    const motivation = Number(checkIn.motivation ?? 5);

    // Case 1A: High Stress or Overwhelmed
    if (stress >= 7 || moodId === 'overwhelmed') {
      return {
        id: 'greeting_contextual',
        role: 'ai',
        time,
        text: `Hello ${firstName}. I reviewed your daily check-in — I see your stress level is elevated at **${stress}/10** with a **${moodLabel}** state. That can feel heavy on your nervous system.\n\nI'm right here with you. Before we dive into conversation, let's pause and ground your body with this quick vagal reset:`,
        recommendations: [{
          id: 'rec_stress_init',
          title: '4-7-8 Breathing Reset',
          type: 'BREATHING',
          durationMin: 4,
          category: 'Breathwork',
          icon: 'air',
        }],
      };
    }

    // Case 1B: Low Motivation with High Energy (Kinetic Restlessness / Inertia — e.g. Energy 9/10, Motivation 4/10)
    if (motivation <= 4 && energy >= 6) {
      return {
        id: 'greeting_contextual',
        role: 'ai',
        time,
        text: `Good ${timeOfDay}, ${firstName}! ✨ I reviewed your live check-in: you have strong physical vitality (**${energy}/10**), but your motivation is currently running low (**${motivation}/10**) alongside some tension (**${stress}/10**).\n\nWhen your body has kinetic energy but your mental drive feels resistant or blocked, forcing large tasks creates friction. I've set up this 5-minute Micro-Momentum reset to dissolve inertia and channel your energy into gentle, effortless focus:`,
        recommendations: [{
          id: 'rec_inertia_init',
          title: 'Overcoming Inertia: Micro-Momentum',
          type: 'FOCUS',
          durationMin: 5,
          category: 'Focus',
          icon: 'target',
        }],
      };
    }

    // Case 1C: Low Motivation with Moderate/High Stress (Stress-induced Avoidance / Freeze)
    if (motivation <= 4 && stress >= 6) {
      return {
        id: 'greeting_contextual',
        role: 'ai',
        time,
        text: `Hello ${firstName}. Looking at your check-in, stress is elevated (**${stress}/10**) while your motivation is low (**${motivation}/10**). When nervous tension is high, the brain often enters a subconscious avoidance freeze that blocks motivation.\n\nLet's not force high productivity right now. Let's first decompress the stress so your natural drive can return:`,
        recommendations: [{
          id: 'rec_stress_mot_init',
          title: '4-7-8 Breathing & Stress Relief',
          type: 'BREATHING',
          durationMin: 4,
          category: 'Breathwork',
          icon: 'air',
        }],
      };
    }

    // Case 1D: Low Motivation with Low Energy (Depleted / Burnout)
    if (motivation <= 4 && energy <= 4) {
      return {
        id: 'greeting_contextual',
        role: 'ai',
        time,
        text: `Good ${timeOfDay}, ${firstName} 🌿. Both your energy (**${energy}/10**) and motivation (**${motivation}/10**) are depleted right now. That's a clear signal from your body that you need genuine restoration, not self-criticism.\n\nHere is a zero-pressure mindful pause that asks nothing of you:`,
        recommendations: [{
          id: 'rec_depleted_init',
          title: 'Zero-Pressure Mindful Pause',
          type: 'MINDFULNESS',
          durationMin: 3,
          category: 'Mindfulness',
          icon: 'timer',
        }],
      };
    }

    // Case 1E: Low Motivation alone
    if (motivation <= 4) {
      return {
        id: 'greeting_contextual',
        role: 'ai',
        time,
        text: `Hi ${firstName}. Your check-in shows your motivation is sitting lower today (**${motivation}/10**). Overcoming a motivation dip is all about taking one tiny, frictionless step without big expectations. Let's spark your momentum with this 5-minute session:`,
        recommendations: [{
          id: 'rec_mot_init',
          title: 'Sparking Motivation: 1-Step Reset',
          type: 'FOCUS',
          durationMin: 5,
          category: 'Focus',
          icon: 'target',
        }],
      };
    }

    // Case 1F: Elevated Stress alone
    if (stress >= 6) {
      return {
        id: 'greeting_contextual',
        role: 'ai',
        time,
        text: `Good ${timeOfDay}, ${firstName}. You're carrying an elevated stress level today (**${stress}/10**). Taking 4 minutes now to down-regulate your nervous system will relieve physical tension and clear your mind:`,
        recommendations: [{
          id: 'rec_stress_relief_init',
          title: '4-7-8 Breathing Reset',
          type: 'BREATHING',
          durationMin: 4,
          category: 'Breathwork',
          icon: 'air',
        }],
      };
    }

    // Case 1G: Low Energy + Moderate/High Stress (Burnout/Depleted)
    if (energy <= 4 && stress >= 6) {
      return {
        id: 'greeting_contextual',
        role: 'ai',
        time,
        text: `Good ${timeOfDay}, ${firstName} 🌿. Looking at your live check-in, your energy is running low (**${energy}/10**) while tension is high (**${stress}/10**).\n\nWhen reserves are depleted, demanding more of yourself only adds pressure. Here is a zero-effort restorative body scan to help you unburden and breathe freely:`,
        recommendations: [{
          id: 'rec_burnout_init',
          title: 'Restorative Body Scan',
          type: 'MINDFULNESS',
          durationMin: 8,
          category: 'Mindfulness',
          icon: 'self_improvement',
        }],
      };
    }

    // Case 1H: Low Energy + Low/Moderate Stress (Fatigued / Sleepy)
    if (energy <= 4 && stress <= 5) {
      return {
        id: 'greeting_contextual',
        role: 'ai',
        time,
        text: `Hi ${firstName}. Your check-in shows you're carrying a gentle, low-energy state today (**${energy}/10**).\n\nWhether you need to ease afternoon brain fog or simply want a calm space to rest, I'm here. If you'd like a gentle oxygenating lift without any strain, give this 4-minute flow a try:`,
        recommendations: [{
          id: 'rec_lowe_init',
          title: 'Energizing Breath Awakening',
          type: 'BREATHING',
          durationMin: 4,
          category: 'Breathwork',
          icon: 'air',
        }],
      };
    }

    // Case 1I: Low Mood (Sadness / Heavy Heart)
    if (moodId === 'low') {
      return {
        id: 'greeting_contextual',
        role: 'ai',
        time,
        text: `Hello ${firstName} 🤍. I noticed in your check-in that your mood is feeling low today. Please remember that you don't have to carry this alone, and you never have to force a smile here.\n\nTake all the space you need. Would you like to share what's on your mind, or start with this soothing self-compassion practice?`,
        recommendations: [{
          id: 'rec_lowm_init',
          title: 'Self-Compassion Meditation',
          type: 'MEDITATION',
          durationMin: 8,
          category: 'Meditation',
          icon: 'self_improvement',
        }],
      };
    }

    // Case 1J: High Energy & High Motivation (Vitality & Flow)
    if (energy >= 7 && motivation >= 6 && stress <= 5) {
      return {
        id: 'greeting_contextual',
        role: 'ai',
        time,
        text: `Good ${timeOfDay}, ${firstName}! ⚡ I see great vitality in your check-in today — energy at **${energy}/10** and motivation at **${motivation}/10** with calm composure. You have fantastic momentum for deep focus.\n\nWhat would you like to accomplish together? Or tap below to lock into a deep focus flow:`,
        recommendations: [{
          id: 'rec_highe_init',
          title: 'Focused Flow Session',
          type: 'FOCUS',
          durationMin: 10,
          category: 'Focus',
          icon: 'target',
        }],
      };
    }

    // Case 1K: Good / Thriving
    if ((moodId === 'good' || moodId === 'thriving') && stress <= 5 && motivation >= 5) {
      return {
        id: 'greeting_contextual',
        role: 'ai',
        time,
        text: `Welcome back ${firstName}! ✨ Your check-in reflects a **${moodLabel}** state with positive energy (${energy}/10) and steady motivation (${motivation}/10). Anchoring the moments that lift you up creates lasting resilience.\n\nWhat has brought lightness to your day so far? You can also ground this positive state with a quick gratitude reflection:`,
        recommendations: [{
          id: 'rec_thrive_init',
          title: 'Gratitude Anchor Practice',
          type: 'GRATITUDE',
          durationMin: 7,
          category: 'Journaling',
          icon: 'edit_note',
        }],
      };
    }

    // Case 1L: Neutral / Steady (Default with check-in)
    return {
      id: 'greeting_contextual',
      role: 'ai',
      time,
      text: `Hi ${firstName} 🌿. I reviewed your state log: you're in a **${moodLabel}** equilibrium today (Energy: ${energy}/10, Stress: ${stress}/10, Motivation: ${motivation}/10).\n\nI'm ready whenever you are — whether you'd like to reflect on your day, process a thought, or take a quick mental reset:`,
      recommendations: [{
        id: 'rec_neutral_init',
        title: 'Mindful Equilibrium Reset',
        type: 'MINDFULNESS',
        durationMin: 5,
        category: 'Mindfulness',
        icon: 'self_improvement',
      }],
    };
  }

  // 2. If user completed an activity earlier today
  if (isRecentActivity) {
    return {
      id: 'greeting_contextual',
      role: 'ai',
      time,
      text: `Welcome back, ${firstName} 🌿! I noticed you completed **${lastActivity.title}** (${lastActivity.durationMin} min) earlier today — wonderful dedication to your well-being.\n\nHow is your mind and body feeling since that session? Tell me what's on your mind, or we can continue with another gentle practice below:`,
      recommendations: [{
        id: 'rec_followup_init',
        title: 'Daily Intentions Journal',
        type: 'GRATITUDE',
        durationMin: 6,
        category: 'Journaling',
        icon: 'edit_note',
      }],
    };
  }

  // 3. Fallback: User has NOT checked in yet today
  const streakText = streak > 0 ? ` (your active streak is at **${streak} days** 🔥)` : '';
  return {
    id: 'greeting_contextual',
    role: 'ai',
    time,
    text: `Hello ${firstName} 🌿 I'm your AI Wellness Companion — a safe, confidential space.\n\nI noticed you haven't completed your daily check-in yet today${streakText}. Logging your state helps me tailor every recommendation to how you feel.\n\nHow are you feeling right now? Tell me what's on your mind, or tap below to start with a calming reset:`,
    recommendations: [{
      id: 'rec_init_br',
      title: '4-7-8 Breathing Reset',
      type: 'BREATHING',
      durationMin: 4,
      category: 'Breathwork',
      icon: 'air',
    }],
  };
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function WellnessCompanion() {
  const { user } = useAuthStore();
  const firstName = user?.fullName?.split(' ')[0] || 'there';

  const [messages,      setMessages]      = useState(() => {
    const ci = loadTodayCheckIn();
    const acts = loadActivityLog();
    const strk = calculateStreak();
    return [buildContextualGreeting({ checkIn: ci, firstName: 'there', recentActivities: acts, streak: strk })];
  });
  const [inputValue,    setInputValue]    = useState('');
  const [isTyping,      setIsTyping]      = useState(false);
  const [conversation,  setConversation]  = useState(null);
  const [lastCheckIn,   setLastCheckIn]   = useState(() => loadTodayCheckIn());
  const [apiMode,       setApiMode]       = useState(false);

  // ActivityPlayer state
  const [activeItem,    setActiveItem]    = useState(null);
  const activityStartRef = useRef(null);

  const chatContainerRef = useRef(null);
  const inputRef         = useRef(null);
  const responseIdx      = useRef(0);

  // Update greeting with real user name or updated check-in once available
  useEffect(() => {
    setMessages(prev => {
      if (prev.length <= 1 && (!prev[0] || prev[0].id?.startsWith('greeting'))) {
        return [buildContextualGreeting({
          checkIn: lastCheckIn || loadTodayCheckIn(),
          firstName,
          recentActivities: loadActivityLog(),
          streak: calculateStreak(),
        })];
      }
      return prev;
    });
  }, [firstName, lastCheckIn]);

  // Scroll ONLY the inner chat messages container to the bottom; the main browser page remains static
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isTyping]);

  /**
   * Open ActivityPlayer for an exercise from chat or quick tools
   * @param {{ type: string, title: string, durationMin: number, category: string, icon?: string }} opts
   */
  const openActivity = ({ type, title, durationMin, category, icon }) => {
    activityStartRef.current = new Date().toISOString();
    setActiveItem({
      type: type || 'MINDFULNESS',
      title: title || 'Wellness Session',
      // ActivityPlayer reads item.duration in MINUTES and multiplies by 60
      duration: durationMin || 5,
      description: `${durationMin || 5} min · ${category || 'Mindfulness'}`,
    });
  };

  /**
   * Called when ActivityPlayer completes the countdown
   */
  const handleActivityComplete = (completedItem) => {
    setActiveItem(null);
    if (!completedItem) return;

    const cat  = completedItem.description?.split(' · ')[1] ?? 'Mindfulness';
    const icon = CATEGORY_ICONS[cat] ?? 'self_improvement';

    // Log to localStorage so it appears in My Journey as: "Meditation at 12:45 PM for 10 minutes"
    appendActivityLog({
      title:       completedItem.title,
      category:    cat,
      icon,
      durationMin: completedItem.duration,
      startedAt:   activityStartRef.current ?? new Date().toISOString(),
    });

    // Send a supportive feedback message into the chat
    setMessages(prev => [...prev, {
      id:   `done_${Date.now()}`,
      role: 'ai',
      text: `🎉 Wonderful job completing **${completedItem.title}** (${completedItem.duration} min)!\n\nTaking this time for yourself makes a real difference. Notice how your mind and body feel right now. How are you doing?`,
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    }]);

    // Fire and forget to API
    mhService.completeActivity?.('local', {
      title:    completedItem.title,
      duration: completedItem.duration,
    }).catch(() => {});
  };

  // Init conversation and opening greeting
  useEffect(() => {
    const ci = loadTodayCheckIn();
    const acts = loadActivityLog();
    const strk = calculateStreak();
    const contextualGreeting = buildContextualGreeting({
      checkIn: ci,
      firstName,
      recentActivities: acts,
      streak: strk,
    });

    (async () => {
      try {
        const res = await mhService.createConversation();
        const data = res?.data ?? res;
        if (data?.id) {
          setConversation(data);
          setApiMode(true);
          // Load existing messages if any
          const msgRes = await mhService.getConversation(data.id);
          const msgData = msgRes?.data ?? msgRes;
          const msgs = msgData?.messages ?? [];
          if (msgs.length > 0) {
            setMessages(msgs.map(m => ({
              id:   m.id ?? `m${Math.random()}`,
              role: m.role === 'PATIENT' ? 'user' : 'ai',
              text: m.content ?? m.text ?? '',
              recommendations: m.recommendations ?? [],
              time: new Date(m.createdAt || Date.now()).toLocaleTimeString('en-US', {
                hour: 'numeric', minute: '2-digit',
              }),
            })));
          } else {
            setMessages([contextualGreeting]);
          }
          return;
        }
      } catch {
        // fall through to mock mode
      }
      // Mock mode — show dynamic contextual greeting with interactive exercise card
      setMessages([contextualGreeting]);
    })();

    // Load last check-in for LiveContext (local first, then API sync)
    const localCI = loadTodayCheckIn();
    if (localCI) setLastCheckIn(localCI);

    (async () => {
      try {
        const res = await mhService.getCheckInHistory(1);
        const data = res?.data ?? res;
        const history = Array.isArray(data) ? data : (data?.checkIns ?? []);
        const todayApi = data?.todaysCheckIn || (history.length > 0 ? history[0] : null);
        if (todayApi) {
          const todayStr = new Date().toDateString();
          const apiDateStr = new Date(todayApi.createdAt || todayApi.date || '').toDateString();
          if (apiDateStr === todayStr) {
            setLastCheckIn(todayApi);
          }
        }
      } catch {
        // keep local state
      }
    })();

    // Listen to focus and storage so checking in on the Home tab immediately updates Live Context here
    const handleSync = () => {
      const updated = loadTodayCheckIn();
      if (updated) setLastCheckIn(updated);
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('focus', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('focus', handleSync);
    };
  }, []);

  // ── Send message ─────────────────────────────────────────────────────────
  const sendMessage = async (text) => {
    if (!text || !text.trim()) return;

    const trimmedText = text.trim();
    const time = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    const userMsg = {
      id:   `u${Date.now()}`,
      role: 'user',
      text: trimmedText,
      time,
    };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    if (apiMode && conversation?.id) {
      // Real API path
      try {
        const res  = await mhService.sendMessage(conversation.id, trimmedText);
        const data = res?.data ?? res;
        const aiText = data?.message?.content ?? data?.reply;
        const recs   = data?.recommendations ?? [];
        setIsTyping(false);
        setMessages(prev => [...prev, {
          id:   `a${Date.now()}`,
          role: 'ai',
          text: aiText || getGeneralAiResponse(lastCheckIn, responseIdx.current),
          recommendations: Array.isArray(recs) ? recs : [],
          time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        }]);
        responseIdx.current++;
        return;
      } catch {
        // fall through to smart mock
      }
    }

    // Smart fallback mode with interactive exercise recommendations
    setTimeout(() => {
      setIsTyping(false);
      const match = getExerciseRecommendation(trimmedText, lastCheckIn);
      const replyText = match?.reply ?? getGeneralAiResponse(lastCheckIn, responseIdx.current);
      const recs = match?.recommendations ?? [{
        id: `rec_fallback_${Date.now()}`,
        title: '4-7-8 Breathing',
        type: 'BREATHING',
        durationMin: 4,
        category: 'Breathwork',
        icon: 'air',
      }];

      setMessages(prev => [...prev, {
        id:   `a${Date.now()}`,
        role: 'ai',
        text: replyText,
        recommendations: recs,
        time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      }]);
      responseIdx.current++;
    }, 1200);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      {/* ActivityPlayer overlay */}
      {activeItem && (
        <ActivityPlayer
          item={activeItem}
          onClose={() => setActiveItem(null)}
          onComplete={handleActivityComplete}
        />
      )}

      <div className="max-w-[1280px] mx-auto px-5 md:px-16 py-6 pb-36 md:pb-8">

        {/* Page header */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#006a67] flex items-center justify-center">
              <span className="material-symbols-outlined text-white filled msym-sm">smart_toy</span>
            </div>
            <div>
              <h1 className="font-display font-bold text-2xl text-[#171d1c] leading-tight">AI Wellness Companion</h1>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#006a67] animate-pulse" />
                <p className="text-xs text-[#3c4948]">Online · Confidential · Always here</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main layout: chat + sidebar */}
        <div className="flex flex-col md:flex-row gap-5">

          {/* Chat column — 2/3 */}
          <div className="flex-1 md:w-0 flex flex-col" style={{ minHeight: 0 }}>
            <div
              className="mw-card rounded-2xl flex flex-col overflow-hidden"
              style={{ height: 'calc(100vh - 220px)', minHeight: '400px' }}
            >
              {/* Messages area — scroll is contained inside this element */}
              <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto mw-hide-scrollbar p-5 space-y-4"
                style={{ minHeight: 0 }}
              >
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-last' : ''}`}>
                      {msg.role === 'ai' && (
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <div className="w-5 h-5 rounded-full bg-[#006a67] flex items-center justify-center">
                            <span className="material-symbols-outlined text-white filled" style={{ fontSize: '11px' }}>smart_toy</span>
                          </div>
                          <span className="text-[10px] text-[#3c4948] font-medium">Companion · {msg.time}</span>
                        </div>
                      )}
                      <div
                        className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                          msg.role === 'user'
                            ? 'bg-[#006a67] text-white rounded-tr-sm'
                            : 'bg-white border border-[rgba(188,201,200,0.45)] text-[#171d1c] rounded-tl-sm mw-soft-shadow'
                        }`}
                      >
                        {msg.text}

                        {/* Interactive Exercise Cards inside the chat message */}
                        {(msg.recommendations?.length > 0 || msg.action) && (
                          <div className="mt-3 pt-2.5 border-t border-[rgba(188,201,200,0.4)] space-y-2">
                            <p className="text-[11px] font-semibold text-[#006a67] font-display flex items-center gap-1">
                              <span className="material-symbols-outlined msym-sm">self_improvement</span>
                              Recommended Exercise:
                            </p>

                            {(msg.recommendations || [msg.action]).map((rec, i) => {
                              if (!rec) return null;
                              const recTitle    = rec.title || rec.label || 'Wellness Session';
                              const recDuration = rec.durationMin || rec.duration || 5;
                              const recCat      = rec.category || 'Mindfulness';
                              const recIcon     = rec.icon || CATEGORY_ICONS[recCat] || 'self_improvement';
                              const recType     = rec.type || 'MINDFULNESS';

                              return (
                                <div
                                  key={rec.id || i}
                                  className="flex items-center justify-between gap-2.5 p-2.5 rounded-xl bg-[#e9efee] border border-[rgba(188,201,200,0.45)]"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-8 h-8 rounded-lg bg-[#006a67]/10 flex items-center justify-center flex-shrink-0">
                                      <span className="material-symbols-outlined text-[#006a67] msym-sm">
                                        {recIcon}
                                      </span>
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-xs font-semibold text-[#171d1c] font-display truncate">
                                        {recTitle}
                                      </p>
                                      <p className="text-[10px] text-[#3c4948]">
                                        {recDuration} min · {recCat}
                                      </p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => openActivity({
                                      type: recType,
                                      title: recTitle,
                                      durationMin: recDuration,
                                      category: recCat,
                                      icon: recIcon,
                                    })}
                                    className="flex-shrink-0 bg-[#006a67] hover:bg-[#00514f] text-white text-xs font-display font-semibold px-3 py-1.5 rounded-full transition-colors flex items-center gap-1 active:scale-95 shadow-sm"
                                  >
                                    <span className="material-symbols-outlined text-[14px]">play_arrow</span>
                                    Start · {recDuration}m
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {msg.role === 'user' && (
                        <p className="text-[10px] text-[#3c4948] text-right mt-1">You · {msg.time}</p>
                      )}
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-[rgba(188,201,200,0.45)] rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5 mw-soft-shadow">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="w-2 h-2 rounded-full bg-[#6c7a78] mw-animate-bounce-dot"
                          style={{ animationDelay: `${i * 0.2}s` }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Suggestion chips */}
              <div className="px-4 pt-3 pb-2 border-t border-[rgba(188,201,200,0.4)]">
                <div className="flex gap-2 overflow-x-auto mw-hide-scrollbar pb-1">
                  {SUGGESTION_CHIPS.map((chip) => (
                    <button
                      key={chip}
                      onClick={() => sendMessage(chip)}
                      className="flex-shrink-0 text-xs font-medium text-[#3c4948] bg-[#e9efee] px-3.5 py-2 rounded-full hover:bg-[#e4e9e8] hover:text-[#006a67] transition-colors border border-[rgba(188,201,200,0.4)] whitespace-nowrap"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input bar */}
              <div className="px-4 pb-4 pt-2">
                <div className="relative flex items-end bg-[#e9efee] rounded-full border border-[rgba(188,201,200,0.5)] pr-2 pl-5 py-2 focus-within:border-[#006a67]/40 focus-within:ring-2 focus-within:ring-[#006a67]/15 transition-all">
                  <textarea
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Share what's on your mind..."
                    rows={1}
                    className="flex-1 bg-transparent resize-none outline-none text-sm text-[#171d1c] placeholder:text-[#6c7a78]/60 py-1.5 max-h-28 mw-hide-scrollbar"
                    style={{ lineHeight: '1.5' }}
                  />
                  <button
                    onClick={() => sendMessage(inputValue)}
                    disabled={!inputValue.trim()}
                    className="w-9 h-9 rounded-full bg-[#006a67] flex items-center justify-center flex-shrink-0 ml-2 hover:bg-[#00514f] active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Send message"
                  >
                    <span className="material-symbols-outlined text-white filled" style={{ fontSize: '18px' }}>send</span>
                  </button>
                </div>
                <p className="text-[10px] text-[#3c4948] text-center mt-2">
                  Your conversations are private and never shared without your consent.
                </p>
              </div>
            </div>
          </div>

          {/* Context panel — 1/3 */}
          <div className="md:w-80 lg:w-96 flex-shrink-0 space-y-4">
            <LiveContext lastCheckIn={lastCheckIn} />
            <BreathingWidget />

            {/* Quick Tools — Click directly opens the exercise timer */}
            <div className="p-5 rounded-2xl bg-white border border-[rgba(188,201,200,0.45)] mw-soft-shadow">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-[#3c4948] msym-sm">apps</span>
                <h3 className="font-display font-semibold text-[#171d1c] text-sm">Quick Tools</h3>
                <span className="ml-auto text-[10px] text-[#006a67] bg-[#006a67]/10 px-2 py-0.5 rounded-full font-medium">1-click</span>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                {QUICK_TOOLS.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => {
                      if (tool.type) {
                        openActivity({
                          type: tool.type,
                          title: tool.label,
                          durationMin: tool.durationMin,
                          category: tool.category,
                          icon: tool.icon,
                        });
                      } else {
                        window.location.href = 'tel:9152987821';
                      }
                    }}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-[#e9efee] hover:bg-[#e4e9e8] transition-colors active:scale-95 text-center group"
                  >
                    <span className="material-symbols-outlined text-[#006a67] group-hover:scale-110 transition-transform" style={{ fontSize: '20px' }}>
                      {tool.icon}
                    </span>
                    <span className="text-[10px] text-[#3c4948] font-medium leading-tight">{tool.label}</span>
                    <span className="text-[9px] text-[#006a67] font-bold">
                      {tool.durationMin > 0 ? `${tool.durationMin} min` : '24/7'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <ProfessionalSupport />
          </div>
        </div>
      </div>
    </>
  );
}
