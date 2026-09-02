/**
 * seedWellnessContent.js — Seeds the governed Mental Wellness content library.
 *
 * Run: node prisma/seedWellnessContent.js
 *
 * This is idempotent — it clears existing wellness content before re-seeding.
 * Safe to re-run after content updates.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Mental Wellness content library...');

  // Clear existing wellness content (idempotent)
  await prisma.wellnessRecommendation.deleteMany().catch(() => {});
  await prisma.wellnessActivity.deleteMany().catch(() => {});
  await prisma.wellnessProgramEnrollment.deleteMany().catch(() => {});
  await prisma.wellnessContent.deleteMany().catch(() => {});
  await prisma.wellnessProgram.deleteMany().catch(() => {});

  const wellnessContent = [
    // Breathing Exercises
    { type: 'BREATHING', title: '5-Minute Box Breathing', description: 'A calming technique used by Navy SEALs to reduce stress and sharpen focus. Inhale, hold, exhale, hold — each for 4 counts.', duration: 5, tags: ['STRESS', 'ANXIETY', 'FOCUS', 'EXAM_STRESS'], sortOrder: 1 },
    { type: 'BREATHING', title: '4-7-8 Breathing for Sleep', description: "Dr. Andrew Weil's technique to help you fall asleep faster. Inhale for 4, hold for 7, exhale for 8 counts.", duration: 3, tags: ['SLEEP', 'ANXIETY', 'CALM'], sortOrder: 2 },
    { type: 'BREATHING', title: '2-Minute Calming Breath', description: 'A quick reset for overwhelming moments. Simple deep breathing to bring your nervous system back to balance.', duration: 2, tags: ['STRESS', 'ANXIETY', 'OVERWHELM', 'CALM'], sortOrder: 3 },
    { type: 'BREATHING', title: 'Energizing Morning Breath', description: 'Start your day with intention. A gentle breathing sequence to wake up your body and mind.', duration: 4, tags: ['MOTIVATION', 'ENERGY', 'MORNING'], sortOrder: 4 },
    { type: 'BREATHING', title: 'Belly Breathing for Anxiety', description: 'Diaphragmatic breathing activates the parasympathetic nervous system, reducing anxiety naturally.', duration: 5, tags: ['ANXIETY', 'CALM', 'STRESS'], sortOrder: 5 },

    // Meditation
    { type: 'MEDITATION', title: '10-Minute Focus Meditation', description: 'A guided mindfulness meditation to clear mental fog and improve concentration. Perfect before studying or deep work.', duration: 10, tags: ['FOCUS', 'CLARITY', 'EXAM_STRESS', 'PRODUCTIVITY'], sortOrder: 10 },
    { type: 'MEDITATION', title: '8-Minute Stress Relief Meditation', description: "Release tension stored in the body. A body-scan meditation to let go of the day's stress.", duration: 8, tags: ['STRESS', 'ANXIETY', 'CALM', 'RELIEF'], sortOrder: 11 },
    { type: 'MEDITATION', title: '12-Minute Sleep Preparation Meditation', description: 'Ease your mind into a restful state. A gentle guided meditation to prepare body and mind for deep sleep.', duration: 12, tags: ['SLEEP', 'CALM', 'NIGHT', 'REST'], sortOrder: 12 },
    { type: 'MEDITATION', title: '5-Minute Loving-Kindness Meditation', description: 'Cultivate compassion for yourself and others. A short but powerful practice for loneliness and disconnection.', duration: 5, tags: ['SOCIAL', 'LONELINESS', 'COMPASSION', 'MOOD'], sortOrder: 13 },
    { type: 'MEDITATION', title: '15-Minute Deep Relaxation', description: 'A longer session for total mental and physical restoration. Best for evenings or rest days.', duration: 15, tags: ['RELAXATION', 'STRESS', 'CALM', 'REST'], sortOrder: 14 },
    { type: 'MEDITATION', title: '7-Minute Morning Intention', description: 'Set a positive intention for your day. A brief centering practice to start each morning with clarity.', duration: 7, tags: ['MORNING', 'MOTIVATION', 'CLARITY', 'INTENTION'], sortOrder: 15 },
    { type: 'MEDITATION', title: 'Breath Awareness for Beginners', description: "Your first step into meditation. Simple, gentle, and perfect if you've never meditated before.", duration: 5, tags: ['BEGINNER', 'CALM', 'ANXIETY', 'STRESS'], sortOrder: 16 },
    { type: 'MEDITATION', title: '10-Minute Anxiety Relief Meditation', description: 'A specific practice for anxious thoughts. Learn to observe them without being overwhelmed.', duration: 10, tags: ['ANXIETY', 'STRESS', 'OVERTHINKING', 'CALM'], sortOrder: 17 },

    // Mindfulness
    { type: 'MINDFULNESS', title: '5-Minute Mindful Check-In', description: 'A brief pause to notice where you are, how you feel, and what you need right now.', duration: 5, tags: ['AWARENESS', 'CALM', 'STRESS', 'MOOD'], sortOrder: 20 },
    { type: 'MINDFULNESS', title: 'Mindful Walking Exercise', description: 'Transform a simple walk into a meditative practice. Notice your surroundings with fresh eyes.', duration: 10, tags: ['ENERGY', 'MOOD', 'FOCUS', 'NATURE'], sortOrder: 21 },
    { type: 'MINDFULNESS', title: '5-4-3-2-1 Grounding Technique', description: 'An evidence-based grounding exercise for anxiety and panic. Brings you back to the present moment quickly.', duration: 3, tags: ['ANXIETY', 'GROUNDING', 'PANIC', 'CALM', 'OVERWHELM'], sortOrder: 22 },
    { type: 'MINDFULNESS', title: 'Mindful Eating Practice', description: 'Transform any meal into a mindful experience. Slow down, savour, and appreciate.', duration: 10, tags: ['AWARENESS', 'CALM', 'GRATITUDE'], sortOrder: 23 },

    // Sleep Sounds
    { type: 'SLEEP_SOUND', title: 'Gentle Rain Sounds', description: 'Soft rainfall to mask noise and create a peaceful sleep environment.', duration: 480, tags: ['SLEEP', 'CALM', 'RELAXATION'], sortOrder: 30 },
    { type: 'SLEEP_SOUND', title: 'Ocean Waves', description: 'Rhythmic waves for deep relaxation and restful sleep.', duration: 480, tags: ['SLEEP', 'RELAXATION', 'CALM'], sortOrder: 31 },
    { type: 'SLEEP_SOUND', title: 'Forest Night Ambience', description: 'Crickets, gentle wind, and forest sounds for grounding and rest.', duration: 480, tags: ['SLEEP', 'CALM', 'GROUNDING', 'NATURE'], sortOrder: 32 },
    { type: 'SLEEP_SOUND', title: 'White Noise for Deep Sleep', description: 'Consistent white noise to block distractions and enhance sleep depth.', duration: 480, tags: ['SLEEP', 'FOCUS', 'CONCENTRATION'], sortOrder: 33 },

    // Sleep Stories
    { type: 'SLEEP_STORY', title: 'A Walk Through the Lavender Fields', description: 'A gentle, sleep-inducing story set in the French countryside. Narrated in a slow, calming voice.', duration: 20, tags: ['SLEEP', 'RELAXATION', 'CALM', 'NIGHT'], sortOrder: 35 },
    { type: 'SLEEP_STORY', title: 'The Peaceful Mountain Retreat', description: 'Journey to a quiet mountain cabin. Let your mind slow down and drift into sleep.', duration: 15, tags: ['SLEEP', 'CALM', 'REST', 'RELAXATION'], sortOrder: 36 },
    { type: 'SLEEP_STORY', title: 'Stargazing by the Lake', description: 'A serene story for restless nights. Watch the stars reflect on still water as your eyes grow heavy.', duration: 18, tags: ['SLEEP', 'CALM', 'NIGHT', 'REST'], sortOrder: 37 },

    // Relaxation Music
    { type: 'RELAXATION_MUSIC', title: 'Calm Piano for Stress Relief', description: 'Soft, instrumental piano to soothe an overactive mind.', duration: 30, tags: ['STRESS', 'CALM', 'RELAXATION', 'ANXIETY'], sortOrder: 40 },
    { type: 'RELAXATION_MUSIC', title: 'Binaural Beats for Focus', description: 'Alpha wave binaural beats to improve concentration and reduce mental chatter.', duration: 30, tags: ['FOCUS', 'CONCENTRATION', 'STUDY', 'PRODUCTIVITY'], sortOrder: 41 },
    { type: 'RELAXATION_MUSIC', title: 'Evening Wind-Down Music', description: "Gentle, ambient music to signal to your body that it's time to rest.", duration: 30, tags: ['SLEEP', 'RELAXATION', 'EVENING', 'CALM'], sortOrder: 42 },

    // Gratitude
    { type: 'GRATITUDE', title: 'Three Good Things Practice', description: 'Research-backed: write down three good things that happened today, however small. This rewires your brain for positivity.', duration: 5, tags: ['GRATITUDE', 'MOOD', 'POSITIVITY', 'REFLECTION'], sortOrder: 50 },
    { type: 'GRATITUDE', title: 'Morning Gratitude Intention', description: "Start your morning by acknowledging one thing you're grateful for. Set a positive tone for the day.", duration: 3, tags: ['GRATITUDE', 'MORNING', 'MOOD', 'INTENTION'], sortOrder: 51 },
    { type: 'GRATITUDE', title: 'Self-Compassion Letter', description: 'Write a short letter to yourself as you would to a dear friend. A powerful practice for self-criticism and low mood.', duration: 10, tags: ['SELF_COMPASSION', 'MOOD', 'LONELINESS', 'REFLECTION'], sortOrder: 52 },

    // Grounding
    { type: 'GROUNDING', title: 'Body Scan Grounding', description: 'A systematic scan from head to toe to reconnect with your body and anchor yourself in the present.', duration: 8, tags: ['ANXIETY', 'STRESS', 'GROUNDING', 'CALM', 'OVERWHELM'], sortOrder: 60 },
    { type: 'GROUNDING', title: 'Tapping (EFT) for Anxiety', description: 'Emotional Freedom Technique — tap specific acupressure points while focusing on anxiety to reduce its intensity.', duration: 7, tags: ['ANXIETY', 'STRESS', 'GROUNDING', 'CALM'], sortOrder: 61 },

    // Focus
    { type: 'FOCUS', title: 'Pomodoro Mindfulness Sprint', description: 'A guided 25-minute focus session with a mindful break. Pairs structure with awareness for peak productivity.', duration: 25, tags: ['FOCUS', 'PRODUCTIVITY', 'STUDY', 'EXAM_STRESS'], sortOrder: 70 },
    { type: 'FOCUS', title: 'Single-Tasking Practice', description: 'A guided exercise to train the mind to do one thing at a time. Antidote to digital overwhelm.', duration: 10, tags: ['FOCUS', 'CLARITY', 'OVERWHELM', 'PRODUCTIVITY'], sortOrder: 71 },
  ];

  for (const item of wellnessContent) {
    await prisma.wellnessContent.create({ data: item });
  }
  console.log(`Created ${wellnessContent.length} wellness content items`);

  const programs = [
    { title: '7-Day Stress Reset', description: 'A one-week journey to reduce stress and build resilience. Combines breathing, meditation, and reflection each day.', durationDays: 7, tags: ['STRESS', 'ANXIETY', 'CALM', 'RESILIENCE'] },
    { title: '7-Day Sleep Improvement', description: 'Science-backed sleep hygiene practices over seven days. Better sleep means better everything.', durationDays: 7, tags: ['SLEEP', 'REST', 'CALM', 'ENERGY'] },
    { title: '5-Day Focus & Clarity', description: 'Build deep focus and mental clarity in five days. For students, professionals, and anyone battling distraction.', durationDays: 5, tags: ['FOCUS', 'PRODUCTIVITY', 'CLARITY', 'STUDY'] },
    { title: '14-Day Mindfulness Foundation', description: 'A two-week introduction to mindfulness. No experience needed — just a few minutes each day.', durationDays: 14, tags: ['MINDFULNESS', 'BEGINNER', 'CALM', 'AWARENESS'] },
  ];

  for (const program of programs) {
    await prisma.wellnessProgram.create({ data: program });
  }
  console.log(`Created ${programs.length} wellness programs`);
  console.log('Mental Wellness content seeded successfully.');
}

main()
  .catch((e) => {
    console.error('Wellness seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
