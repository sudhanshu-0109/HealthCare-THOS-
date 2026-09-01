/**
 * data/wellnessMockData.js
 * Converted from Mentalwellness-frontend/src/data/mockData.ts
 * All TypeScript syntax removed; runtime behavior identical.
 */

export const MOODS = [
  { id: 'overwhelmed', label: 'Overwhelmed', emoji: '😫', score: 1 },
  { id: 'low',         label: 'Low',         emoji: '😔', score: 2 },
  { id: 'neutral',     label: 'Neutral',     emoji: '😐', score: 3 },
  { id: 'okay',        label: 'Okay',        emoji: '🙂', score: 4 },
  { id: 'good',        label: 'Good',        emoji: '😊', score: 5 },
  { id: 'thriving',    label: 'Thriving',    emoji: '✨', score: 6 },
];

export const QUICK_RESET = [
  { id: 'qr1', title: '4-7-8 Breathing',    duration: '4 min', category: 'Breathwork',  icon: 'air',              bg: 'bg-primary/8' },
  { id: 'qr2', title: '2-min Body Scan',    duration: '2 min', category: 'Mindfulness', icon: 'self_improvement', bg: 'bg-secondary-container' },
  { id: 'qr3', title: 'Grounding 5-4-3-2-1',duration: '3 min', category: 'Anxiety',     icon: 'spa',              bg: 'bg-tertiary-fixed' },
  { id: 'qr4', title: 'Mindful Pause',      duration: '1 min', category: 'Mindfulness', icon: 'timer',            bg: 'bg-primary-fixed' },
  { id: 'qr5', title: 'Shoulder Release',   duration: '3 min', category: 'Movement',    icon: 'fitness_center',   bg: 'bg-secondary-fixed' },
];

export const CATEGORIES = [
  { id: 'c1', label: 'Mindfulness', icon: 'spa',              count: 24, iconBg: 'bg-primary/10',          iconColor: 'text-primary' },
  { id: 'c2', label: 'Breathwork',  icon: 'air',              count: 20, iconBg: 'bg-tertiary-fixed',       iconColor: 'text-tertiary' },
  { id: 'c3', label: 'Sleep',       icon: 'bedtime',          count: 15, iconBg: 'bg-surface-variant',      iconColor: 'text-on-surface-variant' },
  { id: 'c4', label: 'Movement',    icon: 'directions_walk',  count: 18, iconBg: 'bg-secondary-container',  iconColor: 'text-secondary' },
  { id: 'c5', label: 'Journaling',  icon: 'edit_note',        count: 12, iconBg: 'bg-primary-fixed/60',     iconColor: 'text-on-primary-fixed' },
  { id: 'c6', label: 'Sound Bath',  icon: 'music_note',       count: 8,  iconBg: 'bg-tertiary-fixed',       iconColor: 'text-on-tertiary-fixed-variant' },
  { id: 'c7', label: 'Meditation',  icon: 'self_improvement', count: 31, iconBg: 'bg-primary/10',           iconColor: 'text-primary' },
  { id: 'c8', label: 'Body Scan',   icon: 'accessibility_new',count: 10, iconBg: 'bg-secondary-fixed',      iconColor: 'text-on-secondary-fixed-variant' },
];

export const PROGRAMS = [
  {
    id: 'p1',
    title: 'Stress Resilience',
    subtitle: '4-week program',
    description: 'Build lasting resilience to workplace stress through evidence-based CBT techniques.',
    weeks: 4,
    currentWeek: 3,
    progress: 68,
    sessions: { completed: 19, total: 28 },
    nextSession: 'Managing Workplace Anxiety',
    accent: 'bg-primary/8',
    tag: 'In Progress',
    tagColor: 'bg-primary/10 text-primary',
  },
  {
    id: 'p2',
    title: 'Sleep Reset',
    subtitle: '2-week program',
    description: 'Restore healthy sleep patterns with guided sleep hygiene practices and wind-down rituals.',
    weeks: 2,
    currentWeek: 1,
    progress: 30,
    sessions: { completed: 4, total: 14 },
    nextSession: 'Evening Tension Release',
    accent: 'bg-secondary-container/40',
    tag: 'Active',
    tagColor: 'bg-secondary-container text-on-secondary-container',
  },
  {
    id: 'p3',
    title: 'Anxiety Relief',
    subtitle: '6-week program',
    description: 'Science-backed micro-practices to reduce anxiety and build a calmer daily baseline.',
    weeks: 6,
    currentWeek: 0,
    progress: 0,
    sessions: { completed: 0, total: 42 },
    nextSession: 'Introduction & Assessment',
    accent: 'bg-tertiary-fixed/50',
    tag: 'Start Soon',
    tagColor: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
  },
];

