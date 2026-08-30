/**
 * pages/patient/MentalWellness.jsx — Mental Wellness Coming Soon page.
 * Polished, themed Coming Soon experience. Route preserved for future full module.
 */

import { useNavigate } from 'react-router-dom';
import { Brain, ArrowLeft, Heart, Sparkles, Moon, Wind, Music, CheckCircle2 } from 'lucide-react';

const UPCOMING_FEATURES = [
  'AI Wellness Companion',
  'Guided Meditation Sessions',
  'Breathing Exercises',
  'Mood Tracking & Check-ins',
  'Sleep Improvement Programs',
  'Mindfulness Programs',
  'Daily Wellness Plan',
  'Gratitude Journaling',
];

export default function MentalWellness() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-slate-50 flex flex-col">

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-purple-100 sticky top-0 z-40">
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
            className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-purple-600 transition-colors"
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
            <img src="/mental-wellness.jpg" alt="Mental Wellness" className="w-full h-full object-cover object-center" />
            <div className="absolute inset-0 bg-gradient-to-t from-purple-900/60 to-transparent" />
            <div className="absolute bottom-4 left-4">
              <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center shadow">
                <Brain className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          {/* Coming soon badge */}
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-5">
            <Sparkles className="w-3.5 h-3.5" />
            Coming Soon
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-4">
            Mental <span className="text-purple-600">Wellness</span>
          </h1>
          <p className="text-slate-500 text-lg leading-relaxed mb-10 max-w-lg mx-auto">
            Your complete mental wellness companion is almost ready.
            Meditation, AI support, mood tracking, and mindfulness programs —
            all in one caring space.
          </p>

          {/* Feature preview grid */}
          <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-6 mb-8 text-left">
            <p className="text-sm font-bold text-slate-700 mb-4 text-center">What's coming</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {UPCOMING_FEATURES.map((feature) => (
                <div key={feature} className="flex items-center gap-2.5 text-sm text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-purple-500 flex-shrink-0" />
                  {feature}
                </div>
              ))}
            </div>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/health-hub')}
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-colors shadow-lg shadow-purple-200"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Health Hub
            </button>
            <button
              onClick={() => navigate('/patient/dashboard')}
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 border-2 border-slate-200 text-slate-700 rounded-xl font-bold hover:border-purple-200 hover:text-purple-600 transition-colors"
            >
              Go to Hospital Care
            </button>
          </div>

          <p className="text-xs text-slate-400 mt-6">
            Healthcare+ Mental Wellness module is under development and will be available soon.
          </p>
        </div>
      </main>
    </div>
  );
}
