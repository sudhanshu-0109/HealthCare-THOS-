# healthcare+ — Roles & Permission Matrix

## User Roles

| Role | Description |
|---|---|
| `PATIENT` | End user who books appointments, manages health records |
| `DOCTOR` | Medical professional attached to a hospital/department |
| `HOSPITAL_ADMIN` | Manages a single hospital's operations |
| `RECEPTIONIST` | Handles front-desk tasks within a hospital |
| `PHARMACIST` | Manages pharmacy orders within a hospital |
| `LAB_STAFF` | Processes lab requests and uploads reports |
| `AMBULANCE_DRIVER` | Responds to emergency dispatch requests |
| `SUPER_ADMIN` | Platform-wide administrator with unrestricted access |

---

## Permission Matrix

> **Key:** `Full` = Create / Read / Update / Delete | `Own records only` = Only their own data | `Read-only` = Read only | `None` = No access

| Module | Patient | Doctor | Hospital Admin | Receptionist | Pharmacist | Lab Staff | Ambulance Driver | Super Admin |
|---|---|---|---|---|---|---|---|---|
| **Authentication & Profile** | Own records only | Own records only | Own records only | Own records only | Own records only | Own records only | Own records only | Full |
| **Hospital Management** | Read-only | Read-only | Full (own hospital only) | Read-only | Read-only | Read-only | Read-only | Full |
| **Department Management** | Read-only | Read-only | Full (own hospital only) | Read-only | None | None | None | Full |
| **Doctor Management** | Read-only | Own records only | Full (own hospital only) | Read-only | None | None | None | Full |
| **Staff Management** | None | None | Full (own hospital only) | None | None | None | None | Full |
| **Appointment Booking** | Full (own only) | None | Full (own hospital) | Full (own hospital) | None | None | None | Full |
| **Appointment Management (hospital side)** | Read-only (own only) | Read-only (own queue) | Full (own hospital) | Full (own hospital) | None | None | None | Full |
| **Queue (view)** | Own records only | Full (own queue) | Full (own hospital) | Full (own hospital) | None | None | None | Full |
| **Queue (control)** | None | Full (own queue — call next, skip, complete) | Full (own hospital) | Full (own hospital) | None | None | None | Full |
| **Healthcare Passport** | Own records only (+ consent grants) | Read-only (if consent granted by patient) | None | None | None | None | None | Full |
| **Consultation & Prescription** | Read-only (own only) | Full (own consultations) | Read-only | None | Read-only (prescription only) | None | None | Full |
| **Pharmacy Orders** | Own records only | None | Full (own hospital) | None | Full (own hospital) | None | None | Full |
| **Lab Requests & Reports** | Read-only (own only) | Full (create/view own) | Full (own hospital) | None | None | Full (own hospital — upload report) | None | Full |
| **Billing & Payments** | Own records only | Read-only (own patients) | Full (own hospital) | Full (own hospital) | None | None | None | Full |
| **Emergency SOS (trigger)** | Full (trigger own SOS) | None | None | None | None | None | None | Full |
| **Emergency Dispatch (manage)** | None | None | Full (own hospital) | None | None | None | Full (own vehicle — accept/complete) | Full |
| **Notifications** | Own records only | Own records only | Own records only + hospital-scoped | Own records only | Own records only | Own records only | Own records only | Full |
| **Analytics** | None | Read-only (own stats) | Full (own hospital) | None | Read-only (pharmacy stats) | Read-only (lab stats) | None | Full |
| **Audit Logs** | None | None | Read-only (own hospital) | None | None | None | None | Full |

---

## Notes on Hospital Scoping

All roles except `PATIENT`, `AMBULANCE_DRIVER`, and `SUPER_ADMIN` are **hospital-scoped** — their permissions apply only within the context of their assigned hospital (`hospitalId` on their profile). The backend `checkRole()` middleware (Phase 2) must validate:

1. The authenticated user's role matches the required role(s).
2. For hospital-scoped roles, the requested resource belongs to the same `hospitalId` as the authenticated user.

## Notes on Healthcare Passport

- A patient's passport is only readable by a doctor if the patient has explicitly granted consent via a `PassportConsent` record (specifying the doctor or hospital and an optional expiry date).
- `SUPER_ADMIN` can read any passport for audit/compliance purposes.

## Notes on Emergency Dispatch

- `AMBULANCE_DRIVER` can only manage (`accept`, `en_route`, `completed`) emergency requests assigned to their vehicle.
- `HOSPITAL_ADMIN` can view all emergency requests for their hospital and assign ambulances.
