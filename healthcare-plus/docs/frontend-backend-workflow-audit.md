# HealthCare+ — Frontend ↔ Backend Workflow Audit Report

> **Audit Context**: PERN Stack (React / Vite Frontend, Express / Node Backend, Prisma / PostgreSQL Database, Socket.IO Real-time).  
> **Ground Truth Principle**: Every claim in this document is backed by code line citations from static analysis of the existing codebase. No claim is assumed working based solely on file names or planning documents.

---

## 1. Architecture Overview

### Actual Repository Directory Structure
```
healthcare-plus/
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma (1023 lines, 26 Prisma models, 15 Enums)
│   │   └── seed.js
│   ├── src/
│   │   ├── config/ (cors.js, env.js)
│   │   ├── controllers/ (26 controllers)
│   │   ├── middleware/ (authenticate.js, checkRole.js, errorHandler.js, notFound.js, rateLimiter.js, requestLogger.js, scopeToHospital.js, validate.js)
│   │   ├── prisma/ (client.js)
│   │   ├── routes/ (index.js central router + 29 module routers)
│   │   ├── services/ (33 service modules)
│   │   ├── sockets/ (index.js, emergencyHandlers.js)
│   │   ├── templates/ (email templates)
│   │   ├── utils/ (asyncHandler.js, jwt.js, otp.js, logger.js)
│   │   ├── app.js (Express app configuration & middleware stack)
│   │   └── server.js (HTTP server entrypoint & Socket.IO initialization)
│   └── test-otp.js
├── frontend/
│   ├── public/
│   └── src/
│       ├── assets/
│       ├── components/ (admin, auth, billing, booking, common, consultation, dashboard, emergency, layout, notifications, passport, queue)
│       ├── hooks/ (useAuth.js, useDebounce.js, useDoctorQueue.js, useGeolocation.js, useNotifications.js)
│       ├── layouts/ (DashboardLayout.jsx, PatientLayout.jsx, PublicLayout.jsx)
│       ├── pages/
│       │   ├── admin/ (Analytics.jsx, AuditLog.jsx, Dashboard.jsx, Departments.jsx, Doctors.jsx, QueueMonitor.jsx, Revenue.jsx, Staff.jsx)
│       │   ├── doctor/ (ConsultationScreen.jsx, Dashboard.jsx, PatientProfileView.jsx, Queue.jsx)
│       │   ├── driver/ (Dashboard.jsx)
│       │   ├── lab/ (Dashboard.jsx)
│       │   ├── patient/ (AppointmentConfirmation.jsx, Billing.jsx, Dashboard.jsx, DoctorBooking.jsx, EmergencyTracking.jsx, HospitalWorkspace.jsx, LiveQueue.jsx, MedicalTimeline.jsx, Passport.jsx)
│       │   ├── public/ (AcceptInvite.jsx, ForgotPassword.jsx, Landing.jsx, Login.jsx, Register.jsx, ResetPassword.jsx, VerifyEmail.jsx)
│       │   ├── superadmin/ (Dashboard.jsx, Hospitals.jsx, Users.jsx)
│       │   ├── NotFound.jsx
│       │   └── Unauthorized.jsx
│       ├── router/ (AppRouter.jsx)
│       ├── services/ (20 API service clients including api.js, socket.js)
│       ├── store/ (authStore.js - Zustand persistent store)
│       ├── utils/ (constants.js, roleRedirect.js)
│       ├── App.jsx
│       └── main.jsx
└── docs/
    └── frontend-backend-workflow-audit.md (This Document)
```

### Layer Responsibilities & Flow
1. **Frontend Dispatch**: User interaction triggers handler in a React Page/Component $\rightarrow$ Calls Axios helper in `frontend/src/services/*.service.js` $\rightarrow$ Axios instance (`api.js`) attaches JWT from `localStorage.getItem('hc_token')` and unwraps `response.data` in response interceptor.
2. **HTTP Routing & Middleware**: Request arrives at Express `backend/src/app.js` $\rightarrow$ Mounted at `/api` via `backend/src/routes/index.js` $\rightarrow$ Processed by `authenticate.js` (verifies Bearer JWT), `checkRole.js` (role restriction), `scopeToHospital.js` (extracts `hospitalId` from token or profile), `validate.js` (Zod body schema check).
3. **Controller & Business Logic**: Controller (`backend/src/controllers/*.controller.js`) delegates to Service layer (`backend/src/services/*.service.js`) $\rightarrow$ Executes database transactions/queries via Prisma Client (`backend/src/prisma/client.js`) $\rightarrow$ Updates PostgreSQL.
4. **Real-time Pipeline**: Socket.IO server (`backend/src/sockets/index.js`) authenticates client handshakes using JWT $\rightarrow$ Manages room memberships (`doctor:{doctorId}:{date}`, `user:{userId}`, `patient:{patientId}`, `emergency:{requestId}`, `driver:{userId}`, `hospital:{hospitalId}:queue`) $\rightarrow$ Emits real-time state changes triggered during REST controller service operations.

---

## 2. Role-by-Role Workflow Audit

### 1. Patient Role
- **Auth & Access**: 
  - Login (`Login.jsx:57`, `auth.service.js:login`) calls `POST /api/auth/login` $\rightarrow$ `auth.controller.js:login` $\rightarrow$ `auth.service.js:login` $\rightarrow$ Prisma `User` query $\rightarrow$ returns JWT + User. Persisted in `authStore.js` (`localStorage['hc_token']`). (`✅ Fully Wired`)
  - Registration (`Register.jsx:54`, `auth.service.js:register`) calls `POST /api/auth/register` $\rightarrow$ `auth.controller.js:register` $\rightarrow$ sends 6-digit OTP email (`email.service.js:sendOtpEmail`). (`✅ Fully Wired`)
  - Verification (`VerifyEmail.jsx:32`) calls `POST /api/auth/verify-otp`. Reset password via `ForgotPassword.jsx` & `ResetPassword.jsx`. (`✅ Fully Wired`)
- **Dashboard**: `frontend/src/pages/patient/Dashboard.jsx:45` calls `getDashboardSummary()` (`/api/dashboard/summary`), `getMyAppointments()` (`/api/appointments/my`), `getMyPassport()` (`/api/passport`), `getMyPrescriptions()` (`/api/prescriptions/my`), `getMyLabRequests()` (`/api/lab-requests/my`). Real data loads into summary widgets. (`✅ Fully Wired`)
- **Core Domain Actions**:
  - Hospital search: `HospitalWorkspace.jsx:25` calls `searchHospitals` (`GET /api/hospitals/search`) with lat/lng. (`✅ Fully Wired`)
  - Doctor slot booking: `DoctorBooking.jsx:29` calls `initiateBooking` (`POST /api/appointments`). Returns `{ appointment, bill, order }`. (`🟡 Partially Wired` due to response/params mismatch in payment checkout).
  - Live Queue: `LiveQueue.jsx:28` calls `getMyQueuePosition` (`GET /api/queue/my-position/:appointmentId`). Subscribes to Socket.IO `queue:token-called` & `queue:updated`. (`✅ Fully Wired`)
  - SOS Emergency: `patient.service.js:createEmergencyRequest` calls `POST /api/emergency`. Triggers driver dispatch in `emergencyDispatch.service.js:createAndDispatchEmergency`. (`✅ Fully Wired`)
