/**
 * components/mentalWellness/ActivityPlayer.jsx
 *
 * Full-screen activity player with:
 * - Animated icon specific to each content type
 * - Large countdown timer with progress ring
 * - Start / Pause / Stop controls
 * - Auto-completes when timer hits zero
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  X, Play, Pause, RotateCcw, CheckCircle2, ChevronLeft,
  Volume2, VolumeX, Check,
} from 'lucide-react';
import {
  wellnessAudio,
  WELLNESS_SOUNDSCAPES,
  DEFAULT_ACTIVITY_SOUNDS,
} from '../../utils/wellnessSoundEngine';

// ── Type-specific configs ─────────────────────────────────────────────────────

const TYPE_CONFIG = {
  BREATHING: {
    label: 'Breathing Exercise',
    gradient: 'from-sky-400 to-blue-600',
    bgGlow: 'bg-sky-400',
    instruction: ['Breathe in...', 'Hold...', 'Breathe out...', 'Hold...'],
    instrDurations: [4, 4, 4, 4], // seconds per phase
    AnimIcon: BreathingIcon,
  },
  MEDITATION: {
    label: 'Meditation',
    gradient: 'from-purple-400 to-violet-600',
    bgGlow: 'bg-purple-400',
    instruction: ['Settle in...', 'Focus on your breath...', 'Let thoughts pass...', 'Be present...'],
    instrDurations: [6, 6, 6, 6],
    AnimIcon: MeditationIcon,
  },
  MINDFULNESS: {
    label: 'Mindfulness',
    gradient: 'from-violet-400 to-indigo-600',
    bgGlow: 'bg-violet-400',
    instruction: ['Notice your surroundings...', 'Feel your body...', 'Observe without judgment...', 'Stay present...'],
    instrDurations: [6, 6, 6, 6],
    AnimIcon: MindfulnessIcon,
  },
  SLEEP_SOUND: {
    label: 'Sleep Sound',
    gradient: 'from-indigo-500 to-slate-700',
    bgGlow: 'bg-indigo-500',
    instruction: ['Close your eyes...', 'Relax your body...', 'Let go of the day...', 'Drift into rest...'],
    instrDurations: [8, 8, 8, 8],
    AnimIcon: SleepIcon,
  },
  SLEEP_STORY: {
    label: 'Sleep Story',
    gradient: 'from-blue-500 to-indigo-700',
    bgGlow: 'bg-blue-500',
    instruction: ['Get comfortable...', 'Let the story carry you...', 'Allow your mind to wander...', 'Drift away...'],
    instrDurations: [8, 8, 8, 8],
    AnimIcon: StoryIcon,
  },
  RELAXATION_MUSIC: {
    label: 'Relaxation Music',
    gradient: 'from-pink-400 to-rose-600',
    bgGlow: 'bg-pink-400',
    instruction: ['Listen deeply...', 'Let tension release...', 'Feel the rhythm...', 'Relax completely...'],
    instrDurations: [6, 6, 6, 6],
    AnimIcon: MusicIcon,
  },
  GRATITUDE: {
    label: 'Gratitude Practice',
    gradient: 'from-amber-400 to-orange-500',
    bgGlow: 'bg-amber-400',
    instruction: ['Think of something good...', 'Feel the gratitude...', 'Let it sink in...', 'Carry this forward...'],
    instrDurations: [6, 6, 6, 6],
    AnimIcon: GratitudeIcon,
  },
  GROUNDING: {
    label: 'Grounding Exercise',
    gradient: 'from-emerald-400 to-green-600',
    bgGlow: 'bg-emerald-400',
    instruction: ['Feel your feet...', 'Notice 5 things you see...', 'What do you hear?', 'Take a deep breath...'],
    instrDurations: [6, 6, 6, 6],
    AnimIcon: GroundingIcon,
  },
  FOCUS: {
    label: 'Focus Session',
    gradient: 'from-teal-400 to-cyan-600',
    bgGlow: 'bg-teal-400',
    instruction: ['Set your intention...', 'Clear your mind...', 'Focus on one thing...', 'Stay with it...'],
    instrDurations: [6, 6, 6, 6],
    AnimIcon: FocusIcon,
  },
};

// ── Animated SVG Icons ────────────────────────────────────────────────────────

function BreathingIcon({ phase }) {
  // phase 0 = inhale, 1 = hold-in, 2 = exhale, 3 = hold-out
  const scale = phase === 0 ? 1.3 : phase === 1 ? 1.3 : phase === 2 ? 0.7 : 0.7;
  const opacity = phase === 0 || phase === 1 ? 1 : 0.6;
  return (
    <div className="relative flex items-center justify-center w-48 h-48">
      {/* Outer pulse rings */}
      {[1, 2, 3].map(i => (
        <div
          key={i}
          className="absolute rounded-full border-2 border-sky-300/40 transition-all duration-[4000ms] ease-in-out"
          style={{
            width: `${(i * 55 + 30) * scale}px`,
            height: `${(i * 55 + 30) * scale}px`,
            opacity: opacity * (1 - i * 0.2),
          }}
        />
      ))}
      {/* Core circle */}
      <div
        className="rounded-full bg-gradient-to-br from-sky-300 to-blue-500 shadow-2xl shadow-blue-400/60 flex items-center justify-center transition-all duration-[4000ms] ease-in-out"
        style={{ width: `${96 * scale}px`, height: `${96 * scale}px` }}
      >
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          {/* Lungs shape */}
          <path d="M20 8 C16 8 12 11 11 16 C10 20 10 25 11 29 C11.5 31 13 33 15 33 C17 33 18 31 18 29 L18 20 L20 18 L22 20 L22 29 C22 31 23 33 25 33 C27 33 28.5 31 29 29 C30 25 30 20 29 16 C28 11 24 8 20 8Z" fill="white" fillOpacity="0.9" />
          <path d="M20 8 L20 18" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

