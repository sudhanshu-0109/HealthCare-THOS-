# healthcare+ — API Structure

> **Conventions:**
> - All routes are prefixed with `/api`
> - `[R]` = requires authentication (JWT Bearer token)
> - `[HS]` = hospital-scoped (backend filters by `hospitalId` of authenticated user)
> - `[Role: X]` = requires one of the listed roles
> - Request/response shown as one-liner: `body fields → response fields`

---

## Auth

```
POST   /api/auth/register
       body: fullName, email, password → { user, token }

POST   /api/auth/login
       body: email, password → { user, token }

POST   /api/auth/logout                                [R]
       → { message }

GET    /api/auth/verify-email/:token
       → redirect or { message }

POST   /api/auth/resend-verification
       body: email → { message }

POST   /api/auth/google
       body: id_token → { user, token }

POST   /api/auth/forgot-password
       body: email → { message }

POST   /api/auth/reset-password
       body: token, newPassword → { message }

POST   /api/auth/change-password                       [R]
       body: currentPassword, newPassword → { message }

GET    /api/auth/me                                    [R]
       → { user, roleProfile }
```

---

## Users / Profile

```
GET    /api/users/profile                              [R]
       → { user, roleProfile }

PATCH  /api/users/profile                              [R]
       body: fullName?, phone?, address?, ...profileFields → { user }

DELETE /api/users/account                              [R]
       → { message }

GET    /api/users/:id                                  [R][Role: SUPER_ADMIN]
       → { user, roleProfile }

GET    /api/users                                      [R][Role: SUPER_ADMIN]
       query: role?, page, limit → { users[], total }

PATCH  /api/users/:id/role                             [R][Role: SUPER_ADMIN]
       body: role → { user }
```

---

## Hospitals

```
GET    /api/hospitals
       query: search?, city?, specialty?, lat?, lng?, page, limit
       → { hospitals[], total }  (public — no auth required)

GET    /api/hospitals/:hospitalId
       → { hospital, departments[], stats }  (public)

POST   /api/hospitals                                  [R][Role: SUPER_ADMIN]
       body: name, address, city, latitude, longitude, contactPhone, contactEmail → { hospital }

PATCH  /api/hospitals/:hospitalId                      [R][Role: SUPER_ADMIN | HOSPITAL_ADMIN][HS]
       body: name?, address?, contactPhone?, crowdLevel?, rating? → { hospital }

DELETE /api/hospitals/:hospitalId                      [R][Role: SUPER_ADMIN]
       → { message }  (soft delete: isActive=false)
```

---

## Departments

```
GET    /api/hospitals/:hospitalId/departments
       → { departments[] }  (public)

GET    /api/hospitals/:hospitalId/departments/:departmentId
       → { department, doctors[] }  (public)

POST   /api/hospitals/:hospitalId/departments          [R][Role: HOSPITAL_ADMIN | SUPER_ADMIN][HS]
       body: name → { department }

PATCH  /api/hospitals/:hospitalId/departments/:departmentId   [R][Role: HOSPITAL_ADMIN | SUPER_ADMIN][HS]
       body: name?, isActive? → { department }

DELETE /api/hospitals/:hospitalId/departments/:departmentId   [R][Role: HOSPITAL_ADMIN | SUPER_ADMIN][HS]
       → { message }  (soft delete)
```

---

## Doctors

```
GET    /api/hospitals/:hospitalId/doctors
       query: departmentId?, page, limit → { doctors[] }  (public)

GET    /api/doctors/:doctorId
       → { doctor, availability[] }  (public)

POST   /api/hospitals/:hospitalId/doctors              [R][Role: HOSPITAL_ADMIN | SUPER_ADMIN][HS]
       body: email, fullName, departmentId, specialization, experienceYears, consultationFee
       → { doctor, user }  (creates User + Doctor profile)

PATCH  /api/doctors/:doctorId                          [R][Role: HOSPITAL_ADMIN | DOCTOR | SUPER_ADMIN][HS for admin]
       body: specialization?, experienceYears?, consultationFee?, isActive? → { doctor }

DELETE /api/doctors/:doctorId                          [R][Role: HOSPITAL_ADMIN | SUPER_ADMIN][HS]
       → { message }  (soft delete: isActive=false)
```

---

## Doctor Availability

