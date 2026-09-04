import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { mockUser, mockHabits } from "../../data/physicalWellnessMockData.js";

const HomeIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const CalendarIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const SparkleIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
  </svg>
);
const ChartIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);
const BotIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="10" rx="2"/><path d="M12 11V7"/><circle cx="12" cy="5" r="2"/><path d="M8 15h.01M16 15h.01"/>
  </svg>
);
const GearIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
  </svg>
);

const navItems = [
  { id: "dashboard", label: "Home", icon: <HomeIcon /> },
  { id: "weekly-plan", label: "Plan", icon: <CalendarIcon /> },
  { id: "habits", label: "Habits", icon: <SparkleIcon /> },
  { id: "progress", label: "Progress", icon: <ChartIcon /> },
  { id: "assistant", label: "Assistant", icon: <BotIcon /> },
];

export default function PWLayout({ currentPage, navigate, children }) {
  const routerNavigate = useNavigate();
  const mainNavIds = ["dashboard", "weekly-plan", "habits", "progress", "assistant"];
  const showNav = mainNavIds.includes(currentPage);

  return (
    <div className="flex h-screen bg-transparent overflow-hidden relative">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 h-full bg-white/90 backdrop-blur-md border-r border-[var(--border)] shrink-0 z-20">
        <div className="px-6 pt-6 pb-5 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center shadow-xs">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
            </div>
            <div>
              <p className="text-xs text-[var(--muted-foreground)] leading-none mb-0.5">Healthcare+</p>
              <p className="text-sm font-semibold text-[var(--foreground)] leading-none">Physical Health</p>
            </div>
          </div>
          <button
            onClick={() => routerNavigate('/health-hub')}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-[var(--accent)] font-medium transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to Health Hub
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                currentPage === item.id
                  ? "bg-[var(--primary)] text-white shadow-xs"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-[var(--border)]">
          <button
            onClick={() => navigate("settings")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              currentPage === "settings"
                ? "bg-[var(--primary)] text-white shadow-xs"
                : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            <GearIcon />
            Settings
          </button>
          <div className="mt-3 px-3 py-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[var(--secondary)] flex items-center justify-center text-xs font-bold text-[var(--primary)] shrink-0">
                {mockUser.name.charAt(0)}
              </div>
              <div>
                <p className="text-xs font-semibold text-[var(--foreground)]">{mockUser.name}</p>
                <p className="text-xs text-[var(--muted-foreground)]">{mockHabits.streaks.current}-day streak 🔥</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative z-10 bg-transparent">
        {/* Mobile top bar with Back to Health Hub */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white/90 backdrop-blur-md border-b border-[var(--border)] shrink-0">
          <button
            onClick={() => routerNavigate('/health-hub')}
            className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-[var(--accent)]"
          >
            <ArrowLeft className="w-4 h-4" />
            Health Hub
          </button>
          <span className="text-xs font-bold text-[var(--foreground)]">Physical Health</span>
          <button
            onClick={() => navigate("settings")}
            className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            Settings
          </button>
        </div>

        <main className={`flex-1 overflow-y-auto bg-transparent ${showNav ? "pb-20 lg:pb-0" : ""}`}>
          {children}
        </main>

        {/* Mobile bottom nav */}
        {showNav && (
          <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[var(--card)] border-t border-[var(--border)] z-50">
            <div className="flex items-center justify-around px-2 py-2">
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => navigate(item.id)}
                  className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-[52px] cursor-pointer ${
                    currentPage === item.id
                      ? "text-[var(--primary)] font-bold"
                      : "text-[var(--muted-foreground)]"
                  }`}
                >
                  {item.icon}
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </nav>
        )}
      </div>
    </div>
  );
}