function MeditationIcon({ phase }) {
  return (
    <div className="relative flex items-center justify-center w-48 h-48">
      {/* Aura glow */}
      <div className="absolute inset-0 rounded-full bg-purple-400/20 animate-pulse" />
      <div className="absolute w-40 h-40 rounded-full bg-purple-400/15 animate-ping" style={{ animationDuration: '3s' }} />
      <svg width="140" height="140" viewBox="0 0 140 140" fill="none">
        {/* Person in lotus pose */}
        {/* Head */}
        <circle cx="70" cy="28" r="14" fill="white" fillOpacity="0.95" />
        {/* Body / torso */}
        <path d="M70 42 L70 65" stroke="white" strokeWidth="5" strokeLinecap="round" />
        {/* Crossed legs - lotus */}
        <path d="M70 65 C60 65 50 72 40 78 C35 81 30 82 28 80" stroke="white" strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M70 65 C80 65 90 72 100 78 C105 81 110 82 112 80" stroke="white" strokeWidth="5" strokeLinecap="round" fill="none" />
        {/* Feet */}
        <circle cx="28" cy="80" r="5" fill="white" fillOpacity="0.9" />
        <circle cx="112" cy="80" r="5" fill="white" fillOpacity="0.9" />
        {/* Arms/hands on knees */}
        <path d="M70 52 C58 56 45 62 38 72" stroke="white" strokeWidth="4" strokeLinecap="round" />
        <path d="M70 52 C82 56 95 62 102 72" stroke="white" strokeWidth="4" strokeLinecap="round" />
        <circle cx="38" cy="72" r="4" fill="white" fillOpacity="0.9" />
        <circle cx="102" cy="72" r="4" fill="white" fillOpacity="0.9" />
        {/* Energy lines above head */}
        <path d="M70 8 L70 14" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
        <path d="M60 10 L63 15" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
        <path d="M80 10 L77 15" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      </svg>
    </div>
  );
}

function MindfulnessIcon() {
  return (
    <div className="relative flex items-center justify-center w-48 h-48">
      <div className="absolute inset-0 rounded-full bg-violet-400/15 animate-pulse" style={{ animationDuration: '2.5s' }} />
      <svg width="130" height="130" viewBox="0 0 130 130" fill="none">
        {/* Eye of awareness */}
        <ellipse cx="65" cy="55" rx="40" ry="22" stroke="white" strokeWidth="4" fill="none" strokeOpacity="0.9" />
        <circle cx="65" cy="55" r="12" fill="white" fillOpacity="0.9" />
        <circle cx="65" cy="55" r="6" fill="violet" fillOpacity="0.6" />
        {/* Sparkle dots around */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
          <circle
            key={i} cx={65 + 48 * Math.cos(angle * Math.PI / 180)}
            cy={55 + 48 * Math.sin(angle * Math.PI / 180)} r="3"
            fill="white" fillOpacity={0.4 + (i % 3) * 0.2}
          />
        ))}
        {/* Ground/earth line */}
        <path d="M25 95 Q65 85 105 95" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" strokeOpacity="0.7" />
        <path d="M35 105 Q65 95 95 105" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" strokeOpacity="0.4" />
      </svg>
    </div>
  );
}

