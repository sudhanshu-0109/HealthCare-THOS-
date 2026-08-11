const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const hospitals = await prisma.hospital.findMany({
    include: { hospitalAdmins: { include: { user: true } } }
  });
  console.log(JSON.stringify(hospitals.map(h => ({
    name: h.name,
    isActive: h.isActive,
    admins: h.hospitalAdmins.map(a => a.user.email)
  })), null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
