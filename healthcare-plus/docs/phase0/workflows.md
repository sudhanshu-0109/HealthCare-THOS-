# healthcare+ — Core Workflow Diagrams

---

## 1. Patient Registration

```
START
  │
  ▼
User visits /register
  │
  ├──[Chooses Email/Password path]──────────────────────────────────────────┐
  │                                                                          │
  │  Fill in: fullName, email, password, confirmPassword                    │
  │    │                                                                     │
  │    ▼                                                                     │
  │  Client validation                                                       │
  │    ├── FAIL → Show inline errors → User corrects → Retry               │
  │    └── PASS                                                              │
  │         │                                                                │
  │         ▼                                                                │
  │  POST /api/auth/register                                                 │
  │    ├── 400 Email already registered → Show error → Redirect /login      │
  │    └── 201 User created (isEmailVerified=false)                          │
  │         │                                                                │
  │         ▼                                                                │
  │  [Email flow — see Workflow 2]                                           │
  │                                                                          │
  └──[Chooses Google OAuth path]────────────────────────────────────────────┘
                                                                             │
       User clicks [Continue with Google]                                    │
         │                                                                   │
         ▼                                                                   │
       Google OAuth consent screen                                           │
         ├── User denies → Redirect to /register with error toast           │
         └── User allows → Google returns id_token                          │
              │                                                              │
              ▼                                                              │
            POST /api/auth/google { id_token }                              │
              ├── Token invalid → 401 → Show error                          │
              └── Valid                                                      │
                   ├── Existing user (googleId matches) → issue JWT → /dashboard
                   └── New user → create User (isEmailVerified=true) → issue JWT → /dashboard
                                                                             │
[Email Path] ──────────────────────────────────────────────────────────────┘
  Redirect to "Check your email" screen
  Timer: verification link expires in 24h
END
```

---

## 2. Email Verification

```
START — User receives verification email
  │
  ▼
User clicks link: GET /api/auth/verify-email/:token
  │
  ├── Token not found in DB → 400 "Link invalid" → Show error page
  │     │
  │     └── [Resend option] → POST /api/auth/resend-verification
  │           ├── Email already verified → 400 "Already verified"
  │           └── OK → New token issued → New email sent → Show "Email sent" toast
  │
  ├── Token found but expired (> 24h) → 400 "Link expired"
  │     │
  │     └── [Resend option] → same as above
  │
  └── Token valid & not expired
        │
        ▼
      Set isEmailVerified=true, delete token from DB
        │
        ▼
      Issue JWT → redirect to /dashboard
        │
        ▼
      Toast: "Email verified! Welcome to healthcare+"
END
```

---

## 3. Hospital Discovery → Hospital Workspace Entry

```
START — Logged-in PATIENT on /dashboard
  │
  ▼
Search bar: patient types city/hospital name/specialty
  │
  ▼
GET /api/hospitals?search=&city=&specialty=&page=
  │
  ├── No results → EmptyState: "No hospitals found. Try a different search."
  └── Results returned (list with distance, crowdLevel, rating)
        │
        ▼
      Patient clicks on a Hospital card
        │
        ▼
      GET /api/hospitals/:hospitalId (fetch full detail)
        ├── 404 Hospital not found → redirect /dashboard with toast
        └── 200 OK → navigate to /hospitals/:hospitalId
              │
              ▼
            Hospital Workspace renders:
              - Department tabs
              - Doctor listings per department
              - Pharmacy / Lab / Billing links
              │
              ▼
            [User chooses a doctor and clicks Book]
              └── → Workflow 4 (Appointment Booking)
END
```

---

## 4. Appointment Booking → Payment → Queue Token

