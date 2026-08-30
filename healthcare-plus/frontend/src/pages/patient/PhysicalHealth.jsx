/**
 * pages/patient/PhysicalHealth.jsx — Physical Health Coming Soon page.
 * Polished, themed Coming Soon experience. Route preserved for future full module.
 */

import { useNavigate } from 'react-router-dom';
import { Dumbbell, ArrowLeft, Heart, Flame, Droplets, TrendingUp, CheckCircle2, Zap } from 'lucide-react';

const UPCOMING_FEATURES = [
  'Personalized Workout Plans',
  'Exercise Video Guidance',
  'Daily Fitness Goals',
  'Hydration Tracking',
  'Weight & BMI Tracking',
  'Progress Analytics',
  'AI Fitness Recommendations',
  'Calorie Counter',
];

export default function PhysicalHealth() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-slate-50 flex flex-col">

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-orange-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-teal-600 rounded-xl flex items-center justify-center">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="text-lg font-bold text-slate-900">
              HealthCare<span className="text-teal-600">+</span>
            </span>
          </div>
          <button
            onClick={() => navigate('/health-hub')}
            className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-orange-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Health Hub
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl w-full text-center">

        {/* Illustration — actual provided image */}
          <div className="relative w-full max-w-md mx-auto mb-6 rounded-2xl overflow-hidden h-48 shadow-lg">
            <img src="/physical-health.jpg" alt="Physical Health" className="w-full h-full object-cover object-center" />
            <div className="absolute inset-0 bg-gradient-to-t from-orange-900/50 to-transparent" />
            <div className="absolute bottom-4 left-4">
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow">
                <Dumbbell className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          {/* Coming soon badge */}
          <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-5">
            <Zap className="w-3.5 h-3.5" />
            Coming Soon
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-4">
            Physical <span className="text-orange-500">Health</span>
          </h1>
          <p className="text-slate-500 text-lg leading-relaxed mb-10 max-w-lg mx-auto">
            Your personalized fitness companion is on its way.
            Custom workout plans, AI recommendations, progress tracking,
            and hydration management — built for a stronger you.
          </p>

          {/* Feature preview grid */}
          <div className="bg-white rounded-2xl border border-orange-100 shadow-sm p-6 mb-8 text-left">
            <p className="text-sm font-bold text-slate-700 mb-4 text-center">What's coming</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {UPCOMING_FEATURES.map((feature) => (
                <div key={feature} className="flex items-center gap-2.5 text-sm text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-orange-500 flex-shrink-0" />
                  {feature}
                </div>
              ))}
            </div>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/health-hub')}
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition-colors shadow-lg shadow-orange-200"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Health Hub
            </button>
            <button
              onClick={() => navigate('/patient/dashboard')}
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 border-2 border-slate-200 text-slate-700 rounded-xl font-bold hover:border-orange-200 hover:text-orange-500 transition-colors"
            >
              Go to Hospital Care
            </button>
          </div>

          <p className="text-xs text-slate-400 mt-6">
            Healthcare+ Physical Health module is under development and will be available soon.
          </p>
        </div>
      </main>
    </div>
  );
}
