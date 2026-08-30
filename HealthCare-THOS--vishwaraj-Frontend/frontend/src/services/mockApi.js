/**
 * services/mockApi.js — Interceptor & Mock Data Router for Frontend Standalone UI Mode.
 * Intercepts network calls when running without a backend, allowing all
 * 8 dashboards and UI features to operate fully with rich mock data.
 */

import {
  MOCK_USERS,
  MOCK_HOSPITALS,
  MOCK_DOCTORS,
  MOCK_APPOINTMENTS,
  MOCK_PRESCRIPTIONS,
  MOCK_LAB_REQUESTS,
  MOCK_PHARMACY_ORDERS,
  MOCK_EMERGENCY_REQUESTS,
  MOCK_STAFF,
  MOCK_DEPARTMENTS,
  MOCK_MEDICINES,
  MOCK_LAB_TESTS,
  MOCK_ANALYTICS,
  MOCK_BILLS,
} from '../utils/mockData.js';

// Helper to attach compatibility properties to an array
function createArrayWithProps(arr, propKey) {
  const result = [...arr];
  if (propKey) {
    result[propKey] = result;
  }
  result.total = result.length;
  result.count = result.length;
  return result;
}

export function handleMockRoute(config = {}) {
  const url = config.url || '';
  const method = (config.method || 'get').toLowerCase();

  // 1. Auth Login
  if (url.includes('/auth/login')) {
    let body = {};
    try {
      body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data || {};
    } catch {
      /* ignore */
    }

    const roleKey = (body.role || 'PATIENT').toUpperCase();
    const user = MOCK_USERS[roleKey] || MOCK_USERS.PATIENT;

    return {
      success: true,
      data: {
        user,
        accessToken: 'standalone-frontend-mock-token-' + roleKey,
      },
    };
  }

  // 2. Auth Register
  if (url.includes('/auth/register') || url.includes('/auth/verify-otp')) {
    let body = {};
    try {
      body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data || {};
    } catch {
      /* ignore */
    }
    const user = {
      ...MOCK_USERS.PATIENT,
      fullName: body.fullName || MOCK_USERS.PATIENT.fullName,
      email: body.email || MOCK_USERS.PATIENT.email,
    };
    return {
      success: true,
      data: {
        user,
        accessToken: 'standalone-mock-token-patient',
      },
    };
  }

  // 3. Auth Refresh Token
  if (url.includes('/auth/refresh-token')) {
    return {
      success: true,
      data: {
        accessToken: 'standalone-refreshed-mock-token',
      },
    };
  }

  // 4. Auth Me (Current User)
  if (url.includes('/auth/me')) {
    const rawUser = typeof localStorage !== 'undefined' ? localStorage.getItem('hc_user') : null;
    let user = MOCK_USERS.PATIENT;
    try {
      if (rawUser) user = JSON.parse(rawUser);
    } catch {}

    return {
      success: true,
      data: {
        user,
        ...user,
      },
    };
  }

  // 5. Doctor Profile (/doctors/me)
  if (url.includes('/doctors/me')) {
    const doc = {
      ...MOCK_DOCTORS[0],
      user: { fullName: MOCK_DOCTORS[0].fullName },
      hospital: MOCK_HOSPITALS[0],
    };
    return { success: true, data: doc };
  }

  // 6. Doctors list & search
  if (url.includes('/doctors')) {
    return { success: true, data: createArrayWithProps(MOCK_DOCTORS, 'doctors') };
  }

  // 7. Hospital Profile & List
  if (url.includes('/hospitals/me')) {
    return { success: true, data: MOCK_HOSPITALS[0] };
  }
  if (url.includes('/hospitals')) {
    return { success: true, data: createArrayWithProps(MOCK_HOSPITALS, 'hospitals') };
  }

  // 8. Appointments (patient, doctor, admin)
  if (url.includes('/appointments')) {
    const formattedAppts = MOCK_APPOINTMENTS.map((apt) => ({
      ...apt,
      doctor: {
        id: apt.doctorId || 'doc_anil_456',
        fullName: apt.doctorName || 'Dr. Anil Shah',
        specialization: apt.specialization || 'Cardiology',
        hospital: { id: apt.hospitalId, name: apt.hospitalName || 'Sterling Hospital' },
      },
      queueToken: {
        tokenNumber: apt.tokenNo || 1,
      },
    }));
    const appointmentsArray = createArrayWithProps(formattedAppts, 'appointments');
    return {
      success: true,
      data: appointmentsArray,
    };
  }

  // 8.1 Doctor Availability Slots
  if (url.includes('/availability')) {
    const slots = [
      { time: '09:00', booked: false },
      { time: '09:30', booked: false },
      { time: '10:00', booked: false },
      { time: '10:30', booked: true },
      { time: '11:00', booked: false },
      { time: '11:30', booked: false },
      { time: '14:00', booked: false },
      { time: '14:30', booked: false },
      { time: '15:00', booked: false },
      { time: '15:30', booked: false },
      { time: '16:00', booked: false },
      { time: '16:30', booked: false },
    ];
    return {
      success: true,
      data: {
        allSlots: slots,
        slots: slots.filter((s) => !s.booked).map((s) => s.time),
      },
    };
  }

  // 9. Queue Management & Doctor Queue
  if (url.includes('/queue')) {
    if (url.includes('/my-position')) {
      return {
        success: true,
        data: {
          token: {
            id: 'tok_01',
            tokenNumber: 23,
            status: 'WAITING',
          },
          patientsAhead: 2,
          estimatedWaitMinutes: 15,
          currentlyServing: 21,
        },
      };
    }

    const formattedQueue = MOCK_APPOINTMENTS.map((apt, idx) => ({
      id: 'q_' + apt.id,
      tokenNumber: apt.tokenNo || (idx + 1),
      tokenNo: apt.tokenNo || (idx + 1),
      status: apt.status === 'IN_CONSULTATION' ? 'IN_PROGRESS' : apt.status || 'WAITING',
      appointment: {
        ...apt,
        patient: {
          fullName: apt.patientName || 'Rahul Verma',
          email: apt.patientEmail,
          phone: apt.patientPhone,
        },
        scheduledTime: apt.slotTime || '10:30 AM',
      },
    }));
    const queueList = createArrayWithProps(formattedQueue, 'queue');
    queueList.currentToken = 1;
    queueList.totalInQueue = formattedQueue.length;
    return {
      success: true,
      data: queueList,
    };
  }

  // 10. Consultations
  if (url.includes('/consultations')) {
    const consultations = MOCK_APPOINTMENTS.map((apt, idx) => ({
      id: 'cons_' + apt.id,
      appointmentId: apt.id,
      patientId: apt.patientId,
      patient: { fullName: apt.patientName },
      startedAt: new Date(Date.now() - idx * 3600000).toISOString(),
      status: apt.status === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS',
      symptoms: apt.symptoms || 'Routine checkup & diagnostic consultation',
      diagnosis: 'Clinical review completed. Advised lifestyle management & medication schedule.',
    }));
    return { success: true, data: createArrayWithProps(consultations, 'consultations') };
  }

  // 10.1 Online Consultation Sessions (Phase 16)
  if (url.includes('/online-sessions')) {
    return {
      success: true,
      data: {
        id: 'session_mock_001',
        appointmentId: 'apt_online_01',
        status: 'WAITING_FOR_PARTICIPANTS',
        doctorJoined: true,
        patientJoined: true,
        doctor: {
          name: 'Dr. Anil Shah',
          specialty: 'Cardiology',
        },
        appointment: {
          patientName: 'Rahul Verma',
          scheduledTime: '10:30 AM',
          consultationType: 'ONLINE',
        },
      },
    };
  }

  // 10.2 AI Symptom Triage
  if (url.includes('/ai/triage') || url.includes('/ai')) {
    return {
      success: true,
      data: {
        severity: 'MODERATE',
        recommendedSpecialty: 'General Physician',
        suggestedActions: [
          'Schedule an OPD consultation with a physician within 24 hours',
          'Keep hydration levels optimal (2.5L+ fluids daily)',
          'Monitor body temperature and resting heart rate',
        ],
        possibleCauses: ['Seasonal Viral Syndrome', 'Mild Dehydration'],
        summary: 'Symptoms suggest mild seasonal viral response. Standard OPD clinical review advised.',
      },
    };
  }

  // 11. Prescriptions
  if (url.includes('/prescriptions')) {
    return { success: true, data: createArrayWithProps(MOCK_PRESCRIPTIONS, 'prescriptions') };
  }

  // 12. Lab Requests & Fulfillment
  if (url.includes('/lab-requests') || url.includes('/lab-fulfillment')) {
    return { success: true, data: createArrayWithProps(MOCK_LAB_REQUESTS, 'requests') };
  }

  // 13. Lab Tests Catalog
  if (url.includes('/lab-tests')) {
    return { success: true, data: createArrayWithProps(MOCK_LAB_TESTS, 'tests') };
  }

  // 14. Pharmacy Orders
  if (url.includes('/pharmacy-orders')) {
    return { success: true, data: createArrayWithProps(MOCK_PHARMACY_ORDERS, 'orders') };
  }

  // 15. Medicines Inventory
  if (url.includes('/medicines')) {
    return { success: true, data: createArrayWithProps(MOCK_MEDICINES, 'medicines') };
  }

  // 15.1 Unified Billing & Payments
  if (url.includes('/bills') || url.includes('/billing')) {
    if (url.includes('/revenue')) {
      return {
        success: true,
        data: {
          todayRevenue: 42800,
          weeklyRevenue: 284000,
          monthlyRevenue: 1150000,
        },
      };
    }
    if (url.includes('/pay')) {
      return {
        success: true,
        data: {
          orderId: 'order_mock_' + Date.now(),
          razorpayOrderId: 'order_mock_' + Date.now(),
          amount: 800,
        },
      };
    }
    if (url.includes('/verify')) {
      return {
        success: true,
        data: { verified: true, status: 'COMPLETED' },
        message: 'Payment verified successfully',
      };
    }
    return {
      success: true,
      data: createArrayWithProps(MOCK_BILLS, 'bills'),
    };
  }

  // 15.2 Payments
  if (url.includes('/payments')) {
    return {
      success: true,
      data: {
        paymentId: 'pay_mock_' + Date.now(),
        status: 'COMPLETED',
        verified: true,
      },
    };
  }

  // 16. Driver State & Location (/driver/me)
  if (url.includes('/driver/me')) {
    return {
      success: true,
      data: {
        isOnline: true,
        ambulance: {
          id: 'amb_01',
          vehicleNumber: 'GJ-01-AB-1234',
          hospitalName: 'Sterling Hospital',
        },
        activeRequest: MOCK_EMERGENCY_REQUESTS[0] || null,
        pendingRequests: MOCK_EMERGENCY_REQUESTS,
      },
    };
  }

  // 17. Emergencies & Ambulance List
  if (url.includes('/emergency') || url.includes('/ambulances') || url.includes('/driver/')) {
    const list = createArrayWithProps(MOCK_EMERGENCY_REQUESTS, 'emergencies');
    if (url.includes('/status') && MOCK_EMERGENCY_REQUESTS[0]) {
      return { success: true, data: MOCK_EMERGENCY_REQUESTS[0] };
    }
    if (url.includes('/active')) {
      return { success: true, data: null };
    }
    return { success: true, data: list };
  }

  // 18. Staff & Departments
  if (url.includes('/staff')) {
    return { success: true, data: createArrayWithProps(MOCK_STAFF, 'staff') };
  }
  if (url.includes('/departments')) {
    return { success: true, data: createArrayWithProps(MOCK_DEPARTMENTS, 'departments') };
  }

  // 19. Users (Admin/SuperAdmin)
  if (url.includes('/users')) {
    return { success: true, data: createArrayWithProps(Object.values(MOCK_USERS), 'users') };
  }

  // 20. Analytics
  if (url.includes('/analytics') || url.includes('/dashboard/summary')) {
    return { success: true, data: MOCK_ANALYTICS };
  }

  // 20.1 Notifications
  if (url.includes('/notifications')) {
    const mockNotifs = [
      {
        id: 'notif_1',
        title: 'Appointment Confirmed',
        message: 'Your consultation with Dr. Anil Shah is scheduled for today at 10:30 AM.',
        type: 'APPOINTMENT',
        isRead: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'notif_2',
        title: 'Lab Report Ready',
        message: 'Your Complete Blood Count (CBC) report has been finalized.',
        type: 'LAB_REPORT',
        isRead: true,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
    ];
    return {
      success: true,
      data: {
        notifications: mockNotifs,
        unreadCount: 1,
        total: mockNotifs.length,
      },
    };
  }

  // 21. Passport Timeline
  if (url.includes('/passport/timeline')) {
    const mockEvents = [
      {
        id: 'ev_1',
        eventType: 'CONSULTATION',
        title: 'Cardiology Consultation',
        description: 'Comprehensive cardiac review and ECG assessment with Dr. Anil Shah at Sterling Hospital.',
        doctorName: 'Dr. Anil Shah',
        hospitalName: 'Sterling Hospital',
        date: new Date(Date.now() - 86400000 * 3).toISOString(),
      },
      {
        id: 'ev_2',
        eventType: 'LAB_REPORT',
        title: 'Complete Blood Count (CBC)',
        description: 'Diagnostic report analyzed by Pathology Lab. All blood indices within normal reference range.',
        doctorName: 'Dr. Anil Shah',
        hospitalName: 'Sterling Hospital',
        date: new Date(Date.now() - 86400000 * 7).toISOString(),
      },
      {
        id: 'ev_3',
        eventType: 'PRESCRIPTION',
        title: 'Prescription Dispensed',
        description: 'Medication order fulfilled: Telmisartan 40mg, Atorvastatin 10mg.',
        doctorName: 'Dr. Anil Shah',
        hospitalName: 'Sterling Hospital',
        date: new Date(Date.now() - 86400000 * 14).toISOString(),
      },
      {
        id: 'ev_4',
        eventType: 'APPOINTMENT',
        title: 'Routine General OPD Checkup',
        description: 'Initial intake consultation and vitals recording.',
        doctorName: 'Dr. Sanjay Verma',
        hospitalName: 'Sterling Hospital',
        date: new Date(Date.now() - 86400000 * 30).toISOString(),
      },
    ];
    return {
      success: true,
      data: {
        events: mockEvents,
        total: mockEvents.length,
      },
    };
  }

  // 21.1 Passport Profile
  if (url.includes('/passport')) {
    const passportObj = {
      patient: MOCK_USERS.PATIENT,
      allergies: MOCK_USERS.PATIENT.allergies || ['Penicillin', 'Dust Mites'],
      medicalConditions: MOCK_USERS.PATIENT.chronicConditions || ['Mild Asthma'],
      chronicConditions: MOCK_USERS.PATIENT.chronicConditions || ['Mild Asthma'],
      currentMedications: ['Salbutamol Inhaler (as needed)', 'Vitamin D3 60k IU (weekly)'],
      notes: 'Patient exhibits seasonal allergic rhinitis. Stable vitals.',
      timeline: MOCK_APPOINTMENTS,
      consents: [
        { id: 'c_1', hospitalName: 'Sterling Hospital', grantedAt: '2026-01-15', status: 'ACTIVE' },
      ],
    };
    return {
      success: true,
      data: {
        ...passportObj,
        passport: passportObj,
      },
    };
  }

  // 22. Generic mutations (POST/PUT/PATCH/DELETE)
  if (method === 'post' || method === 'put' || method === 'patch' || method === 'delete') {
    let parsedData = {};
    try {
      parsedData = typeof config.data === 'string' ? JSON.parse(config.data) : config.data || {};
    } catch {
      /* ignore */
    }
    return {
      success: true,
      data: { id: 'mock_' + Date.now(), ...parsedData },
      message: 'Operation succeeded in Standalone UI Mode',
    };
  }

  // Default fallback: empty array with compatibility props
  return { success: true, data: createArrayWithProps([], 'items') };
}
