# API INTEGRATION AUDIT (response contract + endpoint/method wiring)

_Frontend ↔ backend contract check. Envelope rule (see CODEBASE-UNDERSTANDING §3): interceptor returns `response.data` = `{ success, data }`; consumers read `res.data`; the rejected error is a normalized `{ status, message, errors }` with **no `.response`**._

---

## 1. Envelope confirmation

- No shared `sendSuccess`/`ApiResponse` helper; each controller builds `{ success:true, data }` inline. Errors centralized in `middleware/errorHandler.js:26-30`.
- All ~21 `frontend/src/services/*.js` files are thin pass-throughs (`export const x = (...) => api.get(...)`) — none read `.data` internally. Shape reads happen in **consumers**.
- No `.data.data` double-unwrap exists in the service layer (verified by grep).

**Backend envelope inconsistency (P2):** `backend/src/controllers/followUp.controller.js` returns **raw objects**:
- `:21` `res.status(201).json(recommendation)`
- `:30` `res.json(booking)`
- `:38` `res.json({ followUp })`
- `:43` `res.json({ followUps })`
Fix: wrap each in `res.json({ success: true, data: … })`.

---

## 2. Response-shape mismatches (consumer reads)

| file:line | source → endpoint | reads | actual | broken |
|---|---|---|---|---|
| `hooks/useNotifications.js:29-32` | `getNotifications` → `GET /notifications` | `data.notifications`, `data.unreadCount`, `data.total` on the envelope | payload at `res.data.*` (controller returns `{success,data:result}`) | **YES** — bell list always `[]`, count always `0` for every role |
| `components/booking/RazorpayCheckout.jsx:73` | catch | `err.response?.data?.message` | error is normalized `{status,message,errors}` | **YES** (msg never shown) |
| `pages/superadmin/Hospitals.jsx:35` | catch | `e.response?.data?.message` | same | **YES** |
| `pages/doctor/PatientProfileView.jsx:19` | catch | `err.response?.data?.message` | same | **YES** |
| `pages/doctor/ConsultationScreen.jsx:54, :81` | catch | `err.response?.data?.message` | same | **YES** |
| `pages/admin/Staff.jsx:35` | catch | `e.response?.data?.message` | same | **YES** |
| `pages/admin/Doctors.jsx:46` | catch | `e.response?.data?.message` | same | **YES** |
| `pages/admin/Departments.jsx:34` | catch | `e.response?.data?.message` | same | **YES** |
| `components/consultation/LabRequestEditor.jsx:34` | catch | `err.response?.data?.message` | same | **YES** |
| `components/consultation/PrescriptionEditor.jsx:44` | catch | `err.response?.data?.message` | same | **YES** |
| `components/consultation/FollowUpRecommendationForm.jsx:27` | catch | `err.response?.data?.message` | same | **YES** |
| `components/passport/ConsentManager.jsx:33` | catch | `err.response?.data?.message` | same | **YES** |
| `pages/patient/Passport.jsx:56` | catch | `err.response?.data?.message` | same | **YES** |

**Fix:** in every catch above, use `err.message` (the normalized field). For `useNotifications`, read `res.data.notifications` / `res.data.unreadCount` / `res.data.total`.

**Success-path reads that are already correct** (defensive `res.data?.x || res.data || []`): `patient/Dashboard.jsx:708` (notifications — note this reads the *same* endpoint correctly, only the hook is wrong), `CurrentQueueWidget.jsx:23`, `SlotPicker.jsx:41`, `useDoctorQueue.js:38`, `pharmacy/Dashboard.jsx:116`, `lab/Dashboard.jsx:190`, `doctor/Dashboard.jsx:291/336/569`, admin/superadmin list pages.

---

## 3. Endpoint / method mismatches

| file:line | frontend call | backend reality | verdict |
|---|---|---|---|
| `services/admin.service.js:7` | `GET /hospitals/me` | no `/me` route; `hospital.routes.js` has public `GET /:id` | **Path doesn't exist** → resolves to `getHospitalById(id="me")` → 404. (`getHospitalProfile` appears unused.) |
| `services/admin.service.js:22` | `GET /staff?role=PHARMACY_STAFF` (used `admin/Dashboard.jsx`) | Role enum value is `PHARMACIST` | **Wrong value** → empty list |
| `services/admin.service.js:23` | `POST /staff/invite {role:'PHARMACY_STAFF'}` | `inviteStaffSchema` enum = `['RECEPTIONIST','PHARMACIST','LAB_STAFF','AMBULANCE_DRIVER']` (`staff.controller.js:8`) | **Rejected (400/422)** → pharmacy staff can never be invited |

All other frontend endpoints/methods cross-checked against the route files **exist with matching methods** (auth, hospitals, departments, doctors, staff, users, ai/triage, availability, appointments, payments/verify, queue, passport, dashboard/summary, consultations, prescriptions, lab-requests, follow-ups, billing, bills, pharmacy-orders, lab-fulfillment, ambulances, driver, analytics, audit-log, notifications, lab-tests).

---

## 4. Ranked priorities

- **P0 — Notification bell broken for every role.** `useNotifications.js:29-32`. Fix the read path.
- **P1 — Pharmacy staff can never be invited/listed.** `admin.service.js:22-23` — use `'PHARMACIST'`.
- **P2 — Backend error messages never surface (13 sites).** Replace `err.response?.data?.message` with `err.message`.
- **P2 — Follow-up controller returns raw objects.** Wrap in the envelope.
- **P3 — Dead/broken `GET /hospitals/me`.** Add the route or remove the unused method.

_Payment-contract issues (PaymentModal never calls the backend, invented lab statuses) are tracked in COMPLETE-WORKFLOW-AUDIT and MASTER-REPAIR-PLAN, not here._
