# healthcare+ — Frontend Page Map

> All protected routes render placeholder content in Phase 1 (`<div>Coming in Phase X</div>`).
> Full implementation arrives with their respective phases.
> Route tree follows React Router v6 `<Routes>` / `<Route>` structure.

---

## Public Routes (no auth required)

```
/                          Landing page
                           Component: pages/public/Landing.jsx
                           Layout: PublicLayout

/login                     Login page
                           Component: pages/public/Login.jsx
                           Layout: PublicLayout

/register                  Register page
                           Component: pages/public/Register.jsx
                           Layout: PublicLayout

/verify-email/:token       Email verification handler
                           Component: pages/public/VerifyEmail.jsx
                           Layout: PublicLayout

/forgot-password           Forgot password page
                           Component: pages/public/ForgotPassword.jsx
                           Layout: PublicLayout

/reset-password/:token     Password reset page
                           Component: pages/public/ResetPassword.jsx
                           Layout: PublicLayout

*                          404 Not Found
                           Component: pages/NotFound.jsx
                           Layout: PublicLayout
```

---

## Patient Routes (protected, role=PATIENT)

```
/dashboard                 Main dashboard — AI assistant, SOS, hospital search, nearby hospitals
                           Component: pages/patient/Dashboard.jsx
                           Layout: PatientLayout
                           Phase: 3

/hospitals                 Hospital search/list page
                           Component: pages/patient/HospitalList.jsx
                           Layout: PatientLayout
                           Phase: 3

/hospitals/:hospitalId     Hospital workspace entry
                           Component: pages/patient/HospitalWorkspace.jsx
                           Layout: PatientLayout
                           Phase: 3

/hospitals/:hospitalId/doctors/:doctorId/book
                           Book appointment with doctor
                           Component: pages/patient/BookAppointment.jsx
                           Layout: PatientLayout
                           Phase: 4

/appointments              Patient's appointment list
                           Component: pages/patient/Appointments.jsx
                           Layout: PatientLayout
                           Phase: 4

/appointments/:id          Appointment detail
                           Component: pages/patient/AppointmentDetail.jsx
                           Layout: PatientLayout
                           Phase: 4

/appointments/:id/queue    Live queue tracking
                           Component: pages/patient/QueueTracker.jsx
                           Layout: PatientLayout
                           Phase: 6

/passport                  Healthcare passport viewer/editor
                           Component: pages/patient/HealthcarePassport.jsx
                           Layout: PatientLayout
                           Phase: 5

/prescriptions             Patient's prescription list
                           Component: pages/patient/Prescriptions.jsx
                           Layout: PatientLayout
                           Phase: 5

/pharmacy/orders           Patient's pharmacy orders
                           Component: pages/patient/PharmacyOrders.jsx
                           Layout: PatientLayout
                           Phase: 7

/lab/requests              Patient's lab requests & reports
                           Component: pages/patient/LabRequests.jsx
                           Layout: PatientLayout
                           Phase: 8

/billing                   Patient's bills & payments
                           Component: pages/patient/Billing.jsx
                           Layout: PatientLayout
                           Phase: 9

/emergency                 Emergency SOS page
                           Component: pages/patient/Emergency.jsx
                           Layout: PatientLayout
                           Phase: 10

/notifications             Notifications inbox
                           Component: pages/shared/Notifications.jsx
                           Layout: PatientLayout
                           Phase: 11

/profile                   Patient profile & settings
                           Component: pages/patient/Profile.jsx
                           Layout: PatientLayout
                           Phase: 2
```

---

## Doctor Routes (protected, role=DOCTOR)

```
/doctor/dashboard          Doctor main dashboard
                           Component: pages/doctor/Dashboard.jsx
                           Layout: DashboardLayout
                           Phase: 6

/doctor/queue              Today's queue management
                           Component: pages/doctor/Queue.jsx
                           Layout: DashboardLayout
                           Phase: 6

/doctor/patients/:patientId
                           Patient detail & history
                           Component: pages/doctor/PatientDetail.jsx
                           Layout: DashboardLayout
                           Phase: 5

/doctor/consultation/:appointmentId
                           Consultation workspace
                           Component: pages/doctor/Consultation.jsx
                           Layout: DashboardLayout
                           Phase: 5

/doctor/notifications      Notifications
                           Component: pages/shared/Notifications.jsx
                           Layout: DashboardLayout
                           Phase: 11

/doctor/profile            Doctor profile & availability settings
                           Component: pages/doctor/Profile.jsx
                           Layout: DashboardLayout
                           Phase: 2
```

---

## Hospital Admin Routes (protected, role=HOSPITAL_ADMIN)