```
GET    /api/doctors/:doctorId/availability
       query: date? → { availability[], slots[] }  (public)

POST   /api/doctors/:doctorId/availability             [R][Role: DOCTOR | HOSPITAL_ADMIN][HS]
       body: dayOfWeek, startTime, endTime, slotDurationMinutes, maxPatients → { availability }

PATCH  /api/doctors/:doctorId/availability/:availabilityId   [R][Role: DOCTOR | HOSPITAL_ADMIN][HS]
       body: startTime?, endTime?, slotDurationMinutes?, maxPatients? → { availability }

DELETE /api/doctors/:doctorId/availability/:availabilityId   [R][Role: DOCTOR | HOSPITAL_ADMIN][HS]
       → { message }
```

---

## Appointments

```
GET    /api/appointments                               [R]
       query: status?, page, limit
       [PATIENT] → own appointments
       [DOCTOR] → doctor's appointments
       [HOSPITAL_ADMIN | RECEPTIONIST] → hospital's appointments [HS]
       → { appointments[], total }

GET    /api/appointments/:appointmentId                [R]
       → { appointment, queueToken?, consultation? }

POST   /api/appointments                               [R][Role: PATIENT]
       body: doctorId, hospitalId, appointmentDate, appointmentTime, notes? → { appointment }

POST   /api/appointments/lite                          [R][Role: RECEPTIONIST | HOSPITAL_ADMIN][HS]
       body: doctorId, patientId?, patientName, patientPhone, appointmentDate → { appointment, queueToken }

PATCH  /api/appointments/:appointmentId/cancel         [R]
       [PATIENT] → own, [HOSPITAL_ADMIN | RECEPTIONIST] → any in hospital [HS]
       → { appointment }

PATCH  /api/appointments/:appointmentId/no-show        [R][Role: DOCTOR | HOSPITAL_ADMIN | RECEPTIONIST][HS]
       → { appointment }
```

---

## Queue

```
GET    /api/queue                                      [R][Role: DOCTOR | HOSPITAL_ADMIN | RECEPTIONIST][HS]
       query: doctorId, date → { tokens[], currentToken }

GET    /api/queue/token/:appointmentId                 [R]
       → { queueToken, position, estimatedWaitMinutes }

PATCH  /api/queue/:tokenId/start                       [R][Role: DOCTOR][HS]
       → { queueToken }  (status: WAITING → IN_PROGRESS)

PATCH  /api/queue/:tokenId/complete                    [R][Role: DOCTOR][HS]
       → { queueToken }  (status: IN_PROGRESS → DONE)

PATCH  /api/queue/:tokenId/skip                        [R][Role: DOCTOR | HOSPITAL_ADMIN][HS]
       → { queueToken }  (status: WAITING → SKIPPED)

POST   /api/queue/:tokenId/requeue                     [R][Role: DOCTOR | HOSPITAL_ADMIN][HS]
       → { queueToken }  (re-adds skipped patient at current position+1)
```

---

## Healthcare Passport

```
GET    /api/passport                                   [R][Role: PATIENT]
       → { passport }

GET    /api/passport/:patientId                        [R][Role: DOCTOR | SUPER_ADMIN]
       (DOCTOR: only if PassportConsent exists and is valid)
       → { passport }

PATCH  /api/passport                                   [R][Role: PATIENT]
       body: bloodGroup?, emergencyContactName?, emergencyContactPhone?, height?, weight?
       → { passport }

POST   /api/passport/consent                           [R][Role: PATIENT]
       body: grantedToDoctorId?, grantedToHospitalId?, expiresAt? → { consent }

DELETE /api/passport/consent/:consentId                [R][Role: PATIENT]
       → { message }

GET    /api/passport/consents                          [R][Role: PATIENT]
       → { consents[] }
```

---

## Consultations

```
GET    /api/consultations/:appointmentId               [R][Role: DOCTOR | PATIENT | HOSPITAL_ADMIN]
       → { consultation, prescription?, labRequests[] }

POST   /api/consultations/:appointmentId               [R][Role: DOCTOR][HS]
       body: chiefComplaint, examinationNotes?, diagnosis?, referralNotes? → { consultation }

PATCH  /api/consultations/:consultationId              [R][Role: DOCTOR][HS]
       body: examinationNotes?, diagnosis?, referralNotes? → { consultation }

PATCH  /api/consultations/:consultationId/complete     [R][Role: DOCTOR][HS]
       → { consultation }  (triggers passport update)
```

