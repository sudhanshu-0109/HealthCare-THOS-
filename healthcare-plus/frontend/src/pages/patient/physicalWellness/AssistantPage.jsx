import React, { useState, useRef, useEffect, useMemo } from "react";
import { sendPhysicalAssistantMessage } from "../../../services/physicalAssistant.service.js";
import { mockTodayWorkout, loadBiometricsHistory } from "../../../data/physicalWellnessMockData.js";

// Render formatted text with bolding, lists, blockquotes, headings, and responsive Markdown tables
function FormattedMessage({ text = "" }) {
  const lines = text.split("\n");
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      elements.push(<div key={`space_${i}`} className="h-1.5" />);
      i++;
      continue;
    }

    // ── 1. Markdown Table Block ──
    if (
      trimmed.startsWith("|") &&
      trimmed.endsWith("|") &&
      i + 1 < lines.length &&
      lines[i + 1].trim().startsWith("|") &&
      lines[i + 1].includes("-")
    ) {
      const headerLine = trimmed;
      const headers = headerLine
        .split("|")
        .slice(1, -1)
        .map(h => h.trim());

      const rows = [];
      let j = i + 2;
      while (j < lines.length && lines[j].trim().startsWith("|") && lines[j].trim().endsWith("|")) {
        const rowCells = lines[j]
          .trim()
          .split("|")
          .slice(1, -1)
          .map(c => c.trim());
        rows.push(rowCells);
        j++;
      }

      elements.push(
        <div key={`table_${i}`} className="overflow-x-auto my-3 rounded-2xl border border-[var(--border)] shadow-xs bg-white">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[var(--muted)] border-b border-[var(--border)]">
                {headers.map((h, hIdx) => (
                  <th key={hIdx} className="px-3.5 py-2.5 font-bold uppercase tracking-wider text-[10px] text-[var(--muted-foreground)] whitespace-nowrap">
                    <span dangerouslySetInnerHTML={{ __html: formatInline(h) }} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]/60">
              {rows.map((row, rIdx) => (
                <tr
                  key={rIdx}
                  className={rIdx % 2 === 0 ? "bg-white hover:bg-emerald-50/20" : "bg-slate-50/50 hover:bg-emerald-50/30 transition-colors"}
                >
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-3.5 py-2.5 align-top text-[var(--foreground)] leading-relaxed">
                      <span dangerouslySetInnerHTML={{ __html: formatInline(cell) }} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

      i = j;
      continue;
    }

    // ── 2. Headings ──
    if (trimmed.startsWith("### ")) {
      elements.push(
        <h4 key={`h3_${i}`} className="font-bold text-sm text-[var(--foreground)] mt-3 mb-1.5 flex items-center gap-1.5">
          <span dangerouslySetInnerHTML={{ __html: formatInline(trimmed.slice(4)) }} />
        </h4>
      );
      i++;
      continue;
    }
    if (trimmed.startsWith("## ")) {
      elements.push(
        <h3 key={`h2_${i}`} className="font-bold text-base text-[var(--foreground)] mt-3.5 mb-1.5 flex items-center gap-1.5">
          <span dangerouslySetInnerHTML={{ __html: formatInline(trimmed.slice(3)) }} />
        </h3>
      );
      i++;
      continue;
    }
    if (trimmed.startsWith("# ")) {
      elements.push(
        <h2 key={`h1_${i}`} className="font-extrabold text-lg text-[var(--foreground)] mt-4 mb-2">
          <span dangerouslySetInnerHTML={{ __html: formatInline(trimmed.slice(2)) }} />
        </h2>
      );
      i++;
      continue;
    }

    // ── 3. Blockquote ──
    if (trimmed.startsWith("> ")) {
      elements.push(
        <div key={`quote_${i}`} className="border-l-3 border-emerald-500 bg-emerald-50/70 rounded-r-xl px-3.5 py-2 my-2 text-xs text-emerald-950 font-medium leading-relaxed">
          <span dangerouslySetInnerHTML={{ __html: formatInline(trimmed.slice(2)) }} />
        </div>
      );
      i++;
      continue;
    }

    // ── 4. Bullet Point ──
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      elements.push(
        <div key={`bullet_${i}`} className="flex items-start gap-2 pl-1 my-0.5">
          <span className="text-[var(--accent)] font-bold text-xs mt-1">•</span>
          <span dangerouslySetInnerHTML={{ __html: formatInline(trimmed.slice(2)) }} />
        </div>
      );
      i++;
      continue;
    }

    // ── 5. Numbered List ──
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      elements.push(
        <div key={`num_${i}`} className="flex items-start gap-2 pl-1 my-0.5">
          <span className="font-bold text-[var(--accent)] text-xs mt-0.5">{numMatch[1]}.</span>
          <span dangerouslySetInnerHTML={{ __html: formatInline(numMatch[2]) }} />
        </div>
      );
      i++;
      continue;
    }

    // ── 6. Default Paragraph ──
    elements.push(
      <p key={`p_${i}`} dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
    );
    i++;
  }

  return <div className="space-y-1.5 text-sm leading-relaxed">{elements}</div>;
}

// Convert markdown **bold** and *italic* to safe HTML
function formatInline(str = "") {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-[var(--foreground)]">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic text-[var(--muted-foreground)]">$1</em>');
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-[var(--accent)] animate-bounce"
          style={{ animationDelay: `${i * 160}ms`, animationDuration: "800ms" }}
        />
      ))}
    </div>
  );
}

