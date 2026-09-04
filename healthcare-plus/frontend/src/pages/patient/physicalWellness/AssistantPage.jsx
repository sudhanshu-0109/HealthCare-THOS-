import React, { useState, useRef, useEffect } from "react";
import { sendPhysicalAssistantMessage } from "../../../services/physicalAssistant.service.js";
import { mockTodayWorkout } from "../../../data/physicalWellnessMockData.js";

// Render formatted text with bolding, lists, and line breaks
function FormattedMessage({ text = "" }) {
  const lines = text.split("\n");

  return (
    <div className="space-y-1.5 text-sm leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1.5" />;

        // Bullet point
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          const content = trimmed.slice(2);
          return (
            <div key={idx} className="flex items-start gap-2 pl-1">
              <span className="text-[var(--accent)] font-bold text-xs mt-1">•</span>
              <span dangerouslySetInnerHTML={{ __html: formatInline(content) }} />
            </div>
          );
        }

        // Numbered list (e.g. 1. 2.)
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-1">
              <span className="font-bold text-[var(--accent)] text-xs mt-0.5">{numMatch[1]}.</span>
              <span dangerouslySetInnerHTML={{ __html: formatInline(numMatch[2]) }} />
            </div>
          );
        }

        return (
          <p
            key={idx}
            dangerouslySetInnerHTML={{ __html: formatInline(line) }}
          />
        );
      })}
    </div>
  );
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
}) {
  const name = profile?.firstName || profile?.name || "there";
  const goal = profile?.primaryGoal || "General Fitness";
  const readiness = todayCheckin ? `${todayCheckin.avgReadiness}/10` : "Logged";

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hi ${name}! 👋 I'm your Healthcare+ Physical Health AI Coach powered by Gemini.\n\nI'm connected to your **${goal}** goal, your **${streak}-day streak**, and today's **${mockTodayWorkout.title}** plan. Ask me anything about exercise form, workout adjustments, recovery, or nutrition!`,
      time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    },
  ]);

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Suggested dynamic prompt chips
  const dynamicPrompts = [
    "How do I perform the Hip Thrust with proper form?",
    "Explain today's workout plan",
    todayCheckin?.result === "adjusted"
      ? "Why was my workout adjusted today?"
      : "What should I focus on for my goal?",
    "Best recovery tips for muscle soreness",
    "How can I modify exercises if my joints ache?",
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
          workoutPlan: mockTodayWorkout,
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

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-full lg:px-8" style={{ height: "100%" }}>
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
            🏋️ {mockTodayWorkout.title}
          </span>
        </div>
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
              className={`max-w-[85%] sm:max-w-[78%] px-4 py-3.5 shadow-xs transition-all ${
                msg.role === "user"
                  ? "bg-[var(--primary)] text-white rounded-2xl rounded-tr-xs"
                  : "bg-white border border-[var(--border)] text-[var(--foreground)] rounded-2xl rounded-tl-xs shadow-2xs"
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