export const RECOMMENDATIONS = {
  overwhelmed: {
    title: 'Grounding 5-4-3-2-1',
    description: 'Anchor yourself in the present moment through your senses when everything feels too much.',
    duration: '3 min',
    category: 'Anxiety',
    intensity: 'Gentle',
    icon: 'spa',
  },
  low: {
    title: 'Gentle Body Movement',
    description: 'Light movement to shift your energy and mood without pressure or exertion.',
    duration: '8 min',
    category: 'Movement',
    intensity: 'Gentle',
    icon: 'directions_walk',
  },
  neutral: {
    title: 'Mindful Check-In',
    description: 'A brief guided reflection to tune into how you actually feel and what you need.',
    duration: '5 min',
    category: 'Mindfulness',
    intensity: 'Light',
    icon: 'self_improvement',
  },
  okay: {
    title: 'Focus Breathwork',
    description: 'Box breathing to sharpen your attention and sustain productive flow.',
    duration: '4 min',
    category: 'Breathwork',
    intensity: 'Light',
    icon: 'air',
  },
  good: {
    title: 'Morning Meditation',
    description: 'Deepen your positive state and set an intentional, grounded tone for the day.',
    duration: '10 min',
    category: 'Meditation',
    intensity: 'Moderate',
    icon: 'self_improvement',
  },
  thriving: {
    title: 'Gratitude Journaling',
    description: "Capture and amplify what is working — build on today's momentum.",
    duration: '7 min',
    category: 'Journaling',
    intensity: 'Reflective',
    icon: 'edit_note',
  },
};

export const CHAT_MESSAGES = [
  {
    id: 'm1',
    role: 'ai',
    text: "Hello 🌿 I've noticed your mood has been shifting through the week. How are you feeling in this exact moment — not the story about it, just the feeling itself?",
    time: '10:01 AM',
  },
  {
    id: 'm2',
    role: 'user',
    text: "Honestly, anxious. I have a big presentation tomorrow and my mind just won't stop running through everything that could go wrong.",
    time: '10:04 AM',
  },
  {
    id: 'm3',
    role: 'ai',
    text: "That makes complete sense. What you're describing — the mind rehearsing risk — is actually your brain trying to protect you. It doesn't feel helpful right now, but it means you care deeply about doing well.\n\nBefore we talk strategy, I'd like to offer you something immediate: a 4-minute box-breathing exercise that's been shown to reduce cortisol within a single session. Would that help right now?",
    time: '10:05 AM',
    action: { label: 'Start Box Breathing →', icon: 'air' },
  },
  {
    id: 'm4',
    role: 'user',
    text: 'Yes please, something quick.',
    time: '10:06 AM',
  },
  {
    id: 'm5',
    role: 'ai',
    text: "Perfect. Let's do this together.\n\nInhale for 4 counts → Hold for 4 → Exhale for 4 → Hold for 4. Repeat this 4 times. That's it. I'll be here when you're ready to continue.",
    time: '10:06 AM',
  },
];

export const SUGGESTION_CHIPS = [
  "I'm feeling anxious",
  'Help me sleep tonight',
  'I need a quick reset',
  'How was my week?',
  'Talk about stress',
];

export const QUICK_TOOLS = [
  { id: 't1', label: 'Box Breathing',   icon: 'air' },
  { id: 't2', label: 'Quick Journal',   icon: 'edit_note' },
  { id: 't3', label: 'Meditation',      icon: 'self_improvement' },
  { id: 't4', label: 'Sleep Wind-down', icon: 'bedtime' },
  { id: 't5', label: 'Body Stretch',    icon: 'fitness_center' },
  { id: 't6', label: 'Crisis Line',     icon: 'support_agent' },
];

