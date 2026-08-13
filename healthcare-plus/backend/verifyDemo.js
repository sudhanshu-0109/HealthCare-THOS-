import dotenv from 'dotenv';
dotenv.config();
import { env } from './src/config/env.js';
import { PrismaClient } from '@prisma/client';
import { checkAndRollDemoAppointments } from './src/services/demo.service.js';
import { toMidnightUTC } from './src/services/slotGenerator.service.js';
import { recalculateQueueTokens } from './src/services/queue.service.js';

const prisma = new PrismaClient();

async function runTests() {
  console.log("Starting Rolling Appointment Verification...\n");
  const doctorUser = await prisma.user.findFirst({ where: { fullName: { contains: 'Anil Shah' } } });
  const doctor = await prisma.doctor.findFirst({ where: { userId: doctorUser.id } });
  
  const todayStr = new Date().toLocaleString('en-CA', { timeZone: 'Asia/Kolkata' }).split(',')[0];
  const todayDate = toMidnightUTC(todayStr);

  // Helper to reset test environment
  async function seedTestAppointments(targetDateStr) {
    const targetDate = toMidnightUTC(targetDateStr);
    
    // Clear all
    await prisma.queueToken.deleteMany({ where: { doctorId: doctor.id } });
    await prisma.appointment.deleteMany({ where: { doctorId: doctor.id } });
    
    // Seed 2 unresolved
    const p1 = await prisma.user.findFirst({ where: { role: 'PATIENT' }});
    
    const a1 = await prisma.appointment.create({
      data: {
        patientId: p1.id, doctorId: doctor.id, hospitalId: doctor.hospitalId, departmentId: doctor.departmentId,
        scheduledDate: targetDate, scheduledTime: '09:00', fee: 500, status: 'CONFIRMED', appointmentType: 'REGULAR'
      }
    });
    await prisma.queueToken.create({ data: { appointmentId: a1.id, doctorId: doctor.id, hospitalId: doctor.hospitalId, queueDate: targetDate, tokenNumber: 1, status: 'WAITING' }});
    
    const a2 = await prisma.appointment.create({
      data: {
        patientId: p1.id, doctorId: doctor.id, hospitalId: doctor.hospitalId, departmentId: doctor.departmentId,
        scheduledDate: targetDate, scheduledTime: '09:30', fee: 500, status: 'CONFIRMED', appointmentType: 'REGULAR'
      }
    });
    await prisma.queueToken.create({ data: { appointmentId: a2.id, doctorId: doctor.id, hospitalId: doctor.hospitalId, queueDate: targetDate, tokenNumber: 2, status: 'WAITING' }});
    
    // Seed 1 completed
    const a3 = await prisma.appointment.create({
      data: {
        patientId: p1.id, doctorId: doctor.id, hospitalId: doctor.hospitalId, departmentId: doctor.departmentId,
        scheduledDate: targetDate, scheduledTime: '10:00', fee: 500, status: 'COMPLETED', appointmentType: 'REGULAR'
      }
    });
    await prisma.queueToken.create({ data: { appointmentId: a3.id, doctorId: doctor.id, hospitalId: doctor.hospitalId, queueDate: targetDate, tokenNumber: 3, status: 'COMPLETED' }});
    
    // Seed 1 cancelled
    const a4 = await prisma.appointment.create({
      data: {
        patientId: p1.id, doctorId: doctor.id, hospitalId: doctor.hospitalId, departmentId: doctor.departmentId,
        scheduledDate: targetDate, scheduledTime: '10:30', fee: 500, status: 'CANCELLED', appointmentType: 'REGULAR'
      }
    });
    await prisma.queueToken.create({ data: { appointmentId: a4.id, doctorId: doctor.id, hospitalId: doctor.hospitalId, queueDate: targetDate, tokenNumber: 4, status: 'CANCELLED' }});
    
    return { a1, a2, a3, a4 };
  }

  // --- Scenario 2 & 3 & 4: Move to Day 2 and verify completed/cancelled ---
  console.log("Test: Roll past appointments to today");
  // Seed for yesterday
  const yesterday = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);
  const yesterdayStr = yesterday.toLocaleString('en-CA', { timeZone: 'Asia/Kolkata' }).split(',')[0];
  await seedTestAppointments(yesterdayStr);
  
  // Hack test env to trigger the roll
  env.DEMO_MODE = true;
  await checkAndRollDemoAppointments();
  
  // Check results
  const allAppts = await prisma.appointment.findMany({ where: { doctorId: doctor.id }});
  
  const rolled = allAppts.filter(a => a.scheduledDate.getTime() === todayDate.getTime());
  const stayed = allAppts.filter(a => a.scheduledDate.getTime() === toMidnightUTC(yesterdayStr).getTime());
  
  let passed = true;
  if (rolled.length !== 2) { passed = false; console.log(`FAIL: Expected 2 rolled appointments, got ${rolled.length}`); }
  if (stayed.length !== 2) { passed = false; console.log(`FAIL: Expected 2 stayed appointments, got ${stayed.length}`); }
  if (stayed.some(a => !['COMPLETED', 'CANCELLED'].includes(a.status))) { passed = false; console.log(`FAIL: Unresolved appointment stayed on yesterday`); }
  
  console.log(passed ? "✅ Passed: Rolled unresolved, left completed/cancelled\n" : "❌ Failed\n");

  // --- Scenario 9: Idempotency ---
  console.log("Test: Idempotency (multiple runs)");
  await checkAndRollDemoAppointments();
  await checkAndRollDemoAppointments();
  
  const allAppts2 = await prisma.appointment.findMany({ where: { doctorId: doctor.id }});
  if (allAppts2.length === 4) {
    console.log("✅ Passed: No duplicates created, exact same 4 records exist\n");
  } else {
    console.log(`❌ Failed: Expected 4 records, got ${allAppts2.length}\n`);
  }

  // --- Scenario 10: DEMO_MODE = false ---
  console.log("Test: DEMO_MODE = false");
  await seedTestAppointments(yesterdayStr);
  env.DEMO_MODE = false;
  // Clear local cache for test
  const { checkAndRollDemoAppointments: checkRoll2 } = await import('./src/services/demo.service.js?v=2');
  await checkRoll2();
  
  const allAppts3 = await prisma.appointment.findMany({ where: { doctorId: doctor.id }});
  const rolled3 = allAppts3.filter(a => a.scheduledDate.getTime() === todayDate.getTime());
  if (rolled3.length === 0) {
    console.log("✅ Passed: No rolling occurred when DEMO_MODE is false\n");
  } else {
    console.log("❌ Failed: Rolling occurred despite DEMO_MODE being false\n");
  }

}

runTests().catch(console.error).finally(() => prisma.$disconnect());
