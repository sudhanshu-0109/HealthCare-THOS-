/**
 * components/patient/DashboardIllustrations.jsx
 * High-precision vector SVG illustrations matching the Patient Dashboard mockup screenshots:
 * 1. SunnyHospitalHeaderIllustration (Desktop greeting banner)
 * 2. HospitalBuildingIllustration (Hospital Care card)
 * 3. MeditatingWomanIllustration (Mental Wellness card)
 * 4. YogaStretchingWomanIllustration (Physical Health card)
 */

import React from 'react';

/**
 * 1. Sunny Hospital Header Illustration (Sun, clouds, hospital building, green trees)
 */
export function SunnyHospitalHeaderIllustration({ className = "w-72 h-36" }) {
  return (
    <svg viewBox="0 0 420 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="sunGlow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FDE047" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id="skyFade" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E0F2FE" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#F0FDFA" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id="hospitalFacade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F1F5F9" />
        </linearGradient>
      </defs>

      {/* Warm Sun */}
      <circle cx="210" cy="42" r="26" fill="url(#sunGlow)" filter="drop-shadow(0px 0px 12px rgba(251, 191, 36, 0.45))" />
      <circle cx="210" cy="42" r="34" fill="#FEF08A" opacity="0.25" />

      {/* Floating birds */}
      <path d="M140 32 Q144 26 148 32 Q152 26 156 32" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.6" />
      <path d="M165 24 Q168 19 171 24 Q174 19 177 24" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.5" />
      <path d="M260 28 Q264 22 268 28 Q272 22 276 28" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.6" />

      {/* Distant City Skyline Silhouettes */}
      <rect x="290" y="65" width="28" height="80" rx="3" fill="#E2E8F0" opacity="0.7" />
      <rect x="325" y="75" width="22" height="70" rx="2" fill="#CBD5E1" opacity="0.6" />
      <rect x="100" y="80" width="24" height="65" rx="2" fill="#CBD5E1" opacity="0.6" />
      <rect x="130" y="70" width="26" height="75" rx="3" fill="#E2E8F0" opacity="0.7" />

      {/* Hospital Wings */}
      <rect x="256" y="72" width="58" height="75" rx="4" fill="#E0F2FE" />
      <rect x="146" y="72" width="58" height="75" rx="4" fill="#E0F2FE" />

      {/* Wing Windows */}
      <g fill="#38BDF8" opacity="0.55">
        <rect x="264" y="80" width="8" height="10" rx="1.5" />
        <rect x="278" y="80" width="8" height="10" rx="1.5" />
        <rect x="292" y="80" width="8" height="10" rx="1.5" />
        <rect x="264" y="98" width="8" height="10" rx="1.5" />
        <rect x="278" y="98" width="8" height="10" rx="1.5" />
        <rect x="292" y="98" width="8" height="10" rx="1.5" />
        <rect x="264" y="116" width="8" height="10" rx="1.5" />
        <rect x="278" y="116" width="8" height="10" rx="1.5" />
        <rect x="292" y="116" width="8" height="10" rx="1.5" />

        <rect x="156" y="80" width="8" height="10" rx="1.5" />
        <rect x="170" y="80" width="8" height="10" rx="1.5" />
        <rect x="184" y="80" width="8" height="10" rx="1.5" />
        <rect x="156" y="98" width="8" height="10" rx="1.5" />
        <rect x="170" y="98" width="8" height="10" rx="1.5" />
        <rect x="184" y="98" width="8" height="10" rx="1.5" />
        <rect x="156" y="116" width="8" height="10" rx="1.5" />
        <rect x="170" y="116" width="8" height="10" rx="1.5" />
        <rect x="184" y="116" width="8" height="10" rx="1.5" />
      </g>

      {/* Main Center Hospital Building */}
      <rect x="194" y="48" width="72" height="100" rx="5" fill="url(#hospitalFacade)" stroke="#CBD5E1" strokeWidth="1" />

      {/* Hospital Cross Emblem Header */}
      <circle cx="230" cy="65" r="11" fill="#10B981" />
      <path d="M227 65H233M230 62V68" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />

      {/* Hospital Sign Banner */}
      <rect x="206" y="80" width="48" height="11" rx="2" fill="#0284C7" />
      <text x="230" y="88.5" fill="#FFFFFF" fontSize="6.5" fontWeight="bold" textAnchor="middle" letterSpacing="0.8">HOSPITAL</text>

      {/* Center Windows */}
      <g fill="#0284C7" opacity="0.35">
        <rect x="204" y="96" width="11" height="11" rx="1.5" />
        <rect x="220" y="96" width="11" height="11" rx="1.5" />
        <rect x="236" y="96" width="11" height="11" rx="1.5" />
        <rect x="204" y="112" width="11" height="11" rx="1.5" />
        <rect x="220" y="112" width="11" height="11" rx="1.5" />
        <rect x="236" y="112" width="11" height="11" rx="1.5" />
      </g>

      {/* Main Entrance Glass Doors */}
      <rect x="219" y="130" width="22" height="18" rx="2" fill="#0D9488" />
      <rect x="221" y="133" width="8" height="15" rx="1" fill="#CCFBF1" opacity="0.8" />
      <rect x="231" y="133" width="8" height="15" rx="1" fill="#CCFBF1" opacity="0.8" />

      {/* Lush Green Trees */}
      <circle cx="138" cy="134" r="16" fill="#10B981" />
      <circle cx="130" cy="138" r="12" fill="#059669" />
      <circle cx="146" cy="138" r="12" fill="#34D399" />
      <rect x="136" y="142" width="4" height="14" rx="1" fill="#94A3B8" />

      <circle cx="324" cy="132" r="15" fill="#10B981" />
      <circle cx="334" cy="136" r="13" fill="#059669" />
      <circle cx="316" cy="136" r="11" fill="#34D399" />
      <rect x="322" y="140" width="4" height="14" rx="1" fill="#94A3B8" />

      {/* Ground Strip */}
      <rect x="90" y="146" width="280" height="4" rx="2" fill="#10B981" opacity="0.4" />
    </svg>
  );
}

