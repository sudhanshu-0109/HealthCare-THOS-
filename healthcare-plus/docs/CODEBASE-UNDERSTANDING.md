# HealthCare+ — Codebase Understanding

_Generated 2026-08-09 as the baseline reference for the production-readiness / real-workflow repair. Source of truth is the actual code under `healthcare-plus/`; this document records what the code **currently does**, not what it should do._

---

## 1. Stack

| Layer | Technology |
|---|---|
| Backend runtime | Node.js + Express (ESM, `"type":"module"`) |
| ORM / DB | Prisma + PostgreSQL |
| Real-time | Socket.IO (server `backend/src/sockets/`, client `frontend/src/services/socket.js`) |
| Auth | JWT (access + refresh) + Google OAuth (`google-auth-library`) |
| Payments | Razorpay (`backend/src/services/razorpay.service.js`), currently mock-capable |
| Email | Nodemailer (OTP / verification) |
| Validation | Zod (backend request schemas) |
| Frontend | React 19 + Vite + react-router-dom v7 + Zustand + axios + socket.io-client + Tailwind v4 + lucide-react |
| Language | JavaScript (no TypeScript) |

**Do not change the stack.** No Redis. Google Maps + Razorpay keys must come from environment variables and must not be committed.

---

## 2. Roles (Prisma `Role` enum, `schema.prisma:33`)

`PATIENT`, `DOCTOR`, `HOSPITAL_ADMIN`, `RECEPTIONIST`, `PHARMACIST`, `LAB_STAFF`, `AMBULANCE_DRIVER`, `SUPER_ADMIN`.

> Note: the frontend `admin.service.js` sends `PHARMACY_STAFF` in two places — this string is **not** in the enum (see API-INTEGRATION-AUDIT).

---

## 3. API envelope contract

- **Backend** returns `{ success: true, data }` on success (built inline in each controller — there is **no** shared `sendSuccess`/`ApiResponse` helper). Errors are centralized in `backend/src/middleware/errorHandler.js:26-30` → `{ success: false, message, errors? }`.
- **Frontend** axios response interceptor (`frontend/src/services/api.js:32`) returns `response.data` — i.e. the **whole envelope** `{ success, data }`.
- Therefore **service functions are thin pass-throughs** and **consumers must read `res.data`** for the payload. Reading `res.data.data` is wrong; reading `err.response.data.message` in a `catch` is wrong (the rejected value is already normalized to `{ status, message, errors }` — it has no `.response`).

**Exceptions found (bugs):**
- `backend/src/controllers/followUp.controller.js:21,30,38,43` return **raw objects**, not the envelope.
- `frontend/src/hooks/useNotifications.js:29-32` reads `data.notifications` on the envelope instead of `res.data.notifications` (double-nesting) → bell always empty.

---

## 4. Auth model

- **Access token**: `{ sub, role, jti }`, 15 min, stored in `localStorage.hc_token`. Attached as `Bearer` by the request interceptor.
- **Refresh token**: `{ sub, jti }`, 30 days, stored **hashed** in DB; delivered as an httpOnly cookie `hc_refresh_token` **and** echoed in the JSON body (the body echo should be dropped).
- **Rotation with reuse-detection** exists on the backend (`POST /auth/refresh-token`) but **the client never calls it** — there is no silent-refresh interceptor and no `/auth/me` bootstrap, so users are hard-logged-out after 15 minutes.
- **Zustand `authStore`** (`frontend/src/store/authStore.js`) persists to `localStorage` key `healthcare-plus-auth`, and mirrors `token→hc_token`, `user→hc_user`. Role is read from this (client-editable) store with no server revalidation.
- **Google OAuth** is solid: `verifyIdToken` with audience check.

---

## 5. Socket contract (`backend/src/sockets/index.js`, `emergencyHandlers.js`)

- Handshake auth via `socket.handshake.auth.token` → `verifyAccessToken` → `socket.user = { id: decoded.sub, role: decoded.role }` (**no** hospitalId on the socket).
- **Rooms**: `user:{userId}` (all roles auto-join), `patient:{patientId}` (patients auto-join), `doctor:{doctorId}:{date}`, `hospital:{hospitalId}:queue`, `emergency:{requestId}`, `driver:{userId}` (drivers auto-join).
- **Architecture rule (correct and to be preserved):** clients **never** mutate state over the socket. They call REST → server updates DB → server emits. Socket is receive-only for clients.
- **Server-emitted events**: `queue:updated`, `queue:token-called`, `emergency:new-request`, `emergency:accepted`, `emergency:location-update`, `emergency:status-update`.

---

## 6. Backend routes (mounted at `/api`, `routes/index.js`)

`health, auth, hospitals, departments, doctors, staff, users, emergency, ai, availability, appointments, payments, queue, passport, dashboard, consultations, prescriptions, lab-requests, follow-ups, billing, bills, pharmacy-orders, lab-fulfillment, ambulances, driver, analytics, audit-log, admin/queue, notifications, lab-tests`.