```
/admin/dashboard           Admin main dashboard — stats, quick actions
                           Component: pages/admin/Dashboard.jsx
                           Layout: DashboardLayout
                           Phase: 12

/admin/departments         Department management
                           Component: pages/admin/Departments.jsx
                           Layout: DashboardLayout
                           Phase: 3

/admin/doctors             Doctor management
                           Component: pages/admin/Doctors.jsx
                           Layout: DashboardLayout
                           Phase: 3

/admin/staff               Staff management (receptionist, pharmacist, lab staff, driver)
                           Component: pages/admin/Staff.jsx
                           Layout: DashboardLayout
                           Phase: 3

/admin/queue               Queue overview & control
                           Component: pages/admin/Queue.jsx
                           Layout: DashboardLayout
                           Phase: 6

/admin/pharmacy            Pharmacy orders overview
                           Component: pages/admin/Pharmacy.jsx
                           Layout: DashboardLayout
                           Phase: 7

/admin/laboratory          Lab requests overview
                           Component: pages/admin/Laboratory.jsx
                           Layout: DashboardLayout
                           Phase: 8

/admin/billing             Billing & revenue management
                           Component: pages/admin/Billing.jsx
                           Layout: DashboardLayout
                           Phase: 9

/admin/emergency           Emergency requests & ambulance management
                           Component: pages/admin/Emergency.jsx
                           Layout: DashboardLayout
                           Phase: 10

/admin/analytics           Analytics & reports
                           Component: pages/admin/Analytics.jsx
                           Layout: DashboardLayout
                           Phase: 12

/admin/settings            Hospital settings
                           Component: pages/admin/Settings.jsx
                           Layout: DashboardLayout
                           Phase: 3

/admin/notifications       Notifications
                           Component: pages/shared/Notifications.jsx
                           Layout: DashboardLayout
                           Phase: 11
```

---

## Receptionist Routes (protected, role=RECEPTIONIST)

```
/receptionist/dashboard    Receptionist dashboard
                           Component: pages/receptionist/Dashboard.jsx
                           Layout: DashboardLayout
                           Phase: 6

/receptionist/queue        Queue management (same as admin/queue but receptionist-scoped)
                           Component: pages/receptionist/Queue.jsx
                           Layout: DashboardLayout
                           Phase: 6

/receptionist/appointments Appointment management
                           Component: pages/receptionist/Appointments.jsx
                           Layout: DashboardLayout
                           Phase: 4

/receptionist/billing      Billing & payment collection
                           Component: pages/receptionist/Billing.jsx
                           Layout: DashboardLayout
                           Phase: 9

/receptionist/notifications
                           Component: pages/shared/Notifications.jsx
                           Layout: DashboardLayout
                           Phase: 11
```

---

## Pharmacist Routes (protected, role=PHARMACIST)

```
/pharmacy/dashboard        Pharmacy order management
                           Component: pages/pharmacy/Dashboard.jsx
                           Layout: DashboardLayout
                           Phase: 7

/pharmacy/orders/:orderId  Order detail
                           Component: pages/pharmacy/OrderDetail.jsx
                           Layout: DashboardLayout
                           Phase: 7

/pharmacy/notifications    Notifications
                           Component: pages/shared/Notifications.jsx
                           Layout: DashboardLayout
                           Phase: 11
```

---

## Lab Staff Routes (protected, role=LAB_STAFF)

```
/lab/dashboard             Lab request management & report uploads
                           Component: pages/lab/Dashboard.jsx
                           Layout: DashboardLayout
                           Phase: 8

/lab/requests/:requestId   Lab request detail & report upload
                           Component: pages/lab/RequestDetail.jsx
                           Layout: DashboardLayout
                           Phase: 8

/lab/notifications         Notifications
                           Component: pages/shared/Notifications.jsx
                           Layout: DashboardLayout
                           Phase: 11
```

---

## Ambulance Driver Routes (protected, role=AMBULANCE_DRIVER)

```
/driver/dashboard          Active emergency dispatch management
                           Component: pages/driver/Dashboard.jsx
                           Layout: DashboardLayout
                           Phase: 10

/driver/notifications      Notifications
                           Component: pages/shared/Notifications.jsx
                           Layout: DashboardLayout
                           Phase: 11
```

---

## Super Admin Routes (protected, role=SUPER_ADMIN)

```
/superadmin/dashboard      Platform-wide overview
                           Component: pages/superadmin/Dashboard.jsx
                           Layout: DashboardLayout
                           Phase: 12

/superadmin/hospitals      All hospitals management
                           Component: pages/superadmin/Hospitals.jsx
                           Layout: DashboardLayout
                           Phase: 3

/superadmin/users          All users management
                           Component: pages/superadmin/Users.jsx
                           Layout: DashboardLayout
                           Phase: 2

/superadmin/analytics      Platform-wide analytics
                           Component: pages/superadmin/Analytics.jsx
                           Layout: DashboardLayout
                           Phase: 12

/superadmin/audit-logs     Audit log viewer
                           Component: pages/superadmin/AuditLogs.jsx
                           Layout: DashboardLayout
                           Phase: 12
```

---

## Shared / Utility Routes

```
/unauthorized              403 Forbidden page
                           Component: pages/Unauthorized.jsx
                           Layout: PublicLayout

/maintenance               Maintenance mode page
                           Component: pages/Maintenance.jsx
                           Layout: PublicLayout
```

---

## Route Guard Architecture (Phase 2)

```
<ProtectedRoute roles={['PATIENT']}>
  → Checks: token valid? → role matches? → render child : redirect
</ProtectedRoute>

Redirect logic:
  - Not logged in → /login?redirect=<current path>
  - Logged in but wrong role → /unauthorized
  - Email not verified → /verify-email (with resend option)
```