/**
 * 2. Hospital Care Card Illustration (Right graphic of Hospital Care card)
 */
export function HospitalBuildingIllustration({ className = "w-36 h-28" }) {
  return (
    <svg viewBox="0 0 180 140" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="cloudGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F0FDFA" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#CCFBF1" stopOpacity="0.4" />
        </linearGradient>
      </defs>
      {/* Background Soft Cloud/Aura */}
      <ellipse cx="90" cy="65" rx="75" ry="45" fill="url(#cloudGrad)" opacity="0.7" />

      {/* Background Skyline */}
      <rect x="25" y="60" width="22" height="60" rx="3" fill="#E2E8F0" opacity="0.5" />
      <rect x="135" y="55" width="22" height="65" rx="3" fill="#E2E8F0" opacity="0.5" />

      {/* Hospital Building Base & Wings */}
      <rect x="42" y="64" width="96" height="58" rx="4" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
      <rect x="62" y="44" width="56" height="78" rx="4" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" />

      {/* Medical Cross Symbol */}
      <circle cx="90" cy="56" r="8" fill="#10B981" />
      <path d="M88 56H92M90 54V58" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />

      {/* Windows Grid */}
      <g fill="#38BDF8" opacity="0.5">
        <rect x="48" y="72" width="8" height="8" rx="1.5" />
        <rect x="48" y="86" width="8" height="8" rx="1.5" />
        <rect x="48" y="100" width="8" height="8" rx="1.5" />
        <rect x="124" y="72" width="8" height="8" rx="1.5" />
        <rect x="124" y="86" width="8" height="8" rx="1.5" />
        <rect x="124" y="100" width="8" height="8" rx="1.5" />
        <rect x="70" y="70" width="10" height="9" rx="1.5" />
        <rect x="85" y="70" width="10" height="9" rx="1.5" />
        <rect x="100" y="70" width="10" height="9" rx="1.5" />
        <rect x="70" y="84" width="10" height="9" rx="1.5" />
        <rect x="85" y="84" width="10" height="9" rx="1.5" />
        <rect x="100" y="84" width="10" height="9" rx="1.5" />
      </g>

      {/* Entrance */}
      <rect x="80" y="104" width="20" height="18" rx="2" fill="#0D9488" />
      <rect x="82" y="107" width="7" height="15" rx="1" fill="#CCFBF1" />
      <rect x="91" y="107" width="7" height="15" rx="1" fill="#CCFBF1" />

      {/* Round Green Trees */}
      <circle cx="34" cy="112" r="12" fill="#10B981" />
      <circle cx="28" cy="116" r="9" fill="#059669" />
      <circle cx="146" cy="112" r="12" fill="#10B981" />
      <circle cx="152" cy="116" r="9" fill="#059669" />

      {/* Ground */}
      <path d="M15 122H165" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

/**
 * 3. Meditating Woman Illustration (Right graphic of Mental Wellness card)
 */
export function MeditatingWomanIllustration({ className = "w-36 h-32" }) {
  return (
    <svg viewBox="0 0 180 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="purpleLeaves" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#DDD6FE" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#F5F3FF" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id="sereneAura" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#C4B5FD" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#EDE9FE" stopOpacity="0.1" />
        </linearGradient>
      </defs>

      {/* Peaceful Botanical Foliage Background */}
      <path d="M35 140 C25 100, 30 65, 45 45 C48 68, 45 100, 50 140 Z" fill="url(#purpleLeaves)" />
      <path d="M48 140 C42 110, 48 80, 62 60 C64 82, 58 112, 60 140 Z" fill="#DDD6FE" opacity="0.5" />
      <path d="M145 140 C155 100, 150 65, 135 45 C132 68, 135 100, 130 140 Z" fill="url(#purpleLeaves)" />
      <path d="M132 140 C138 110, 132 80, 118 60 C116 82, 122 112, 120 140 Z" fill="#DDD6FE" opacity="0.5" />

      {/* Soft Aura Ring */}
      <circle cx="90" cy="85" r="50" fill="url(#sereneAura)" />

      {/* Woman in Lotus Pose (Serene Violet/Purple) */}
      <g fill="#7C3AED">
        {/* Head and Hair Bun */}
        <circle cx="90" cy="52" r="10" />
        <circle cx="90" cy="40" r="4.5" /> {/* Top bun */}

        {/* Neck & Shoulders */}
        <path d="M87 62 H93 V68 H87 Z" />
        <path d="M72 74 C72 68, 80 66, 90 66 C100 66, 108 68, 108 74 L104 102 C104 106, 76 106, 76 102 Z" />

        {/* Relaxed Meditating Arms */}
        {/* Left Arm resting on knee */}
        <path d="M73 74 C66 84, 58 98, 54 110 C58 113, 66 113, 72 108 L80 96" stroke="#7C3AED" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        {/* Right Arm resting on knee */}
        <path d="M107 74 C114 84, 122 98, 126 110 C122 113, 114 113, 108 108 L100 96" stroke="#7C3AED" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />

        {/* Crossed Legs (Lotus Position / Padmasana) */}
        <ellipse cx="90" cy="116" rx="42" ry="12" />
        <path d="M48 114 C52 108, 64 102, 78 104 C92 106, 104 102, 116 104 C128 106, 134 114, 126 122 C114 126, 66 126, 54 122 Z" />

        {/* Folded Hands in Chin Mudra */}
        <circle cx="58" cy="111" r="3.5" fill="#6D28D9" />
        <circle cx="122" cy="111" r="3.5" fill="#6D28D9" />
      </g>
    </svg>
  );
}

/**
 * 4. Yoga Stretching Woman Illustration (Right graphic of Physical Health card)
 */
export function YogaStretchingWomanIllustration({ className = "w-40 h-32" }) {
  return (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="warmLeaves" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FED7AA" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#FFF7ED" stopOpacity="0.1" />
        </linearGradient>
      </defs>

      {/* Gentle Warm Leaves / Autumn Botanical Background */}
      <path d="M25 140 C15 105, 20 75, 35 55 C38 78, 35 105, 40 140 Z" fill="url(#warmLeaves)" />
      <path d="M38 140 C32 112, 38 85, 50 68 C52 88, 46 115, 48 140 Z" fill="#FED7AA" opacity="0.5" />

      {/* Woman in Warrior / Triangle Yoga Stretch Pose */}
      {/* Head with Ponytail */}
      <circle cx="148" cy="38" r="8.5" fill="#EA580C" />
      {/* Ponytail flying back */}
      <path d="M144 38 Q136 39 132 46" stroke="#9A3412" strokeWidth="4" strokeLinecap="round" />

      {/* Raised Right Arm stretching upwards */}
      <path d="M148 45 L156 22" stroke="#EA580C" strokeWidth="5.5" strokeLinecap="round" />
      <circle cx="157" cy="20" r="2.8" fill="#EA580C" />

      {/* Torso stretching angled */}
      <path d="M144 46 L134 76 L118 72 L132 44 Z" fill="#F97316" />

      {/* Left Arm extended down towards front knee */}
      <path d="M134 52 L112 70 L94 88" stroke="#EA580C" strokeWidth="5.5" strokeLinecap="round" />

      {/* Legs in Wide Warrior Stance (Navy Leggings) */}
      {/* Left Forward Leg (bent knee lunge) */}
      <path d="M132 74 L108 92 L84 116 L88 126" stroke="#1E293B" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      <ellipse cx="88" cy="126" rx="5" ry="3" fill="#EA580C" />

      {/* Right Back Leg (straight extended back) */}
      <path d="M132 74 L152 96 L178 124" stroke="#1E293B" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      <ellipse cx="180" cy="125" rx="6" ry="3.5" fill="#EA580C" />
    </svg>
  );
}
