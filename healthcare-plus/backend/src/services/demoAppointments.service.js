/**
 * services/demoAppointments.service.js — Daily Demo Appointment Maintenance.
 *
 * Automatically maintains realistic baseline appointments for the current day
 * and upcoming days across primary demo doctors and hospitals.
 *
 * Guarantees:
 *  1. REAL PostgreSQL records (Appointment + QueueToken + OnlineSession where applicable).
 *  2. Preserves genuine available slots (including 10:00 AM) for live booking demos.
 *  3. Idempotent: safe to run on startup or repeatedly without duplicate records.
 *  4. Preserves multi-tenant scoping and real patient history.
 *  5. Operates on current date (TODAY / TOMORROW) rather than static historical dates.
 */

import prisma from '../prisma/client.js';
import { toMidnightUTC } from './slotGenerator.service.js';
import { recalculateQueueTokens, emitQueueUpdateById } from './queue.service.js';

/**
 * Returns formatted ISO date string for today + offsetDays in local/IST time.
 * @param {number} offsetDays
 * @returns {string} "YYYY-MM-DD"
 */
export const getDayString = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Main function: Ensure daily demo appointments are populated and balanced.
 */
export const ensureDailyDemoAppointments = async () => {
  try {
    console.log('[DemoAppointments] Checking and maintaining daily demo appointments...');

    // 1. Fetch Demo Doctors
    const sterlingDoctorA = await prisma.doctor.findFirst({
      where: { user: { email: 'dr.anil.shah@sterling.dev' } },
      include: { user: true, hospital: true, department: true },
    });

    const sterlingDoctorB = await prisma.doctor.findFirst({
      where: { user: { email: 'dr.meena.patel@sterling.dev' } },
      include: { user: true, hospital: true, department: true },
    });

    const medantaDoctor = await prisma.doctor.findFirst({
      where: { user: { email: 'dr.arti.gupta@medanta.dev' } },
      include: { user: true, hospital: true, department: true },
    });

    const parulDoctor = await prisma.doctor.findFirst({
      where: { user: { email: 'dr.priti.shah@parul.dev' } },
      include: { user: true, hospital: true, department: true },
    });

    // 2. Fetch Patients
    const rahulVerma = await prisma.user.findUnique({
      where: { email: 'patient@healthcareplus.dev' },
    });

    const dummyPatients = await prisma.user.findMany({
      where: { email: { startsWith: 'dummy' }, role: 'PATIENT' },
      take: 20,
      orderBy: { email: 'asc' },
    });

    if (!rahulVerma || dummyPatients.length === 0) {
      console.warn('[DemoAppointments] Required patients not found in database. Skipping seeding.');
      return;
    }

    // 3. Ensure Rahul Verma has Mental Health consent LEVEL_2 so wellness pages load cleanly
    await prisma.mentalHealthProfile.upsert({
      where: { userId: rahulVerma.id },
      create: { userId: rahulVerma.id, consentLevel: 'LEVEL_2' },
      update: { consentLevel: 'LEVEL_2' },
    }).catch(() => {});

    // Target dates: Today (local and UTC), Tomorrow, and Yesterday (for history)
    const todayStr = getDayString(0);
    const tomorrowStr = getDayString(1);
    const yesterdayStr = getDayString(-1);
    const utcDateStr = new Date().toISOString().slice(0, 10);

    const dateSet = new Set([todayStr, tomorrowStr]);
    if (utcDateStr !== todayStr) dateSet.add(utcDateStr);

    const targetDates = Array.from(dateSet).map((dStr) => ({
      dateStr: dStr,
      isToday: dStr === todayStr || dStr === utcDateStr,
    }));

    // ── DOCTOR A: Dr. Anil Shah (Sterling Hospital — Cardiology) ─────────────
    if (sterlingDoctorA) {
      for (const { dateStr, isToday } of targetDates) {
        const midnight = toMidnightUTC(dateStr);

        // Slots to book for Doctor A:
        // 09:00, 09:30, 10:30, 11:00, 11:30
        // LEAVING AVAILABLE: 09:15, 09:45, 10:00 (DEMO BOOKING SLOT), 10:15, 10:45, 11:15, 11:45, 12:00+
        const plan = [
          { time: '09:00', patientIdx: 0, status: isToday ? 'COMPLETED' : 'CONFIRMED', tokenStatus: isToday ? 'COMPLETED' : 'WAITING', type: 'OFFLINE' },
          { time: '09:30', patientIdx: 1, status: 'CONFIRMED', tokenStatus: isToday ? 'IN_PROGRESS' : 'WAITING', type: 'OFFLINE' },
          { time: '10:30', patientIdx: 2, status: 'CONFIRMED', tokenStatus: 'WAITING', type: 'OFFLINE' },
          { time: '11:00', patientIdx: 3, status: 'CONFIRMED', tokenStatus: 'WAITING', type: 'OFFLINE' },
          { time: '11:30', patientIdx: 4, status: 'CONFIRMED', tokenStatus: 'WAITING', type: 'OFFLINE' },
          { time: '14:30', patientIdx: 5, status: 'CONFIRMED', type: 'ONLINE' },
        ];

        for (const item of plan) {
          const patientUser = dummyPatients[item.patientIdx % dummyPatients.length];

          // Check if appointment already exists at this doctor + date + time
          const existing = await prisma.appointment.findFirst({
            where: {
              doctorId: sterlingDoctorA.id,
              scheduledDate: midnight,
              scheduledTime: item.time,
            },
          });

          if (!existing) {
            const appt = await prisma.appointment.create({
              data: {
                patientId: patientUser.id,
                doctorId: sterlingDoctorA.id,
                hospitalId: sterlingDoctorA.hospitalId,
                departmentId: sterlingDoctorA.departmentId,
                scheduledDate: midnight,
                scheduledTime: item.time,
                fee: sterlingDoctorA.consultationFee,
                status: item.status,
                appointmentType: 'REGULAR',
                consultationType: item.type,
              },
            });

            // Create QueueToken for OFFLINE appointments
            if (item.type === 'OFFLINE') {
              await prisma.queueToken.create({
                data: {
                  appointmentId: appt.id,
                  doctorId: sterlingDoctorA.id,
                  hospitalId: sterlingDoctorA.hospitalId,
                  queueDate: midnight,
                  tokenNumber: 999,
                  status: item.tokenStatus,
                  ...(item.tokenStatus === 'IN_PROGRESS' ? { calledAt: new Date(Date.now() - 10 * 60 * 1000), consultationStartAt: new Date(Date.now() - 5 * 60 * 1000) } : {}),
                  ...(item.tokenStatus === 'COMPLETED' ? { calledAt: new Date(Date.now() - 40 * 60 * 1000), consultationStartAt: new Date(Date.now() - 35 * 60 * 1000), completedAt: new Date(Date.now() - 15 * 60 * 1000) } : {}),
                },
              });
            } else if (item.type === 'ONLINE') {
              const [h, m] = item.time.split(':').map(Number);
              const start = new Date(midnight);
              start.setUTCHours(h, m, 0, 0);
              const end = new Date(start.getTime() + 30 * 60 * 1000);
              await prisma.onlineSession.create({
                data: {
                  appointmentId: appt.id,
                  scheduledStart: start,
                  scheduledEnd: end,
                  status: 'SCHEDULED',
                },
              });
            }
          }
        }

        // Add a Lite Fractional Appointment (T-3.5) for follow-up review
        const existingLite = await prisma.appointment.findFirst({
          where: {
            doctorId: sterlingDoctorA.id,
            scheduledDate: midnight,
            appointmentType: 'LITE',
          },
        });
        if (!existingLite) {
          const litePatient = dummyPatients[6 % dummyPatients.length];
          const liteAppt = await prisma.appointment.create({
            data: {
              patientId: litePatient.id,
              doctorId: sterlingDoctorA.id,
              hospitalId: sterlingDoctorA.hospitalId,
              departmentId: sterlingDoctorA.departmentId,
              scheduledDate: midnight,
              scheduledTime: '10:45',
              fee: 250,
              status: 'CONFIRMED',
              appointmentType: 'LITE',
              consultationType: 'OFFLINE',
            },
          });
          await prisma.queueToken.create({
            data: {
              appointmentId: liteAppt.id,
              doctorId: sterlingDoctorA.id,
              hospitalId: sterlingDoctorA.hospitalId,
              queueDate: midnight,
              tokenNumber: 3.5,
              status: 'WAITING',
            },
          });
        }

        // Recalculate tokens sequentially (fractional tokens like 3.5 are preserved)
        await recalculateQueueTokens(sterlingDoctorA.id, midnight);
        try {
          await emitQueueUpdateById(sterlingDoctorA.id, midnight);
        } catch (_) {}
      }
    }

    // ── DOCTOR B: Dr. Meena Patel (Sterling Hospital — Neurology) ─────────────
    if (sterlingDoctorB) {
      for (const { dateStr, isToday } of targetDates) {
        const midnight = toMidnightUTC(dateStr);

        const plan = [
          // If today, give Rahul Verma a completed appointment with Dr. Meena Patel
          // so Rahul's "My Appointments" has realistic history!
          { time: '09:00', isRahul: isToday, patientIdx: 6, status: isToday ? 'COMPLETED' : 'CONFIRMED', tokenStatus: isToday ? 'COMPLETED' : 'WAITING', type: 'OFFLINE' },
          { time: '10:00', isRahul: false, patientIdx: 7, status: 'CONFIRMED', tokenStatus: 'WAITING', type: 'OFFLINE' },
          { time: '11:00', isRahul: false, patientIdx: 8, status: 'CONFIRMED', tokenStatus: 'WAITING', type: 'OFFLINE' },
        ];

        for (const item of plan) {
          const patientId = item.isRahul ? rahulVerma.id : dummyPatients[item.patientIdx % dummyPatients.length].id;

          const existing = await prisma.appointment.findFirst({
            where: {
              doctorId: sterlingDoctorB.id,
              scheduledDate: midnight,
              scheduledTime: item.time,
            },
          });

          if (!existing) {
            const appt = await prisma.appointment.create({
              data: {
                patientId,
                doctorId: sterlingDoctorB.id,
                hospitalId: sterlingDoctorB.hospitalId,
                departmentId: sterlingDoctorB.departmentId,
                scheduledDate: midnight,
                scheduledTime: item.time,
                fee: sterlingDoctorB.consultationFee,
                status: item.status,
                appointmentType: 'REGULAR',
                consultationType: item.type,
              },
            });

            await prisma.queueToken.create({
              data: {
                appointmentId: appt.id,
                doctorId: sterlingDoctorB.id,
                hospitalId: sterlingDoctorB.hospitalId,
                queueDate: midnight,
                tokenNumber: 999,
                status: item.tokenStatus,
                ...(item.tokenStatus === 'COMPLETED' ? { calledAt: new Date(Date.now() - 60 * 60 * 1000), completedAt: new Date(Date.now() - 30 * 60 * 1000) } : {}),
              },
            });
          }
        }

        await recalculateQueueTokens(sterlingDoctorB.id, midnight);
      }
    }

    // ── DOCTOR C: Dr. Arti Gupta (Medanta) ───────────────────────────────────
    if (medantaDoctor) {
      for (const { dateStr, isToday } of targetDates) {
        const midnight = toMidnightUTC(dateStr);

        // Give Rahul Verma 1 upcoming appointment tomorrow at Medanta
        const plan = [
          { time: '09:30', isRahul: false, patientIdx: 9, status: 'CONFIRMED', tokenStatus: 'WAITING' },
          { time: '11:00', isRahul: !isToday, patientIdx: 10, status: 'CONFIRMED', tokenStatus: 'WAITING' },
        ];

        for (const item of plan) {
          const patientId = item.isRahul ? rahulVerma.id : dummyPatients[item.patientIdx % dummyPatients.length].id;

          const existing = await prisma.appointment.findFirst({
            where: {
              doctorId: medantaDoctor.id,
              scheduledDate: midnight,
              scheduledTime: item.time,
            },
          });

          if (!existing) {
            const appt = await prisma.appointment.create({
              data: {
                patientId,
                doctorId: medantaDoctor.id,
                hospitalId: medantaDoctor.hospitalId,
                departmentId: medantaDoctor.departmentId,
                scheduledDate: midnight,
                scheduledTime: item.time,
                fee: medantaDoctor.consultationFee,
                status: item.status,
                appointmentType: 'REGULAR',
                consultationType: 'OFFLINE',
              },
            });

            await prisma.queueToken.create({
              data: {
                appointmentId: appt.id,
                doctorId: medantaDoctor.id,
                hospitalId: medantaDoctor.hospitalId,
                queueDate: midnight,
                tokenNumber: 999,
                status: item.tokenStatus,
              },
            });
          }
        }

        await recalculateQueueTokens(medantaDoctor.id, midnight);
      }
    }

    // ── DOCTOR D: Dr. Priti Shah (Parul Sevashram) ───────────────────────────
    if (parulDoctor) {
      for (const { dateStr } of targetDates) {
        const midnight = toMidnightUTC(dateStr);

        const plan = [
          { time: '09:00', patientIdx: 11, status: 'CONFIRMED', tokenStatus: 'WAITING' },
          { time: '10:00', patientIdx: 12, status: 'CONFIRMED', tokenStatus: 'WAITING' },
        ];

        for (const item of plan) {
          const patientUser = dummyPatients[item.patientIdx % dummyPatients.length];

          const existing = await prisma.appointment.findFirst({
            where: {
              doctorId: parulDoctor.id,
              scheduledDate: midnight,
              scheduledTime: item.time,
            },
          });

          if (!existing) {
            const appt = await prisma.appointment.create({
              data: {
                patientId: patientUser.id,
                doctorId: parulDoctor.id,
                hospitalId: parulDoctor.hospitalId,
                departmentId: parulDoctor.departmentId,
                scheduledDate: midnight,
                scheduledTime: item.time,
                fee: parulDoctor.consultationFee,
                status: item.status,
                appointmentType: 'REGULAR',
                consultationType: 'OFFLINE',
              },
            });

            await prisma.queueToken.create({
              data: {
                appointmentId: appt.id,
                doctorId: parulDoctor.id,
                hospitalId: parulDoctor.hospitalId,
                queueDate: midnight,
                tokenNumber: 999,
                status: item.tokenStatus,
              },
            });
          }
        }

        await recalculateQueueTokens(parulDoctor.id, midnight);
      }
    }

    // ── DEMO LAB REQUEST: Rahul Verma at Sterling Hospital (PROCESSING) ───────
    if (sterlingDoctorA && rahulVerma) {
      const existingLabReq = await prisma.labRequest.findFirst({
        where: {
          patientId: rahulVerma.id,
          hospitalId: sterlingDoctorA.hospitalId,
          status: { in: ['PROCESSING', 'SAMPLE_COLLECTED'] },
        },
      });

      if (!existingLabReq) {
        // Find or create an appointment + consultation for Rahul Verma with sterlingDoctorA
        let consult = await prisma.consultation.findFirst({
          where: {
            patientId: rahulVerma.id,
            doctorId: sterlingDoctorA.id,
          },
        });

        if (!consult) {
          let appt = await prisma.appointment.findFirst({
            where: {
              patientId: rahulVerma.id,
              doctorId: sterlingDoctorA.id,
            },
          });

          if (!appt) {
            appt = await prisma.appointment.create({
              data: {
                patientId: rahulVerma.id,
                doctorId: sterlingDoctorA.id,
                hospitalId: sterlingDoctorA.hospitalId,
                departmentId: sterlingDoctorA.departmentId,
                scheduledDate: toMidnightUTC(targetDates[0].dateStr),
                scheduledTime: '08:30',
                fee: sterlingDoctorA.consultationFee,
                status: 'COMPLETED',
                appointmentType: 'REGULAR',
                consultationType: 'OFFLINE',
              },
            });
          }

          consult = await prisma.consultation.create({
            data: {
              appointmentId: appt.id,
              patientId: rahulVerma.id,
              doctorId: sterlingDoctorA.id,
              hospitalId: sterlingDoctorA.hospitalId,
              status: 'COMPLETED',
              symptoms: 'Fatigue and periodic headaches',
              diagnosis: 'Evaluation of metabolic parameters',
            },
          });
        }

        await prisma.labRequest.create({
          data: {
            consultationId: consult.id,
            patientId: rahulVerma.id,
            doctorId: sterlingDoctorA.id,
            hospitalId: sterlingDoctorA.hospitalId,
            status: 'PROCESSING',
            priority: 'ROUTINE',
            notes: 'Diagnostic workup for lipid and metabolic parameters.',
            items: {
              create: [
                {
                  testName: 'Complete Blood Count (CBC)',
                  estimatedPrice: 350,
                },
                {
                  testName: 'Serum Creatinine',
                  estimatedPrice: 150,
                },
              ],
            },
          },
        });
        console.log('[DemoAppointments] Seeded active PROCESSING lab request for Rahul Verma.');
      }
    }

    console.log('[DemoAppointments] ✅ Daily demo appointments verified and up-to-date.');
  } catch (err) {
    console.error('[DemoAppointments] Error during daily demo appointment maintenance:', err);
  }
};
