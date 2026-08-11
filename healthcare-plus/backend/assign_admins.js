import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hospitals = await prisma.hospital.findMany({
    include: { hospitalAdmins: true }
  });

  const defaultPasswordHash = await bcrypt.hash('Password123!', 12);
  const superAdmin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });

  let count = 0;
  for (const h of hospitals) {
    if (h.hospitalAdmins.length === 0) {
      // Create an admin for this hospital
      const domain = h.contactEmail ? h.contactEmail.split('@')[1] : 'healthcareplus.dev';
      const adminEmail = `admin@${domain}`;
      const adminName = `${h.name} Admin`;

      // Check if user already exists
      let user = await prisma.user.findUnique({ where: { email: adminEmail } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            email: adminEmail,
            passwordHash: defaultPasswordHash,
            fullName: adminName,
            role: 'HOSPITAL_ADMIN',
            isEmailVerified: true,
            authProvider: 'LOCAL',
          }
        });
      }

      await prisma.hospitalAdmin.create({
        data: {
          userId: user.id,
          hospitalId: h.id
        }
      });
      console.log(`Created admin ${adminEmail} for ${h.name}`);
      count++;
    }
  }
  console.log(`Assigned admins to ${count} hospitals.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