---

## Prescriptions

```
GET    /api/prescriptions                              [R][Role: PATIENT]
       query: page, limit → { prescriptions[] }

GET    /api/prescriptions/:prescriptionId              [R][Role: PATIENT | DOCTOR | PHARMACIST]
       → { prescription, items[] }

POST   /api/prescriptions                              [R][Role: DOCTOR][HS]
       body: consultationId, items[]: { medicineId, dosage, frequency, duration, instructions? }
       → { prescription, items[] }

PATCH  /api/prescriptions/:prescriptionId              [R][Role: DOCTOR][HS]
       body: items[] (full replace of items) → { prescription, items[] }
```

---

## Pharmacy Orders

```
GET    /api/pharmacy-orders                            [R]
       [PATIENT] → own orders
       [PHARMACIST | HOSPITAL_ADMIN] → hospital's orders [HS]
       query: status?, page, limit → { orders[], total }

GET    /api/pharmacy-orders/:orderId                   [R]
       → { order, items[] }

POST   /api/pharmacy-orders                            [R][Role: PATIENT]
       body: hospitalId, prescriptionId? → { order }

POST   /api/pharmacy-orders/from-prescription          [R][Role: PATIENT]
       body: prescriptionId → { order }

PATCH  /api/pharmacy-orders/:orderId/status            [R][Role: PHARMACIST | HOSPITAL_ADMIN][HS]
       body: status → { order }

DELETE /api/pharmacy-orders/:orderId                   [R][Role: PATIENT]
       (only if status=PENDING) → { message }
```

---

## Medicine Reminders

```
GET    /api/reminders                                  [R][Role: PATIENT]
       → { reminders[] }

POST   /api/reminders                                  [R][Role: PATIENT]
       body: prescriptionItemId, reminderTime → { reminder }

PATCH  /api/reminders/:reminderId                      [R][Role: PATIENT]
       body: reminderTime?, isActive? → { reminder }

DELETE /api/reminders/:reminderId                      [R][Role: PATIENT]
       → { message }
```

---

## Lab Tests (Catalog)

```
GET    /api/lab-tests
       query: category?, search? → { tests[] }  (public)

GET    /api/lab-tests/:testId
       → { test }  (public)

POST   /api/lab-tests                                  [R][Role: SUPER_ADMIN | HOSPITAL_ADMIN][HS]
       body: name, category, description?, price → { test }

PATCH  /api/lab-tests/:testId                          [R][Role: SUPER_ADMIN | HOSPITAL_ADMIN][HS]
       body: name?, price?, isActive? → { test }
```

---

## Lab Requests

```
GET    /api/lab-requests                               [R]
       [PATIENT] → own
       [LAB_STAFF | HOSPITAL_ADMIN] → hospital's [HS]
       query: status?, page, limit → { requests[], total }

GET    /api/lab-requests/:requestId                    [R]
       → { labRequest, items[], reports[] }

POST   /api/lab-requests                               [R][Role: DOCTOR][HS]
       body: consultationId, patientId, items[]: { labTestCatalogId } → { labRequest, items[] }

PATCH  /api/lab-requests/:requestId/status             [R][Role: LAB_STAFF | HOSPITAL_ADMIN][HS]
       body: status → { labRequest }
```

---

## Lab Reports

```
GET    /api/lab-reports/:labRequestItemId              [R]
       → { labReport }

POST   /api/lab-reports                                [R][Role: LAB_STAFF][HS]
       body: labRequestItemId, fileUrl, findings? → { labReport }
       (triggers notification to patient and doctor, updates passport)

PATCH  /api/lab-reports/:reportId                      [R][Role: LAB_STAFF][HS]
       body: findings? → { labReport }
```

---

## Billing

```
GET    /api/billing                                    [R]
       [PATIENT] → own bills
       [HOSPITAL_ADMIN | RECEPTIONIST] → hospital bills [HS]
       query: isPaid?, page, limit → { bills[], total }

GET    /api/billing/:billId                            [R]
       → { bill, items[], payments[] }

POST   /api/billing                                    [R][Role: HOSPITAL_ADMIN | RECEPTIONIST][HS]
       body: patientId, appointmentId?, items[]: { description, amount, itemType } → { bill }

PATCH  /api/billing/:billId/mark-paid                  [R][Role: HOSPITAL_ADMIN | RECEPTIONIST][HS]
       → { bill }

PATCH  /api/billing/:billId/discount                   [R][Role: HOSPITAL_ADMIN][HS]
       body: discountAmount → { bill }
```

