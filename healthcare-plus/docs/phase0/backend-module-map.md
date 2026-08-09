# healthcare+ — Backend Module Map

> **Naming Contract:** Every module in this file defines the exact file names that must be used in `backend/src/`. Later phases MUST follow these names — no deviation allowed.

---

## Convention

```
backend/src/
  controllers/  → <module>.controller.js   (handles HTTP req/res, calls service)
  services/     → <module>.service.js      (business logic, Prisma calls)
  routes/       → <module>.routes.js       (Express Router, mounts controller methods)
```

Each module's routes file is imported in `routes/index.js` and mounted at its prefix.

---

## Module File Name Map

### Auth
| File | Path |
|---|---|
| `auth.routes.js` | `src/routes/auth.routes.js` |
| `auth.controller.js` | `src/controllers/auth.controller.js` |
| `auth.service.js` | `src/services/auth.service.js` |

Mounted at: `/api/auth`

---

### Users / Profile
| File | Path |
|---|---|
| `user.routes.js` | `src/routes/user.routes.js` |
| `user.controller.js` | `src/controllers/user.controller.js` |
| `user.service.js` | `src/services/user.service.js` |

Mounted at: `/api/users`

---

### Hospitals
| File | Path |
|---|---|
| `hospital.routes.js` | `src/routes/hospital.routes.js` |
| `hospital.controller.js` | `src/controllers/hospital.controller.js` |
| `hospital.service.js` | `src/services/hospital.service.js` |

Mounted at: `/api/hospitals`

---

### Departments
| File | Path |
|---|---|
| `department.routes.js` | `src/routes/department.routes.js` |
| `department.controller.js` | `src/controllers/department.controller.js` |
| `department.service.js` | `src/services/department.service.js` |

Mounted at: `/api/hospitals/:hospitalId/departments`

---

### Doctors
| File | Path |
|---|---|
| `doctor.routes.js` | `src/routes/doctor.routes.js` |
| `doctor.controller.js` | `src/controllers/doctor.controller.js` |
| `doctor.service.js` | `src/services/doctor.service.js` |

Mounted at: `/api/doctors` and `/api/hospitals/:hospitalId/doctors`

---

### Doctor Availability
| File | Path |
|---|---|
| `availability.routes.js` | `src/routes/availability.routes.js` |
| `availability.controller.js` | `src/controllers/availability.controller.js` |
| `availability.service.js` | `src/services/availability.service.js` |

Mounted at: `/api/doctors/:doctorId/availability`

---

### Appointments
| File | Path |
|---|---|
| `appointment.routes.js` | `src/routes/appointment.routes.js` |
| `appointment.controller.js` | `src/controllers/appointment.controller.js` |
| `appointment.service.js` | `src/services/appointment.service.js` |

Mounted at: `/api/appointments`

---

### Queue
| File | Path |
|---|---|
| `queue.routes.js` | `src/routes/queue.routes.js` |
| `queue.controller.js` | `src/controllers/queue.controller.js` |
| `queue.service.js` | `src/services/queue.service.js` |

Mounted at: `/api/queue`

---

### Healthcare Passport
| File | Path |
|---|---|
| `passport.routes.js` | `src/routes/passport.routes.js` |
| `passport.controller.js` | `src/controllers/passport.controller.js` |
| `passport.service.js` | `src/services/passport.service.js` |

Mounted at: `/api/passport`

---

### Consultations
| File | Path |
|---|---|
| `consultation.routes.js` | `src/routes/consultation.routes.js` |
| `consultation.controller.js` | `src/controllers/consultation.controller.js` |
| `consultation.service.js` | `src/services/consultation.service.js` |

Mounted at: `/api/consultations`

---

### Prescriptions
| File | Path |
|---|---|
| `prescription.routes.js` | `src/routes/prescription.routes.js` |
| `prescription.controller.js` | `src/controllers/prescription.controller.js` |
| `prescription.service.js` | `src/services/prescription.service.js` |

Mounted at: `/api/prescriptions`

---

### Pharmacy Orders
| File | Path |
|---|---|
| `pharmacyOrder.routes.js` | `src/routes/pharmacyOrder.routes.js` |
| `pharmacyOrder.controller.js` | `src/controllers/pharmacyOrder.controller.js` |
| `pharmacyOrder.service.js` | `src/services/pharmacyOrder.service.js` |

Mounted at: `/api/pharmacy-orders`

---

### Medicine Reminders
| File | Path |
|---|---|
| `reminder.routes.js` | `src/routes/reminder.routes.js` |
| `reminder.controller.js` | `src/controllers/reminder.controller.js` |
| `reminder.service.js` | `src/services/reminder.service.js` |

Mounted at: `/api/reminders`

---

### Lab Tests (Catalog)
| File | Path |
|---|---|
| `labTest.routes.js` | `src/routes/labTest.routes.js` |
| `labTest.controller.js` | `src/controllers/labTest.controller.js` |
| `labTest.service.js` | `src/services/labTest.service.js` |

Mounted at: `/api/lab-tests`

---

### Lab Requests
| File | Path |
|---|---|
| `labRequest.routes.js` | `src/routes/labRequest.routes.js` |
| `labRequest.controller.js` | `src/controllers/labRequest.controller.js` |
| `labRequest.service.js` | `src/services/labRequest.service.js` |

Mounted at: `/api/lab-requests`

---

### Lab Reports
| File | Path |
|---|---|
| `labReport.routes.js` | `src/routes/labReport.routes.js` |
| `labReport.controller.js` | `src/controllers/labReport.controller.js` |
| `labReport.service.js` | `src/services/labReport.service.js` |

Mounted at: `/api/lab-reports`

---

