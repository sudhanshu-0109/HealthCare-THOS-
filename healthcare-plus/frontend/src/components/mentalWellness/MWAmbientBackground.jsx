/**
 * components/mentalWellness/MWAmbientBackground.jsx
 *
 * Fixed animated SVG background — floating blurred orbs + flowing line paths.
 * Desktop-only (hidden on mobile to avoid performance issues).
 * Converted from Mentalwellness-frontend/src/components/AmbientBackground.tsx.
 *
 * Renamed MWAmbientBackground to avoid conflicts with any future global component.
 */

export default function MWAmbientBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden hidden md:block">
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <filter id="mw-blur-orb" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="60" />
          </filter>
        </defs>

        {/* Cream orb — top right */}
        <circle
          cx="1150"
          cy="120"
          r="300"
          fill="#f7dcb4"
          opacity="0.18"
          filter="url(#mw-blur-orb)"
          className="mw-animate-float"
          style={{ mixBlendMode: 'multiply' }}
        />

        {/* Peach orb — bottom left */}
        <circle
          cx="200"
          cy="760"
          r="260"
          fill="#ffdbca"
          opacity="0.14"
          filter="url(#mw-blur-orb)"
          className="mw-animate-float-alt"
          style={{ mixBlendMode: 'multiply' }}
        />

        {/* Teal flowing line */}
        <path
          d="M -80 420 C 120 180, 340 680, 560 380 S 820 80, 1040 440 S 1280 720, 1560 320"
          fill="none"
          stroke="#006a67"
          strokeWidth="1.5"
          opacity="0.12"
          strokeDasharray="3000"
          strokeDashoffset="3000"
          strokeLinecap="round"
          className="mw-animate-flow"
        />

        {/* Second softer line */}
        <path
          d="M -80 600 C 180 340, 400 820, 620 520 S 900 200, 1160 560 S 1380 800, 1600 440"
          fill="none"
          stroke="#03a6a1"
          strokeWidth="0.8"
          opacity="0.07"
          strokeDasharray="3000"
          strokeDashoffset="3000"
          strokeLinecap="round"
          style={{ animationDelay: '8s' }}
          className="mw-animate-flow"
        />
      </svg>
    </div>
  );
}
