const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const patientAppts = await prisma.appointment.count();
  const queueTokens = await prisma.queueToken.count();
  const consultations = await prisma.consultation.count();
  const prescriptions = await prisma.prescription.count();
  const labRequests = await prisma.labRequest.count();
  const labReports = await prisma.labReport.count();

  // Check specific patient (e.g. Rahul)
  const patient = await prisma.patient.findFirst({
    where: { user: { email: 'patient@healthcareplus.dev' } },
    include: {
      appointments: { include: { queueToken: true } },
      consultations: true,
      prescriptions: true,
      labRequests: { include: { reports: true } }
    }
  });

  // Check a specific doctor's queue (e.g. Dr. Anil Shah)
  const doctor = await prisma.doctor.findFirst({
    where: { user: { email: 'dr.anil.shah@sterling.dev' } }
  });

  let todayQueue = [];
  if (doctor) {
    // We expect today's date formatted as YYYY-MM-DD
    const today = new Date().toLocaleString('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).split(',')[0];
    todayQueue = await prisma.queueToken.findMany({
      where: { doctorId: doctor.id, queueDate: today },
      orderBy: { tokenNumber: 'asc' },
      include: { appointment: { include: { patient: { include: { user: true } } } } }
    });
  }

  console.log('--- GLOBAL DATABASE COUNTS ---');
  console.log(`Appointments: ${patientAppts}`);
  console.log(`Queue Tokens: ${queueTokens}`);
  console.log(`Consultations: ${consultations}`);
  console.log(`Prescriptions: ${prescriptions}`);
  console.log(`Lab Requests: ${labRequests}`);
  console.log(`Lab Reports: ${labReports}`);
  console.log('\n--- PRIMARY PATIENT (Rahul) DATA ---');
  if (patient) {
    console.log(`Appointments: ${patient.appointments.length}`);
    console.log(`Consultations (Passport Data): ${patient.consultations.length}`);
    console.log(`Prescriptions (Passport Data): ${patient.prescriptions.length}`);
    console.log(`Lab Requests (Passport Data): ${patient.labRequests.length}`);
  } else {
    console.log('Primary patient not found.');
  }

  console.log('\n--- DOCTOR QUEUE (Dr. Anil Shah) ---');
  if (doctor) {
    console.log(`Tokens for today: ${todayQueue.length}`);
    if (todayQueue.length > 0) {
      console.log(`First Token: ${todayQueue[0].tokenNumber} - ${todayQueue[0].appointment?.patient?.user?.fullName}`);
      console.log(`Last Token: ${todayQueue[todayQueue.length-1].tokenNumber} - ${todayQueue[todayQueue.length-1].appointment?.patient?.user?.fullName}`);
    }
  }

}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