- **Cross-Role Handoffs**: Doctor completes consultation $\rightarrow$ Prescription created $\rightarrow$ Visible in Patient Dashboard & Healthcare Passport (`MedicalTimeline.jsx:32`). SOS event $\rightarrow$ Emitted to driver room `driver:{driverUserId}` over Socket.IO. (`✅ Fully Wired`)
- **Notifications**: `useNotifications.js:22` polls `/api/notifications/unread-count` & listens on Socket room `user:{userId}`. (`✅ Fully Wired`)
- **Authorization Boundaries**: Server enforces `checkRole('PATIENT')` on `/api/appointments/my`, `/api/passport`, `/api/bills/my`. Patient cannot read other patients' records without explicit consent. (`✅ Fully Wired`)

### 2. Doctor Role
- **Auth & Access**: Login as `DOCTOR`. Routed via `roleRedirect.js` to `/doctor/dashboard`. (`✅ Fully Wired`)
- **Dashboard & Queue**: `frontend/src/pages/doctor/Queue.jsx:32` & `useDoctorQueue.js:18` call `getDoctorQueue` (`GET /api/queue/doctor/:doctorId`). Emits socket event `join-doctor-queue` to join `doctor:{doctorId}:{date}` room. (`✅ Fully Wired`)
- **Core Domain Actions**:
  - Doctor queue controls: `callNext` (`POST /api/queue/call-next`), `startConsultation` (`POST /api/queue/:id/start`), `skipPatient` (`POST /api/queue/:id/skip`), `requeueSkipped` (`POST /api/queue/:id/requeue`). All wired to backend `queue.controller.js` & `queue.service.js`. (`✅ Fully Wired`)
  - Consultation execution: `ConsultationScreen.jsx` starts consultation (`POST /api/consultations/start`), creates prescriptions (`POST /api/prescriptions`), orders lab tests (`POST /api/lab-requests`), recommends follow-ups (`POST /api/follow-ups`), and completes consultation (`POST /api/consultations/:id/complete`). (`✅ Fully Wired`)
  - Patient Passport view: `PatientProfileView.jsx:24` calls `GET /api/passport/:patientId`. Backend checks active consent in `passport.service.js:getDoctorViewPassport`. (`✅ Fully Wired`)
- **Cross-Role Handoffs**: Doctor creates prescription $\rightarrow$ Backend auto-creates `PharmacyOrder` in status `PENDING` (`prescriptions.service.js:85`). Doctor creates lab request $\rightarrow$ Backend creates `LabRequest` in status `PENDING` (`labRequests.service.js:45`). (`✅ Fully Wired`)
- **Authorization Boundaries**: Doctor can only view queue for their assigned hospital & doctor ID. Passport access requires active consent or active consultation. (`✅ Fully Wired`)

### 3. Laboratory Staff Role
- **Auth & Access**: Login as `LAB_STAFF`. Routed via `AppRouter.jsx:119` to `/lab/dashboard`. (`✅ Fully Wired`)
- **Dashboard**: `frontend/src/pages/lab/Dashboard.jsx:16-34` renders hardcoded mock arrays (`PENDING_REQUESTS`, `PROCESSING`, `COMPLETED_TODAY`). It does NOT import or call `labRequests.service.js` or backend `/api/lab-fulfillment` endpoints. (`🔵 Frontend Only`)
- **Core Domain Actions**: Backend has full lab fulfillment implementation in `backend/src/routes/labFulfillment.routes.js` (`GET /api/lab-fulfillment/hospital`, `POST /api/lab-fulfillment/:id/confirm`, `POST /api/lab-fulfillment/:id/upload-report`), but frontend component is purely hardcoded static UI. (`🔴 Backend Only`)
- **Cross-Role Handoffs**: Lab reports uploaded on backend trigger `Notification` and write `MedicalTimelineEvent` (`labFulfillment.service.js:142`), but UI is not connected to trigger this flow. (`⚠️ Broken Wiring`)

### 4. Pharmacist Role
- **Auth & Access**: Login as `PHARMACIST`. Routed via `AppRouter.jsx:125` (`<Route path="/pharmacy/dashboard" element={<LabDashboard />} />`). (`⚠️ Broken Wiring` - renders LabDashboard instead of a Pharmacy dashboard!).
- **Dashboard**: Renders `LabDashboard` component with hardcoded lab mock data. No pharmacy UI exists. (`🔵 Frontend Only`)
- **Core Domain Actions**: Backend contains complete pharmacy order workflow in `backend/src/routes/pharmacyOrders.routes.js` (`GET /api/pharmacy-orders/hospital`, `POST /api/pharmacy-orders/:id/confirm`, `PATCH /api/pharmacy-orders/:id/status`), but zero frontend components exist to call these endpoints. (`🔴 Backend Only`)

### 5. Ambulance Driver Role
- **Auth & Access**: Login as `AMBULANCE_DRIVER`. Routed to `/driver/dashboard`. Auto-joins socket room `driver:{userId}` on connection (`sockets/emergencyHandlers.js:20`). (`✅ Fully Wired`)
- **Dashboard**: `frontend/src/pages/driver/Dashboard.jsx:55` toggles online status via `goOnline` (`POST /api/driver/go-online`) and sends GPS location updates via `updateLocation` (`POST /api/driver/location`). (`✅ Fully Wired`)
- **Core Domain Actions**:
  - Receives real-time SOS modal via socket event `emergency:new-request` (`Dashboard.jsx:45`).
  - Driver accepts via `acceptRequest` (`POST /api/driver/requests/:id/accept`). (`⚠️ Broken Wiring` in response parsing: `if (res.data.success)` tries to read `undefined.success` due to Axios unwrap in `api.js`).
  - Advances state: `markEnRoute` (`POST /api/driver/requests/:id/en-route`), `markPickedUp` (`POST /api/driver/requests/:id/picked-up`), `markArrived` (`POST /api/driver/requests/:id/arrived`). (`✅ Fully Wired` in API service & backend).