---

## 7. Unified billing / payment path (well-designed, REAL)

`backend/src/services/billing.service.js` is the single shared payment path:

1. **`createBillAndInitiatePayment({ patientId, hospitalId, sourceType, sourceId, items })`** → creates `Bill` + `BillItem[]` + Razorpay order + `Payment(CREATED)`; returns `{ billId, razorpayOrderId, amount, currency, keyId, isMock }`. Route: `POST /api/billing/pay` (PATIENT).
2. **`verifyAndCompletePayment({ billId, razorpayOrderId, razorpayPaymentId, razorpaySignature })`** → verifies signature (or accepts the `webhook-verified` sentinel), marks `Bill` **PAID**, then calls the source-specific **`onBillPaid`** callback (`APPOINTMENT`, `LITE_APPOINTMENT`, `PHARMACY_ORDER`, `LAB_REQUEST`). Routes: `POST /api/billing/verify` and `POST /api/payments/verify` (both PATIENT).
3. A Razorpay webhook (`payments.controller.js:razorpayWebhook`) is a signature-verified safety net.

**`onBillPaid` is what advances the real business state** (appointment → CONFIRMED, pharmacy order → CONFIRMED, lab request → CONFIRMED). Any payment UI that does **not** flow through `/billing/pay` + `/billing/verify` (or `/payments/verify`) leaves the DB in `UNPAID` and never fires the downstream progression. **This is the core reason `PaymentModal` must be replaced** (see COMPLETE-WORKFLOW-AUDIT §Payments).

---

## 8. Key enums (state machines) — `schema.prisma`

| Enum | Values |
|---|---|
| `AppointmentStatus` | PENDING_PAYMENT, CONFIRMED, CANCELLED, COMPLETED, NO_SHOW |
| `QueueStatus` | WAITING, CALLED, IN_PROGRESS, COMPLETED, SKIPPED, CANCELLED |
| `PharmacyOrderStatus` | PENDING, CONFIRMED, PREPARING, PACKED, READY, COMPLETED, CANCELLED |
| `LabRequestStatus` | PENDING, CONFIRMED, SAMPLE_COLLECTED, PROCESSING, COMPLETED, CANCELLED |
| `BillStatus` | UNPAID, PAID, CANCELLED |
| `BillSourceType` | APPOINTMENT, PHARMACY_ORDER, LAB_REQUEST |
| `EmergencyStatus` | REQUESTED, SEARCHING, DRIVER_ASSIGNED, EN_ROUTE, PICKED_UP, ARRIVED, CANCELLED, NO_DRIVER_FALLBACK |

> Several **frontend** files invent statuses that do not exist in these enums (e.g. `HospitalWorkspace` LabTab uses `PAYMENT_PENDING/PAYMENT_COMPLETED/SAMPLE_PENDING/TESTING/REPORT_READY`; `EmergencyTracking` uses `ACCEPTED/AT_HOSPITAL/COMPLETED`). These are simulation artifacts, not backend contracts.

---

## 9. Emergency dispatch (backend is REAL)

`backend/src/services/emergencyDispatch.service.js`:
- Haversine nearest-driver search over **online** ambulances (cross-hospital by design), notifies nearest 5 via `emergency:new-request` to `driver:{userId}`.
- Atomic claim: `updateMany where status:'SEARCHING'` → `DRIVER_ASSIGNED`, emits `emergency:accepted` to `emergency:{requestId}`.
- `updateDriverLocation` emits `emergency:location-update`; `markEnRoute/PickedUp/Arrived` emit `emergency:status-update`.
- 3-minute server-side `setTimeout` fallback (legitimate — server-owned, not a UI fake).
- `Ambulance` model has `isOnline`, `currentLatitude/Longitude`, `locationUpdatedAt`.

The **driver dashboard** (`frontend/src/pages/driver/Dashboard.jsx`) is real (calls `/driver/*`, listens `emergency:new-request`). The **patient tracking page** (`frontend/src/pages/patient/EmergencyTracking.jsx`) is fully simulated and disconnected (see REALTIME-AUDIT and COMPLETE-WORKFLOW-AUDIT).

---

## 10. Maps

There is **no** real map anywhere in the repo (zero `google.maps` / `leaflet` / `mapbox` references). `frontend/src/components/emergency/LiveTrackingMap.jsx` is a CSS "radar" with a hardcoded driver marker. Real Google Maps must be built from scratch with a key supplied via `VITE_GOOGLE_MAPS_API_KEY` (see GOOGLE-MAPS-INTEGRATION-PLAN).

---

## 11. Working-tree state at audit time

- Uncommitted WIP from a prior session: modified `appointments`/`bills`/`labRequests` controllers + routes, `labRequests.service.js`; new `PaymentModal.jsx`, `StatusBadge.jsx`, `lab-tests` route/service; several frontend dashboards modified.
- The entire `docs/` tree was deleted in the working tree (this file recreates it).
- Only one commit exists (`Initial commit`).
