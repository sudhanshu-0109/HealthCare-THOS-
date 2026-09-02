/**
 * components/mentalWellness/CrisisScreen.jsx
 *
 * RED-path safety screen. This component is ONLY rendered when the backend
 * returns a response with type === 'safety_screen'.
 *
 * CRITICAL: This must never be rendered as a chat bubble.
 * It must always occupy the full conversation area with clear visual distinction.
 */

import { Phone, Heart, Users, Briefcase, X } from 'lucide-react';
import { recordCrisisAction } from '../../services/mentalHealth.service';

const HELPLINES = [
  { name: 'iCall', number: '9152987821', description: 'Free counseling helpline', color: 'from-purple-500 to-purple-600' },
  { name: 'Vandrevala Foundation', number: '1860-2662-345', description: '24/7 mental health helpline', color: 'from-blue-500 to-blue-600' },
  { name: 'AASRA', number: '9820466627', description: 'Crisis intervention helpline', color: 'from-teal-500 to-teal-600' },
  { name: 'Emergency Services', number: '112', description: 'National emergency number', color: 'from-red-500 to-red-600' },
];

export default function CrisisScreen({ message, onContactTrustedPerson, onFindProfessional, onDismiss }) {
  const handleCallHelpline = async (helpline) => {
    try {
      await recordCrisisAction('CALLED_HELPLINE', { helpline: helpline.name, number: helpline.number });
    } catch {}
    window.location.href = `tel:${helpline.number.replace(/-/g, '')}`;
  };

  const handleContactTrustedPerson = async () => {
    try {
      await recordCrisisAction('CONTACTED_TRUSTED_PERSON');
    } catch {}
    onContactTrustedPerson?.();
  };

  const handleFindProfessional = async () => {
    try {
      await recordCrisisAction('BOOKED_PROFESSIONAL');
    } catch {}
    onFindProfessional?.();
  };

  const handleViewedResources = async () => {
    try {
      await recordCrisisAction('VIEWED_RESOURCES');
    } catch {}
  };

  // Log that the crisis screen was shown
  const handleDismiss = async () => {
    try {
      await recordCrisisAction('DISMISSED', null, true);
    } catch {}
    onDismiss?.();
  };

  return (
    <div className="bg-gradient-to-b from-purple-900 to-slate-900 rounded-2xl p-6 text-white">
      {/* Header */}
      <div className="flex items-start gap-3 mb-5">
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
          <Heart className="w-5 h-5 text-pink-300 fill-pink-300" />
        </div>
        <div>
          <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">
            You're Not Alone
          </p>
          <p className="text-white text-sm leading-relaxed">
            {message || "I can hear that you're going through something really difficult right now. Please know that you're not alone — there are people who care about you and want to help."}
          </p>
        </div>
      </div>

      {/* Helplines */}
      <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-3">
        Immediate Support Lines
      </p>
      <div className="grid grid-cols-1 gap-2 mb-5" onClick={handleViewedResources}>
        {HELPLINES.map((h) => (
          <button
            key={h.name}
            onClick={() => handleCallHelpline(h)}
            className={`w-full flex items-center justify-between bg-gradient-to-r ${h.color} hover:opacity-90 transition-opacity rounded-xl px-4 py-3 text-left`}
          >
            <div>
              <p className="text-white font-semibold text-sm">{h.name}</p>
              <p className="text-white/70 text-xs">{h.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-sm">{h.number}</span>
              <Phone className="w-4 h-4 text-white/80" />
            </div>
          </button>
        ))}
      </div>

      {/* Additional options */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={handleContactTrustedPerson}
          className="flex flex-col items-center gap-2 bg-white/10 hover:bg-white/20 transition-colors rounded-xl p-3 text-center"
        >
          <Users className="w-5 h-5 text-purple-300" />
          <span className="text-white text-xs font-medium leading-tight">Contact Trusted Person</span>
        </button>
        <button
          onClick={handleFindProfessional}
          className="flex flex-col items-center gap-2 bg-white/10 hover:bg-white/20 transition-colors rounded-xl p-3 text-center"
        >
          <Briefcase className="w-5 h-5 text-blue-300" />
          <span className="text-white text-xs font-medium leading-tight">Find a Professional</span>
        </button>
      </div>

      {/* Dismiss */}
      <button
        onClick={handleDismiss}
        className="w-full flex items-center justify-center gap-2 text-white/50 hover:text-white/80 transition-colors text-xs py-2"
      >
        <X className="w-3 h-3" />
        I'm okay for now
      </button>
    </div>
  );
}
