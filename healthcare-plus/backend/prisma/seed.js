/**
 * prisma/seed.js — Comprehensive Demo Data Seeder for Vadodara, Gujarat.
 *
 * Populates:
 * - 8 Realistic Hospitals in Vadodara with real coordinates.
 * - 30 Doctors across 12 specialties.
 * - 1 Primary Patient (Rahul Verma) + Dummy Patients.
 * - Active Queues, Appointments, and Healthcare Passports.
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Helper to generate a date offset by days
const getOffsetDate = (days, timeStr = '10:00') => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setUTCHours(0, 0, 0, 0); // Midnight UTC for scheduledDate
  return { dateObj: d, timeStr };
};

async function main() {
  console.log('🌱 Starting HealthCare+ comprehensive demo seed for Vadodara...');

  // 1. CLEAR EXISTING DATA (safely, obeying foreign keys)
  console.log('Clearing existing data...');
  // Leaf/child tables that FK into User/Hospital/Bill/MedicineReminder without
  // cascade — must be cleared FIRST so the parent deletes below don't fail on
  // re-seed (a silent failure here caused unique-email collisions on re-run).
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

  // ── SUPER ADMIN ─────────────────────────────────────────────────────────────
  const superAdmin = await prisma.user.create({
    data: {
      email: 'superadmin@healthcareplus.dev',
      passwordHash: defaultPasswordHash,
      fullName: 'Super Admin',
      role: 'SUPER_ADMIN',
      isEmailVerified: true,
      authProvider: 'LOCAL',
    },
  });
  console.log(`✅ Super Admin created`);

  // ── HOSPITALS ───────────────────────────────────────────────────────────────
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
      workingHoursClose: '23:59', // 24/7
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
    }
  ];

  for (const h of hospitalData) {
    await prisma.hospital.create({ data: h });
  }
  console.log(`✅ Created 8 Vadodara Hospitals`);

  // ── STAFF PROFILES (Sterling Hospital) ──────────────────────────────────────
  // Hospital Admin
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
  await prisma.hospitalAdmin.create({
    data: { userId: adminUser.id, hospitalId: 'hosp-sterling' },
  });

  // Receptionist
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
  await prisma.receptionist.create({
    data: { userId: receptionistUser.id, hospitalId: 'hosp-sterling' },
  });

  // Pharmacist
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
  await prisma.pharmacist.create({
    data: { userId: pharmacistUser.id, hospitalId: 'hosp-sterling' },
  });

  // Lab Technician
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
  await prisma.labStaff.create({
    data: { userId: labUser.id, hospitalId: 'hosp-sterling' },
  });

  // Ambulance Driver
  const driverUser = await prisma.user.create({
    data: {
      email: 'driver@sterling.dev',
      passwordHash: defaultPasswordHash,
      fullName: 'Mahesh Driver',
      role: 'AMBULANCE_DRIVER',
      isEmailVerified: true,
      authProvider: 'LOCAL',
    },
  });
  const driver = await prisma.ambulanceDriver.create({
    data: { userId: driverUser.id, hospitalId: 'hosp-sterling' },
  });
  // Register the driver's ambulance so they can go online and be dispatched.
  // Ambulance.driverId references AmbulanceDriver.id (not the User id).
  await prisma.ambulance.create({
    data: { hospitalId: 'hosp-sterling', driverId: driver.id, vehicleNumber: 'GJ-01-AB-1234' },
  });

  console.log(`✅ Created Staff Accounts (Admin, Receptionist, Pharmacist, Lab, Driver)`);

  // ── DEPARTMENTS ─────────────────────────────────────────────────────────────
  // Create departments based on hospital specialities
  const hospitalDepts = {};
  for (const h of hospitalData) {
    hospitalDepts[h.id] = {};
    for (const spec of h.specialities) {
      const dept = await prisma.department.create({
        data: {
          name: spec,
          hospitalId: h.id,
        },
      });
      hospitalDepts[h.id][spec] = dept.id;
    }
  }

  // ── DOCTORS ─────────────────────────────────────────────────────────────────
  const doctorSeeds = [
    // Sterling
    { email: 'dr.anil.shah@sterling.dev', name: 'Dr. Anil Shah', hosp: 'hosp-sterling', spec: 'Cardiologist', dept: 'Cardiology', exp: 20, fee: 1500, rating: 4.8 },
    { email: 'dr.meena.patel@sterling.dev', name: 'Dr. Meena Patel', hosp: 'hosp-sterling', spec: 'Neurologist', dept: 'Neurology', exp: 15, fee: 1200, rating: 4.6 },
    { email: 'dr.karan.desai@sterling.dev', name: 'Dr. Karan Desai', hosp: 'hosp-sterling', spec: 'Orthopedic Surgeon', dept: 'Orthopedics', exp: 12, fee: 1000, rating: 4.5 },
    { email: 'dr.sanjay.verma@sterling.dev', name: 'Dr. Sanjay Verma', hosp: 'hosp-sterling', spec: 'General Physician', dept: 'General Medicine', exp: 8, fee: 500, rating: 4.4 },
    // Sunshine
    { email: 'dr.neha.joshi@sunshine.dev', name: 'Dr. Neha Joshi', hosp: 'hosp-sunshine', spec: 'Pediatrician', dept: 'Pediatrics', exp: 10, fee: 700, rating: 4.7 },
    { email: 'dr.priya.sharma@sunshine.dev', name: 'Dr. Priya Sharma', hosp: 'hosp-sunshine', spec: 'Gynecologist', dept: 'Gynecology', exp: 14, fee: 800, rating: 4.5 },
    { email: 'dr.vikram.singh@sunshine.dev', name: 'Dr. Vikram Singh', hosp: 'hosp-sunshine', spec: 'Dermatologist', dept: 'Dermatology', exp: 6, fee: 600, rating: 4.3 },
    { email: 'dr.rahul.mehta@sunshine.dev', name: 'Dr. Rahul Mehta', hosp: 'hosp-sunshine', spec: 'General Physician', dept: 'General Medicine', exp: 5, fee: 400, rating: 4.1 },
    // Bhailal Amin
    { email: 'dr.amit.trivedi@bhailal.dev', name: 'Dr. Amit Trivedi', hosp: 'hosp-bhailal', spec: 'Gastroenterologist', dept: 'Gastroenterology', exp: 18, fee: 1100, rating: 4.9 },
    { email: 'dr.pooja.bhatt@bhailal.dev', name: 'Dr. Pooja Bhatt', hosp: 'hosp-bhailal', spec: 'ENT Specialist', dept: 'ENT', exp: 9, fee: 600, rating: 4.4 },
    { email: 'dr.manish.parikh@bhailal.dev', name: 'Dr. Manish Parikh', hosp: 'hosp-bhailal', spec: 'Orthopedic', dept: 'Orthopedics', exp: 22, fee: 1300, rating: 4.6 },
    // Tricolour
    { email: 'dr.raj.shah@tricolour.dev', name: 'Dr. Raj Shah', hosp: 'hosp-tricolour', spec: 'Cardiologist', dept: 'Cardiology', exp: 16, fee: 1400, rating: 4.7 },
    { email: 'dr.smita.deshmukh@tricolour.dev', name: 'Dr. Smita Deshmukh', hosp: 'hosp-tricolour', spec: 'Gynecologist', dept: 'Gynecology', exp: 11, fee: 800, rating: 4.5 },
    // Rhythm
    { email: 'dr.harish.amin@rhythm.dev', name: 'Dr. Harish Amin', hosp: 'hosp-rhythm', spec: 'Cardiologist', dept: 'Cardiology', exp: 25, fee: 2000, rating: 4.9 },
    { email: 'dr.vijay.patel@rhythm.dev', name: 'Dr. Vijay Patel', hosp: 'hosp-rhythm', spec: 'Cardiologist', dept: 'Cardiology', exp: 7, fee: 900, rating: 4.2 },
    // BAPS
    { email: 'dr.swami.das@baps.dev', name: 'Dr. Swami Das', hosp: 'hosp-baps', spec: 'Ophthalmologist', dept: 'Ophthalmology', exp: 14, fee: 500, rating: 4.8 },
    { email: 'dr.kavita.shukla@baps.dev', name: 'Dr. Kavita Shukla', hosp: 'hosp-baps', spec: 'Dentist', dept: 'Dentistry', exp: 8, fee: 400, rating: 4.5 },
    { email: 'dr.ashok.vyas@baps.dev', name: 'Dr. Ashok Vyas', hosp: 'hosp-baps', spec: 'General Physician', dept: 'General Medicine', exp: 30, fee: 300, rating: 4.9 },
    // Welcare
    { email: 'dr.nisha.shah@welcare.dev', name: 'Dr. Nisha Shah', hosp: 'hosp-welcare', spec: 'Psychiatrist', dept: 'Psychiatry', exp: 12, fee: 1000, rating: 4.6 },
    { email: 'dr.sameer.khan@welcare.dev', name: 'Dr. Sameer Khan', hosp: 'hosp-welcare', spec: 'Dermatologist', dept: 'Dermatology', exp: 5, fee: 500, rating: 4.1 },
    // Isha
    { email: 'dr.isha.patel@isha.dev', name: 'Dr. Isha Patel', hosp: 'hosp-isha', spec: 'Gynecologist', dept: 'Gynecology', exp: 20, fee: 1200, rating: 4.8 },
    { email: 'dr.sonali.raval@isha.dev', name: 'Dr. Sonali Raval', hosp: 'hosp-isha', spec: 'Pediatrician', dept: 'Pediatrics', exp: 8, fee: 600, rating: 4.4 },
  ];

  const doctorMap = {}; // store doctor id by email for easy lookup later
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
    doctorMap[d.email] = doc.id;

    // Give each doctor availability for today and next 7 days
    for (let i = 0; i < 7; i++) {
      const dayOfWeek = (new Date().getDay() + i) % 7;
      await prisma.doctorAvailability.create({
        data: {
          doctorId: doc.id,
          dayOfWeek, // 0-6
          startTime: '09:00',
          endTime: '17:00',
          slotMinutes: 15,
        }
      });
    }
  }
  console.log(`✅ Created ${doctorSeeds.length} Doctors with availability`);

  // ── PATIENTS ────────────────────────────────────────────────────────────────
  // Main Demo Patient
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
  const demoPatient = await prisma.patientProfile.create({
    data: {
      userId: demoPatientUser.id,
      phone: '+91-9876543210',
      city: 'Vadodara',
      gender: 'MALE',
      bloodGroup: 'O_POS',
    },
  });

  // Dummy Patients for queueing
  const dummyPatients = [];
  for (let i = 1; i <= 40; i++) {
    const du = await prisma.user.create({
      data: {
        email: `dummy${i}@healthcareplus.dev`,
        passwordHash: defaultPasswordHash,
        fullName: `Patient ${i}`,
        role: 'PATIENT',
        isEmailVerified: true,
        authProvider: 'LOCAL',
      },
    });
    dummyPatients.push(du.id);
  }
  console.log(`✅ Created Primary Patient (Rahul) & 40 Dummy Patients`);

  // ── HEALTHCARE PASSPORT (Demo Patient) ──────────────────────────────────────
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

  // ── APPOINTMENTS & MEDICAL TIMELINE ───────────────────────────────────────────
  // Past Appointment (Cardiologist) - Completed
  const pastApptDate = getOffsetDate(-14, '10:30');
  const pastAppt = await prisma.appointment.create({
    data: {
      patientId: demoPatientUser.id,
      doctorId: doctorMap['dr.anil.shah@sterling.dev'],
      hospitalId: 'hosp-sterling',
      departmentId: hospitalDepts['hosp-sterling']['Cardiology'],
      scheduledDate: pastApptDate.dateObj,
      scheduledTime: pastApptDate.timeStr,
      fee: 1500,
      status: 'COMPLETED',
    }
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
        create: [
          { description: 'Consultation — Dr. Anil Shah (Cardiology)', quantity: 1, unitPrice: 1500, subtotal: 1500 }
        ]
      }
    }
  });
  await prisma.payment.create({
    data: {
      billId: pastBill.id,
      amount: 1500,
      currency: 'INR',
      razorpayOrderId: 'mock_order_past',
      razorpayPaymentId: 'mock_payment_past',
      status: 'SUCCESS',
    }
  });
  await prisma.medicalTimelineEvent.create({
    data: {
      passportId: passport.id,
      eventType: 'APPOINTMENT',
      sourceId: pastAppt.id,
      title: 'Appointment completed — Dr. Anil Shah, Cardiologist',
      description: `At Sterling Hospital on ${pastApptDate.dateObj.toISOString().split('T')[0]} at 10:30`,
      eventDate: pastApptDate.dateObj,
    }
  });
  await prisma.medicalTimelineEvent.create({
    data: {
      passportId: passport.id,
      eventType: 'PRESCRIPTION',
      sourceId: 'rx_mock_1',
      title: 'New Prescription: Amlodipine 5mg',
      description: 'Prescribed by Dr. Anil Shah for blood pressure management. 1 tablet daily after breakfast.',
      eventDate: pastApptDate.dateObj,
    }
  });

  // ── LIVE QUEUE SIMULATION (Today) ───────────────────────────────────────────
  // We will simulate a busy day for Dr. Amit Trivedi (Gastroenterologist at Bhailal Amin)
  // Demo patient is in this queue.
  const todayObj = getOffsetDate(0).dateObj;
  const busyDoctorId = doctorMap['dr.amit.trivedi@bhailal.dev'];
  const busyHospitalId = 'hosp-bhailal';
  const busyDeptId = hospitalDepts[busyHospitalId]['Gastroenterology'];

  // Create 20 dummy appointments BEFORE demo patient.
  // Layout keeps the queue visibly busy without exceeding the doctor's slot grid
  // (09:00–17:00 @ 15min = 32 slots/day). 27 tokens total end at 15:30.
  let currentTokenTime = new Date(todayObj);
  currentTokenTime.setUTCHours(9, 0, 0, 0);

  for (let i = 0; i < 20; i++) {
    const timeStr = `${String(currentTokenTime.getUTCHours()).padStart(2, '0')}:${String(currentTokenTime.getUTCMinutes()).padStart(2, '0')}`;
    const a = await prisma.appointment.create({
      data: {
        patientId: dummyPatients[i],
        doctorId: busyDoctorId,
        hospitalId: busyHospitalId,
        departmentId: busyDeptId,
        scheduledDate: todayObj,
        scheduledTime: timeStr,
        fee: 1100,
        status: 'CONFIRMED',
      }
    });
    // First 10 are COMPLETED, 11th (i===10) is IN_PROGRESS (now serving),
    // the remaining 9 are WAITING — so the demo patient sees a real queue ahead.
    let qStatus = 'COMPLETED';
    if (i === 10) qStatus = 'IN_PROGRESS';
    if (i > 10) qStatus = 'WAITING';

    await prisma.queueToken.create({
      data: {
        appointmentId: a.id,
        doctorId: busyDoctorId,
        hospitalId: busyHospitalId,
        queueDate: todayObj,
        tokenNumber: i + 1,
        status: qStatus,
      }
    });
    currentTokenTime.setUTCMinutes(currentTokenTime.getUTCMinutes() + 15);
  }

  // Create DEMO PATIENT Appointment (Token #21)
  const myApptTimeStr = `${String(currentTokenTime.getUTCHours()).padStart(2, '0')}:${String(currentTokenTime.getUTCMinutes()).padStart(2, '0')}`;
  const myAppt = await prisma.appointment.create({
    data: {
      patientId: demoPatientUser.id,
      doctorId: busyDoctorId,
      hospitalId: busyHospitalId,
      departmentId: busyDeptId,
      scheduledDate: todayObj,
      scheduledTime: myApptTimeStr,
      fee: 1100,
      status: 'CONFIRMED',
    }
  });
  const todayBill = await prisma.bill.create({
    data: {
      patientId: demoPatientUser.id,
      hospitalId: busyHospitalId,
      sourceType: 'APPOINTMENT',
      sourceId: myAppt.id,
      subtotal: 1100,
      total: 1100,
      status: 'PAID',
      items: {
        create: [
          { description: 'Consultation — Dr. Amit Trivedi (Gastroenterology)', quantity: 1, unitPrice: 1100, subtotal: 1100 }
        ]
      }
    }
  });
  await prisma.payment.create({
    data: {
      billId: todayBill.id,
      amount: 1100,
      currency: 'INR',
      razorpayOrderId: 'mock_order_today',
      razorpayPaymentId: 'mock_payment_today',
      status: 'SUCCESS',
    }
  });
  await prisma.queueToken.create({
    data: {
      appointmentId: myAppt.id,
      doctorId: busyDoctorId,
      hospitalId: busyHospitalId,
      queueDate: todayObj,
      tokenNumber: 21,
      status: 'WAITING',
    }
  });

  // Create 6 more dummy appointments AFTER demo patient (Tokens #22–27)
  for (let i = 20; i < 26; i++) {
    currentTokenTime.setUTCMinutes(currentTokenTime.getUTCMinutes() + 15);
    const timeStr = `${String(currentTokenTime.getUTCHours()).padStart(2, '0')}:${String(currentTokenTime.getUTCMinutes()).padStart(2, '0')}`;
    const a = await prisma.appointment.create({
      data: {
        patientId: dummyPatients[i],
        doctorId: busyDoctorId,
        hospitalId: busyHospitalId,
        departmentId: busyDeptId,
        scheduledDate: todayObj,
        scheduledTime: timeStr,
        fee: 1100,
        status: 'CONFIRMED',
      }
    });
    await prisma.queueToken.create({
      data: {
        appointmentId: a.id,
        doctorId: busyDoctorId,
        hospitalId: busyHospitalId,
        queueDate: todayObj,
        tokenNumber: i + 2, // demo took token 21, so after-tokens start at 22
        status: 'WAITING',
      }
    });
  }

  // Upcoming Appointment (Next Week)
  const upcomingDate = getOffsetDate(5, '11:00');
  const upAppt = await prisma.appointment.create({
    data: {
      patientId: demoPatientUser.id,
      doctorId: doctorMap['dr.neha.joshi@sunshine.dev'], // Pediatrician
      hospitalId: 'hosp-sunshine',
      departmentId: hospitalDepts['hosp-sunshine']['Pediatrics'],
      scheduledDate: upcomingDate.dateObj,
      scheduledTime: upcomingDate.timeStr,
      fee: 700,
      status: 'CONFIRMED',
    }
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
        create: [
          { description: 'Consultation — Dr. Neha Joshi (Pediatrics)', quantity: 1, unitPrice: 700, subtotal: 700 }
        ]
      }
    }
  });
  await prisma.payment.create({
    data: {
      billId: upBill.id,
      amount: 700,
      currency: 'INR',
      razorpayOrderId: 'mock_order_future',
      razorpayPaymentId: 'mock_payment_future',
      status: 'SUCCESS',
    }
  });
  await prisma.queueToken.create({
    data: {
      appointmentId: upAppt.id,
      doctorId: doctorMap['dr.neha.joshi@sunshine.dev'],
      hospitalId: 'hosp-sunshine',
      queueDate: upcomingDate.dateObj,
      tokenNumber: 1, // first token of that future day
      status: 'WAITING',
    }
  });

  console.log(`✅ Simulated live queue: Dr. Amit Trivedi is on Token 11, Rahul is Token 21 (27 tokens total).`);
  console.log(`✅ Seed complete! Log in with patient@healthcareplus.dev / Password123!`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
