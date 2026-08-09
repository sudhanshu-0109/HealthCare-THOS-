import request from 'supertest';
import app from '../../src/app.js';
import prisma from '../../src/prisma/client.js';
import { signAccessToken } from '../../src/utils/jwt.js';

describe('Consultations API (Phase 8)', () => {
  let doctorToken;
  let doctorId;
  let patientId;
  let appointmentId;
  let queueTokenId;
  let hospitalId;

  beforeAll(async () => {
    // 1. Setup a hospital
    const hospital = await prisma.hospital.create({
      data: {
        name: 'Test Hospital for Consult',
        city: 'Vadodara',
        address: 'Test Addr',
        isActive: true,
        latitude: 22.3072,
        longitude: 73.1812,
        contactPhone: '+919999999999',
        contactEmail: 'hospital@test.com',
      },
    });
    hospitalId = hospital.id;

    // 2. Setup a doctor
    const doctorUser = await prisma.user.create({
      data: {
        email: `doc-consult-${Date.now()}@test.com`,
        passwordHash: 'dummy',
        role: 'DOCTOR',
        fullName: 'Dr. Test Consult',
        status: 'ACTIVE',
      },
    });

    const department = await prisma.department.create({
      data: { hospitalId, name: 'General Consult' },
    });

    const doctor = await prisma.doctor.create({
      data: {
        userId: doctorUser.id,
        hospitalId,
        departmentId: department.id,
        specialization: 'General',
        qualification: 'MBBS',
        experienceYears: 10,
        consultationFee: 500,
      },
    });
    doctorId = doctor.id;
    doctorToken = signAccessToken({ sub: doctorUser.id, role: doctorUser.role });

    // 3. Setup a patient
    const patientUser = await prisma.user.create({
      data: {
        email: `pat-consult-${Date.now()}@test.com`,
        passwordHash: 'dummy',
        role: 'PATIENT',
        fullName: 'Patient Consult Test',
        status: 'ACTIVE',
      },
    });
    patientId = patientUser.id;

    const patientProfile = await prisma.patientProfile.create({
      data: {
        userId: patientId,
        dateOfBirth: new Date('1990-01-01'),
        gender: 'MALE',
      },
    });

    // 4. Create Healthcare Passport for patient
    const passport = await prisma.healthcarePassport.create({
      data: {
        patientId,
        allergies: ['Peanuts'],
      },
    });

    // 5. Create Passport Consent
    await prisma.passportConsent.create({
      data: {
        doctorId,
        hospitalId,
        passportId: passport.id,
      },
    });

    // 6. Create an appointment
    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId,
        hospitalId,
        departmentId: department.id,
        scheduledDate: new Date(),
        scheduledTime: '10:00',
        status: 'CONFIRMED', // Paid
        appointmentType: 'REGULAR',
        fee: 500,
      },
    });
    appointmentId = appointment.id;

    // 7. Create a queue token
    const token = await prisma.queueToken.create({
      data: {
        appointmentId,
        hospitalId,
        doctorId,
        queueDate: new Date(new Date().toISOString().split('T')[0] + 'T00:00:00.000Z'),
        tokenNumber: 1,
        status: 'CALLED', // Ready to start
      },
    });
    queueTokenId = token.id;
  });

  afterAll(async () => {
    // Cleanup is tricky with so many relations. We'll rely on global teardown if needed,
    // or just leave it since the test database is reset.
    // For safety, let's at least delete the specific objects we created if possible.
  });

  it('Doctor can start a consultation, which updates queue status and returns passport', async () => {
    const res = await request(app)
      .post('/api/consultations/start')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        appointmentId,
        queueTokenId,
      });

    expect(res.status).toBe(201);
    expect(res.body.consultation).toHaveProperty('id');
    expect(res.body.consultation.status).toBe('IN_PROGRESS');
    
    // Passport summary should be included because we granted consent
    expect(res.body.passportSummary).toBeDefined();
    expect(res.body.passportSummary.allergies).toContain('Peanuts');

    // Verify queue token changed to IN_PROGRESS
    const token = await prisma.queueToken.findUnique({ where: { id: queueTokenId } });
    expect(token.status).toBe('IN_PROGRESS');
  });

  it('Doctor can save clinical notes', async () => {
    // get consultation ID first
    const consultation = await prisma.consultation.findFirst({ where: { queueTokenId } });
    
    const res = await request(app)
      .patch(`/api/consultations/${consultation.id}`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        symptoms: 'Headache',
        diagnosis: 'Migraine',
      });

    expect(res.status).toBe(200);
    expect(res.body.consultation.symptoms).toBe('Headache');
    expect(res.body.consultation.diagnosis).toBe('Migraine');
  });

  it('Doctor can complete a consultation, which marks queue and appointment COMPLETED and writes timeline event', async () => {
    const consultation = await prisma.consultation.findFirst({ where: { queueTokenId } });
    
    const res = await request(app)
      .post(`/api/consultations/${consultation.id}/complete`)
      .set('Authorization', `Bearer ${doctorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.consultation.status).toBe('COMPLETED');

    // Check cascades
    const token = await prisma.queueToken.findUnique({ where: { id: queueTokenId } });
    expect(token.status).toBe('COMPLETED');

    const appt = await prisma.appointment.findUnique({ where: { id: appointmentId } });
    expect(appt.status).toBe('COMPLETED');

    // Check timeline event
    const passportObj = await prisma.healthcarePassport.findUnique({ where: { patientId } });
    const events = await prisma.medicalTimelineEvent.findMany({ where: { passportId: passportObj.id } });
    expect(events.some(e => e.eventType === 'CONSULTATION')).toBe(true);
  });
});
