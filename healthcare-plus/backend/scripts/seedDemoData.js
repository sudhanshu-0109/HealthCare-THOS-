// backend/scripts/seedDemoData.js
// Demo data seeder for HealthCare+ application
// Creates 10 hospitals, 20 doctors (2 per hospital) with a default department, and 500 patients (50 per hospital)

import pkg from "@prisma/client";
import bcrypt from "bcryptjs";

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

async function main() {
  console.log("🟢 Starting demo data seed...");

  const passwordHash = await bcrypt.hash("password123", 10);

  // Helper to create a user
  const createUser = async (email, role, fullName) => {
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        role,
        isEmailVerified: true,
        status: "ACTIVE",
      },
    });
    return user;
  };

  // 1️⃣ Create hospitals and a default department per hospital
  const hospitals = [];
  const departments = [];
  for (let i = 1; i <= 10; i++) {
    const hospital = await prisma.hospital.create({
      data: {
        name: `Hospital ${i}`,
        address: `${i} Medical Ave, City ${i}`,
        city: `City ${i}`,
        latitude: 12.97 + i * 0.01,
        longitude: 77.59 + i * 0.01,
        contactPhone: `+911234567${i.toString().padStart(2, "0")}`,
        contactEmail: `admin${i}@hospital.com`,
        specialities: ["General", "Pediatrics", "Cardiology"],
      },
    });
    hospitals.push(hospital);

    // Create hospital admin user
    const adminUser = await createUser(`admin${i}@hospital.com`, "HOSPITAL_ADMIN", `Hospital ${i} Admin`);
    await prisma.hospitalAdmin.create({
      data: {
        userId: adminUser.id,
        hospitalId: hospital.id,
      },
    });

    // Create a default department (e.g., "General") for the hospital
    const dept = await prisma.department.create({
      data: {
        name: "General",
        hospitalId: hospital.id,
        isActive: true,
      },
    });
    departments.push(dept);
  }

  // 2️⃣ Doctors (2 per hospital, total 20)
  const doctorSpecialities = [
    "Cardiology",
    "Dermatology",
    "Neurology",
    "Pediatrics",
    "Orthopedics",
    "General Medicine",
    "Oncology",
    "Gynecology",
    "Psychiatry",
    "Urology",
  ];
  let doctorIdx = 0;
  for (let hIdx = 0; hIdx < hospitals.length; hIdx++) {
    const hosp = hospitals[hIdx];
    const dept = departments[hIdx];
    for (let d = 0; d < 2; d++) {
      const specialty = doctorSpecialities[doctorIdx % doctorSpecialities.length];
      const fullName = `Dr. ${specialty} ${doctorIdx + 1}`;
      const email = `doctor${doctorIdx + 1}@hospital.com`;
      const user = await createUser(email, "DOCTOR", fullName);

      await prisma.doctor.create({
        data: {
          userId: user.id,
          hospitalId: hosp.id,
          departmentId: dept.id,
          specialization: specialty,
          experienceYears: Math.floor(Math.random() * 20) + 1,
          consultationFee: (Math.random() * 1000 + 500).toFixed(2),
        },
      });
      doctorIdx++;
    }
  }

  // 3️⃣ Patients (50 per hospital = 500 total)
  let patientIdx = 0;
  for (let hIdx = 0; hIdx < hospitals.length; hIdx++) {
    const hosp = hospitals[hIdx];
    for (let p = 0; p < 50; p++) {
      const fullName = `Patient ${patientIdx + 1}`;
      const email = `patient${patientIdx + 1}@example.com`;
      const user = await createUser(email, "PATIENT", fullName);

      await prisma.patientProfile.create({
        data: {
          userId: user.id,
          phone: `+9111122233${(patientIdx % 100).toString().padStart(2, "0")}`,
        },
      });

      await prisma.healthcarePassport.create({
        data: {
          patientId: user.id,
          allergies: ["Penicillin", "Dust Mites"],
          medicalConditions: ["Asthma", "Mild Hypertension"],
          currentMedications: ["Albuterol 90mcg", "Multivitamins"],
          notes: "Regular exercise and low-sodium diet advised.",
        },
      });

      // Create dummy appointments & prescriptions for first 20 patients to have rich demo data!
      if (patientIdx < 20) {
        const docRecord = await prisma.doctor.findFirst({ where: { hospitalId: hosp.id } });
        if (docRecord) {
          const appt = await prisma.appointment.create({
            data: {
              patientId: user.id,
              doctorId: docRecord.id,
              hospitalId: hosp.id,
              departmentId: docRecord.departmentId,
              status: "COMPLETED",
              scheduledDate: new Date(),
              scheduledTime: "10:00 AM",
              fee: 500,
            },
          });

          const qToken = await prisma.queueToken.create({
            data: {
              hospitalId: hosp.id,
              doctorId: docRecord.id,
              tokenNumber: patientIdx + 1,
              queueDate: new Date(),
              status: "COMPLETED",
              appointmentId: appt.id,
            }
          });

          const consult = await prisma.consultation.create({
            data: {
              appointmentId: appt.id,
              queueTokenId: qToken.id,
              doctorId: docRecord.id,
              patientId: user.id,
              hospitalId: hosp.id,
              diagnosis: "Viral upper respiratory infection",
              status: "COMPLETED",
            },
          });

          await prisma.prescription.create({
            data: {
              consultationId: consult.id,
              patientId: user.id,
              doctorId: docRecord.id,
              hospitalId: hosp.id,
              generalInstructions: "Take medicines after meals with warm water.",
              items: {
                create: [
                  { medicineName: "Paracetamol 500mg", dosage: "1 tablet", frequency: "Twice daily", durationDays: 5 },
                  { medicineName: "Cetirizine 10mg", dosage: "1 tablet", frequency: "Once daily at night", durationDays: 3 },
                ]
              }
            }
          });

          await prisma.labRequest.create({
            data: {
              consultationId: consult.id,
              patientId: user.id,
              doctorId: docRecord.id,
              hospitalId: hosp.id,
              priority: "ROUTINE",
              status: "COMPLETED",
              items: {
                create: [
                  { testName: "Complete Blood Count (CBC)" },
                  { testName: "Serum Electrolytes" }
                ]
              }
            }
          });
        }
      }

      patientIdx++;
    }
  }

  console.log(`✅ Seeded ${hospitals.length} hospitals, ${doctorIdx} doctors, and ${patientIdx} patients with rich appointments, prescriptions, & lab records.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