### 6. Hospital Admin Role
- **Auth & Access**: Login as `HOSPITAL_ADMIN`. Routed to `/admin/dashboard`. (`✅ Fully Wired`)
- **Dashboard**: `frontend/src/pages/admin/Dashboard.jsx` loads overview stats. Call to `adminService.getDepartments()` (`GET /api/departments`) fails with HTTP 400 because route `GET /api/departments` is unauthenticated and `req.hospitalId` is `undefined`. (`⚠️ Broken Wiring`)
- **Core Domain Actions**:
  - Doctors management: `Doctors.jsx:32` calls `getDoctors` (`GET /api/doctors`) and `inviteDoctor` (`POST /api/doctors/invite`). Note: `GET /api/doctors` is mounted unauthenticated before `scopeToHospital` middleware, returning doctors across ALL hospitals. (`⚠️ Broken Wiring` / Auth Scoping Gap).
  - Staff management: `Staff.jsx:28` calls `getStaff` (`GET /api/staff`) & `inviteStaff` (`POST /api/staff/invite`). (`✅ Fully Wired`)
  - Live Queue Monitor: `QueueMonitor.jsx:15` calls `GET /api/admin/queue/overview` and supports administrative force-skip (`POST /api/admin/queue/:id/force-skip`). (`✅ Fully Wired`)
  - Revenue & Analytics: `Revenue.jsx:18` calls `GET /api/bills/hospital/revenue`. `Analytics.jsx:22` calls `/api/analytics/*`. `AuditLog.jsx:16` calls `/api/audit-log`. (`✅ Fully Wired`)

### 7. Super Admin Role
- **Auth & Access**: Login as `SUPER_ADMIN`. Routed to `/superadmin/dashboard`. (`✅ Fully Wired`)
- **Dashboard**: `frontend/src/pages/superadmin/Dashboard.jsx:35` loads system-wide stats from `GET /api/hospitals`, `GET /api/users`, `GET /api/analytics/dashboard`. (`✅ Fully Wired`)
- **Core Domain Actions**:
  - Hospitals management: `Hospitals.jsx:22` calls `getHospitals` (`GET /api/hospitals`), `createHospital` (`POST /api/hospitals`), `updateHospital` (`PUT /api/hospitals/:id`). (`✅ Fully Wired`)
  - Platform users view: `Users.jsx:15` calls `getUsers` (`GET /api/users`). Backend protected by `checkRole('SUPER_ADMIN')` (`user.routes.js:8`). (`✅ Fully Wired`)

---

## 3. Feature Matrix

