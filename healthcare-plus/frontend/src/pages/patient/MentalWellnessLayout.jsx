/**
 * pages/patient/MentalWellnessLayout.jsx
 *
 * Shared layout shell for all Mental Wellness sub-routes:
 *   /health-hub/mental-wellness          → WellnessHome
 *   /health-hub/mental-wellness/companion → WellnessCompanion
 *   /health-hub/mental-wellness/journey   → WellnessJourney
 *
 * Renders the ambient animated background + MW navigation bar,
 * then <Outlet /> for the active child route.
 *
 * The .mw-root class scopes all Mental Wellness CSS tokens and
 * utility classes defined in mentalWellness.css.
 */

import { Outlet } from 'react-router-dom';
import WaveformBackground from '../../components/common/WaveformBackground';
import MWNavigation from '../../components/mentalWellness/MWNavigation';
import '../../components/mentalWellness/mentalWellness.css';

export default function MentalWellnessLayout() {
  return (
    <div className="mw-root min-h-screen relative bg-transparent">
      {/* Biometric waveform animation spanning full page */}
      <WaveformBackground />

      {/* Relative z-10 keeps content above the fixed background canvas */}
      <div className="relative z-10 bg-transparent">
        <MWNavigation />

        {/* Child route page — padded for bottom nav on mobile */}
        <main className="pb-24 md:pb-0 bg-transparent">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
