import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();
async function main() {
  const profiles = await p.mentalHealthProfile.findMany({
    include: {
      user: { select: { id: true, email: true, fullName: true } },
      checkIns: true,
      activities: true,
      conversations: true,
      recommendations: true,
      programEnrollments: true,
      trustedContacts: true,
    },
  });
  console.log('Total MentalHealthProfiles in DB:', profiles.length);
  const c = await p.mentalHealthCheckIn.count();
  const a = await p.wellnessActivity.count();
  const r = await p.wellnessRecommendation.count();
  const conv = await p.aIConversation.count();
  console.log('DB Counts -> CheckIns:', c, 'Activities:', a, 'Recommendations:', r, 'Conversations:', conv);
}

main().catch(console.error).finally(() => p.$disconnect());