| Feature | Role | Frontend Page | Component/Hook | API Service | Method | Endpoint | Backend Route | Middleware | Controller | Service | Prisma Model | DB Verified | Response Shape Matches Frontend | UI Displays It | Status | Evidence (file paths) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **User Login** | All | `Login.jsx` | Form | `auth.service.js` | POST | `/auth/login` | `auth.routes.js:11` | `validate` | `auth.controller.js:114` | `auth.service.js:95` | `User` | Yes | Yes | Yes | ✅ Fully Wired | `frontend/src/pages/public/Login.jsx:57`, `backend/src/controllers/auth.controller.js:114` |
| **User Registration** | Patient | `Register.jsx` | Form | `auth.service.js` | POST | `/auth/register` | `auth.routes.js:10` | `validate` | `auth.controller.js:105` | `auth.service.js:45` | `User`, `PatientProfile` | Yes | Yes | Yes | ✅ Fully Wired | `frontend/src/pages/public/Register.jsx:54`, `backend/src/controllers/auth.controller.js:105` |
| **Email OTP Verify** | Patient | `VerifyEmail.jsx` | `OtpInput` | `auth.service.js` | POST | `/auth/verify-otp` | `auth.routes.js:13` | None | `auth.controller.js:132` | `auth.service.js:140` | `VerificationToken` | Yes | Yes | Yes | ✅ Fully Wired | `frontend/src/pages/public/VerifyEmail.jsx:32`, `backend/src/controllers/auth.controller.js:132` |
| **Google OAuth** | Patient | `Login.jsx` | `GoogleLoginButton` | `auth.service.js` | POST | `/auth/google` | `auth.routes.js:15` | None | `auth.controller.js:160` | `auth.service.js:210` | `User` | Yes | Yes | Yes | ⚪ Manual Verification Required | `frontend/src/components/auth/GoogleLoginButton.jsx:12` (requires live Google Client ID) |
| **Hospital Search** | Patient | `HospitalWorkspace.jsx` | Search Input | `patient.service.js` | GET | `/hospitals/search` | `hospital.routes.js:12` | None | `hospital.controller.js:12` | `hospitalSearch.service.js:10` | `Hospital` | Yes | Yes | Yes | ✅ Fully Wired | `frontend/src/pages/patient/HospitalWorkspace.jsx:25`, `backend/src/controllers/hospital.controller.js:12` |
| **Doctor Slot Fetch** | Patient | `DoctorBooking.jsx` | `SlotPicker` | `availability.service.js` | GET | `/availability/:id/slots` | `availability.routes.js:14` | None | `availability.controller.js:10` | `slotGenerator.service.js:15` | `DoctorAvailability`, `Appointment` | Yes | Yes | Yes | ✅ Fully Wired | `frontend/src/components/booking/SlotPicker.jsx:22`, `backend/src/controllers/availability.controller.js:10` |
| **Appointment Initiate** | Patient | `DoctorBooking.jsx` | Form | `appointments.service.js` | POST | `/appointments` | `appointments.routes.js:16` | `authenticate`, `checkRole` | `appointments.controller.js:15` | `appointments.service.js:45` | `Appointment`, `Bill`, `Payment` | Yes | ⚠️ Mismatch (`res.data.data`) | Yes | ⚠️ Broken Wiring | `frontend/src/pages/patient/DoctorBooking.jsx:34` (`res.data.data` is undefined because `api.js` unwraps Axios `response.data`) |
| **Payment Verification** | Patient | `DoctorBooking.jsx` | `RazorpayCheckout` | `payments.service.js` | POST | `/payments/verify` | `payments.routes.js:13` | `authenticate`, `checkRole` | `payments.controller.js:14` | `billing.service.js:140` | `Bill`, `Payment`, `QueueToken` | Yes | ⚠️ Param Mismatch | Yes | ⚠️ Broken Wiring | `RazorpayCheckout.jsx:64` sends `appointmentId`, controller expects `billId`. `onSuccess(res.data.data)` reads undefined. |
| **Live Queue Tracking** | Patient | `LiveQueue.jsx` | `PatientQueueTracker` | `queue.service.js` | GET | `/queue/my-position/:id` | `queue.routes.js:18` | `authenticate`, `checkRole` | `queue.controller.js:22` | `queue.service.js:180` | `QueueToken`, `Doctor` | Yes | Yes | Yes | ✅ Fully Wired | `frontend/src/pages/patient/LiveQueue.jsx:28`, `backend/src/controllers/queue.controller.js:22` |
| **Emergency SOS Request**| Patient | `Dashboard.jsx` | `SOSButton` | `patient.service.js` | POST | `/emergency` | `emergency.routes.js:14` | `authenticate`, `checkRole` | `emergency.controller.js:12` | `emergencyDispatch.service.js:50` | `EmergencyRequest`, `Ambulance` | Yes | Yes | Yes | ✅ Fully Wired | `frontend/src/pages/patient/Dashboard.jsx:74`, `backend/src/controllers/emergency.controller.js:12` |
| **Emergency Live Track** | Patient | `EmergencyTracking.jsx` | `LiveTrackingMap` | `emergencyDispatch.service.js` | GET | `/emergency/:id/status` | `emergency.routes.js:22` | `authenticate`, `checkRole` | `emergencyDispatch.controller.js:90` | `emergencyDispatch.service.js:340` | `EmergencyRequest`, `Ambulance` | Yes | Yes | Yes | 🟡 Partially Wired | `EmergencyTracking.jsx:34` listens to sockets but never emits `join-emergency-room`, fallback to REST polling. |
| **Passport Read** | Patient | `Passport.jsx` | `PassportSummaryCard` | `passport.service.js` | GET | `/passport` | `passport.routes.js:15` | `authenticate`, `checkRole` | `passport.controller.js:10` | `passport.service.js:15` | `HealthcarePassport` | Yes | Yes | Yes | ✅ Fully Wired | `frontend/src/pages/patient/Passport.jsx:24`, `backend/src/controllers/passport.controller.js:10` |
| **Medical Timeline** | Patient | `MedicalTimeline.jsx` | Timeline List | `passport.service.js` | GET | `/passport/timeline` | `passport.routes.js:17` | `authenticate`, `checkRole` | `passport.controller.js:28` | `passport.service.js:85` | `MedicalTimelineEvent` | Yes | Yes | Yes | ✅ Fully Wired | `frontend/src/pages/patient/MedicalTimeline.jsx:18`, `backend/src/controllers/passport.controller.js:28` |
| **Doctor Queue List** | Doctor | `Queue.jsx` | Queue List | `queue.service.js` | GET | `/queue/doctor/:id` | `queue.routes.js:15` | `authenticate`, `checkRole` | `queue.controller.js:10` | `queue.service.js:45` | `QueueToken`, `Appointment` | Yes | Yes | Yes | ✅ Fully Wired | `frontend/src/pages/doctor/Queue.jsx:32`, `backend/src/controllers/queue.controller.js:10` |
| **Doctor Call Next** | Doctor | `Queue.jsx` | Button | `queue.service.js` | POST | `/queue/call-next` | `queue.routes.js:21` | `authenticate`, `checkRole` | `queue.controller.js:35` | `queue.service.js:310` | `QueueToken` | Yes | Yes | Yes | ✅ Fully Wired | `frontend/src/pages/doctor/Queue.jsx:45`, `backend/src/controllers/queue.controller.js:35` |
| **Start Consultation** | Doctor | `ConsultationScreen.jsx`| Screen Header | `consultations.service.js` | POST | `/consultations/start` | `consultations.routes.js:11` | `requireAuth`, `requireRole` | `consultations.controller.js:10` | `consultations.service.js:20` | `Consultation`, `QueueToken` | Yes | Yes | Yes | ✅ Fully Wired | `frontend/src/pages/doctor/ConsultationScreen.jsx:45`, `backend/src/controllers/consultations.controller.js:10` |
| **Create Prescription** | Doctor | `ConsultationScreen.jsx`| `PrescriptionEditor` | `prescriptions.service.js` | POST | `/prescriptions` | `prescriptions.routes.js:10` | `requireAuth`, `requireRole` | `prescriptions.controller.js:10` | `prescriptions.service.js:15` | `Prescription`, `PharmacyOrder` | Yes | Yes | Yes | ✅ Fully Wired | `frontend/src/components/consultation/PrescriptionEditor.jsx:35`, `backend/src/controllers/prescriptions.controller.js:10` |
| **Create Lab Request** | Doctor | `ConsultationScreen.jsx`| `LabRequestEditor` | `labRequests.service.js` | POST | `/lab-requests` | `labRequests.routes.js:10` | `requireAuth`, `requireRole` | `labRequests.controller.js:10` | `labRequests.service.js:15` | `LabRequest`, `LabRequestItem` | Yes | Yes | Yes | ✅ Fully Wired | `frontend/src/components/consultation/LabRequestEditor.jsx:32`, `backend/src/controllers/labRequests.controller.js:10` |
| **Doctor Passport View**| Doctor | `PatientProfileView.jsx`| Profile View | `passport.service.js` | GET | `/passport/:patientId` | `passport.routes.js:22` | `authenticate`, `checkRole` | `passport.controller.js:45` | `passport.service.js:130` | `HealthcarePassport`, `PassportConsent` | Yes | Yes | Yes | ✅ Fully Wired | `frontend/src/pages/doctor/PatientProfileView.jsx:24`, `backend/src/controllers/passport.controller.js:45` |
| **Lab Requests Queue** | Lab Staff | `LabDashboard.jsx` | Pending Tab | None | None | None | `labFulfillment.routes.js:13` | `authenticate`, `checkRole`, `scopeToHospital` | `bills.controller.js:120` | `labFulfillment.service.js:15` | `LabRequest` | Yes | No | Hardcoded | 🔵 Frontend Only | `frontend/src/pages/lab/Dashboard.jsx:16` (hardcoded array `PENDING_REQUESTS`) |
| **Lab Report Upload** | Lab Staff | `LabDashboard.jsx` | Upload Tab | None | None | None | `labFulfillment.routes.js:17` | `authenticate`, `checkRole`, `scopeToHospital` | `bills.controller.js:140` | `labFulfillment.service.js:120` | `LabReport`, `Notification` | Yes | No | Hardcoded | 🔴 Backend Only | `backend/src/routes/labFulfillment.routes.js:17` exists, frontend form is mock state. |
| **Pharmacy Orders Queue**| Pharmacist | `AppRouter.jsx:125` | `LabDashboard` | None | None | None | `pharmacyOrders.routes.js:18` | `authenticate`, `checkRole`, `scopeToHospital` | `bills.controller.js:60` | `pharmacyOrders.service.js:15` | `PharmacyOrder` | Yes | No | Wrong Component | 🔵 Frontend Only | `AppRouter.jsx:125` routes `/pharmacy/dashboard` to `LabDashboard`. |
| **Driver Go Online** | Driver | `AmbulanceDashboard` | `OnlineToggle` | `emergencyDispatch.service.js` | POST | `/driver/go-online` | `driver.routes.js:13` | `authenticate`, `checkRole` | `emergencyDispatch.controller.js:12` | `emergencyDispatch.service.js:80` | `Ambulance` | Yes | Yes | Yes | ✅ Fully Wired | `frontend/src/pages/driver/Dashboard.jsx:55`, `backend/src/controllers/emergencyDispatch.controller.js:12` |
| **Driver Accept SOS** | Driver | `AmbulanceDashboard` | `IncomingRequestModal` | `emergencyDispatch.service.js` | POST | `/driver/requests/:id/accept` | `driver.routes.js:16` | `authenticate`, `checkRole` | `emergencyDispatch.controller.js:40` | `emergencyDispatch.service.js:180` | `EmergencyRequest`, `Ambulance` | Yes | ⚠️ Mismatch (`res.data.success`) | Yes | ⚠️ Broken Wiring | `AmbulanceDashboard.jsx:75` checks `if (res.data.success)`, which throws TypeError because `res.data` is undefined. |
| **Admin Departments** | Admin | `Dashboard.jsx`, `Departments.jsx` | Dept List | `admin.service.js` | GET | `/departments` | `department.routes.js:12` | None | `department.controller.js:9` | `department.service.js:10` | `Department` | Yes | ⚠️ Missing Param Error | No (Fails 400) | ⚠️ Broken Wiring | `department.routes.js:12` is unauthenticated, missing `scopeToHospital`, causes 400 Bad Request error. |
| **Admin Doctors List** | Admin | `Dashboard.jsx`, `Doctors.jsx` | Doctor List | `admin.service.js` | GET | `/doctors` | `doctor.routes.js:11` | None | `doctor.controller.js:15` | `doctor.service.js:10` | `Doctor` | Yes | ⚠️ Unscoped Data | Yes | ⚠️ Broken Wiring | `doctor.routes.js:11` is mounted before `scopeToHospital`, returns doctors across ALL hospitals. |
| **Admin Staff Invite** | Admin | `Staff.jsx` | Invite Form | `admin.service.js` | POST | `/staff/invite` | `staff.routes.js:14` | `authenticate`, `scopeToHospital`, `checkRole` | `staff.controller.js:16` | `staff.service.js:35` | `User`, `InviteToken` | Yes | Yes | Yes | ✅ Fully Wired | `frontend/src/pages/admin/Staff.jsx:42`, `backend/src/controllers/staff.controller.js:16` |
| **Admin Queue Monitor**| Admin | `QueueMonitor.jsx` | `LiveQueueOverview` | `api.js` | GET | `/admin/queue/overview` | `adminQueue.routes.js:22` | `authenticate`, `checkRole`, `scopeToHospital` | Inline route handler | `queue.service.js:580` | `QueueToken`, `Doctor` | Yes | Yes | Yes | ✅ Fully Wired | `frontend/src/pages/admin/QueueMonitor.jsx:15`, `backend/src/routes/adminQueue.routes.js:22` |
| **Admin Revenue Stats**| Admin | `Revenue.jsx` | Revenue Chart | `billing.service.js` | GET | `/bills/hospital/revenue` | `bills.routes.js:16` | `authenticate`, `checkRole`, `scopeToHospital` | `bills.controller.js:40` | `billing.service.js:210` | `Bill`, `Payment` | Yes | Yes | Yes | ✅ Fully Wired | `frontend/src/pages/admin/Revenue.jsx:18`, `backend/src/controllers/bills.controller.js:40` |
| **Super Admin Hospitals**| SuperAdmin| `Hospitals.jsx` | Hospital Table | `admin.service.js` | GET | `/hospitals` | `hospital.routes.js:11` | None | `hospital.controller.js:8` | `hospital.service.js:10` | `Hospital` | Yes | Yes | Yes | ✅ Fully Wired | `frontend/src/pages/superadmin/Hospitals.jsx:22`, `backend/src/controllers/hospital.controller.js:8` |
| **Super Admin Users** | SuperAdmin| `Users.jsx` | User Table | `admin.service.js` | GET | `/users` | `user.routes.js:9` | `authenticate`, `checkRole` | `user.controller.js:6` | `user.service.js:10` | `User` | Yes | Yes | Yes | ✅ Fully Wired | `frontend/src/pages/superadmin/Users.jsx:15`, `backend/src/controllers/user.controller.js:6` |

