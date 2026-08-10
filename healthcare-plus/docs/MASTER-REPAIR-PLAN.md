# MASTER REPAIR PLAN — HealthCare+

_Prioritized, code-grounded repair plan. Severity: **P0** security / data-integrity / crash · **P1** core workflow broken · **P2** secondary · **P3** UI / polish. Repair order follows the directive: crashes → auth → authz → API contracts → wiring → per-workflow → emergency/maps → admin/superadmin → remove mock → polish → regression._

Columns: **ID · Sev · Role · Feature · Problem · Root cause · Files · Fix · Verification**

---

## P0 — security / data-integrity / crash

### R1 · P0 · Patient+Staff · Billing · Bill read is both broken for patients and open to cross-hospital staff
- **Problem:** legitimate patient gets 403 on their own bill; any staff role can read any hospital's bill.
- **Root cause:** `BILL_SELECT` omits `patientId` (owner check compares `undefined`); `getBillById` has no default-deny; route lacks `scopeToHospital`/`checkRole` so `req.hospitalId` is undefined.
- **Files:** `backend/src/services/bills.service.js:8-39` (SELECT), `:69-85` (getBillById), `backend/src/routes/bills.routes.js:20`.
- **Fix:** add `patientId` to `BILL_SELECT`; make `getBillById` default-deny (PATIENT-owner OR staff within `req.hospitalId`, else 403); add `scopeToHospital` (+ role check) to `GET /:id`.
- **Verify:** patient reads own bill (200), staff of another hospital gets 403, admin reads own hospital's bill (200).
- **Status:** ✅ DONE — `BILL_SELECT` now includes `patientId`; `getBillById` is default-deny (PATIENT-owner / SUPER_ADMIN / `BILL_STAFF_ROLES` within hospital); controller passes `req.user.hospitalId` (route serves both patients + staff, so `scopeToHospital` can't be used — it throws for PATIENT).

### R2 · P0 · Pharmacist · Pharmacy order · Cross-hospital confirm + billing
- **Problem:** a pharmacist can confirm/bill an order belonging to another hospital.
- **Root cause:** `pharmacistMatchAndConfirm` does `findUnique({where:{id}})` with no hospital scope; controller passes none.
- **Files:** `backend/src/services/pharmacyOrders.service.js:57-63`, `backend/src/controllers/bills.controller.js:57`.
- **Fix:** thread `req.hospitalId`; verify `order.hospitalId === req.hospitalId` before confirm/advance.
- **Verify:** Hospital B pharmacist confirming a Hospital A order → 403.
- **Status:** ✅ DONE — `pharmacistMatchAndConfirm(orderId, userId, items, hospitalId)` now checks `order.hospitalId === hospitalId`; controller passes `req.hospitalId`. (`advanceStatus` already scoped.)

### R3 · P0 · Lab staff · Lab request · Cross-hospital confirm + report upload (PHI write)
- **Problem:** lab staff can confirm/upload reports for another hospital's request.
- **Root cause:** `confirmLabRequest` / `uploadReport` ignore hospital scope; controller passes none.
- **Files:** `backend/src/services/labFulfillment.service.js:24-30`, `:87-89`, `backend/src/controllers/bills.controller.js:79,86`.
- **Fix:** thread + enforce `req.hospitalId` on confirm and upload.
- **Verify:** Hospital B lab confirming/uploading a Hospital A request → 403.
- **Status:** ✅ DONE — `confirmLabRequest(...,hospitalId)` and `uploadReport(...,hospitalId)` now check `labRequest.hospitalId === hospitalId`; controller passes `req.hospitalId` on both.

### R4 · P0 · Hospital Admin · Dashboard · Medicines tab crashes the whole admin dashboard
- **Problem:** opening the Medicines tab throws `ReferenceError: MOCK_MEDICINES is not defined`; single ErrorBoundary takes down the entire admin dashboard.
- **Root cause:** `useState(MOCK_MEDICINES)` references an undefined identifier.
- **Files:** `frontend/src/pages/admin/Dashboard.jsx:432`.
- **Fix:** `useState([])`; fetch real medicines if/when the feature is wired; remove the `MedicinesTab` optimistic local-only add (`:436-439`) or back it with a service.
- **Verify:** open Medicines tab → renders empty state, no crash.
- **Status:** ✅ DONE (wired for real, not just crash-patched) — new backend `medicines.routes.js` (`GET/POST /medicines`, `PATCH /medicines/:id/toggle`, hospital-scoped, mirrors `labTests.routes.js`) mounted in `routes/index.js`; new `frontend/src/services/medicines.service.js`; `MedicinesTab` now fetches via `getMedicines()` and persists via `createMedicine()`; display + AddModal fields aligned to the real `Medicine` model (`genericName`/`manufacturer`/`unit`/`price`/`stockQuantity`). No more local-only fake add.

### R5 · P0 · Patient · Payments · "Paid" is faked in the UI; DB never records payment, no downstream progression
- **Problem:** paying a bill / pharmacy order / lab request via `PaymentModal` shows success but the backend `Bill` stays UNPAID; pharmacy/lab/appointment never progress; state reverts on refresh.
- **Root cause:** `PaymentModal.handlePay` never calls the backend; callers flip local React state only.
- **Files:** `frontend/src/components/common/PaymentModal.jsx:20-27`; callers `patient/Dashboard.jsx:687`, `patient/HospitalWorkspace.jsx:381,470,538`.
- **Fix:** replace `PaymentModal` with the real flow — `POST /billing/pay` → Razorpay checkout (mock-aware, model: `RazorpayCheckout` / dead `patient/Billing.jsx`) → `POST /billing/verify` (or `/payments/verify`); re-fetch from backend after verify. This marks `Bill` PAID and fires `onBillPaid` (real progression).
- **Verify:** pay a pharmacy order → DB `Bill.status=PAID`, order CONFIRMED, still paid after refresh; multi-device: pharmacy sees the confirmed order.

### R24 · P0 · All · Read-by-ID endpoints · Cross-hospital / cross-doctor IDOR + PHI leak on `GET` by id
- **Problem:** `GET /appointments/:id`, `/prescriptions/:id`, `/lab-requests/:id` had no `checkRole` and their services default-**allowed** any role past the explicit PATIENT/DOCTOR branches → any authenticated user read any hospital's records. The DOCTOR branch compared `record.doctorId` (a `Doctor.id`) against `req.user.id` (a `User.id`), so it always threw — doctors could never read their own, while every staff role read everything. `GET /queue/doctor/:doctorId` took the doctor id from the URL, so any doctor could read another doctor's full queue (patient names/tokens = PHI).
- **Root cause:** default-allow authorization + `Doctor.id` vs `User.id` mismatch; queue trusts the URL param.
- **Files:** `backend/src/services/appointments.service.js` (`getAppointmentById`), `services/labRequests.service.js` (`getLabRequest`), `services/prescriptions.service.js` (`getPrescription`), `controllers/queue.controller.js` (`getDoctorQueue`); matching controllers thread `req.user.hospitalId`.
- **Fix:** default-deny in all three services — PATIENT own; DOCTOR resolves its own `Doctor.id` and matches; least-privilege hospital-scoped staff (appointments: HOSPITAL_ADMIN/RECEPTIONIST; lab: LAB_STAFF/HOSPITAL_ADMIN; prescriptions: PHARMACIST/HOSPITAL_ADMIN); SUPER_ADMIN any; everything else 403. `getDoctorQueue`: DOCTOR forced to own id (URL param ignored); HOSPITAL_ADMIN must target a doctor in its own hospital; SUPER_ADMIN any; else 403.
- **Verify:** patient reads own (200) / another's (403); doctor reads own appointment/queue (200) / another doctor's (403); Hospital B staff reads Hospital A record (403); pharmacist/driver reading arbitrary appointment (403).
- **Status:** ✅ DONE.

## P1 — core workflow broken

### R6 · P1 · Patient · Emergency tracking · Patient page is fully simulated & disconnected
- **Problem:** patient tracking auto-advances on a timer regardless of the real dispatch; never joins the socket; wrong fetch path 404s silently; uses non-existent statuses; fake ETA; fake map.
- **Root cause:** page built as a standalone simulation, never wired to the (real) backend.
- **Files:** `frontend/src/pages/patient/EmergencyTracking.jsx:35,39-43,62-77,110-128,174`.
- **Fix:** `GET /emergency/:id/status` on mount; `getSocket()` + join `emergency:{requestId}`; listen `emergency:accepted / location-update / status-update`; map real `EmergencyStatus`; delete the `setTimeout` progression; (map + ETA per GOOGLE-MAPS-INTEGRATION-PLAN).
- **Verify:** multi-device — driver accepts on device A → patient device B shows "driver assigned" within ~1s (no timer); status advances only when the driver acts.

### R7 · P1 · Lab staff/Patient · Lab workflow · Status transitions faked; invented statuses
- **Problem:** lab staff advance SAMPLE_COLLECTED/PROCESSING by abusing `uploadReport` with junk data; patient LabTab uses statuses not in the enum; View/Download report buttons dead.
- **Root cause:** missing backend status-advance endpoints for lab; frontend invented its own flow.
- **Files:** `frontend/src/pages/lab/Dashboard.jsx:210-223`; `frontend/src/pages/patient/HospitalWorkspace.jsx:405,448-454`; backend lab service/routes.
- **Fix:** add real lab status-advance endpoints (mirror pharmacy `advanceStatus`, scoped to hospital); call them from lab dashboard; align patient statuses to `LabRequestStatus`; wire View/Download to `reportFileUrl`.
- **Verify:** lab advances a request through PENDING→CONFIRMED→SAMPLE_COLLECTED→PROCESSING→COMPLETED via real endpoints; patient sees each real status + can open the report.

### R8 · P1 · All · Auth · 15-minute forced logout (no silent refresh)
- **Problem:** access token expires at 15m; any 401 hard-redirects to login even though a valid refresh token exists.
- **Root cause:** client never calls `POST /auth/refresh-token`; no silent-refresh interceptor; no `/auth/me` bootstrap.
- **Files:** `frontend/src/services/api.js:49-52`, `frontend/src/services/auth.service.js:33`, `authStore`.
- **Fix:** add a single-flight 401 refresh interceptor (queue in-flight requests, retry after refresh, clear+redirect only if refresh fails); bootstrap identity from `/auth/me` on load; drop the refresh-token JSON body echo.
- **Verify:** idle > 15m, perform an action → succeeds without a login bounce; reused/rotated refresh triggers reuse-detection.

### R9 · P1 · Hospital Admin/Super Admin · Routing · Sub-routes render the same monolith; complete features unreachable
- **Problem:** all `/admin/*` and `/superadmin/*` sub-routes render the Overview tab; Analytics, Audit-Log, Revenue, QueueMonitor, Users are unreachable despite finished page files.
- **Root cause:** dashboards use local `useState` for section; router points every sub-path at the monolith; no URL awareness.
- **Files:** `frontend/src/router/AppRouter.jsx:110-118,145-148`; `admin/Dashboard.jsx:20-33,603`; `superadmin/Dashboard.jsx:18-21,306`.
- **Fix (recommended):** route Analytics/AuditLog/Revenue/QueueMonitor/Users to their existing dedicated pages; for remaining sub-tabs, derive `activeItem` from `useLocation()`. Reconcile the two role-home maps.
- **Verify:** `/admin/analytics` shows analytics; `/superadmin/users` shows users; deep links land on the right section.

### R10 · P1 · Hospital Admin · Staff · Pharmacy staff can never be invited/listed
- **Problem:** inviting/listing pharmacy staff fails (empty list / validation 400).
- **Root cause:** frontend sends `PHARMACY_STAFF`, not the enum value `PHARMACIST`.
- **Files:** `frontend/src/services/admin.service.js:22,23`.
- **Fix:** use `'PHARMACIST'` for both list filter and invite payload.
- **Verify:** invite a pharmacist → 201; appears in the staff list.

### R11 · P1 · Patient/Driver · Emergency maps · No real map, no ETA, no location streaming
- **Problem:** requirement for real Google Maps + real geolocation + socket-driven driver location + route/distance ETA is unmet.
- **Root cause:** no map library; driver doesn't stream location; ETA is a timer.
- **Files:** per GOOGLE-MAPS-INTEGRATION-PLAN §7.
- **Fix:** implement that plan (keys via env, `@react-google-maps/api`, `watchPosition` streaming, Distance Matrix ETA with haversine fallback).
- **Verify:** driver marker moves with the physical device; ETA tracks distance; graceful degrade without a key.

## P1 (contract) & P2 — secondary

### R12 · P1 · All · Notifications · Bell always empty for every role
- **Problem:** notification list always `[]`, unread count always `0`.
- **Root cause:** hook reads `data.notifications` on the envelope instead of `res.data.notifications` (double-nesting).
- **Files:** `frontend/src/hooks/useNotifications.js:29-32`.
- **Fix:** read `res.data.notifications` / `res.data.unreadCount` / `res.data.total`.
- **Verify:** create a notification server-side → appears in the bell with correct count.

### R13 · P2 · All · Errors · Backend error messages never surface (13 sites)
- **Problem:** catch blocks read `err.response?.data?.message`, but the interceptor already normalized the error to `{status,message,errors}` (no `.response`) → generic/blank messages.
- **Files:** `RazorpayCheckout.jsx:73`, `superadmin/Hospitals.jsx:35`, `doctor/PatientProfileView.jsx:19`, `doctor/ConsultationScreen.jsx:54,81`, `admin/Staff.jsx:35`, `admin/Doctors.jsx:46`, `admin/Departments.jsx:34`, `consultation/LabRequestEditor.jsx:34`, `consultation/PrescriptionEditor.jsx:44`, `consultation/FollowUpRecommendationForm.jsx:27`, `passport/ConsentManager.jsx:33`, `patient/Passport.jsx:56`.
- **Fix:** use `err.message`.
- **Verify:** trigger a validation error → the real backend message renders.

### R14 · P2 · All · Contract · Follow-up controller returns raw objects (not enveloped)
- **Files:** `backend/src/controllers/followUp.controller.js:21,30,38,43`.
- **Fix:** wrap each in `res.json({ success:true, data:… })`.
- **Verify:** follow-up endpoints return `{success,data}`; consumers reading `.data` work.

### R15 · P2 · Driver · Dashboard · No state rehydration on refresh; History is a stub
- **Files:** `frontend/src/pages/driver/Dashboard.jsx:65-169,293-299`.
- **Fix:** fetch current online status + active/pending request on mount; implement History fetch.
- **Verify:** refresh mid-emergency → active request restored; History lists completed dispatches.

### R16 · P2 · Hospital Admin · Queue monitor · Dead socket subscription
- **Problem:** admin QueueMonitor joins `hospital:{hospitalId}:queue`, but the server never emits there.
- **Files:** `backend/src/services/queue.service.js` (`emitQueueUpdate` ~`:52`).
- **Fix:** also emit `queue:updated` to `hospital:{hospitalId}:queue`.
- **Verify:** admin monitor updates live as tokens are called.

### R17 · P2 · All · Socket · Listeners orphaned after reconnect
- **Files:** `frontend/src/services/socket.js` + consumers.
- **Fix:** re-bind listeners on `connect`/`reconnect`, or subscribe via a stable wrapper.
- **Verify:** kill/restore network → live updates resume without reload.

### R18 · P2 · Receptionist · Routing · RECEPTIONIST redirected to a route it can't access
- **Files:** `frontend/src/utils/roleRedirect.js:5` vs `constants.js` + guards.
- **Fix:** delete the stale duplicate map; send RECEPTIONIST to a route its guard allows.
- **Verify:** receptionist login lands on a working dashboard, not `/unauthorized`.

### R19 · P2 · Super Admin · Dashboard · Zero-flash (loading not gated)
- **Files:** `frontend/src/pages/superadmin/Dashboard.jsx:308,318`.
- **Fix:** gate `renderContent` on `loading`.

### R20 · P2 · Hospital Admin · Dead endpoint `GET /hospitals/me`
- **Files:** `frontend/src/services/admin.service.js:7`.
- **Fix:** add the route or remove the unused `getHospitalProfile`.

## P3 — polish / hardening

### R21 · P3 · Public · Login · Role selector redesign to a dropdown
- **Files:** login page role selector.
- **Fix:** replace the heavy button set with a clean dropdown. **Do not change auth logic** — visual only.
- **Verify:** each role still logs in and routes correctly.

### R22 · P3 · Security · Auth hardening
- Remove OTP/email `console.log` (`auth.controller.js:135`); throttle `/auth/refresh-token`, `/auth/logout`, OTP verify; bind OTP to email.

### R23 · P3 · Admin/Patient · Dead code & mock cleanup
- Remove `ACTIVITIES` mock + duplicate Departments stat (`admin/Dashboard.jsx:146-156`); persist or remove hardcoded `SettingsTab` (`:562-570`); bind notification `badge` to real unread count (`patient/Dashboard.jsx:45`); delete dead `Sidebar.jsx`, `layouts/DashboardLayout.jsx`, `layouts/PatientLayout.jsx`, `utils/roleRedirect.js` (or wire the richer dead pages in per R9); mobile bottom-nav `slice(0,5)` (`DashboardShell.jsx:199`).

---

## Execution order (dependency-aware)

1. **R4** (crash) — unblocks admin testing.
2. **R1, R2, R3** (authz/isolation) — security foundation; verify with two hospitals.
3. **R8** (refresh) then **R12, R13, R14** (contract) — stabilize the request/response layer before wiring workflows.
4. **R5** (real payments) + **R7** (lab endpoints) — core workflow integrity; depends on R1 (bill reads) being correct.
5. **R6 + R11** (emergency real-time + maps) — the flagship "no simulation" fix.
6. **R9, R10** (admin/superadmin routing + staff) + **R16, R17, R19, R20** (secondary wiring).
7. **R15** (driver hydration), **R18** (receptionist), **R21–R23** (polish/hardening).
8. **Regression** per MANUAL-E2E-TEST-PLAN across all roles + multi-device.

_Guardrails: smallest safe change per item; do not rewrite working services (pharmacy fulfillment, doctor queue, driver side, appointment-booking Razorpay path); no Redis; keys via env, never committed; test dependent workflows after each fix._


