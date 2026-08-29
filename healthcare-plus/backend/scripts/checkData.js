import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const patientAppts = await prisma.appointment.count();
  const queueTokens = await prisma.queueToken.count();
  const consultations = await prisma.consultation.count();
  const prescriptions = await prisma.prescription.count();
  const labRequests = await prisma.labRequest.count();
  const labReports = await prisma.labReport.count();

  // Check specific patient (e.g. Rahul)
  const patient = await prisma.user.findUnique({
    where: { email: 'patient@healthcareplus.dev' },
    include: {
      appointments: { include: { queueToken: true } },
      consultationsAsPatient: true,
      passport: true
    }
  });
  
  let patientLabRequests = [];
  let patientPrescriptions = [];
  if (patient) {
    patientLabRequests = await prisma.labRequest.findMany({ where: { patientId: patient.id } });
    patientPrescriptions = await prisma.prescription.findMany({ where: { consultation: { patientId: patient.id } } });
  }

  // Check a specific doctor's queue (e.g. Dr. Anil Shah)
  const doctorUser = await prisma.user.findUnique({
    where: { email: 'dr.anil.shah@sterling.dev' },
    include: { doctor: true }
  });

  let todayQueue = [];
  if (doctorUser && doctorUser.doctor) {
    todayQueue = await prisma.queueToken.findMany({
      where: { doctorId: doctorUser.doctor.id },
      orderBy: { tokenNumber: 'asc' },
      include: { appointment: { include: { patient: true } } }
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
    console.log(`Consultations (Passport Data): ${patient.consultationsAsPatient.length}`);
    console.log(`Prescriptions (Passport Data): ${patientPrescriptions.length}`);
    console.log(`Lab Requests (Passport Data): ${patientLabRequests.length}`);
    console.log(`Health Passport Created: ${patient.passport ? 'Yes' : 'No'}`);
  } else {
    console.log('Primary patient not found.');
  }

  console.log('\n--- DOCTOR QUEUE (Dr. Anil Shah) ---');
  if (doctorUser && doctorUser.doctor) {
    console.log(`Tokens (Total): ${todayQueue.length}`);
    if (todayQueue.length > 0) {
      console.log(`First Token: ${todayQueue[0].tokenNumber} - Patient ID: ${todayQueue[0].appointment?.patient?.id}`);
      console.log(`Last Token: ${todayQueue[todayQueue.length-1].tokenNumber} - Patient ID: ${todayQueue[todayQueue.length-1].appointment?.patient?.id}`);
    }
  }

}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