function SleepIcon() {
  return (
    <div className="relative flex items-center justify-center w-48 h-48">
      <div className="absolute inset-0 rounded-full bg-indigo-400/20 animate-pulse" style={{ animationDuration: '4s' }} />
      <svg width="130" height="130" viewBox="0 0 130 130" fill="none">
        {/* Moon */}
        <path d="M75 20 C55 22 40 38 40 58 C40 78 55 94 75 96 C55 96 26 78 26 58 C26 38 55 20 75 20Z" fill="white" fillOpacity="0.95" />
        {/* Stars */}
        <circle cx="92" cy="30" r="4" fill="white" fillOpacity="0.9" />
        <circle cx="105" cy="50" r="3" fill="white" fillOpacity="0.7" />
        <circle cx="88" cy="65" r="2.5" fill="white" fillOpacity="0.8" />
        <circle cx="100" cy="72" r="2" fill="white" fillOpacity="0.6" />
        <circle cx="80" cy="42" r="2" fill="white" fillOpacity="0.7" />
        {/* Z letters - floating */}
        <text x="82" y="90" fontSize="16" fill="white" fillOpacity="0.7" fontFamily="serif" fontWeight="bold">z</text>
        <text x="97" y="76" fontSize="12" fill="white" fillOpacity="0.5" fontFamily="serif" fontWeight="bold">z</text>
        <text x="108" y="65" fontSize="9" fill="white" fillOpacity="0.3" fontFamily="serif" fontWeight="bold">z</text>
      </svg>
    </div>
  );
}

function StoryIcon() {
  return (
    <div className="relative flex items-center justify-center w-48 h-48">
      <div className="absolute inset-0 rounded-full bg-blue-400/15 animate-pulse" style={{ animationDuration: '3s' }} />
      <svg width="130" height="130" viewBox="0 0 130 130" fill="none">
        {/* Open book */}
        <path d="M20 40 L65 35 L65 95 L20 100 Z" fill="white" fillOpacity="0.9" />
        <path d="M65 35 L110 40 L110 100 L65 95 Z" fill="white" fillOpacity="0.7" />
        <path d="M65 35 L65 95" stroke="white" strokeWidth="3" />
        {/* Lines of text */}
        <line x1="28" y1="52" x2="57" y2="49" stroke="rgba(100,120,200,0.6)" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="28" y1="60" x2="57" y2="57" stroke="rgba(100,120,200,0.6)" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="28" y1="68" x2="57" y2="65" stroke="rgba(100,120,200,0.6)" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="28" y1="76" x2="50" y2="73" stroke="rgba(100,120,200,0.6)" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="73" y1="52" x2="102" y2="52" stroke="rgba(100,120,200,0.4)" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="73" y1="60" x2="102" y2="60" stroke="rgba(100,120,200,0.4)" strokeWidth="2.5" strokeLinecap="round" />
        {/* Stars above book */}
        <circle cx="40" cy="28" r="3" fill="white" fillOpacity="0.8" />
        <circle cx="65" cy="22" r="2" fill="white" fillOpacity="0.6" />
        <circle cx="90" cy="28" r="3" fill="white" fillOpacity="0.8" />
        <path d="M30 18 L31.5 22 L35 22 L32 24 L33 28 L30 26 L27 28 L28 24 L25 22 L28.5 22Z" fill="white" fillOpacity="0.7" />
      </svg>
    </div>
  );
}

function MusicIcon() {
  return (
    <div className="relative flex items-center justify-center w-48 h-48">
      <div className="absolute inset-0 rounded-full bg-pink-400/15 animate-pulse" style={{ animationDuration: '2s' }} />
      <svg width="130" height="130" viewBox="0 0 130 130" fill="none">
        {/* Musical notes */}
        <text x="30" y="75" fontSize="52" fill="white" fillOpacity="0.9" className="select-none">♪</text>
        <text x="62" y="55" fontSize="38" fill="white" fillOpacity="0.7" className="select-none">♫</text>
        <text x="88" y="80" fontSize="28" fill="white" fillOpacity="0.6" className="select-none">♪</text>
        {/* Sound waves */}
        <path d="M15 65 Q20 55 15 45" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" strokeOpacity="0.4" />
        <path d="M10 70 Q18 55 10 40" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeOpacity="0.3" />
      </svg>
    </div>
  );
}

