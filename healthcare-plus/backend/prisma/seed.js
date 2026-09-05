/**
 * prisma/seed.js — Healthcare+ Demo Seeder (Vadodara Real-World Edition)
 *
 * Seeds:
 *  - 47 Geographically accurate Vadodara hospitals
 *  - 131 Doctors across all hospitals (verified + curated demo associations)
 *  - 1 Primary demo patient (Rahul Verma) + 40 named dummy patients
 *  - Doctor availability: 7 days × 2 sessions (AM 09:00–13:00, PM 14:00–18:00)
 *  - Healthcare Passport for demo patient
 *  - Ambulance drivers for Sterling, Sunshine, Bhailal
 *  - Sterling Hospital staff (admin, receptionist, pharmacist, lab)
 *  - Master Lab catalogue
 *
 * Clean Slate Policy:
 *  - ZERO mock or pre-existing appointments
 *  - ZERO queue tokens
 *  - ZERO dummy online sessions
 *  - Every page (Appointments, Queue, Patient Dashboard, Timeline) starts clean as new
 *  - All doctor slots are completely open and ready for live user bookings
 *
 * ⚠️  DEV/STAGING ONLY — All seeded accounts (drivers, patients, staff) exist ONLY in
 *    the local or staging database. These accounts MUST NOT appear in a production database.
 *    The production guard below hard-blocks execution when NODE_ENV=production.
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { hospitalData, doctorData } from './vadodaraHospitalsData.js';
import { seedLabCatalogue } from './seedLabTests.js';

const prisma = new PrismaClient();

// ── MAIN ────────────────────────────────────────────────────────────────────────

async function main() {
  // ── PRODUCTION GUARD ─────────────────────────────────────────────────────────
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      '[SEED] Refusing to seed in NODE_ENV=production. ' +
      'This script creates demo accounts with known passwords and MUST NOT run against a live database.'
    );
  }

  console.log('🌱 Starting HealthCare+ Vadodara Real-World Demo Seed...');

  // ── CLEAR EXISTING DATA ──────────────────────────────────────────────────────
  console.log('🗑️  Clearing existing data...');
  try {
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "users", "hospitals" CASCADE;');
  } catch (rawErr) {
    // Fallback in case of non-postgres or permissions
    await prisma.professionalConnection.deleteMany().catch(() => {});
    await prisma.gratitudeEntry.deleteMany().catch(() => {});
    await prisma.wellnessProgramEnrollment.deleteMany().catch(() => {});
    await prisma.wellnessRecommendation.deleteMany().catch(() => {});
    await prisma.wellnessActivity.deleteMany().catch(() => {});
    await prisma.wellnessProgram.deleteMany().catch(() => {});
    await prisma.wellnessContent.deleteMany().catch(() => {});
    await prisma.trustedContact.deleteMany().catch(() => {});
    await prisma.crisisAction.deleteMany().catch(() => {});
    await prisma.mentalHealthRiskEvent.deleteMany().catch(() => {});
    await prisma.aIRiskAssessment.deleteMany().catch(() => {});
    await prisma.aIConversationMessage.deleteMany().catch(() => {});
    await prisma.aIConversation.deleteMany().catch(() => {});
    await prisma.mentalHealthCheckIn.deleteMany().catch(() => {});
    await prisma.mentalHealthProfile.deleteMany().catch(() => {});
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
    await prisma.onlineSession.deleteMany().catch(() => {});
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
  }
  console.log('✅ Database cleared');

  const defaultPasswordHash = await bcrypt.hash('Password123!', 12);

  // ── SUPER ADMIN ──────────────────────────────────────────────────────────────
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
  console.log('✅ Super Admin created');

  // ── HOSPITALS (44) ───────────────────────────────────────────────────────────
  for (const h of hospitalData) {
    await prisma.hospital.create({ data: h });
  }
  console.log(`✅ Created ${hospitalData.length} Vadodara hospitals`);

  // ── STERLING STAFF ───────────────────────────────────────────────────────────
  const adminUser = await prisma.user.create({
    data: { email: 'admin@sterling.dev', passwordHash: defaultPasswordHash, fullName: 'Vikramaditya Admin', role: 'HOSPITAL_ADMIN', isEmailVerified: true, authProvider: 'LOCAL' },
  });
  await prisma.hospitalAdmin.create({ data: { userId: adminUser.id, hospitalId: 'hosp-sterling' } });

  const receptionistUser = await prisma.user.create({
    data: { email: 'receptionist@sterling.dev', passwordHash: defaultPasswordHash, fullName: 'Anita Roy', role: 'RECEPTIONIST', isEmailVerified: true, authProvider: 'LOCAL' },
  });
  await prisma.receptionist.create({ data: { userId: receptionistUser.id, hospitalId: 'hosp-sterling' } });

  const pharmacistUser = await prisma.user.create({
    data: { email: 'pharmacist@sterling.dev', passwordHash: defaultPasswordHash, fullName: 'Ramesh Gupta', role: 'PHARMACIST', isEmailVerified: true, authProvider: 'LOCAL' },
  });
  await prisma.pharmacist.create({ data: { userId: pharmacistUser.id, hospitalId: 'hosp-sterling' } });

  const labUser = await prisma.user.create({
    data: { email: 'labstaff@sterling.dev', passwordHash: defaultPasswordHash, fullName: 'Suresh Kumar', role: 'LAB_STAFF', isEmailVerified: true, authProvider: 'LOCAL' },
  });
  await prisma.labStaff.create({ data: { userId: labUser.id, hospitalId: 'hosp-sterling' } });
  console.log('✅ Sterling Hospital staff created (Admin, Receptionist, Pharmacist, Lab)');

  // ── AMBULANCE DRIVERS (Sterling, Sunshine, Bhailal) ─────────────────────────
  // DEV-SEED-ONLY: These accounts have a known shared password (Password123!).
  // They do not and must not exist in any production database.
  const ambulanceDriverSeeds = [
    { email: 'driver@sterling.dev', fullName: 'Mahesh Driver', hospitalId: 'hosp-sterling', vehicleNumber: 'GJ-01-AB-1234', lat: 22.3175, lng: 73.1690 },
    { email: 'driver@sunshine.dev', fullName: 'Rajesh Driver', hospitalId: 'hosp-sunshine', vehicleNumber: 'GJ-06-CD-5678', lat: 22.3065, lng: 73.1880 },
    { email: 'driver@bhailal.dev',  fullName: 'Vikram Driver', hospitalId: 'hosp-bhailal',  vehicleNumber: 'GJ-06-EF-9012', lat: 22.3340, lng: 73.1610 },
  ];
  for (const ds of ambulanceDriverSeeds) {
    const dUser = await prisma.user.create({
      data: { email: ds.email, passwordHash: defaultPasswordHash, fullName: ds.fullName, role: 'AMBULANCE_DRIVER', isEmailVerified: true, authProvider: 'LOCAL' },
    });
    const driverRecord = await prisma.ambulanceDriver.create({ data: { userId: dUser.id, hospitalId: ds.hospitalId } });
    await prisma.ambulance.create({
      data: { hospitalId: ds.hospitalId, driverId: driverRecord.id, vehicleNumber: ds.vehicleNumber, isOnline: false, isActive: true, currentLatitude: ds.lat, currentLongitude: ds.lng },
    });
  }
  console.log('✅ 3 Ambulance Drivers seeded (Sterling, Sunshine, Bhailal)');

  // ── DEPARTMENTS (auto-created from hospital specialities) ───────────────────
  // hospitalDepts[hospitalId][deptName] = departmentId
  const hospitalDepts = {};
  for (const h of hospitalData) {
    hospitalDepts[h.id] = {};
    // Collect unique dept names from all doctors for this hospital + hospital specialities
    const allDepts = new Set(h.specialities);
    const hDoctors = doctorData[h.id] || [];
    for (const d of hDoctors) allDepts.add(d.dept);

    for (const deptName of allDepts) {
      const dept = await prisma.department.create({ data: { name: deptName, hospitalId: h.id } });
      hospitalDepts[h.id][deptName] = dept.id;
    }
  }
  console.log('✅ Departments created for all hospitals');

  // ── DOCTORS ──────────────────────────────────────────────────────────────────
  // doctorMap[email] = { docId, hosp, dept, fee }
  const doctorMap = {};
  let totalDoctors = 0;

  for (const [hospId, doctors] of Object.entries(doctorData)) {
    for (const d of doctors) {
      // Ensure department exists (may not be in hospital specialities if it's a sub-specialty)
      if (!hospitalDepts[hospId][d.dept]) {
        const dept = await prisma.department.create({ data: { name: d.dept, hospitalId: hospId } });
        hospitalDepts[hospId][d.dept] = dept.id;
      }

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
          hospitalId: hospId,
          departmentId: hospitalDepts[hospId][d.dept],
          specialization: d.spec,
          experienceYears: d.exp,
          consultationFee: d.fee,
          averageRating: d.rating,
          ...(d.qualification ? { qualification: d.qualification } : {}),
          ...(d.bio ? { bio: d.bio } : {}),
        },
      });

      // Availability: 7 consecutive days × 2 sessions (AM + PM), 15-min slots
      const todayDow = new Date().getDay(); // 0=Sun
      for (let i = 0; i < 7; i++) {
        const dayOfWeek = (todayDow + i) % 7;
        // AM session: 09:00–13:00
        await prisma.doctorAvailability.create({
          data: { doctorId: doc.id, dayOfWeek, startTime: '09:00', endTime: '13:00', slotMinutes: 15 },
        });
        // PM session: 14:00–18:00
        await prisma.doctorAvailability.create({
          data: { doctorId: doc.id, dayOfWeek, startTime: '14:00', endTime: '18:00', slotMinutes: 15 },
        });
      }

      doctorMap[d.email] = { docId: doc.id, hosp: hospId, dept: d.dept, fee: d.fee };
      totalDoctors++;
    }
  }
  console.log(`✅ Created ${totalDoctors} Doctors with 2-session availability (14 availability records each)`);

  // ── PATIENTS ─────────────────────────────────────────────────────────────────
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
        bloodGroup: ['A_POS', 'B_POS', 'O_POS', 'AB_POS', 'O_NEG'][i % 5],
      },
    });
    dummyPatients.push(du.id);
  }
  console.log('✅ Created Primary Patient (Rahul Verma) + 40 Named Dummy Patients');

  // ── HEALTHCARE PASSPORT ──────────────────────────────────────────────────────
  const passport = await prisma.healthcarePassport.create({
    data: {
      patientId: demoPatientUser.id,
      allergies: ['Penicillin', 'Dust Mites'],
      medicalConditions: ['Mild Hypertension', 'Asthma'],
      currentMedications: ['Amlodipine 5mg', 'Salbutamol Inhaler'],
      notes: 'Patient maintains a healthy diet but has occasional asthma flare-ups during winter.',
    },
  });
  await prisma.passportConsent.create({
    data: { passportId: passport.id, hospitalId: 'hosp-sterling' },
  });
  console.log('✅ Healthcare Passport created for Rahul Verma');

  // ── CLEAN STATE: ZERO SEEDED APPOINTMENTS (PAGES CLEAN AS NEW) ──────────────
  // In accordance with the latest requirement: all previous appointment bookings,
  // queue tokens, online sessions, consultations, bills, payments, and medical timeline
  // events are completely omitted. Every patient and doctor page begins clean as new,
  // and all doctor schedules remain fully open for fresh, live bookings.
  console.log('✅ Appointment & Queue system clean (0 seeded bookings — ready for fresh appointments)');

  // ── SEED MASTER LAB CATALOGUE ────────────────────────────────────────────────
  await seedLabCatalogue();

  // ── SUMMARY ──────────────────────────────────────────────────────────────────
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('  HealthCare+ Vadodara Demo Seed — COMPLETED');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  🏥 Hospitals:    ${hospitalData.length} (all Vadodara)`);
  console.log(`  👨‍⚕️ Doctors:      ${totalDoctors}`);
  console.log(`  🧑 Patients:     41 (1 primary + 40 dummy)`);
  console.log('');
  console.log('  DEMO LOGIN CREDENTIALS (password: Password123!)');
  console.log('───────────────────────────────────────────────────────');
  console.log('  👤 Patient:             patient@healthcareplus.dev');
  console.log('  🏥 Admin (Sterling):    admin@sterling.dev');
  console.log('  🩺 Dr. (Sterling-Cardio): dr.anil.shah@sterling.dev');
  console.log('  🩺 Dr. (Sterling-Neuro):  dr.meena.patel@sterling.dev');
  console.log('  🩺 Dr. (Sunshine):      dr.neha.joshi@sunshine.dev');
  console.log('  🩺 Dr. (Bhailal-Gastro): dr.amit.trivedi@bhailal.dev');
  console.log('  🩺 Dr. (Tricolour):     dr.raj.shah@tricolour.dev');
  console.log('  🩺 Dr. (Rhythm):        dr.harish.amin@rhythm.dev');
  console.log('  🩺 Dr. (BAPS):          dr.ashok.vyas@baps.dev');
  console.log('  🩺 Dr. (Welcare):       dr.nisha.shah@welcare.dev');
  console.log('  🩺 Dr. (Isha):          dr.isha.patel@isha.dev');
  console.log('  🩺 Dr. (Bankers):       dr.dilip.banker@bankers.dev');
  console.log('  🚑 Driver (Sterling):   driver@sterling.dev');
  console.log('  🚑 Driver (Sunshine):   driver@sunshine.dev');
  console.log('  🚑 Driver (Bhailal):    driver@bhailal.dev');
  console.log('  💊 Pharmacist:          pharmacist@sterling.dev');
  console.log('  🧪 Lab Staff:           labstaff@sterling.dev');
  console.log('  🔑 Super Admin:         superadmin@healthcareplus.dev');
  console.log('═══════════════════════════════════════════════════════');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