---

## 4. Gap Analyses (Both Directions)

### Backend $\rightarrow$ Frontend (Orphaned Backend Capabilities)
1. **Pharmacy Orders Fulfillment API** (`backend/src/routes/pharmacyOrders.routes.js`):
   - `GET /api/pharmacy-orders/hospital` (List orders for hospital pharmacist)
   - `POST /api/pharmacy-orders/:id/confirm` (Pharmacist sets medicine prices)
   - `PATCH /api/pharmacy-orders/:id/status` (Advance status PENDING $\rightarrow$ PREPARING $\rightarrow$ READY $\rightarrow$ COMPLETED)
   - *Status*: Completely orphaned. No frontend page or service function calls these endpoints.
2. **Lab Fulfillment API** (`backend/src/routes/labFulfillment.routes.js`):
   - `GET /api/lab-fulfillment/hospital` (List pending lab requests for lab tech)
   - `POST /api/lab-fulfillment/:id/confirm` (Confirm test items)
   - `POST /api/lab-fulfillment/:id/upload-report` (Upload lab report PDF/file URL)
   - *Status*: Orphaned. `LabDashboard.jsx` uses hardcoded state and mock arrays instead of calling these routes.
3. **Socket.IO Room `hospital:{hospitalId}:queue`** (`backend/src/sockets/index.js:120`):
   - Admin live queue broadcast room. Backend emits updates here, but frontend `QueueMonitor.jsx` does not subscribe or join this socket room.

### Frontend $\rightarrow$ Backend (Unbacked or Mismatched Frontend Calls)
1. **Pharmacy Dashboard Route** (`frontend/src/router/AppRouter.jsx:125`):
   - `<Route path="/pharmacy/dashboard" element={<LabDashboard />} />`
   - *Status*: Renders `LabDashboard` (Laboratory UI with mock data) when a Pharmacist logs in. No Pharmacy UI page exists.
2. **Doctor Availability Management in Admin UI** (`frontend/src/services/availability.service.js`):
   - `createAvailability`, `updateAvailability`, `deleteAvailability` exist in service, but no UI controls exist in `Doctors.jsx` or `Departments.jsx` for admins to edit weekly doctor shift schedules.

---

## 5. Data Lifecycle Audit

