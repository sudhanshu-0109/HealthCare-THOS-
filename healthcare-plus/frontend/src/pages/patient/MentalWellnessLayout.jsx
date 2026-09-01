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
import MWAmbientBackground from '../../components/mentalWellness/MWAmbientBackground';
import MWNavigation from '../../components/mentalWellness/MWNavigation';
import '../../components/mentalWellness/mentalWellness.css';

export default function MentalWellnessLayout() {
  return (
    <div className="mw-root min-h-screen relative" style={{ backgroundColor: '#f5fbf9' }}>
      {/* Animated ambient background (desktop only) */}
      <MWAmbientBackground />

      {/* Relative z-10 keeps content above the fixed background SVG */}
      <div className="relative z-10">
        <MWNavigation />

        {/* Child route page — padded for bottom nav on mobile */}
        <main className="pb-24 md:pb-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