export const MOOD_HISTORY = [
  { day: 'Today',     emoji: '😊', label: 'Good',    score: 5,   date: 'Sep 1'  },
  { day: 'Yesterday', emoji: '😄', label: 'Great',   score: 5.5, date: 'Aug 31' },
  { day: 'Saturday',  emoji: '😐', label: 'Neutral', score: 3,   date: 'Aug 30' },
  { day: 'Friday',    emoji: '🙂', label: 'Okay',    score: 4,   date: 'Aug 29' },
  { day: 'Thursday',  emoji: '😊', label: 'Good',    score: 5,   date: 'Aug 28' },
  { day: 'Wednesday', emoji: '😔', label: 'Low',     score: 2,   date: 'Aug 27' },
  { day: 'Tuesday',   emoji: '😊', label: 'Good',    score: 5,   date: 'Aug 26' },
];

export const TREND_DATA = {
  labels: [
    'Aug 18','Aug 19','Aug 20','Aug 21','Aug 22','Aug 23','Aug 24',
    'Aug 25','Aug 26','Aug 27','Aug 28','Aug 29','Aug 30','Sep 1',
  ],
  mood:   [3, 2, 3.5, 4, 3.5, 4, 4.5, 5, 5, 2, 5, 4, 5.5, 5],
  energy: [5, 4, 5,   6, 5,   6, 7,   6, 6, 4, 7, 6, 7,   6],
  stress: [8, 9, 7,   6, 8,   5, 5,   6, 5, 9, 5, 6, 5,   7],
};

export const ACTIVITY_FILTERS = ['All', 'Breathwork', 'Meditation', 'Movement', 'Journaling', 'Sleep'];

export const ACTIVITY_HISTORY = [
  { id: 'a1', title: '4-7-8 Breathing',   time: 'Today · 10:23 AM',     duration: '5 min',  category: 'Breathwork', icon: 'air' },
  { id: 'a2', title: 'Morning Meditation', time: 'Today · 8:15 AM',      duration: '12 min', category: 'Meditation', icon: 'self_improvement' },
  { id: 'a3', title: 'Sleep Meditation',   time: 'Yesterday · 9:30 PM',  duration: '20 min', category: 'Sleep',      icon: 'bedtime' },
  { id: 'a4', title: 'Quick Journal',      time: 'Yesterday · 6:00 PM',  duration: '8 min',  category: 'Journaling', icon: 'edit_note' },
  { id: 'a5', title: 'Mindful Yoga Flow',  time: 'Yesterday · 9:15 AM',  duration: '25 min', category: 'Movement',   icon: 'directions_walk' },
  { id: 'a6', title: 'Box Breathing',      time: 'Aug 30 · 8:30 AM',     duration: '4 min',  category: 'Breathwork', icon: 'air' },
  { id: 'a7', title: 'Morning Meditation', time: 'Aug 30 · 7:45 AM',     duration: '10 min', category: 'Meditation', icon: 'self_improvement' },
  { id: 'a8', title: 'Body Scan',          time: 'Aug 29 · 9:00 PM',     duration: '15 min', category: 'Sleep',      icon: 'accessibility_new' },
];

export const CATEGORY_ICONS = {
  Breathwork:  'air',
  Meditation:  'self_improvement',
  Movement:    'directions_walk',
  Journaling:  'edit_note',
  Sleep:       'bedtime',
  Mindfulness: 'spa',
};

/** Hardcoded AI responses for mock companion mode */
export const AI_RESPONSES = [
  "That sounds really challenging. You don't have to carry all of this alone. Would you like to try a brief grounding exercise, or would you rather talk through what's coming up for you?",
  "I hear you. What you're feeling makes complete sense given what you're navigating. Let's slow down for a moment — can you take one deep breath with me right now?",
  "Thank you for sharing that. I notice this has been weighing on you for a while. Small, consistent steps tend to work better than big leaps when we're feeling this way. What feels most manageable right now?",
  "Your awareness of what you're feeling is already a step toward working through it. Would a quick journaling prompt help you process this, or would you prefer a breathing technique?",
];