| Entity | Creation Point | State Mutations | Final / Terminal State | Related Models Updated | Evidence (file paths) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **User** | `auth.service.js:register` / `inviteStaff` | `isEmailVerified: true`, `status: ACTIVE` | `DEACTIVATED` | `PatientProfile`, `VerificationToken`, `InviteToken` | `backend/src/services/auth.service.js:45`, `schema.prisma:165` |
| **Hospital** | `hospital.service.js:createHospital` | `updateHospital` (fields, `isActive`) | `isActive: false` | `Department`, `Doctor`, `HospitalAdmin`, `Bill` | `backend/src/services/hospital.service.js:15`, `schema.prisma:293` |
| **Doctor** | `doctor.service.js:inviteDoctor` | `acceptInvite` $\rightarrow$ Profile setup $\rightarrow$ Fee / status edits | `isActive: false` | `User`, `Department`, `DoctorAvailability` | `backend/src/services/doctor.service.js:20`, `schema.prisma:358` |
| **Appointment**| `appointments.service.js:initiateBooking` | `PENDING_PAYMENT` $\rightarrow$ `CONFIRMED` (on payment) $\rightarrow$ `COMPLETED` / `CANCELLED` | `COMPLETED` / `CANCELLED` / `NO_SHOW` | `Bill`, `Payment`, `QueueToken`, `Consultation` | `backend/src/services/appointments.service.js:45`, `schema.prisma:534` |
| **Queue Token** | Auto-created on payment verify (`billing.service.js:180`) | `WAITING` $\rightarrow$ `CALLED` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `COMPLETED` / `SKIPPED` | `COMPLETED` / `CANCELLED` | `Appointment`, `Consultation` | `backend/src/services/queue.service.js:110`, `schema.prisma:632` |
| **Prescription**| `prescriptions.service.js:createPrescription` | Created during consultation $\rightarrow$ Triggers `PharmacyOrder` (`PENDING`) | Permanent Record | `Consultation`, `PrescriptionItem`, `PharmacyOrder`, `MedicalTimelineEvent` | `backend/src/services/prescriptions.service.js:15`, `schema.prisma:743` |
| **Lab Report** | `labFulfillment.service.js:uploadLabReport` | `LabRequest` (`PENDING` $\rightarrow$ `SAMPLE_COLLECTED` $\rightarrow$ `COMPLETED`) | `COMPLETED` | `LabRequest`, `LabReport`, `MedicalTimelineEvent`, `Notification` | `backend/src/services/labFulfillment.service.js:120`, `schema.prisma:971` |
| **Medicine Order**| Auto-created from Prescription (`prescriptions.service.js:85`) | `PENDING` $\rightarrow$ `CONFIRMED` $\rightarrow$ `PREPARING` $\rightarrow$ `READY` $\rightarrow$ `COMPLETED` | `COMPLETED` / `CANCELLED` | `Prescription`, `PharmacyOrder`, `Bill`, `Notification` | `backend/src/services/pharmacyOrders.service.js:15`, `schema.prisma:866` |
| **Emergency Request**| `emergency.service.js:createEmergencyRequest` | `REQUESTED` $\rightarrow$ `SEARCHING` $\rightarrow$ `DRIVER_ASSIGNED` $\rightarrow$ `EN_ROUTE` $\rightarrow$ `PICKED_UP` $\rightarrow$ `ARRIVED` | `ARRIVED` / `CANCELLED` / `NO_DRIVER_FALLBACK` | `Ambulance`, `User`, `Notification` | `backend/src/services/emergencyDispatch.service.js:50`, `schema.prisma:465` |
| **Bill / Payment**| `billing.service.js:createBillForAppointment` | `Bill` (`UNPAID` $\rightarrow$ `PAID`), `Payment` (`CREATED` $\rightarrow$ `SUCCESS`) | `PAID` | `Appointment`, `BillItem`, `Payment`, `QueueToken` | `backend/src/services/billing.service.js:45`, `schema.prisma:570` |

---

## 6. Response Contract Audit

### Systematic Envelope Unwrapping Issue
- **Root Cause Pattern**: `frontend/src/services/api.js:30` returns `response.data` in its response interceptor.
  Express backend controllers return responses formatted as `{ success: true, data: <payload> }`.
  Therefore, Axios calls in frontend services return `{ success: true, data: <payload> }` directly.
- **Affected Components**:
  1. `frontend/src/pages/patient/DoctorBooking.jsx:34`:
     - Code: `setBookingInfo(res.data.data);`
     - Error: `res.data` is ALREADY `{ appointment, bill, order }`. Reading `.data` on that returns `undefined`. `bookingInfo` becomes `undefined`, breaking `RazorpayCheckout`.
  2. `frontend/src/components/booking/RazorpayCheckout.jsx:69`:
     - Code: `onSuccess(res.data.data);`
     - Error: Reads `undefined.data`, throwing TypeError during post-payment callback.
  3. `frontend/src/pages/driver/Dashboard.jsx:75`:
     - Code: `if (res.data.success)`
     - Error: `res` is ALREADY `{ success: true, data: result }`. Accessing `res.data.success` reads `undefined.success`, causing runtime crash when driver accepts an emergency.
  4. `frontend/src/pages/patient/EmergencyTracking.jsx:19`:
     - Code: `const res = await dispatchService.getEmergencyStatus(requestId); setRequest(res.data);`
     - Correct behavior: Here `res` is `{ success: true, data: emergencyRequest }`. `res.data` correctly extracts `emergencyRequest`.

### Parameter Contract Mismatch
- **Payment Verification Endpoint** (`POST /api/payments/verify`):
  - Frontend (`RazorpayCheckout.jsx:64`): Sends `{ appointmentId, razorpayOrderId, razorpayPaymentId, razorpaySignature }`.
  - Backend (`payments.controller.js:15`): Expects `{ billId, razorpayOrderId, razorpayPaymentId, razorpaySignature }`.
  - Result: `billId` is `undefined` on backend, causing `billingService.verifyAndCompletePayment` to fail with 404 / 500 error.

---

## 7. State Management Audit

- **Zustand Store (`authStore.js`)**:
  - Manages `user` object and JWT `token`. Uses Zustand `persist` middleware to synchronize with `localStorage` (`healthcare-plus-auth`).
  - Correctly updated during Login (`Login.jsx:59`), Register, and Logout. Token attached to every Axios HTTP request via `api.js` request interceptor (`api.js:18`).
- **Local Component State**:
  - Pages manage domain data via local `useState` hooks.
  - Data refetching on mutation is implemented in `Queue.jsx` (refetches queue after `callNext`), `ConsultationScreen.jsx` (refetches after completing consultation), and `EmergencyTracking.jsx` (10-second polling interval).
  - Stale state issue: `PatientDashboard.jsx` does not subscribe to Socket.IO events for live appointment status updates; requires manual page refresh to see status changes from `PENDING_PAYMENT` to `CONFIRMED`.

---

## 8. Socket.IO Matrix

| Event | Server Emits | Client Listens | Client Emits | Server Handles | Room | Auth Check | Purpose | Status | Evidence (file paths) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `join-doctor-queue` | No | No | Yes | Yes | `doctor:{doctorId}:{date}` | Verified JWT | Client joins doctor daily queue room | ✅ Fully Wired | `backend/src/sockets/index.js:100`, `frontend/src/services/socket.js:73` |
| `leave-doctor-queue` | No | No | Yes | Yes | `doctor:{doctorId}:{date}` | Verified JWT | Client leaves doctor queue room | ✅ Fully Wired | `backend/src/sockets/index.js:110`, `frontend/src/services/socket.js:81` |
| `join-hospital-queue`| No | No | No | Yes | `hospital:{hospitalId}:queue` | Verified JWT | Admin joins hospital-wide queue room | 🔴 Backend Only | `backend/src/sockets/index.js:120` (Frontend `QueueMonitor.jsx` never emits this event) |
| `join-emergency-room` | No | No | No | Yes | `emergency:{requestId}` | Verified JWT | Join emergency tracking room | 🔴 Backend Only | `backend/src/sockets/emergencyHandlers.js:26` (`EmergencyTracking.jsx` never emits this) |
| `queue:updated` | Yes | Yes | No | No | `doctor:{doctorId}:{date}` | Room gated | Notify doctor & patients of queue state change | ✅ Fully Wired | `backend/src/services/queue.service.js:350`, `frontend/src/hooks/useDoctorQueue.js:28` |
| `queue:token-called` | Yes | Yes | No | No | `patient:{patientId}` | Room gated | Alert specific patient their token was called | ✅ Fully Wired | `backend/src/services/queue.service.js:355`, `frontend/src/components/queue/PatientQueueTracker.jsx:35` |
| `emergency:new-request`| Yes | Yes | No | No | `driver:{driverUserId}` | Room gated | Dispatch new emergency request to driver | ✅ Fully Wired | `backend/src/services/emergencyDispatch.service.js:210`, `frontend/src/pages/driver/Dashboard.jsx:45` |
| `emergency:accepted` | Yes | Yes | No | No | `emergency:{requestId}` | Room gated | Broadcast driver acceptance to patient | 🟡 Partially Wired | Emitted by backend, but patient client never joined room (missing `join-emergency-room` emit) |
| `emergency:location-update`| Yes | Yes | No | No | `emergency:{requestId}` | Room gated | Stream live driver GPS coordinates | 🟡 Partially Wired | Emitted by backend, but patient client never joined room |
| `emergency:status-update` | Yes | Yes | No | No | `emergency:{requestId}` | Room gated | Broadcast emergency status transitions | 🟡 Partially Wired | Emitted by backend, but patient client never joined room |

