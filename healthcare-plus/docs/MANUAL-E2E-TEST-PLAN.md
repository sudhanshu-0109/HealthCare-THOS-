# MANUAL END-TO-END TEST PLAN (multi-device, real backend)

_Every test asserts real backend/DB/socket behavior — **no** step should pass on a frontend timer, mock, or local state flip. "Multi-device" = separate browsers/devices (patient, doctor, pharmacy, lab, driver) reaching the same backend via a tunnel (e.g. one shared `VITE_API_URL`). After any status change, **refresh the page** — real state must survive the refresh._

## 0. Environment preconditions
- Backend running with a real `DATABASE_URL`; migrations applied; seed at least **two hospitals** (A and B) each with an admin, a doctor, a pharmacist, lab staff, and a driver, plus one patient.
- `.env` files present and git-ignored: JWT secrets, (optional) `VITE_GOOGLE_MAPS_API_KEY`, `GOOGLE_MAPS_API_KEY`, `RAZORPAY_KEY_ID/SECRET`. Confirm no secret is committed (`git diff` before any commit).
- Socket connects on login (check devtools Network → WS).

## 1. Auth
1. Register → receive OTP (email; not just console) → verify → login.
2. Google OAuth login for an existing/new user.
3. **Silent refresh:** log in, leave idle > 15 min, perform an action → succeeds without a login bounce (R8).
4. Deep-link `/patient/dashboard` while logged out → redirected to `/login?redirect=…`, and back after login.
5. Wrong-role deep link (patient → `/admin/dashboard`) → `/unauthorized` (R9 guard).
6. Logout clears token; protected pages redirect.

## 2. Authorization / hospital isolation (two hospitals)
1. Hospital A admin sees only A's doctors/staff/bills/queue; never B's.
2. As A patient, `GET` own bill → 200 with data (R1 regression check).
3. As B staff, attempt to read an A bill / confirm an A pharmacy order / confirm-or-upload an A lab request → **403** (R1/R2/R3).
4. Doctor A cannot fetch doctor B's queue (R6-authz / queue IDOR).

## 3. Patient → Doctor → Queue (real-time)
1. Patient books an appointment with a Hospital A doctor.
2. **Pay** via the real flow → backend `Bill.status=PAID`, appointment `CONFIRMED` (R5). Refresh → still confirmed.
3. Appointment appears on the **doctor** device (DB-backed), not only the patient's.
4. Doctor "Call next" → **patient device** shows the call banner within ~1s (socket, R real-time). No timer.
5. Admin QueueMonitor updates live as tokens are called (R16).

## 4. Doctor → Prescription → Pharmacy
1. Doctor writes a prescription during consultation.
2. Patient sees it, accepts → pharmacy order created (DB).
3. Patient **pays** the pharmacy order via the real flow → order `CONFIRMED` in DB (R5); pharmacy device sees it.
4. Pharmacist advances **manually**: CONFIRMED → PREPARING → PACKED/READY → COMPLETED (R pharmacy). Each step is a real API call; patient sees each status (refresh-safe), with **no** auto-progression.

## 5. Doctor → Lab
1. Doctor requests lab tests; patient accepts.
2. Patient **pays** → lab request `CONFIRMED` (R5/R7). Refresh-safe.
3. Lab staff advances via **real endpoints**: CONFIRMED → SAMPLE_COLLECTED → PROCESSING → COMPLETED (R7) — not via faked `uploadReport`.
4. Lab uploads a real report; patient **and** doctor can open it (View/Download work); status shows the real `LabRequestStatus`.

## 6. Emergency dispatch + tracking (multi-device, the flagship)
1. Patient triggers SOS (press-and-hold) → backend creates request (REQUESTED→SEARCHING); patient sent to tracking.
2. **Driver device** (online) receives `emergency:new-request`; driver **manually** Accepts.
3. **Patient device** shows "driver assigned" within ~1s via socket (R6) — **not** on a timer. Kill the patient timer expectation: if the driver never accepts, the patient must stay in "searching" (no auto-advance).
4. Driver marks En-route → Picked-up → Arrived; patient stage advances **only** on these real events.
5. **Map (R11):** with a key, patient sees a real Google Map; the driver marker moves as the driver device physically moves; ETA changes with distance and never counts down on its own. Without a key, a graceful placeholder shows and statuses still advance.
6. Refresh the patient tracking page mid-emergency → correct current status restored from `GET /emergency/:id/status`.
7. Driver refresh mid-emergency → active request restored (R15).

## 7. Billing
1. Patient billing tab lists real bills with correct paid/pending totals.
2. Pay an outstanding bill via the real flow → PAID in DB; receipt viewable; refresh-safe (R5).
3. Admin revenue reflects the payment (scoped to the admin's hospital only).

## 8. Admin / Super Admin
1. Admin: Overview, Doctors, Departments, Staff, Lab-tests all load real data; Medicines tab opens without crashing (R4).
2. Admin: Analytics, Audit-Log, Revenue, QueueMonitor reachable and data-backed (R9).
3. Invite a **pharmacist** → 201 and appears in staff (R10).
4. Super Admin: Hospitals, Users, Analytics, Audit-logs reachable and data-backed (R9); no zero-flash (R19).

## 9. Notifications & errors
1. Bell shows real notifications with correct unread count for each role (R12).
2. Force a validation error (e.g. invalid invite) → the **real backend message** renders (R13).

## 10. Regression sweep (after all fixes)
- Re-run §3–§6 end-to-end on separate devices.
- Confirm the previously-real workflows still work: doctor queue, pharmacy fulfillment, driver side, appointment-booking Razorpay path.
- Grep the final diff for any committed secret or leftover `setTimeout` business-progression / mock array.