### Billing
| File | Path |
|---|---|
| `billing.routes.js` | `src/routes/billing.routes.js` |
| `billing.controller.js` | `src/controllers/billing.controller.js` |
| `billing.service.js` | `src/services/billing.service.js` |

Mounted at: `/api/billing`

---

### Payments
| File | Path |
|---|---|
| `payment.routes.js` | `src/routes/payment.routes.js` |
| `payment.controller.js` | `src/controllers/payment.controller.js` |
| `payment.service.js` | `src/services/payment.service.js` |

Mounted at: `/api/payments`

---

### Emergency Requests
| File | Path |
|---|---|
| `emergency.routes.js` | `src/routes/emergency.routes.js` |
| `emergency.controller.js` | `src/controllers/emergency.controller.js` |
| `emergency.service.js` | `src/services/emergency.service.js` |

Mounted at: `/api/emergency-requests`

---

### Ambulances
| File | Path |
|---|---|
| `ambulance.routes.js` | `src/routes/ambulance.routes.js` |
| `ambulance.controller.js` | `src/controllers/ambulance.controller.js` |
| `ambulance.service.js` | `src/services/ambulance.service.js` |

Mounted at: `/api/hospitals/:hospitalId/ambulances`

---

### Notifications
| File | Path |
|---|---|
| `notification.routes.js` | `src/routes/notification.routes.js` |
| `notification.controller.js` | `src/controllers/notification.controller.js` |
| `notification.service.js` | `src/services/notification.service.js` |

Mounted at: `/api/notifications`

---

### Analytics
| File | Path |
|---|---|
| `analytics.routes.js` | `src/routes/analytics.routes.js` |
| `analytics.controller.js` | `src/controllers/analytics.controller.js` |
| `analytics.service.js` | `src/services/analytics.service.js` |

Mounted at: `/api/analytics`

---

### Audit Logs
| File | Path |
|---|---|
| `auditLog.routes.js` | `src/routes/auditLog.routes.js` |
| `auditLog.controller.js` | `src/controllers/auditLog.controller.js` |
| `auditLog.service.js` | `src/services/auditLog.service.js` |

Mounted at: `/api/audit-logs`

---

### Health Check (Phase 1 only)
| File | Path |
|---|---|
| `health.routes.js` | `src/routes/health.routes.js` |
| `health.controller.js` | `src/controllers/health.controller.js` |

Mounted at: `/api/health` — no service file needed (trivial response)

---

## Shared / Infrastructure Files

```
src/
  middleware/
    authenticate.js      → JWT verification, attaches req.user
    checkRole.js         → Role-based access control middleware factory
    hospitalScope.js     → Validates req.user.hospitalId matches requested resource
    rateLimiter.js       → express-rate-limit config (Phase 2+)
    validate.js          → Joi/Zod request validation middleware factory

  utils/
    ApiError.js          → Custom error class (Phase 1)
    asyncHandler.js      → Async route handler wrapper (Phase 1)
    pagination.js        → paginate(query, page, limit) helper
    distance.js          → Haversine formula for hospital proximity search
    emailService.js      → Nodemailer wrapper for transactional emails
    tokenService.js      → JWT sign/verify, email token generation

  sockets/
    index.js             → Socket.IO server init + namespace setup (Phase 1 stub)
    queue.socket.js      → Queue room handlers (Phase 6)
    emergency.socket.js  → Emergency dispatch handlers (Phase 10)

  prisma/
    client.js            → Singleton PrismaClient (Phase 1)
```

---

## Phase Implementation Tracking

| Module | Routes File | Controller | Service | Target Phase |
|---|---|---|---|---|
| Health Check | ✅ Phase 1 | ✅ Phase 1 | — | Phase 1 |
| Auth | Phase 2 | Phase 2 | Phase 2 | Phase 2 |
| Users/Profile | Phase 2 | Phase 2 | Phase 2 | Phase 2 |
| Hospitals | Phase 3 | Phase 3 | Phase 3 | Phase 3 |
| Departments | Phase 3 | Phase 3 | Phase 3 | Phase 3 |
| Doctors | Phase 3 | Phase 3 | Phase 3 | Phase 3 |
| Doctor Availability | Phase 3 | Phase 3 | Phase 3 | Phase 3 |
| Appointments | Phase 4 | Phase 4 | Phase 4 | Phase 4 |
| Queue | Phase 6 | Phase 6 | Phase 6 | Phase 6 |
| Healthcare Passport | Phase 5 | Phase 5 | Phase 5 | Phase 5 |
| Consultations | Phase 5 | Phase 5 | Phase 5 | Phase 5 |
| Prescriptions | Phase 5 | Phase 5 | Phase 5 | Phase 5 |
| Pharmacy Orders | Phase 7 | Phase 7 | Phase 7 | Phase 7 |
| Medicine Reminders | Phase 7 | Phase 7 | Phase 7 | Phase 7 |
| Lab Tests | Phase 8 | Phase 8 | Phase 8 | Phase 8 |
| Lab Requests | Phase 8 | Phase 8 | Phase 8 | Phase 8 |
| Lab Reports | Phase 8 | Phase 8 | Phase 8 | Phase 8 |
| Billing | Phase 9 | Phase 9 | Phase 9 | Phase 9 |
| Payments | Phase 9 | Phase 9 | Phase 9 | Phase 9 |
| Emergency Requests | Phase 10 | Phase 10 | Phase 10 | Phase 10 |
| Ambulances | Phase 10 | Phase 10 | Phase 10 | Phase 10 |
| Notifications | Phase 11 | Phase 11 | Phase 11 | Phase 11 |
| Analytics | Phase 12 | Phase 12 | Phase 12 | Phase 12 |
| Audit Logs | Phase 12 | Phase 12 | Phase 12 | Phase 12 |