---

## 9. Authorization Audit

1. **Cross-Hospital Scoping**:
   - `department.routes.js:12`: `GET /api/departments` is unauthenticated and mounted before `scopeToHospital`. Calling it without `hospitalId` parameter returns 400 Bad Request error. (`⚠️ Broken Wiring`)
   - `doctor.routes.js:11`: `GET /api/doctors` is unauthenticated and mounted before `scopeToHospital`. Calling it without `hospitalId` parameter returns doctors from ALL hospitals across the platform. (`⚠️ Auth Scoping Gap`)
   - Protected Admin routes (`GET /api/staff`, `GET /api/bills/hospital/revenue`, `GET /api/analytics/*`, `GET /api/audit-log`) correctly enforce `scopeToHospital` middleware, extracting `hospitalId` from `req.user.hospitalAdmin.hospitalId`. (`✅ Fully Wired`)
2. **Cross-Patient Access**:
   - Patient endpoints (`/api/appointments/my`, `/api/passport`, `/api/bills/my`, `/api/lab-requests/my`) query using `req.user.id` extracted from verified JWT. Patients cannot access records of other patients. (`✅ Fully Wired`)
3. **Doctor $\rightarrow$ Patient Passport Access**:
   - Doctor viewing patient passport (`GET /api/passport/:patientId`) is checked in `passport.service.js:130`. Verifies active `PassportConsent` record or active `Appointment` between the doctor and patient. (`✅ Fully Wired`)
4. **Super Admin Scope**:
   - Super Admin routes (`/api/hospitals`, `/api/users`) enforced via `checkRole('SUPER_ADMIN')` in `user.routes.js:8` and `hospital.routes.js:17`. (`✅ Fully Wired`)

---

## 10. Mock / Static / Hardcoded Data Audit

| File Path | Line Range | Variable / Constant | Description & Classification |
| :--- | :--- | :--- | :--- |
| `frontend/src/pages/lab/Dashboard.jsx` | L16–34 | `PENDING_REQUESTS`, `PROCESSING`, `COMPLETED_TODAY` | **Business Data That Should Be Live**. Complete lab requests queue rendered from static mock arrays instead of calling `labFulfillment.service.js` or `/api/lab-fulfillment`. |
| `frontend/src/pages/admin/Dashboard.jsx` | L30–35 | `RECENT_ACTIVITIES` | **Acceptable UI Placeholder**. Static activity log items shown while live audit log widget is under tab navigation. |
| `frontend/src/pages/patient/DoctorBooking.jsx` | L18 | `doctor: propDoctor` | **Acceptable Fallback**. Mock doctor details fallback when page navigated directly without state context. |
| `frontend/src/components/booking/RazorpayCheckout.jsx` | L66–67, L86–91 | `isMock`, `mock_payment_id` | **Acceptable Test Mode**. Simulates Razorpay checkout flow when `VITE_RAZORPAY_KEY_ID` environment variable is not configured. |
| `frontend/src/pages/driver/Dashboard.jsx` | L21 | `currentCoords: { lat: 12.9716, lng: 77.5946 }` | **Acceptable Fallback**. Default GPS fallback coordinates (Bangalore) if browser geolocation permission is pending. |

---

## 11. Empty / Broken UI Audit

1. **Hospital Admin Overview Tab — Departments & Doctors Counters**:
   - **Page**: `frontend/src/pages/admin/Dashboard.jsx:48`
   - **Component**: `OverviewTab`
   - **API Called**: `adminService.getDepartments()` (`GET /api/departments`)
   - **Root Cause**: Backend `department.routes.js:12` exposes `GET /` unauthenticated without `scopeToHospital`. Controller requires `hospitalId`. Request fails with HTTP 400. `OverviewTab` catches error silently and sets departments to `[]` (renders 0).
2. **Pharmacist Dashboard Page**:
   - **Page**: `/pharmacy/dashboard`
   - **Component**: `AppRouter.jsx:125` renders `LabDashboard`
   - **Root Cause**: No Pharmacist UI page component was built. Router points to Lab technician dashboard instead.
3. **Ambulance Driver SOS Accept Button**:
   - **Page**: `frontend/src/pages/driver/Dashboard.jsx:75`
   - **Component**: `handleAccept`
   - **API Called**: `dispatchService.acceptRequest(requestId)` (`POST /api/driver/requests/:id/accept`)
   - **Root Cause**: Code checks `if (res.data.success)`. Axios interceptor in `api.js:30` already un-wrapped `response.data`, so `res` is `{ success: true, data: result }`. `res.data` evaluates to `undefined`, causing runtime TypeError crash upon clicking Accept.
4. **Patient Razorpay Checkout Modal Callback**:
   - **Page**: `frontend/src/pages/patient/DoctorBooking.jsx:34` & `RazorpayCheckout.jsx:69`
   - **Component**: `RazorpayCheckout`
   - **API Called**: `paymentsService.verifyPayment` (`POST /api/payments/verify`)
   - **Root Cause**: Frontend sends `appointmentId` instead of `billId` expected by backend controller. In addition, callback accesses `res.data.data` which is `undefined`.

---

## 12. Final Scorecard