```
START — Patient on /hospitals/:hospitalId/doctors/:doctorId/book
  │
  ▼
GET /api/doctors/:doctorId/availability → Show available slots
  │
  ├── No slots today → "No availability today" → show next available date
  └── Slots shown → patient selects date + time slot
        │
        ▼
      POST /api/appointments { doctorId, hospitalId, slotDate, slotTime, notes? }
        ├── 409 Slot already taken → refresh availability → show error
        ├── 400 Patient has another appointment at same time → show error
        └── 201 Appointment created (status=PENDING_PAYMENT)
              │
              ▼
            Razorpay checkout opened (consultationFee amount)
              ├── Payment cancelled by user → Appointment status=CANCELLED
              │     └── Redirect to /appointments with toast "Booking cancelled"
              ├── Payment failed → retry prompt (2 retries max)
              │     └── 3rd failure → Appointment status=CANCELLED → toast "Payment failed"
              └── Payment success → POST /api/payments/verify (Razorpay signature)
                    ├── Signature invalid → 400 "Payment verification failed" → flag for manual review
                    └── Signature valid
                          │
                          ▼
                        Appointment status=CONFIRMED
                        QueueToken created (position = last+1)
                        Notification sent to patient (SMS/email)
                          │
                          ▼
                        Redirect to /appointments/:id/queue
                        Show queue position + estimated wait time
END
```

---

## 5. Queue Progression (Patient Side + Doctor Side)

```
PATIENT SIDE:
  Patient on /appointments/:id/queue
    │
    ▼
  Socket.IO joins room: `queue:{doctorId}:{date}`
    │
    ├── Real-time update: position number decrements as doctor calls next
    ├── Notification: "You're next!" (when 2 ahead)
    └── Status changes:
          WAITING → IN_PROGRESS (when doctor starts this patient's consultation)
            └── Patient sees "You're with the doctor now"
          IN_PROGRESS → DONE
            └── Patient redirected to view consultation/prescription

DOCTOR SIDE:
  Doctor on /doctor/queue
    │
    ▼
  Socket.IO joins room: `queue:{doctorId}:{date}`
    │
    ▼
  Sees list: #1 (current), #2, #3...
    │
    ├── [Start Consultation] → PATCH /api/queue/:tokenId/start
    │     └── QueueToken status=IN_PROGRESS, Appointment status=IN_CONSULTATION
    │
    ├── [Complete Consultation] → PATCH /api/queue/:tokenId/complete
    │     └── QueueToken status=DONE, socket emit queue-advanced to all waiting patients
    │
    ├── [Skip] → PATCH /api/queue/:tokenId/skip
    │     └── QueueToken status=SKIPPED, patient notified
    │     └── Edge case: patient who was skipped can re-enter queue at current position+1
    │
    └── [Call Next] → moves pointer to next WAITING token
          └── Edge case: no more tokens → "Queue empty for today" state shown
```

---

## 6. Doctor Consultation → Prescription / Lab Request Branch

```
START — Doctor on /doctor/consultation/:appointmentId
  │
  ▼
GET /api/consultations/:appointmentId → load patient info, passport (if consent granted)
  │
  ├── Patient passport consent not granted → show "Passport not accessible"
  │     └── Doctor can request consent (triggers notification to patient)
  │
  └── Data loaded → Doctor fills consultation form:
        - Chief complaint, examination notes, diagnosis
        │
        ▼
      Doctor chooses branch:

      ┌─── [Add Prescription] ──────────────────────────────────────────────┐
      │  Search medicine catalog → add items (medicine, dosage, duration)   │
      │  POST /api/prescriptions { consultationId, items[] }               │
      │    ├── 400 Medicine not in catalog → "Add custom medicine" option  │
      │    └── 201 Prescription created                                     │
      │         └── → patient notified → can confirm PharmacyOrder         │
      └─────────────────────────────────────────────────────────────────────┘

      ┌─── [Add Lab Request] ───────────────────────────────────────────────┐
      │  Search lab test catalog → add tests                                │
      │  POST /api/lab-requests { consultationId, items[] }                │
      │    ├── 400 Test not in catalog → show error                        │
      │    └── 201 LabRequest created → Lab staff notified                 │
      │         └── patient can proceed to lab                              │
      └─────────────────────────────────────────────────────────────────────┘

      ┌─── [Neither / Refer] ───────────────────────────────────────────────┐
      │  Doctor adds referral notes, completes consultation                 │
      └─────────────────────────────────────────────────────────────────────┘

  POST /api/consultations/:id/complete
    └── Appointment status=COMPLETED, Healthcare Passport updated
END
```

