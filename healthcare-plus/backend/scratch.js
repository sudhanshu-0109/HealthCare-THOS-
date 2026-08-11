import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const reqs = await prisma.labRequest.findMany({
    include: { items: true, reports: true },
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log(JSON.stringify(reqs, null, 2));
}
main().finally(() => prisma.$disconnect());
