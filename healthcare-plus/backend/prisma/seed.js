/**
 * prisma/seed.js â€” Comprehensive Demo Data Seeder for Vadodara, Gujarat.
 *
 * Populates:
 * - 8 Realistic Hospitals in Vadodara with real coordinates.
 * - 28 Doctors across 12 specialties â€” ALL with today's queue + appointments.
 * - 3 Ambulance Drivers across Sterling, Sunshine, and Bhailal hospitals.
 * - 1 Primary Patient (Rahul Verma) + 40 Named Dummy Patients.
 * - Active Queues, Appointments, Consultations, Bills, and Healthcare Passports.
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('ðŸŒ± Starting HealthCare+ comprehensive demo seed for Vadodara...');

  // â”€â”€ CLEAR EXISTING DATA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  console.log('Clearing existing data...');
  await prisma.auditLog.deleteMany().catch(() => {});
  await prisma.notification.deleteMany().catch(() => {});
  await prisma.medicineReminderLog.deleteMany().catch(() => {});
  await prisma.labTestCatalog.deleteMany().catch(() => {});
  await prisma.billItem.deleteMany().catch(() => {});
  await prisma.payment.deleteMany().catch(() => {});
  await prisma.bill.deleteMany().catch(() => {});
  await prisma.pharmacyOrderItem.deleteMany().catch(() => {});
  await prisma.pharmacyOrder.deleteMany().catch(() => {});
  await prisma.medicine.deleteMany().catch(() => {});
  await prisma.medicineReminder.deleteMany().catch(() => {});
  await prisma.prescriptionItem.deleteMany().catch(() => {});
  await prisma.prescription.deleteMany().catch(() => {});
  await prisma.labRequestItem.deleteMany().catch(() => {});
  await prisma.labReport.deleteMany().catch(() => {});
  await prisma.labRequest.deleteMany().catch(() => {});
  await prisma.followUpRecommendation.deleteMany().catch(() => {});
  await prisma.consultation.deleteMany().catch(() => {});
  await prisma.medicalTimelineEvent.deleteMany().catch(() => {});
  await prisma.passportConsent.deleteMany().catch(() => {});
  await prisma.healthcarePassport.deleteMany().catch(() => {});
  await prisma.queueToken.deleteMany().catch(() => {});
  await prisma.appointment.deleteMany().catch(() => {});
  await prisma.doctorAvailability.deleteMany().catch(() => {});
  await prisma.doctor.deleteMany().catch(() => {});
  await prisma.emergencyRequest.deleteMany().catch(() => {});
  await prisma.ambulance.deleteMany().catch(() => {});
  await prisma.ambulanceDriver.deleteMany().catch(() => {});
  await prisma.labStaff.deleteMany().catch(() => {});
  await prisma.pharmacist.deleteMany().catch(() => {});
  await prisma.receptionist.deleteMany().catch(() => {});
  await prisma.hospitalAdmin.deleteMany().catch(() => {});
  await prisma.patientProfile.deleteMany().catch(() => {});
  await prisma.department.deleteMany().catch(() => {});
  await prisma.hospital.deleteMany().catch(() => {});
  await prisma.verificationToken.deleteMany().catch(() => {});
  await prisma.passwordResetToken.deleteMany().catch(() => {});
  await prisma.refreshToken.deleteMany().catch(() => {});
  await prisma.inviteToken.deleteMany().catch(() => {});
  await prisma.user.deleteMany().catch(() => {});

  const defaultPasswordHash = await bcrypt.hash('Password123!', 12);

  // â”€â”€ SUPER ADMIN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  await prisma.user.create({
    data: {
      email: 'superadmin@healthcareplus.dev',
      passwordHash: defaultPasswordHash,
      fullName: 'Super Admin',
      role: 'SUPER_ADMIN',
      isEmailVerified: true,
      authProvider: 'LOCAL',
    },
  });
  console.log('âœ… Super Admin created');

  // â”€â”€ HOSPITALS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const hospitalData = [
    {
      id: 'hosp-sterling',
      name: 'Sterling Hospital',
      address: 'Race Course Road, Vadodara',
      city: 'Vadodara',
      latitude: 22.3168,
      longitude: 73.1685,
      contactPhone: '+91-265-2314567',
      contactEmail: 'info@sterlingvadodara.dev',
      workingHoursOpen: '00:00',
      workingHoursClose: '23:59',
      specialities: ['Cardiology', 'Neurology', 'Orthopedics', 'Oncology', 'General Medicine'],
      averageRating: 4.6,
      isActive: true,
    },
    {
      id: 'hosp-sunshine',
      name: 'Sunshine Global Hospital',
      address: 'Manjalpur, Vadodara',
      city: 'Vadodara',
      latitude: 22.2825,
      longitude: 73.1970,
      contactPhone: '+91-265-2637890',
      contactEmail: 'contact@sunshineglobal.dev',
      workingHoursOpen: '00:00',
      workingHoursClose: '23:59',
      specialities: ['Pediatrics', 'Gynecology', 'General Medicine', 'Dermatology'],
      averageRating: 4.4,
      isActive: true,
    },
    {
      id: 'hosp-bhailal',
      name: 'Bhailal Amin General Hospital',
      address: 'Gorwa Road, Vadodara',
      city: 'Vadodara',
      latitude: 22.3330,
      longitude: 73.1601,
      contactPhone: '+91-265-2281234',
      contactEmail: 'help@bhailalamin.dev',
      workingHoursOpen: '08:00',
      workingHoursClose: '22:00',
      specialities: ['Orthopedics', 'Gastroenterology', 'General Medicine', 'ENT'],
      averageRating: 4.5,
      isActive: true,
    },
    {
      id: 'hosp-tricolour',
      name: 'Tricolour Hospital',
      address: 'Sarabhai Campus, Gotri Road, Vadodara',
      city: 'Vadodara',
      latitude: 22.3135,
      longitude: 73.1499,
      contactPhone: '+91-265-2399999',
      contactEmail: 'info@tricolour.dev',
      workingHoursOpen: '00:00',
      workingHoursClose: '23:59',
      specialities: ['Cardiology', 'Neurology', 'Orthopedics', 'Gynecology'],
      averageRating: 4.7,
      isActive: true,
    },
    {
      id: 'hosp-rhythm',
      name: 'Rhythm Heart Institute',
      address: 'Jetalpur Road, Vadodara',
      city: 'Vadodara',
      latitude: 22.3121,
      longitude: 73.1718,
      contactPhone: '+91-265-2356789',
      contactEmail: 'contact@rhythmheart.dev',
      workingHoursOpen: '08:00',
      workingHoursClose: '20:00',
      specialities: ['Cardiology'],
      averageRating: 4.8,
      isActive: true,
    },
    {
      id: 'hosp-baps',
      name: 'BAPS Pramukh Swami Hospital',
      address: 'Atladara, Vadodara',
      city: 'Vadodara',
      latitude: 22.2859,
      longitude: 73.1539,
      contactPhone: '+91-265-2345555',
      contactEmail: 'info@bapshospital.dev',
      workingHoursOpen: '00:00',
      workingHoursClose: '23:59',
      specialities: ['General Medicine', 'Ophthalmology', 'Pediatrics', 'Dentistry'],
      averageRating: 4.3,
      isActive: true,
    },
    {
      id: 'hosp-welcare',
      name: 'Welcare Hospital',
      address: 'Vadiwadi, Vadodara',
      city: 'Vadodara',
      latitude: 22.3150,
      longitude: 73.1650,
      contactPhone: '+91-265-2354444',
      contactEmail: 'info@welcare.dev',
      workingHoursOpen: '09:00',
      workingHoursClose: '21:00',
      specialities: ['Orthopedics', 'Dermatology', 'Psychiatry'],
      averageRating: 4.2,
      isActive: true,
    },
    {
      id: 'hosp-isha',
      name: 'Isha Hospital',
      address: 'Alkapuri, Vadodara',
      city: 'Vadodara',
      latitude: 22.3130,
      longitude: 73.1680,
      contactPhone: '+91-265-2321111',
      contactEmail: 'contact@ishahospital.dev',
      workingHoursOpen: '08:00',
      workingHoursClose: '22:00',
      specialities: ['Gynecology', 'Pediatrics'],
      averageRating: 4.6,
      isActive: true,
    },
  ];

  for (const h of hospitalData) {
    await prisma.hospital.create({ data: h });
  }
  console.log('âœ… Created 8 Vadodara Hospitals');

  // â”€â”€ STERLING STAFF â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@sterling.dev',
      passwordHash: defaultPasswordHash,
      fullName: 'Vikramaditya Admin',
      role: 'HOSPITAL_ADMIN',
      isEmailVerified: true,
      authProvider: 'LOCAL',
    },
  });
  await prisma.hospitalAdmin.create({ data: { userId: adminUser.id, hospitalId: 'hosp-sterling' } });

  const receptionistUser = await prisma.user.create({
    data: {
      email: 'receptionist@sterling.dev',
      passwordHash: defaultPasswordHash,
      fullName: 'Anita Roy',
      role: 'RECEPTIONIST',
      isEmailVerified: true,
      authProvider: 'LOCAL',
    },
  });
  await prisma.receptionist.create({ data: { userId: receptionistUser.id, hospitalId: 'hosp-sterling' } });

  const pharmacistUser = await prisma.user.create({
    data: {
      email: 'pharmacist@sterling.dev',
      passwordHash: defaultPasswordHash,
      fullName: 'Ramesh Gupta',
      role: 'PHARMACIST',
      isEmailVerified: true,
      authProvider: 'LOCAL',
    },
  });
  await prisma.pharmacist.create({ data: { userId: pharmacistUser.id, hospitalId: 'hosp-sterling' } });

  const labUser = await prisma.user.create({
    data: {
      email: 'labstaff@sterling.dev',
      passwordHash: defaultPasswordHash,
      fullName: 'Suresh Kumar',
      role: 'LAB_STAFF',
      isEmailVerified: true,
      authProvider: 'LOCAL',
    },
  });
  await prisma.labStaff.create({ data: { userId: labUser.id, hospitalId: 'hosp-sterling' } });

  console.log('âœ… Created Staff Accounts (Admin, Receptionist, Pharmacist, Lab)');

  // â”€â”€ 3 AMBULANCE DRIVERS (Sterling, Sunshine, Bhailal) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const ambulanceDriverSeeds = [
    { email: 'driver@sterling.dev',  fullName: 'Mahesh Driver',  hospitalId: 'hosp-sterling',  vehicleNumber: 'GJ-01-AB-1234', lat: 22.3175, lng: 73.1690 },
    { email: 'driver@sunshine.dev',  fullName: 'Rajesh Driver',  hospitalId: 'hosp-sunshine',  vehicleNumber: 'GJ-06-CD-5678', lat: 22.2830, lng: 73.1980 },
    { email: 'driver@bhailal.dev',   fullName: 'Vikram Driver',  hospitalId: 'hosp-bhailal',   vehicleNumber: 'GJ-06-EF-9012', lat: 22.3340, lng: 73.1610 },
  ];

  for (const ds of ambulanceDriverSeeds) {
    const dUser = await prisma.user.create({
      data: {
        email: ds.email,
        passwordHash: defaultPasswordHash,
        fullName: ds.fullName,
        role: 'AMBULANCE_DRIVER',
        isEmailVerified: true,
        authProvider: 'LOCAL',
      },
    });
    const driverRecord = await prisma.ambulanceDriver.create({
      data: { userId: dUser.id, hospitalId: ds.hospitalId },
    });
    await prisma.ambulance.create({
      data: {
        hospitalId: ds.hospitalId,
        driverId: driverRecord.id,
        vehicleNumber: ds.vehicleNumber,
        isOnline: false,
        isActive: true,
        currentLatitude: ds.lat,
        currentLongitude: ds.lng,
      },
    });
  }
  console.log('âœ… Created 3 Ambulance Drivers (driver@sterling.dev, driver@sunshine.dev, driver@bhailal.dev)');

  // â”€â”€ DEPARTMENTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const hospitalDepts = {};
  for (const h of hospitalData) {
    hospitalDepts[h.id] = {};
    for (const spec of h.specialities) {
      const dept = await prisma.department.create({ data: { name: spec, hospitalId: h.id } });
      hospitalDepts[h.id][spec] = dept.id;
    }
  }

  // â”€â”€ DOCTORS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const doctorSeeds = [
    // Sterling
    { email: 'dr.anil.shah@sterling.dev',       name: 'Dr. Anil Shah',       hosp: 'hosp-sterling',   spec: 'Cardiologist',       dept: 'Cardiology',       exp: 20, fee: 1500, rating: 4.8 },
    { email: 'dr.meena.patel@sterling.dev',     name: 'Dr. Meena Patel',     hosp: 'hosp-sterling',   spec: 'Neurologist',        dept: 'Neurology',        exp: 15, fee: 1200, rating: 4.6 },
    { email: 'dr.karan.desai@sterling.dev',     name: 'Dr. Karan Desai',     hosp: 'hosp-sterling',   spec: 'Orthopedic Surgeon', dept: 'Orthopedics',      exp: 12, fee: 1000, rating: 4.5 },
    { email: 'dr.sanjay.verma@sterling.dev',    name: 'Dr. Sanjay Verma',    hosp: 'hosp-sterling',   spec: 'General Physician',  dept: 'General Medicine', exp: 8,  fee: 500,  rating: 4.4 },
    // Sunshine
    { email: 'dr.neha.joshi@sunshine.dev',      name: 'Dr. Neha Joshi',      hosp: 'hosp-sunshine',   spec: 'Pediatrician',       dept: 'Pediatrics',       exp: 10, fee: 700,  rating: 4.7 },
    { email: 'dr.priya.sharma@sunshine.dev',    name: 'Dr. Priya Sharma',    hosp: 'hosp-sunshine',   spec: 'Gynecologist',       dept: 'Gynecology',       exp: 14, fee: 800,  rating: 4.5 },
    { email: 'dr.vikram.singh@sunshine.dev',    name: 'Dr. Vikram Singh',    hosp: 'hosp-sunshine',   spec: 'Dermatologist',      dept: 'Dermatology',      exp: 6,  fee: 600,  rating: 4.3 },
    { email: 'dr.rahul.mehta@sunshine.dev',     name: 'Dr. Rahul Mehta',     hosp: 'hosp-sunshine',   spec: 'General Physician',  dept: 'General Medicine', exp: 5,  fee: 400,  rating: 4.1 },
    // Bhailal Amin
    { email: 'dr.amit.trivedi@bhailal.dev',     name: 'Dr. Amit Trivedi',    hosp: 'hosp-bhailal',    spec: 'Gastroenterologist', dept: 'Gastroenterology', exp: 18, fee: 1100, rating: 4.9 },
    { email: 'dr.pooja.bhatt@bhailal.dev',      name: 'Dr. Pooja Bhatt',     hosp: 'hosp-bhailal',    spec: 'ENT Specialist',     dept: 'ENT',              exp: 9,  fee: 600,  rating: 4.4 },
    { email: 'dr.manish.parikh@bhailal.dev',    name: 'Dr. Manish Parikh',   hosp: 'hosp-bhailal',    spec: 'Orthopedic',         dept: 'Orthopedics',      exp: 22, fee: 1300, rating: 4.6 },
    { email: 'dr.suresh.rao@bhailal.dev',       name: 'Dr. Suresh Rao',      hosp: 'hosp-bhailal',    spec: 'General Physician',  dept: 'General Medicine', exp: 10, fee: 450,  rating: 4.3 },
    // Tricolour
    { email: 'dr.raj.shah@tricolour.dev',        name: 'Dr. Raj Shah',        hosp: 'hosp-tricolour',  spec: 'Cardiologist',       dept: 'Cardiology',       exp: 16, fee: 1400, rating: 4.7 },
    { email: 'dr.smita.deshmukh@tricolour.dev',  name: 'Dr. Smita Deshmukh',  hosp: 'hosp-tricolour',  spec: 'Gynecologist',       dept: 'Gynecology',       exp: 11, fee: 800,  rating: 4.5 },
    { email: 'dr.arjun.nair@tricolour.dev',      name: 'Dr. Arjun Nair',      hosp: 'hosp-tricolour',  spec: 'Neurologist',        dept: 'Neurology',        exp: 9,  fee: 950,  rating: 4.4 },
    { email: 'dr.divya.menon@tricolour.dev',     name: 'Dr. Divya Menon',     hosp: 'hosp-tricolour',  spec: 'Orthopedic Surgeon', dept: 'Orthopedics',      exp: 7,  fee: 850,  rating: 4.2 },
    // Rhythm
    { email: 'dr.harish.amin@rhythm.dev',       name: 'Dr. Harish Amin',     hosp: 'hosp-rhythm',     spec: 'Cardiologist',       dept: 'Cardiology',       exp: 25, fee: 2000, rating: 4.9 },
    { email: 'dr.vijay.patel@rhythm.dev',       name: 'Dr. Vijay Patel',     hosp: 'hosp-rhythm',     spec: 'Cardiologist',       dept: 'Cardiology',       exp: 7,  fee: 900,  rating: 4.2 },
    // BAPS
    { email: 'dr.swami.das@baps.dev',           name: 'Dr. Swami Das',       hosp: 'hosp-baps',       spec: 'Ophthalmologist',    dept: 'Ophthalmology',    exp: 14, fee: 500,  rating: 4.8 },
    { email: 'dr.kavita.shukla@baps.dev',       name: 'Dr. Kavita Shukla',   hosp: 'hosp-baps',       spec: 'Dentist',            dept: 'Dentistry',        exp: 8,  fee: 400,  rating: 4.5 },
    { email: 'dr.ashok.vyas@baps.dev',          name: 'Dr. Ashok Vyas',      hosp: 'hosp-baps',       spec: 'General Physician',  dept: 'General Medicine', exp: 30, fee: 300,  rating: 4.9 },
    { email: 'dr.reena.jain@baps.dev',          name: 'Dr. Reena Jain',      hosp: 'hosp-baps',       spec: 'Pediatrician',       dept: 'Pediatrics',       exp: 12, fee: 550,  rating: 4.6 },
    // Welcare
    { email: 'dr.nisha.shah@welcare.dev',       name: 'Dr. Nisha Shah',      hosp: 'hosp-welcare',    spec: 'Psychiatrist',       dept: 'Psychiatry',       exp: 12, fee: 1000, rating: 4.6 },
    { email: 'dr.sameer.khan@welcare.dev',      name: 'Dr. Sameer Khan',     hosp: 'hosp-welcare',    spec: 'Dermatologist',      dept: 'Dermatology',      exp: 5,  fee: 500,  rating: 4.1 },
    { email: 'dr.deepak.rao@welcare.dev',       name: 'Dr. Deepak Rao',      hosp: 'hosp-welcare',    spec: 'Orthopedic',         dept: 'Orthopedics',      exp: 8,  fee: 750,  rating: 4.3 },
    // Isha
    { email: 'dr.isha.patel@isha.dev',          name: 'Dr. Isha Patel',      hosp: 'hosp-isha',       spec: 'Gynecologist',       dept: 'Gynecology',       exp: 20, fee: 1200, rating: 4.8 },
    { email: 'dr.sonali.raval@isha.dev',        name: 'Dr. Sonali Raval',    hosp: 'hosp-isha',       spec: 'Pediatrician',       dept: 'Pediatrics',       exp: 8,  fee: 600,  rating: 4.4 },
    { email: 'dr.mira.desai@isha.dev',          name: 'Dr. Mira Desai',      hosp: 'hosp-isha',       spec: 'Gynecologist',       dept: 'Gynecology',       exp: 6,  fee: 750,  rating: 4.3 },
  ];

  const doctorMap = {};
  for (const d of doctorSeeds) {
    const user = await prisma.user.create({
      data: {
        email: d.email,
        passwordHash: defaultPasswordHash,
        fullName: d.name,
        role: 'DOCTOR',
        isEmailVerified: true,
        authProvider: 'LOCAL',
      },
    });
    const doc = await prisma.doctor.create({
      data: {
        userId: user.id,
        hospitalId: d.hosp,
        departmentId: hospitalDepts[d.hosp][d.dept],
        specialization: d.spec,
        experienceYears: d.exp,
        consultationFee: d.fee,
        averageRating: d.rating,
      },
    });
    doctorMap[d.email] = { docId: doc.id, hosp: d.hosp, dept: d.dept, fee: d.fee };

    for (let i = 0; i < 7; i++) {
      const dayOfWeek = (new Date().getDay() + i) % 7;
      await prisma.doctorAvailability.create({
        data: { doctorId: doc.id, dayOfWeek, startTime: '09:00', endTime: '17:00', slotMinutes: 15 },
      });
    }
  }
  console.log(`âœ… Created ${doctorSeeds.length} Doctors with availability`);

  // â”€â”€ PATIENTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const demoPatientUser = await prisma.user.create({
    data: {
      email: 'patient@healthcareplus.dev',
      passwordHash: defaultPasswordHash,
      fullName: 'Rahul Verma',
      role: 'PATIENT',
      isEmailVerified: true,
      authProvider: 'LOCAL',
    },
  });
  await prisma.patientProfile.create({
    data: { userId: demoPatientUser.id, phone: '+91-9876543210', city: 'Vadodara', gender: 'MALE', bloodGroup: 'O_POS' },
  });

  const dummyNames = [
    'Priya Sharma','Arjun Mehta','Sunita Patel','Ravi Kumar','Kavita Desai',
    'Aakash Singh','Divya Nair','Suresh Rao','Anita Joshi','Deepak Trivedi',
    'Pooja Bhatt','Vikram Shah','Neha Verma','Manish Gupta','Smita Parikh',
    'Rajesh Amin','Leela Iyer','Harish Menon','Komal Vyas','Sanjay Bhide',
    'Preethi Nair','Amit Jain','Meera Das','Rohit Shukla','Geeta Kapoor',
    'Kishore Pillai','Anjali Mishra','Nikhil Pandey','Rekha Sinha','Varun Chaudhary',
    'Pallavi Reddy','Sachin Deshpande','Usha Kulkarni','Gaurav Patil','Swati Gaikwad',
    'Manoj Shelar','Madhuri Salve','Prasad Thorat','Vijaya Mane','Shivaji Jadhav',
  ];

  const dummyPatients = [];
  for (let i = 0; i < 40; i++) {
    const du = await prisma.user.create({
      data: {
        email: `dummy${i + 1}@healthcareplus.dev`,
        passwordHash: defaultPasswordHash,
        fullName: dummyNames[i] || `Patient ${i + 1}`,
        role: 'PATIENT',
        isEmailVerified: true,
        authProvider: 'LOCAL',
      },
    });
    await prisma.patientProfile.create({
      data: {
        userId: du.id,
        phone: `+91-98765${String(43210 + i).padStart(5, '0')}`,
        city: 'Vadodara',
        gender: i % 3 === 0 ? 'FEMALE' : 'MALE',
        bloodGroup: ['A_POS','B_POS','O_POS','AB_POS','O_NEG'][i % 5],
      },
    });
    dummyPatients.push(du.id);
  }
  console.log('âœ… Created Primary Patient (Rahul) & 40 Named Dummy Patients');

  // â”€â”€ HEALTHCARE PASSPORT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const passport = await prisma.healthcarePassport.create({
    data: {
      patientId: demoPatientUser.id,
      allergies: ['Penicillin', 'Dust Mites'],
      medicalConditions: ['Mild Hypertension', 'Asthma'],
      currentMedications: ['Amlodipine 5mg', 'Salbutamol Inhaler'],
      notes: 'Patient maintains a healthy diet but has occasional asthma flare-ups during winter.',
    },
  });

  // Grant consent to Sterling Hospital
  await prisma.passportConsent.create({
    data: {
      passportId: passport.id,
      hospitalId: 'hosp-sterling',
    }
  });


  // â”€â”€ TODAY'S QUEUE FOR ALL DOCTORS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const todayObj = new Date();
  todayObj.setUTCHours(0, 0, 0, 0);

  let patientPoolIdx = 0;
  const nextPatient = () => {
    const id = dummyPatients[patientPoolIdx % dummyPatients.length];
    patientPoolIdx++;
    return id;
  };

  // [email, completedCount, inProgressIdx (0-based), totalTokens]
  const doctorQueueConfigs = [
    ['dr.anil.shah@sterling.dev',        8,  8, 18],
    ['dr.meena.patel@sterling.dev',      6,  6, 14],
    ['dr.karan.desai@sterling.dev',      4,  4, 12],
    ['dr.sanjay.verma@sterling.dev',     10, 10, 20],
    ['dr.neha.joshi@sunshine.dev',       5,  5, 13],
    ['dr.priya.sharma@sunshine.dev',     7,  7, 16],
    ['dr.vikram.singh@sunshine.dev',     3,  3, 10],
    ['dr.rahul.mehta@sunshine.dev',      9,  9, 18],
    ['dr.amit.trivedi@bhailal.dev',      10, 10, 22],
    ['dr.pooja.bhatt@bhailal.dev',       4,  4, 11],
    ['dr.manish.parikh@bhailal.dev',     6,  6, 15],
    ['dr.suresh.rao@bhailal.dev',        8,  8, 17],
    ['dr.raj.shah@tricolour.dev',        5,  5, 14],
    ['dr.smita.deshmukh@tricolour.dev',  7,  7, 16],
    ['dr.arjun.nair@tricolour.dev',      3,  3, 10],
    ['dr.divya.menon@tricolour.dev',     6,  6, 13],
    ['dr.harish.amin@rhythm.dev',        9,  9, 20],
    ['dr.vijay.patel@rhythm.dev',        4,  4, 11],
    ['dr.swami.das@baps.dev',            7,  7, 15],
    ['dr.kavita.shukla@baps.dev',        5,  5, 12],
    ['dr.ashok.vyas@baps.dev',           10, 10, 22],
    ['dr.reena.jain@baps.dev',           3,  3, 9],
    ['dr.nisha.shah@welcare.dev',        5,  5, 13],
    ['dr.sameer.khan@welcare.dev',       2,  2, 8],
    ['dr.deepak.rao@welcare.dev',        6,  6, 14],
    ['dr.isha.patel@isha.dev',           8,  8, 18],
    ['dr.sonali.raval@isha.dev',         4,  4, 11],
    ['dr.mira.desai@isha.dev',           3,  3, 9],
  ];

  for (const [email, completedCount, inProgressIdx, totalTokens] of doctorQueueConfigs) {
    const { docId, hosp, dept, fee } = doctorMap[email];
    const slotTime = new Date(todayObj);
    slotTime.setUTCHours(9, 0, 0, 0);

    for (let i = 0; i < totalTokens; i++) {
      const patId = nextPatient();
      const h = slotTime.getUTCHours();
      const m = slotTime.getUTCMinutes();
      const slotStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

      let apptStatus = 'CONFIRMED';
      let qStatus = 'WAITING';
      if (i < completedCount)       { apptStatus = 'COMPLETED'; qStatus = 'COMPLETED'; }
      else if (i === inProgressIdx) { qStatus = 'IN_PROGRESS'; }

      const appt = await prisma.appointment.create({
        data: {
          patientId: patId,
          doctorId: docId,
          hospitalId: hosp,
          departmentId: hospitalDepts[hosp][dept],
          scheduledDate: todayObj,
          scheduledTime: slotStr,
          fee,
          status: apptStatus,
        },
      });

      const token = await prisma.queueToken.create({
        data: {
          appointmentId: appt.id,
          doctorId: docId,
          hospitalId: hosp,
          queueDate: todayObj,
          tokenNumber: i + 1,
          status: qStatus,
          calledAt: (qStatus === 'IN_PROGRESS' || qStatus === 'COMPLETED') ? new Date() : null,
          consultationStartAt: qStatus === 'IN_PROGRESS' ? new Date() : null,
          completedAt: qStatus === 'COMPLETED' ? new Date() : null,
        },
      });

      if (qStatus === 'COMPLETED') {
        await prisma.consultation.create({
          data: {
            appointmentId: appt.id,
            doctorId: docId,
            patientId: patId,
            hospitalId: hosp,
            queueTokenId: token.id,
            symptoms: 'General discomfort, routine visit',
            diagnosis: 'Patient stable, no acute findings',
            notes: 'Follow-up advised in 3 months.',
            treatmentPlan: 'Continue current medications',
            status: 'COMPLETED',
            completedAt: new Date(),
          },
        });
      }

      slotTime.setUTCMinutes(slotTime.getUTCMinutes() + 15);
    }
  }
  console.log(`âœ… Created today-queue for all ${doctorQueueConfigs.length} doctors`);

  // â”€â”€ DEMO PATIENT IN DR. AMIT TRIVEDI'S QUEUE (Token #23) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const amitInfo = doctorMap['dr.amit.trivedi@bhailal.dev'];
  const demoDayAppt = await prisma.appointment.create({
    data: {
      patientId: demoPatientUser.id,
      doctorId: amitInfo.docId,
      hospitalId: 'hosp-bhailal',
      departmentId: hospitalDepts['hosp-bhailal']['Gastroenterology'],
      scheduledDate: todayObj,
      scheduledTime: '14:30',
      fee: 1100,
      status: 'CONFIRMED',
    },
  });
  const todayBill = await prisma.bill.create({
    data: {
      patientId: demoPatientUser.id,
      hospitalId: 'hosp-bhailal',
      sourceType: 'APPOINTMENT',
      sourceId: demoDayAppt.id,
      subtotal: 1100,
      total: 1100,
      status: 'PAID',
      items: {
        create: [{ description: 'Consultation â€” Dr. Amit Trivedi (Gastroenterology)', quantity: 1, unitPrice: 1100, subtotal: 1100 }],
      },
    },
  });
  await prisma.payment.create({
    data: {
      billId: todayBill.id,
      amount: 1100,
      currency: 'INR',
      razorpayOrderId: 'mock_order_today',
      razorpayPaymentId: 'mock_payment_today',
      status: 'SUCCESS',
    },
  });
  await prisma.queueToken.create({
    data: {
      appointmentId: demoDayAppt.id,
      doctorId: amitInfo.docId,
      hospitalId: 'hosp-bhailal',
      queueDate: todayObj,
      tokenNumber: 23,
      status: 'WAITING',
    },
  });

  // â”€â”€ PAST APPOINTMENT (Cardiology, 14 days ago) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 14);
  pastDate.setUTCHours(0, 0, 0, 0);

  const pastAppt = await prisma.appointment.create({
    data: {
      patientId: demoPatientUser.id,
      doctorId: doctorMap['dr.anil.shah@sterling.dev'].docId,
      hospitalId: 'hosp-sterling',
      departmentId: hospitalDepts['hosp-sterling']['Cardiology'],
      scheduledDate: pastDate,
      scheduledTime: '10:30',
      fee: 1500,
      status: 'COMPLETED',
    },
  });
  const pastBill = await prisma.bill.create({
    data: {
      patientId: demoPatientUser.id,
      hospitalId: 'hosp-sterling',
      sourceType: 'APPOINTMENT',
      sourceId: pastAppt.id,
      subtotal: 1500,
      total: 1500,
      status: 'PAID',
      items: {
        create: [{ description: 'Consultation â€” Dr. Anil Shah (Cardiology)', quantity: 1, unitPrice: 1500, subtotal: 1500 }],
      },
    },
  });
  await prisma.payment.create({
    data: {
      billId: pastBill.id,
      amount: 1500,
      currency: 'INR',
      razorpayOrderId: 'mock_order_past',
      razorpayPaymentId: 'mock_payment_past',
      status: 'SUCCESS',
    },
  });
  await prisma.medicalTimelineEvent.create({
    data: {
      passportId: passport.id,
      eventType: 'APPOINTMENT',
      sourceId: pastAppt.id,
      title: 'Appointment completed â€” Dr. Anil Shah, Cardiologist',
      description: `At Sterling Hospital Â· 14 days ago at 10:30`,
      eventDate: pastDate,
    },
  });
  await prisma.medicalTimelineEvent.create({
    data: {
      passportId: passport.id,
      eventType: 'PRESCRIPTION',
      sourceId: 'rx_mock_1',
      title: 'New Prescription: Amlodipine 5mg',
      description: 'Prescribed by Dr. Anil Shah for blood pressure management. 1 tablet daily after breakfast.',
      eventDate: pastDate,
    },
  });

  // â”€â”€ ADDITIONAL PAST APPOINTMENTS (richer history) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const extraPast = [
    { doctorEmail: 'dr.meena.patel@sterling.dev',   daysAgo: 30, slot: '09:30', desc: 'Neurology follow-up' },
    { doctorEmail: 'dr.priya.sharma@sunshine.dev',  daysAgo: 60, slot: '10:00', desc: 'Routine Gynecology check-up' },
    { doctorEmail: 'dr.harish.amin@rhythm.dev',     daysAgo: 90, slot: '11:00', desc: 'Cardiac stress test review' },
  ];
  for (const ep of extraPast) {
    const pd = new Date();
    pd.setDate(pd.getDate() - ep.daysAgo);
    pd.setUTCHours(0, 0, 0, 0);
    const { docId, hosp, dept, fee } = doctorMap[ep.doctorEmail];
    const pa = await prisma.appointment.create({
      data: {
        patientId: demoPatientUser.id,
        doctorId: docId,
        hospitalId: hosp,
        departmentId: hospitalDepts[hosp][dept],
        scheduledDate: pd,
        scheduledTime: ep.slot,
        fee,
        status: 'COMPLETED',
      },
    });
    const pb = await prisma.bill.create({
      data: {
        patientId: demoPatientUser.id,
        hospitalId: hosp,
        sourceType: 'APPOINTMENT',
        sourceId: pa.id,
        subtotal: fee,
        total: fee,
        status: 'PAID',
        items: { create: [{ description: ep.desc, quantity: 1, unitPrice: fee, subtotal: fee }] },
      },
    });
    await prisma.payment.create({
      data: {
        billId: pb.id,
        amount: fee,
        currency: 'INR',
        razorpayOrderId: `mock_order_${ep.daysAgo}`,
        razorpayPaymentId: `mock_payment_${ep.daysAgo}`,
        status: 'SUCCESS',
      },
    });
    await prisma.medicalTimelineEvent.create({
      data: {
        passportId: passport.id,
        eventType: 'APPOINTMENT',
        sourceId: pa.id,
        title: `Appointment completed â€” ${ep.desc}`,
        description: `${ep.daysAgo} days ago at ${ep.slot}`,
        eventDate: pd,
      },
    });
  }

  // â”€â”€ UPCOMING APPOINTMENT (Sunshine, 5 days away) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const upcomingDate = new Date();
  upcomingDate.setDate(upcomingDate.getDate() + 5);
  upcomingDate.setUTCHours(0, 0, 0, 0);

  const upAppt = await prisma.appointment.create({
    data: {
      patientId: demoPatientUser.id,
      doctorId: doctorMap['dr.neha.joshi@sunshine.dev'].docId,
      hospitalId: 'hosp-sunshine',
      departmentId: hospitalDepts['hosp-sunshine']['Pediatrics'],
      scheduledDate: upcomingDate,
      scheduledTime: '11:00',
      fee: 700,
      status: 'CONFIRMED',
    },
  });
  const upBill = await prisma.bill.create({
    data: {
      patientId: demoPatientUser.id,
      hospitalId: 'hosp-sunshine',
      sourceType: 'APPOINTMENT',
      sourceId: upAppt.id,
      subtotal: 700,
      total: 700,
      status: 'PAID',
      items: {
        create: [{ description: 'Consultation â€” Dr. Neha Joshi (Pediatrics)', quantity: 1, unitPrice: 700, subtotal: 700 }],
      },
    },
  });
  await prisma.payment.create({
    data: {
      billId: upBill.id,
      amount: 700,
      currency: 'INR',
      razorpayOrderId: 'mock_order_future',
      razorpayPaymentId: 'mock_payment_future',
      status: 'SUCCESS',
    },
  });
  await prisma.queueToken.create({
    data: {
      appointmentId: upAppt.id,
      doctorId: doctorMap['dr.neha.joshi@sunshine.dev'].docId,
      hospitalId: 'hosp-sunshine',
      queueDate: upcomingDate,
      tokenNumber: 1,
      status: 'WAITING',
    },
  });

  console.log('âœ… Seed complete!');
  console.log('');
  console.log('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
  console.log('  DEMO LOGIN CREDENTIALS (all passwords: Password123!)');
  console.log('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
  console.log('  ðŸ‘¤ Patient:            patient@healthcareplus.dev');
  console.log('  ðŸ¥ Admin (Sterling):   admin@sterling.dev');
  console.log('  ðŸ©º Dr. (Sterling):     dr.anil.shah@sterling.dev');
  console.log('  ðŸ©º Dr. (Sunshine):     dr.neha.joshi@sunshine.dev');
  console.log('  ðŸ©º Dr. (Bhailal):      dr.amit.trivedi@bhailal.dev');
  console.log('  ðŸ©º Dr. (Tricolour):    dr.raj.shah@tricolour.dev');
  console.log('  ðŸ©º Dr. (Rhythm):       dr.harish.amin@rhythm.dev');
  console.log('  ðŸ©º Dr. (BAPS):         dr.ashok.vyas@baps.dev');
  console.log('  ðŸ©º Dr. (Welcare):      dr.nisha.shah@welcare.dev');
  console.log('  ðŸ©º Dr. (Isha):         dr.isha.patel@isha.dev');
  console.log('  ðŸš‘ Driver (Sterling):  driver@sterling.dev');
  console.log('  ðŸš‘ Driver (Sunshine):  driver@sunshine.dev');
  console.log('  ðŸš‘ Driver (Bhailal):   driver@bhailal.dev');
  console.log('  ðŸ’Š Pharmacist:         pharmacist@sterling.dev');
  console.log('  ðŸ§ª Lab Staff:          labstaff@sterling.dev');
  console.log('  ðŸ”‘ Super Admin:        superadmin@healthcareplus.dev');
  console.log('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
}

main()
  .catch((e) => {
    console.error('âŒ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