---

## 7. Pharmacy Order Lifecycle

```
START — Patient receives prescription (status=PENDING)
  │
  ▼
Patient on /pharmacy/orders → sees prescription
  │
  ├── Patient clicks [Order Medicines]
  │     │
  │     ▼
  │   POST /api/pharmacy-orders/from-prescription { prescriptionId }
  │     └── PharmacyOrder created (status=PENDING)
  │
  └── Patient skips → Prescription remains without PharmacyOrder

PharmacyOrder lifecycle:
  PENDING → Pharmacist sees order in /pharmacy/dashboard
    │
    ├── Pharmacist clicks [Confirm] → status=CONFIRMED
    │
    ├── Pharmacist clicks [Start Preparing] → status=PREPARING
    │
    ├── Pharmacist clicks [Packed] → status=PACKED → patient notified "Ready for pickup"
    │
    ├── Pharmacist clicks [Ready] → status=READY
    │
    └── Pharmacist clicks [Complete] → status=COMPLETED
          └── Bill generated for pharmacy order (added to Bill)

Edge cases:
  - Medicine out of stock → Pharmacist marks item as unavailable → patient notified
  - Patient cancels order (only when status=PENDING) → status=CANCELLED
END
```

---

## 8. Laboratory Request Lifecycle

```
START — Lab request created from consultation (status=PENDING)
  │
  ▼
Lab staff on /lab/dashboard → sees pending requests
  │
  ├── Lab staff clicks [Accept Request] → status=SAMPLE_COLLECTED
  │
  ├── Tests run → status=PROCESSING
  │
  ├── Lab staff uploads report PDF/image → POST /api/lab-reports { labRequestId, fileUrl, findings }
  │     ├── Validation: file must be PDF or image, max 10MB
  │     └── 201 LabReport created → status=REPORT_READY
  │           └── Patient and doctor notified
  │
  └── Edge cases:
        - Sample rejected (quality issue) → status=REJECTED → new request required
        - Test not available at this lab → status=UNAVAILABLE → patient notified
END
```

---

## 9. Healthcare Passport Update Triggers

```
Events that write to a patient's HealthcarePassport:

1. Consultation COMPLETED
   └── Appends: diagnosis, doctor, hospital, date

2. Prescription CREATED
   └── Appends: medicines, dosage, prescribing doctor, date

3. Lab Report REPORT_READY
   └── Appends: test name, result summary, report reference, date

4. Allergy recorded by doctor during consultation
   └── Appends to: allergyList[]

5. Chronic condition flagged by doctor
   └── Appends to: chronicConditions[]

6. Patient manually updates personal health info via /passport
   └── Updates: bloodGroup, emergencyContact, height, weight

7. Vaccination recorded by hospital staff
   └── Appends to: vaccinationHistory[]

Passport consent flow:
  - Doctor requests consent → Patient receives notification
  - Patient grants → PassportConsent record created (doctorId + optional expiry)
  - Patient revokes → PassportConsent soft-deleted → doctor loses read access
```

---

## 10. Emergency SOS → Ambulance Dispatch → Fallback to 108

