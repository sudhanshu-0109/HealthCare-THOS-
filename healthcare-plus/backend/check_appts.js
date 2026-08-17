import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const appts = await prisma.appointment.findMany({
    where: {
      status: { not: 'CANCELLED' }
    },
    include: {
      doctor: {
        include: { user: true }
      }
    },
    orderBy: { scheduledDate: 'asc' }
  });

  console.log(`Found ${appts.length} active appointments.`);
  const stats = {};
  for (const a of appts) {
    const d = a.scheduledDate.toISOString().split('T')[0];
    const doc = a.doctor.user.fullName;
    const key = `${d} | ${doc}`;
    if (!stats[key]) stats[key] = { CONFIRMED: 0, COMPLETED: 0, PROCESSING: 0 };
    stats[key][a.status] = (stats[key][a.status] || 0) + 1;
  }
  console.table(stats);
}
check().finally(() => prisma.$disconnect());