function GratitudeIcon() {
  return (
    <div className="relative flex items-center justify-center w-48 h-48">
      <div className="absolute inset-0 rounded-full bg-amber-400/15 animate-pulse" style={{ animationDuration: '3s' }} />
      <svg width="130" height="130" viewBox="0 0 130 130" fill="none">
        {/* Star / sun rays */}
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => (
          <line key={i}
            x1={65 + 40 * Math.cos(angle * Math.PI / 180)}
            y1={60 + 40 * Math.sin(angle * Math.PI / 180)}
            x2={65 + 52 * Math.cos(angle * Math.PI / 180)}
            y2={60 + 52 * Math.sin(angle * Math.PI / 180)}
            stroke="white" strokeWidth="2.5" strokeLinecap="round"
            strokeOpacity={i % 2 === 0 ? 0.8 : 0.5}
          />
        ))}
        {/* Heart */}
        <path d="M65 75 C65 75 42 60 42 47 C42 40 48 35 55 37 C60 38 65 43 65 43 C65 43 70 38 75 37 C82 35 88 40 88 47 C88 60 65 75 65 75Z"
          fill="white" fillOpacity="0.95" />
      </svg>
    </div>
  );
}

function GroundingIcon() {
  return (
    <div className="relative flex items-center justify-center w-48 h-48">
      <div className="absolute inset-0 rounded-full bg-emerald-400/15 animate-pulse" style={{ animationDuration: '3.5s' }} />
      <svg width="130" height="130" viewBox="0 0 130 130" fill="none">
        {/* Tree */}
        {/* Roots */}
        <path d="M65 85 L55 105" stroke="white" strokeWidth="4" strokeLinecap="round" strokeOpacity="0.7" />
        <path d="M65 85 L75 105" stroke="white" strokeWidth="4" strokeLinecap="round" strokeOpacity="0.7" />
        <path d="M65 90 L48 108" stroke="white" strokeWidth="3" strokeLinecap="round" strokeOpacity="0.4" />
        <path d="M65 90 L82 108" stroke="white" strokeWidth="3" strokeLinecap="round" strokeOpacity="0.4" />
        {/* Trunk */}
        <rect x="60" y="60" width="10" height="28" rx="5" fill="white" fillOpacity="0.8" />
        {/* Canopy */}
        <circle cx="65" cy="45" r="28" fill="white" fillOpacity="0.9" />
        <circle cx="48" cy="55" r="18" fill="white" fillOpacity="0.85" />
        <circle cx="82" cy="55" r="18" fill="white" fillOpacity="0.85" />
        {/* Ground line */}
        <line x1="15" y1="112" x2="115" y2="112" stroke="white" strokeWidth="3" strokeLinecap="round" strokeOpacity="0.5" />
      </svg>
    </div>
  );
}

function FocusIcon() {
  return (
    <div className="relative flex items-center justify-center w-48 h-48">
      <div className="absolute inset-0 rounded-full bg-teal-400/15 animate-pulse" style={{ animationDuration: '2.5s' }} />
      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-teal-400 to-cyan-600 shadow-2xl flex items-center justify-center">
        <span className="text-4xl select-none">🎯</span>
      </div>
    </div>
  );
}

// ── Circular Timer Ring ───────────────────────────────────────────────────────

