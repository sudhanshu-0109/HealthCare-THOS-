import { PrismaClient } from '@prisma/client';
import { getSlotsWithStatus, toMidnightUTC } from './src/services/slotGenerator.service.js';

const prisma = new PrismaClient();

async function main() {
  const doctorUser = await prisma.user.findFirst({ where: { fullName: { contains: 'Anil Shah' } } });
  const doctor = await prisma.doctor.findFirst({ where: { userId: doctorUser.id } });

  // Find all waiting appointments for Dr. Anil Shah
  const tokens = await prisma.queueToken.findMany({
    where: { doctorId: doctor.id, status: 'WAITING' },
    include: { appointment: true }
  });

  if (tokens.length === 0) {
    console.log("No waiting tokens found for Dr. Anil Shah.");
    return;
  }

  // Use the date from the first token as the target date
  const targetDate = tokens[0].queueDate.toISOString().split('T')[0];
  console.log("Target Date for seeding:", targetDate);

  // 1. Delete all existing waiting tokens and their appointments
  console.log(`Deleting ${tokens.length} existing tokens/appointments...`);
  for (const t of tokens) {
    await prisma.queueToken.delete({ where: { id: t.id } });
    await prisma.appointment.delete({ where: { id: t.appointmentId } });
  }

  // 2. Fetch available slots for that date
  const allSlots = await getSlotsWithStatus(doctor.id, targetDate);
  const availableSlots = allSlots.filter(s => !s.booked);
  
  if (availableSlots.length === 0) {
    console.log("No available slots found for Dr. Anil Shah on this date.");
    return;
  }

  // 3. Leave 3 slots empty
  const slotsToBook = availableSlots.slice(0, Math.max(1, availableSlots.length - 3));
  console.log(`Found ${availableSlots.length} available slots. Booking ${slotsToBook.length}...`);

  // 4. Create new patients if needed
  let patients = await prisma.user.findMany({ where: { role: 'PATIENT' }, take: slotsToBook.length });
  const needed = slotsToBook.length - patients.length;
  if (needed > 0) {
    for (let i = 0; i < needed; i++) {
      const u = await prisma.user.create({
        data: {
          email: 'seedpat2_' + Math.random() + '@test.com',
          fullName: 'Seed Patient ' + (patients.length + i),
          passwordHash: 'xx',
          role: 'PATIENT'
        }
      });
      await prisma.patientProfile.create({ data: { userId: u.id, dateOfBirth: new Date('1990-01-01'), gender: 'MALE', bloodGroup: 'O+' } });
      patients.push(u);
    }
  }

  // 5. Book them in the specific slots
  for (let i = 0; i < slotsToBook.length; i++) {
    const slot = slotsToBook[i];
    const appt = await prisma.appointment.create({
      data: {
        patientId: patients[i].id,
        doctorId: doctor.id,
        hospitalId: doctor.hospitalId,
        departmentId: doctor.departmentId,
        scheduledDate: toMidnightUTC(targetDate),
        scheduledTime: slot.time,
        fee: 500,
        status: 'CONFIRMED',
        appointmentType: 'REGULAR',
      }
    });

    await prisma.queueToken.create({
      data: {
        appointmentId: appt.id,
        doctorId: doctor.id,
        hospitalId: doctor.hospitalId,
        queueDate: toMidnightUTC(targetDate),
        tokenNumber: i + 1,
        status: 'WAITING',
      }
    });
  }

  console.log(`Successfully synced! Booked ${slotsToBook.length} slots. 3 slots left empty.`);
}
main().catch(console.error).finally(() => prisma.$disconnect());