export default function AssistantPage({
  profile,
  checkins = [],
  streak = 0,
  workouts = [],
  todayCheckin,
  todayPlan,
  user = null,
}) {
  const name = profile?.firstName || profile?.name || "there";
  const goal = profile?.primaryGoal || "General Fitness";
  const readiness = todayCheckin ? `${todayCheckin.avgReadiness}/10` : "Pending Check-In";

  // Biometrics (Weight & BMI history)
  const biometrics = useMemo(() => loadBiometricsHistory(user), [user]);
  const latestBio = biometrics[0] || null;
  const weightStr = latestBio?.weight ? `${latestBio.weight} ${latestBio.weightUnit || "kg"}` : (profile?.weight ? `${profile.weight} ${profile?.weightUnit || "kg"}` : null);
  const bmiStr = latestBio?.bmi ? `BMI ${latestBio.bmi}` : (profile?.bmi ? `BMI ${profile.bmi}` : null);

  const activeWorkout = todayPlan || mockTodayWorkout;

  const now = new Date();
  const dayName = now.toLocaleDateString("en-US", { weekday: "long" });

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hi ${name}! 👋 I'm your Healthcare+ Physical Health AI Coach powered by Gemini.\n\nI'm connected to your **${goal}** goal${streak > 0 ? `, your **${streak}-day streak**,` : ""}${weightStr ? `, weight **${weightStr}**` : ""}${bmiStr ? ` (${bmiStr})` : ""}, and your daily training plan. Ask me anything about exercise form, workout adjustments, recovery, or tap below to generate today's customized **Indian Diet Plan**!`,
      time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    },
  ]);

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Suggested dynamic prompt chips
  const dynamicPrompts = [
    "🥗 Generate today's Indian diet plan in a table",
    "🍛 High-protein Indian vegetarian meal plan",
    "How do I perform the Hip Thrust with proper form?",
    "Explain today's workout plan",
    todayCheckin?.result === "adjusted"
      ? "Why was my workout adjusted today?"
      : "What should I focus on for my goal?",
    "⚡ Pre & post workout Indian nutrition tips",
    "Best recovery tips for muscle soreness",
  ];

  // Auto-scroll to bottom whenever messages or typing state changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const send = async (text) => {
    const trimmed = (text || "").trim();
    if (!trimmed || isTyping) return;

    const time = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    const userMsg = { role: "user", content: trimmed, time };

    setMessages(m => [...m, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const reply = await sendPhysicalAssistantMessage({
        userMessage: trimmed,
        history: messages,
        context: {
          profile,
          checkins,
          streak,
          workouts,
          todayCheckin,
          workoutPlan: activeWorkout,
          biometrics,
          user,
        },
      });

      setMessages(m => [
        ...m,
        {
          role: "assistant",
          content: reply,
          time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
        },
      ]);
    } catch (err) {
      console.error("[Assistant] Failed to generate AI reply:", err);
      setMessages(m => [
        ...m,
        {
          role: "assistant",
          content: "I'm having a brief connection hiccup, but keep your form strong! For your current plan, focus on controlled repetitions, steady breathing, and listen to your body.",
          time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleGenerateDiet = () => {
    const prompt = `Please generate my personalized Indian diet plan for today (${dayName}) in a clean tabular format, tailored to my weight, BMI, readiness score, and fitness goal.`;
    send(prompt);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-full lg:px-6" style={{ height: "100%" }}>
      {/* Header */}
      <div className="px-4 py-4 border-b border-[var(--border)] shrink-0 bg-white/70 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--primary)] flex items-center justify-center shadow-xs shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-[var(--foreground)] text-base">Physical Health AI Coach</h1>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Gemini Live
                </span>
              </div>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                Personalized to your logged readiness &amp; workout plan
              </p>
            </div>
          </div>
        </div>

        {/* Real runtime context chips */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
          <span className="shrink-0 text-xs bg-[var(--secondary)] text-[var(--accent)] font-semibold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
            🎯 {goal}
          </span>
          <span className="shrink-0 text-xs bg-amber-50 text-amber-700 border border-amber-100 font-semibold px-3 py-1 rounded-full flex items-center gap-1 shadow-2xs">
            🔥 {streak}-day Streak
          </span>
          <span className="shrink-0 text-xs bg-sky-50 text-sky-700 border border-sky-100 font-semibold px-3 py-1 rounded-full flex items-center gap-1 shadow-2xs">
            ⚡ Readiness {readiness}
          </span>
          <span className="shrink-0 text-xs bg-[var(--muted)] text-[var(--foreground)] font-semibold px-3 py-1 rounded-full flex items-center gap-1 shadow-2xs">
            🏋️ {activeWorkout.title}
          </span>
          {weightStr && (
            <span className="shrink-0 text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold px-3 py-1 rounded-full flex items-center gap-1 shadow-2xs">
              ⚖️ {weightStr}
            </span>
          )}
          {bmiStr && (
            <span className="shrink-0 text-xs bg-teal-50 text-teal-800 border border-teal-200 font-semibold px-3 py-1 rounded-full flex items-center gap-1 shadow-2xs">
              📊 {bmiStr}
            </span>
          )}
        </div>

        {/* Dedicated Indian Diet Plan Generator Action Bar */}
        <button
          onClick={handleGenerateDiet}
          disabled={isTyping}
          className="w-full mt-3 flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white shadow-xs hover:shadow-md hover:opacity-95 transition-all cursor-pointer group disabled:opacity-50 text-left"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-base shrink-0 group-hover:scale-110 transition-transform">
              🥗
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold leading-tight">Generate Today's Indian Diet Plan</span>
                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-emerald-300 text-emerald-950">
                  Tabular Menu
                </span>
              </div>
              <p className="text-[10px] text-emerald-100 font-medium truncate mt-0.5">
                {dayName} Rotation · {goal} · {weightStr || "Profile data"} · Readiness {readiness}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-bold bg-white/15 px-2.5 py-1.5 rounded-xl group-hover:bg-white/25 transition-colors shrink-0">
            <span>Generate</span>
            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </div>
        </button>
      </div>

      {/* Messages Viewport */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fadeIn`}>
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-xl bg-[var(--primary)] flex items-center justify-center mr-2.5 mt-1 shrink-0 shadow-xs">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
              </div>
            )}
            <div
              className={`px-4 py-3.5 shadow-xs transition-all ${
                msg.role === "user"
                  ? "max-w-[85%] sm:max-w-[78%] bg-[var(--primary)] text-white rounded-2xl rounded-tr-xs"
                  : "w-full max-w-[96%] bg-white border border-[var(--border)] text-[var(--foreground)] rounded-2xl rounded-tl-xs shadow-2xs"
              }`}
            >
              <FormattedMessage text={msg.content} />
              <div className={`text-[10px] mt-2 flex items-center justify-end ${msg.role === "user" ? "text-white/60" : "text-[var(--muted-foreground)]"}`}>
                {msg.time}
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start animate-fadeIn">
            <div className="w-8 h-8 rounded-xl bg-[var(--primary)] flex items-center justify-center mr-2.5 mt-1 shrink-0 shadow-xs">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
            </div>
            <div className="bg-white border border-[var(--border)] rounded-2xl rounded-tl-xs shadow-xs">
              <TypingDots />
            </div>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>

      {/* Quick Prompts & User Input */}
      <div className="px-4 py-3 border-t border-[var(--border)] shrink-0 bg-white/90 backdrop-blur-md">
        <div className="flex gap-2 overflow-x-auto pb-2 mb-2.5 scrollbar-hide">
          {dynamicPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => send(p)}
              disabled={isTyping}
              className="shrink-0 text-xs bg-white border border-[var(--border)] text-[var(--foreground)] px-3.5 py-1.5 rounded-xl hover:border-[var(--accent)] hover:text-[var(--accent)] transition cursor-pointer shadow-2xs disabled:opacity-50 whitespace-nowrap"
            >
              {p}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            placeholder="Ask about exercises, form cues, soreness, or your workout plan…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isTyping}
            className="flex-1 bg-[var(--muted)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] transition placeholder:text-[var(--muted-foreground)] disabled:opacity-60"
          />
          <button
            onClick={() => send(input)}
            disabled={isTyping || !input.trim()}
            className="w-11 h-11 bg-[var(--primary)] text-white rounded-xl flex items-center justify-center hover:opacity-90 transition shrink-0 cursor-pointer shadow-xs disabled:opacity-40"
            title="Send to Physical Health AI"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
