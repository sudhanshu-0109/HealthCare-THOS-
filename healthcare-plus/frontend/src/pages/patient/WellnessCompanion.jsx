/**
 * pages/patient/WellnessCompanion.jsx
 *
 * Mental Wellness — AI Companion page.
 * Route: /health-hub/mental-wellness/companion
 *
 * Merges:
 *  - Visual layout from Mentalwellness-frontend/src/pages/AICompanion.tsx
 *    (chat column, BreathingWidget, LiveContext, QuickTools, ProfessionalSupport)
 *  - API wiring from existing MentalWellness.jsx
 *    (createConversation, sendMessage, getConversation)
 *  - Graceful mock fallback: if API is unavailable, falls back to
 *    hardcoded AI_RESPONSES with 1.6s simulated typing delay
 *
 * Converted from TSX: all interfaces, Record<> generics, typed useRef<>,
 * React.KeyboardEvent annotations removed. Runtime behavior identical.
 */

import { useState, useRef, useEffect } from 'react';
import * as mhService from '../../services/mentalHealth.service';
import {
  CHAT_MESSAGES,
  SUGGESTION_CHIPS,
  QUICK_TOOLS,
  AI_RESPONSES,
} from '../../data/wellnessMockData';

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
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

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
  const mood   = lastCheckIn?.mood   ?? 'Good';
  const energy = lastCheckIn?.energy ?? 6;
  const stress = lastCheckIn?.stressLevel ?? lastCheckIn?.stress ?? 7;

  return (
    <div className="p-5 rounded-2xl bg-white border border-[rgba(188,201,200,0.45)] mw-soft-shadow">
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-[#006a67] msym-sm filled">radio_button_checked</span>
        <h3 className="font-display font-semibold text-[#171d1c] text-sm">Live Context</h3>
        <span className="ml-auto text-[10px] text-[#3c4948] bg-[#e9efee] px-2 py-0.5 rounded-full">Today</span>
      </div>
      <div className="space-y-3">
        {[
          { label: 'Mood',   value: mood,           icon: '😊', bar: 83,        color: 'bg-[#006a67]' },
          { label: 'Energy', value: `${energy}/10`, icon: '⚡', bar: energy*10, color: 'bg-[#5bd9d3]' },
          { label: 'Stress', value: `${stress}/10`, icon: '🌀', bar: stress*10, color: 'bg-[#ddc39c]' },
        ].map((item) => (
          <div key={item.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-[#3c4948]">{item.label}</span>
              <span className="text-xs font-semibold text-[#171d1c] font-display">
                {item.icon} {item.value}
              </span>
            </div>
            <div className="h-1 rounded-full bg-[#e4e9e8] overflow-hidden">
              <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.bar}%` }} />
            </div>
          </div>
        ))}
      </div>
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

// ── Main Component ────────────────────────────────────────────────────────────

export default function WellnessCompanion() {
  const [messages,    setMessages]    = useState(CHAT_MESSAGES);
  const [inputValue,  setInputValue]  = useState('');
  const [isTyping,    setIsTyping]    = useState(false);
  const [conversation, setConversation] = useState(null);
  const [lastCheckIn, setLastCheckIn] = useState(null);
  const [apiMode,     setApiMode]     = useState(false); // true = real API, false = mock

  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);
  const responseIdx    = useRef(0);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Try to init a real API conversation; fall back to mock silently
  useEffect(() => {
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
              time: new Date(m.createdAt || Date.now()).toLocaleTimeString('en-US', {
                hour: 'numeric', minute: '2-digit',
              }),
            })));
          }
        }
      } catch {
        // mock mode
      }
    })();

    // Load last check-in for LiveContext
    (async () => {
      try {
        const res = await mhService.getCheckInHistory(1);
        const data = res?.data ?? res;
        const history = Array.isArray(data) ? data : data?.checkIns ?? [];
        if (history.length > 0) setLastCheckIn(history[0]);
      } catch {
        // keep null
      }
    })();
  }, []);

  // ── Send message ─────────────────────────────────────────────────────────
  const sendMessage = async (text) => {
    if (!text.trim()) return;

    const time = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    const userMsg = {
      id:   `u${Date.now()}`,
      role: 'user',
      text: text.trim(),
      time,
    };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    if (apiMode && conversation?.id) {
      // Real API path
      try {
        const res  = await mhService.sendMessage(conversation.id, text.trim());
        const data = res?.data ?? res;
        const aiText = data?.message?.content ?? data?.reply ?? AI_RESPONSES[responseIdx.current % AI_RESPONSES.length];
        responseIdx.current++;
        setIsTyping(false);
        setMessages(prev => [...prev, {
          id:   `a${Date.now()}`,
          role: 'ai',
          text: aiText,
          time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        }]);
        return;
      } catch {
        // fall through to mock
      }
    }

    // Mock path
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id:   `a${Date.now()}`,
        role: 'ai',
        text: AI_RESPONSES[responseIdx.current % AI_RESPONSES.length],
        time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      }]);
      responseIdx.current++;
    }, 1600);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
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
            {/* Messages area */}
            <div className="flex-1 overflow-y-auto mw-hide-scrollbar p-5 space-y-4" style={{ minHeight: 0 }}>
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[82%] ${msg.role === 'user' ? 'order-last' : ''}`}>
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
                      {msg.action && (
                        <button className="mt-3 flex items-center gap-1.5 text-[#006a67] font-semibold font-display text-xs bg-[#006a67]/10 px-3 py-2 rounded-xl hover:bg-[#006a67]/15 transition-colors">
                          <span className="material-symbols-outlined msym-sm">{msg.action.icon}</span>
                          {msg.action.label}
                        </button>
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
              <div ref={messagesEndRef} />
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

          {/* Quick Tools */}
          <div className="p-5 rounded-2xl bg-white border border-[rgba(188,201,200,0.45)] mw-soft-shadow">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-[#3c4948] msym-sm">apps</span>
              <h3 className="font-display font-semibold text-[#171d1c] text-sm">Quick Tools</h3>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {QUICK_TOOLS.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => sendMessage(`Help me with ${tool.label}`)}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-[#e9efee] hover:bg-[#e4e9e8] transition-colors active:scale-95"
                >
                  <span className="material-symbols-outlined text-[#006a67]" style={{ fontSize: '20px' }}>{tool.icon}</span>
                  <span className="text-[10px] text-[#3c4948] font-medium text-center leading-tight">{tool.label}</span>
                </button>
              ))}
            </div>
          </div>

          <ProfessionalSupport />
        </div>
      </div>
    </div>
  );
}