---

## Payments

```
POST   /api/payments/initiate                          [R][Role: PATIENT]
       body: billId → { razorpayOrderId, amount, currency }

POST   /api/payments/verify                            [R][Role: PATIENT]
       body: razorpayOrderId, razorpayPaymentId, razorpaySignature, billId → { payment }

GET    /api/payments/:paymentId                        [R]
       → { payment }

GET    /api/payments                                   [R][Role: PATIENT]
       query: page, limit → { payments[], total }
```

---

## Emergency Requests

```
POST   /api/emergency-requests                         [R][Role: PATIENT]
       body: latitude, longitude, description? → { emergencyRequest }

GET    /api/emergency-requests                         [R][Role: HOSPITAL_ADMIN | SUPER_ADMIN][HS]
       query: status?, page, limit → { requests[], total }

GET    /api/emergency-requests/:requestId              [R]
       → { emergencyRequest }

PATCH  /api/emergency-requests/:requestId/assign       [R][Role: HOSPITAL_ADMIN][HS]
       body: ambulanceId → { emergencyRequest }

PATCH  /api/emergency-requests/:requestId/status       [R][Role: AMBULANCE_DRIVER | HOSPITAL_ADMIN][HS]
       body: status → { emergencyRequest }
```

---

## Ambulances

```
GET    /api/hospitals/:hospitalId/ambulances           [R][Role: HOSPITAL_ADMIN | SUPER_ADMIN][HS]
       → { ambulances[] }

POST   /api/hospitals/:hospitalId/ambulances           [R][Role: HOSPITAL_ADMIN | SUPER_ADMIN][HS]
       body: vehicleNumber → { ambulance }

PATCH  /api/hospitals/:hospitalId/ambulances/:ambulanceId   [R][Role: HOSPITAL_ADMIN][HS]
       body: vehicleNumber?, isAvailable? → { ambulance }

DELETE /api/hospitals/:hospitalId/ambulances/:ambulanceId   [R][Role: HOSPITAL_ADMIN | SUPER_ADMIN][HS]
       → { message }
```

---

## Notifications

```
GET    /api/notifications                              [R]
       query: isRead?, page, limit → { notifications[], unreadCount }

PATCH  /api/notifications/:notificationId/read         [R]
       → { notification }

PATCH  /api/notifications/read-all                     [R]
       → { message }

DELETE /api/notifications/:notificationId              [R]
       → { message }
```

---

## Analytics

```
GET    /api/analytics/overview                         [R][Role: HOSPITAL_ADMIN | SUPER_ADMIN][HS]
       query: hospitalId?, from, to → { appointments, revenue, activeDoctors, avgWaitTime }

GET    /api/analytics/appointments                     [R][Role: HOSPITAL_ADMIN | SUPER_ADMIN][HS]
       query: hospitalId?, from, to, groupBy (day|week|month) → { data[] }

GET    /api/analytics/revenue                          [R][Role: HOSPITAL_ADMIN | SUPER_ADMIN][HS]
       query: hospitalId?, from, to → { breakdown: { appointments, pharmacy, lab, total } }

GET    /api/analytics/doctors                          [R][Role: HOSPITAL_ADMIN | SUPER_ADMIN][HS]
       query: hospitalId?, from, to → { doctors[]: { doctor, appointmentCount, utilization } }

GET    /api/analytics/departments                      [R][Role: HOSPITAL_ADMIN | SUPER_ADMIN][HS]
       query: hospitalId?, from, to → { departments[]: { department, patientCount } }
```

---

## Audit Logs

```
GET    /api/audit-logs                                 [R][Role: HOSPITAL_ADMIN | SUPER_ADMIN][HS]
       query: hospitalId?, actorUserId?, action?, from, to, page, limit
       → { logs[], total }

GET    /api/audit-logs/:logId                          [R][Role: SUPER_ADMIN]
       → { log }
```

---

## Health Check (Phase 1 only)

```
GET    /api/health
       → { success: true, message: "healthcare+ API is running", timestamp }
```
