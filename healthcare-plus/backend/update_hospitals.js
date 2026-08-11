import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const hospitals = await prisma.hospital.findMany();
  for (const h of hospitals) {
    if (!h.isActive) {
      await prisma.hospital.update({
        where: { id: h.id },
        data: { isActive: true }
      });
      console.log(`Marked ${h.name} as active`);
    }
  }

  // Assign admin as defined? 
  // Maybe there are HospitalAdmin users that are NOT linked to the hospital, or the user wants me to CREATE admins?
  // Let's first fetch hospitals and their admins.
  const admins = await prisma.user.findMany({
    where: { role: 'HOSPITAL_ADMIN' },
    include: { hospitalAdmin: true }
  });
  console.log("Existing admins:", admins.map(a => ({ email: a.email, hospitalId: a.hospitalAdmin?.hospitalId })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