function TimerRing({ progress, size = 240, strokeWidth = 6 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  return (
    <svg width={size} height={size} className="absolute inset-0 -rotate-90">
      {/* Track */}
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={strokeWidth}
      />
      {/* Progress */}
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke="white" strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 1s linear' }}
      />
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ActivityPlayer({ item, onClose, onComplete }) {
  const cfg = TYPE_CONFIG[item?.type] || TYPE_CONFIG.BREATHING;
  const totalSeconds = (item?.duration || 5) * 60;

  const [phase, setPhase] = useState('idle'); // idle | running | paused | done
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [instrIndex, setInstrIndex] = useState(0);
  const [instrTimer, setInstrTimer] = useState(cfg.instrDurations[0]);

  // ── Ambient Soundscape State ────────────────────────────────────────────────
  const defaultSound = DEFAULT_ACTIVITY_SOUNDS[item?.type] || 'ocean';
  const [selectedSound, setSelectedSound] = useState(defaultSound);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [showSoundMenu, setShowSoundMenu] = useState(false);

  const intervalRef = useRef(null);
  const instrRef = useRef(null);

  const progress = secondsLeft / totalSeconds;

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  // ── Sound engine lifecycle ─────────────────────────────────────────────────
  useEffect(() => {
    if (phase === 'running') {
      if (isMuted || selectedSound === 'none') {
        wellnessAudio.stop(0.3);
      } else {
        wellnessAudio.setVolume(volume);
        wellnessAudio.play(selectedSound);
      }
    } else {
      wellnessAudio.stop(0.4);
    }
  }, [phase, selectedSound, isMuted]);

  // Volume slider update
  useEffect(() => {
    wellnessAudio.setVolume(isMuted ? 0 : volume);
  }, [volume, isMuted]);

  // Cleanup sound engine on unmount
  useEffect(() => {
    return () => {
      wellnessAudio.stop(0.2);
    };
  }, []);

  // Main countdown
  useEffect(() => {
    if (phase === 'running') {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setPhase('done');
            wellnessAudio.stop(0.5);
            onComplete?.(item);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [phase]);

  // Instruction cycling
  useEffect(() => {
    if (phase === 'running') {
      instrRef.current = setInterval(() => {
        setInstrTimer(prev => {
          if (prev <= 1) {
            setInstrIndex(i => (i + 1) % cfg.instruction.length);
            return cfg.instrDurations[(instrIndex + 1) % cfg.instrDurations.length];
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(instrRef.current);
    }
    return () => clearInterval(instrRef.current);
  }, [phase, instrIndex]);

  const handleStart = () => setPhase('running');
  const handlePause = () => setPhase('paused');
  const handleReset = () => {
    setPhase('idle');
    setSecondsLeft(totalSeconds);
    setInstrIndex(0);
    wellnessAudio.stop(0.3);
  };

  const handleClose = () => {
    wellnessAudio.stop(0.2);
    onClose?.();
  };

  // Breathing phase index maps to: 0=inhale, 1=hold-in, 2=exhale, 3=hold-out
  const breathPhase = instrIndex % 4;
  const AnimIcon = cfg.AnimIcon;

  const currentSoundObj = WELLNESS_SOUNDSCAPES.find(s => s.id === selectedSound) || WELLNESS_SOUNDSCAPES[0];

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'rgba(5, 10, 12, 0.96)' }}>
      {/* Background gradient glow */}
      <div
        className={`absolute inset-0 opacity-20 bg-gradient-to-br ${cfg.gradient}`}
        style={{ filter: 'blur(60px)' }}
      />

      {/* Header */}
      <div className="relative flex items-center justify-between px-6 py-4">
        <button onClick={handleClose}
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        <p className="text-white/70 text-sm font-medium">{cfg.label}</p>
        <button onClick={handleClose}
          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 relative max-w-xl mx-auto w-full">

        {/* Title */}
        <div className="text-center">
          <h1 className="text-white text-2xl font-bold font-display tracking-tight">{item?.title}</h1>
          {phase === 'idle' && (
            <p className="text-white/60 text-sm mt-1 max-w-xs mx-auto">{item?.description}</p>
          )}
        </div>

        {/* Animated icon + timer ring */}
        <div className="relative flex items-center justify-center my-2" style={{ width: 240, height: 240 }}>
          <TimerRing progress={progress} size={240} strokeWidth={6} />
          <AnimIcon phase={breathPhase} />
        </div>

        {/* Timer display */}
        <div className="text-center">
          {phase === 'done' ? (
            <div className="flex flex-col items-center gap-3">
              <CheckCircle2 className="w-14 h-14 text-emerald-400 animate-bounce" />
              <p className="text-white text-2xl font-bold font-display">Well done!</p>
              <p className="text-white/60 text-sm">Session completed and logged to your journey</p>
            </div>
          ) : (
            <>
              <div className="text-white font-bold tabular-nums font-display" style={{ fontSize: '3.5rem', letterSpacing: '-0.02em', lineHeight: 1 }}>
                {formatTime(secondsLeft)}
              </div>
              {/* Instruction text */}
              <div className="h-7 mt-3">
                {phase === 'running' && (
                  <p className="text-white/90 text-base font-medium animate-pulse">
                    {cfg.instruction[instrIndex]}
                  </p>
                )}
                {phase === 'idle' && (
                  <p className="text-white/50 text-sm">Press Start to begin with ambient sound</p>
                )}
                {phase === 'paused' && (
                  <p className="text-white/50 text-sm">Paused — press Play to resume</p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          {phase !== 'done' && (
            <>
              <button
                onClick={handleReset}
                title="Reset timer"
                className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <RotateCcw className="w-5 h-5 text-white/70" />
              </button>

              {phase === 'running' ? (
                <button
                  onClick={handlePause}
                  title="Pause"
                  className={`w-20 h-20 rounded-full bg-gradient-to-br ${cfg.gradient} shadow-2xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95`}
                >
                  <Pause className="w-8 h-8 text-white" />
                </button>
              ) : (
                <button
                  onClick={handleStart}
                  title="Start"
                  className={`w-20 h-20 rounded-full bg-gradient-to-br ${cfg.gradient} shadow-2xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95`}
                >
                  <Play className="w-8 h-8 text-white ml-1" />
                </button>
              )}

              <div className="w-12 h-12" /> {/* spacer */}
            </>
          )}

          {phase === 'done' && (
            <button
              onClick={handleClose}
              className={`px-8 py-3 rounded-full bg-gradient-to-r ${cfg.gradient} text-white font-bold text-base shadow-lg hover:opacity-90 transition-opacity font-display`}
            >
              Finish & Return
            </button>
          )}
        </div>

        {/* Progress bar for breathing phases */}
        {item?.type === 'BREATHING' && phase === 'running' && (
          <div className="flex gap-2">
            {['Inhale', 'Hold', 'Exhale', 'Hold'].map((label, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className={`w-12 h-1.5 rounded-full transition-all ${i === breathPhase ? 'bg-sky-400 shadow-sm' : 'bg-white/20'}`} />
                <span className="text-xs text-white/40">{label}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── Ambient Soundscape Bar ────────────────────────────────────────── */}
        <div className="relative w-full max-w-sm mt-1">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2 px-3.5 flex items-center justify-between border border-white/15 shadow-lg">
            
            {/* Sound Selector Button */}
            <button
              onClick={() => setShowSoundMenu(!showSoundMenu)}
              className="flex items-center gap-2 hover:bg-white/10 px-2 py-1 rounded-xl transition-colors text-left"
              title="Change background sound"
            >
              <span className="text-lg">{isMuted || selectedSound === 'none' ? '🔇' : currentSoundObj.icon}</span>
              <div>
                <p className="text-xs font-semibold text-white leading-tight">
                  {isMuted ? 'Muted' : currentSoundObj.name}
                </p>
                <p className="text-[10px] text-white/50 leading-none mt-0.5">
                  {phase === 'running' && !isMuted && selectedSound !== 'none' ? 'Playing now' : 'Soundscape'}
                </p>
              </div>
              <span className="material-symbols-outlined text-white/50 text-[14px] ml-1">expand_more</span>
            </button>

            {/* Volume & Mute Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-white/90" />
                )}
              </button>

              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(Number(e.target.value));
                  if (isMuted) setIsMuted(false);
                }}
                className="w-16 md:w-20 accent-emerald-400 cursor-pointer h-1.5 rounded-lg bg-white/20"
                title={`Volume: ${Math.round(volume * 100)}%`}
              />
            </div>
          </div>

          {/* Sound Picker Menu Dropdown */}
          {showSoundMenu && (
            <div className="absolute bottom-full mb-2 left-0 right-0 bg-[#0f1719]/95 backdrop-blur-xl border border-white/20 rounded-2xl p-2.5 shadow-2xl z-50 space-y-1 animate-in fade-in slide-in-from-bottom-2">
              <div className="px-2 py-1 flex items-center justify-between border-b border-white/10 mb-1">
                <span className="text-xs font-semibold text-white/80 font-display">Ambient Soundscapes</span>
                <button
                  onClick={() => setShowSoundMenu(false)}
                  className="text-white/40 hover:text-white text-xs"
                >
                  Close
                </button>
              </div>

              <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                {WELLNESS_SOUNDSCAPES.map((sound) => {
                  const isSelected = selectedSound === sound.id;
                  return (
                    <button
                      key={sound.id}
                      onClick={() => {
                        setSelectedSound(sound.id);
                        setIsMuted(false);
                        setShowSoundMenu(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                        isSelected
                          ? 'bg-[#006a67] text-white'
                          : 'hover:bg-white/10 text-white/80'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-lg flex-shrink-0">{sound.icon}</span>
                        <div className="truncate">
                          <p className="text-xs font-semibold leading-tight truncate">{sound.name}</p>
                          <p className="text-[10px] text-white/60 truncate mt-0.5">{sound.desc}</p>
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-white flex-shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