```
START — Patient holds SOS button (3 seconds) on /emergency or dashboard
  │
  ▼
Browser prompts location access
  ├── Denied → "Location required for SOS" → manual address input form
  └── Granted → GPS coordinates captured
        │
        ▼
      POST /api/emergency-requests { lat, lng, description? }
        ├── 401 Not logged in → redirect to /login (SOS is preserved in session storage)
        └── 201 EmergencyRequest created (status=PENDING)
              │
              ▼
            Socket.IO emits to all HOSPITAL_ADMIN/AMBULANCE_DRIVER in radius
              │
              ├── Ambulance accepts within 2 minutes
              │     │
              │     ▼
              │   EmergencyRequest updated: status=DISPATCHED, ambulanceId assigned
              │   Patient sees: ambulance ETA + driver contact
              │     │
              │     ▼
              │   Driver en route → status=EN_ROUTE
              │   Driver arrives → status=ARRIVED
              │   Case complete → status=COMPLETED
              │
              └── No ambulance accepts within 2 minutes (timeout)
                    │
                    ▼
                  Fallback: Patient shown [Call 108] button prominently
                  EmergencyRequest status=ESCALATED_TO_108
                  Patient and nearest hospital admin notified of escalation
END
```

---

## 11. Lite Appointment Insertion into Active Queue

```
START — Receptionist or Hospital Admin creating a walk-in / lite appointment
  │
  ▼
POST /api/appointments/lite { doctorId, patientId (optional), patientName, patientPhone, date }
  │
  ├── Doctor not on duty today → 400 "Doctor not scheduled today"
  ├── Doctor's queue capacity reached (configurable max) → 409 "Queue full"
  └── 201 Appointment created (status=CONFIRMED, no payment step)
        │
        ▼
      QueueToken created immediately (position = last+1)
        │
        ▼
      If patient is registered user: notification sent
      If walk-in (no userId): token number printed / shown on screen
        │
        ▼
      Socket.IO emits queue-updated to doctor's queue room
        │
        ▼
      Doctor sees new token appear in real time
END
```

---

## 12. Hospital Admin Operational Loop

```
START — Hospital Admin logs in → /admin/dashboard
  │
  ▼
Daily overview loaded:
  - Today's appointment count
  - Active doctors
  - Revenue summary
  - Queue load, pharmacy pending, lab pending, emergency active
  │
  ┌── SETUP LOOP (initial configuration or changes) ───────────────────────┐
  │                                                                          │
  │  [Manage Departments] → /admin/departments                             │
  │    POST /api/departments → create new department                       │
  │    PATCH /api/departments/:id → rename / deactivate                    │
  │                                                                          │
  │  [Manage Doctors] → /admin/doctors                                     │
  │    POST /api/doctors → invite doctor (creates User + Doctor profile)   │
  │    PATCH /api/doctors/:id → update fee, availability toggle            │
  │    DELETE /api/doctors/:id → soft-delete (isActive=false)              │
  │                                                                          │
  │  [Manage Staff] → /admin/staff                                         │
  │    POST /api/staff → invite receptionist/pharmacist/lab staff          │
  │    PATCH /api/staff/:id/role → change role within allowed set          │
  │    DELETE /api/staff/:id → deactivate staff account                    │
  │                                                                          │
  └─────────────────────────────────────────────────────────────────────────┘
  │
  ┌── DAILY OPERATIONS LOOP ───────────────────────────────────────────────┐
  │                                                                          │
  │  Monitor queue load → can manually override queue position              │
  │  Monitor pharmacy orders → can flag/escalate stuck orders               │
  │  Monitor lab requests → can reassign if lab staff absent                │
  │  Monitor emergency requests → assign ambulance manually if needed       │
  │                                                                          │
  │  Billing review → mark bills as paid / apply discounts                  │
  │                                                                          │
  └─────────────────────────────────────────────────────────────────────────┘
  │
  ┌── ANALYTICS ───────────────────────────────────────────────────────────┐
  │                                                                          │
  │  GET /api/analytics?hospitalId=&from=&to=                              │
  │    - Appointments per day/week/month                                    │
  │    - Revenue breakdown (appointments, pharmacy, lab)                    │
  │    - Doctor utilization rates                                           │
  │    - Average queue wait time                                            │
  │    - Department-wise patient distribution                               │
  │                                                                          │
  │  Edge case: Date range > 1 year → capped at 1 year with warning        │
  │                                                                          │
  └─────────────────────────────────────────────────────────────────────────┘
END
```