| Role | Workflow | Backend | Frontend | Wiring | Data | Real-Time | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Patient** | Appointment booking, queue tracking, SOS, Passport, Billing | ✅ Complete | ✅ Complete | 🟡 Partial | ✅ Real | ✅ Active | 🟡 Partially Wired (Payment verification params/response mismatch) |
| **Doctor** | Daily queue management, consultation execution, Rx, Lab ordering | ✅ Complete | ✅ Complete | ✅ Complete | ✅ Real | ✅ Active | ✅ Fully Wired |
| **Laboratory Staff** | Sample collection, test processing, report PDF upload | ✅ Complete | 🔵 Mock UI | 🔴 Missing | ❌ Static | ❌ None | 🔵 Frontend Only / 🔴 Backend Only (Disconnected) |
| **Pharmacist** | Prescription order processing, inventory pricing, dispensing | ✅ Complete | ❌ Missing | 🔴 Missing | ❌ None | ❌ None | 🔴 Backend Only (No frontend UI created; route renders Lab UI) |
| **Ambulance Driver**| Online toggle, GPS location streaming, emergency dispatch accept | ✅ Complete | ✅ Complete | ⚠️ Broken | ✅ Real | ✅ Active | ⚠️ Broken Wiring (TypeError in `handleAccept` response check) |
| **Hospital Admin** | Hospital staff invite, queue oversight, revenue, audit logs | ✅ Complete | ✅ Complete | 🟡 Partial | ✅ Real | 🟡 Partial | 🟡 Partially Wired (`GET /departments` 400 error & unscoped doctors) |
| **Super Admin** | Platform-wide hospital creation, user management, global analytics | ✅ Complete | ✅ Complete | ✅ Complete | ✅ Real | N/A | ✅ Fully Wired |

---

## 13. Findings Summary

### A. Fully Connected
- **User Authentication Flow**: Registration (`Register.jsx`), Login (`Login.jsx`), OTP Email verification (`VerifyEmail.jsx`), JWT issuance and storage in Zustand (`authStore.js`), and route protection (`ProtectedRoute.jsx`).
- **Doctor Consultation & Clinical Execution**: Doctor queue loading (`Queue.jsx`), token calling (`callNext`), consultation startup (`ConsultationScreen.jsx`), prescription creation (`PrescriptionEditor.jsx`), lab request creation (`LabRequestEditor.jsx`), follow-up recommendation, and completion.
- **Patient Live Queue Tracking**: Live position polling (`LiveQueue.jsx`) and real-time Socket.IO token updates (`PatientQueueTracker.jsx`).
- **Patient Healthcare Passport & Medical Timeline**: Passport viewing (`Passport.jsx`), allergy/condition editing, consent grant/revoke (`ConsentManager.jsx`), and timeline event feed (`MedicalTimeline.jsx`).
- **Hospital Admin Staff & Queue Management**: Staff invitation (`Staff.jsx`), live OPD queue monitoring & administrative force-skip (`QueueMonitor.jsx`), hospital revenue charts (`Revenue.jsx`), and audit logs (`AuditLog.jsx`).
- **Super Admin Operations**: Platform hospital creation (`Hospitals.jsx`), user directory (`Users.jsx`), and global analytics (`Dashboard.jsx`).

### B. Backend Implemented, Frontend Missing
- **Pharmacy Order Fulfillment Endpoints** (`backend/src/routes/pharmacyOrders.routes.js`):
  - `GET /api/pharmacy-orders/hospital`, `POST /api/pharmacy-orders/:id/confirm`, `PATCH /api/pharmacy-orders/:id/status`. Backend logic exists in `bills.controller.js` & `pharmacyOrders.service.js`, but frontend has no Pharmacist UI.
- **Lab Fulfillment Endpoints** (`backend/src/routes/labFulfillment.routes.js`):
  - `GET /api/lab-fulfillment/hospital`, `POST /api/lab-fulfillment/:id/confirm`, `POST /api/lab-fulfillment/:id/upload-report`. Fully implemented in backend `labFulfillment.service.js`, but frontend uses static mock state.

### C. Frontend Implemented, Backend Missing
- **Doctor Availability Schedule Editor**: Service methods exist in `availability.service.js`, but no UI form components exist in `Doctors.jsx` to let Hospital Admins manage weekly doctor shift schedules.

### D. Broken Wiring
- **Payment Verification Body & Response Mismatch**:
  - `frontend/src/components/booking/RazorpayCheckout.jsx:64` passes `appointmentId` to `verifyPayment`, whereas `backend/src/controllers/payments.controller.js:15` destructures `billId`.
  - `frontend/src/pages/patient/DoctorBooking.jsx:34` & `RazorpayCheckout.jsx:69` attempt to access `res.data.data`, which evaluates to `undefined` because `api.js:30` already unwrapped Axios `response.data`.
- **Ambulance Driver Accept Request TypeError**:
  - `frontend/src/pages/driver/Dashboard.jsx:75` checks `if (res.data.success)`. Since `res` is already the unwrapped response body, `res.data` is `undefined`, causing a runtime TypeError when driver clicks Accept.
- **Unauthenticated Unscoped Department & Doctor Routes**:
  - `backend/src/routes/department.routes.js:12` exposes `GET /` before `scopeToHospital` middleware. Calling `getDepartments()` without query params returns HTTP 400 Bad Request, breaking `AdminDashboard` Overview tab counters.
  - `backend/src/routes/doctor.routes.js:11` exposes `GET /` before `scopeToHospital`. Calling `getDoctors()` without query params returns doctors from ALL hospitals across the platform.

### E. Data Exists, UI Doesn't Show It
- **Patient Dashboard Prescription & Lab Status Updates**: Patient dashboard widgets do not update live via Socket.IO when a doctor finishes a consultation or when lab tests change status; requires manual browser page refresh.

### F. UI Expects Data That Doesn't Exist
- **Pharmacist Dashboard Route**: `frontend/src/router/AppRouter.jsx:125` routes `/pharmacy/dashboard` to `<LabDashboard />`, rendering Laboratory staff UI with mock test data for Pharmacist users.

### G. Socket.IO Gaps
- **Missing Emergency Room Join**: `frontend/src/pages/patient/EmergencyTracking.jsx` listens for `emergency:accepted`, `emergency:location-update`, and `emergency:status-update`, but never emits `join-emergency-room` to join the socket room on `backend/src/sockets/emergencyHandlers.js:26`. Real-time socket updates fail; page falls back to 10-second REST polling.
- **Orphaned Hospital Queue Room**: `backend/src/sockets/index.js:120` implements `join-hospital-queue` for room `hospital:{hospitalId}:queue`, but `QueueMonitor.jsx` never connects to or emits this event.

### H. Auth / Authz Gaps
- **Doctor List Multitenancy Leak**: `GET /api/doctors` is mounted unauthenticated prior to `scopeToHospital` middleware in `doctor.routes.js:11`, allowing any authenticated user or Hospital Admin to query doctors across all hospitals.

### I. Manual Verification Required
- **Google OAuth Integration** (`frontend/src/components/auth/GoogleLoginButton.jsx:12` & `backend/src/services/auth.service.js:210`): Code integration is fully implemented using Google OAuth library, but end-to-end verification requires a live `VITE_GOOGLE_CLIENT_ID` and Google Cloud Console OAuth consent setup.
- **Live Razorpay Webhook Callback** (`backend/src/controllers/payments.controller.js:32`): Webhook handler is implemented with HMAC signature verification, but live callback testing requires a deployed server with a publicly accessible HTTPS URL registered in Razorpay Dashboard.
