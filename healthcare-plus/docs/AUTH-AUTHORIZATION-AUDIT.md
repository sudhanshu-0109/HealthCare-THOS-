# AUTH / AUTHORIZATION / HOSPITAL-ISOLATION AUDIT

_All findings are from direct reads of the code. Severity: **P0** = security / data-loss / crash, **P1** = core workflow broken, **P2** = secondary, **P3** = polish._

---

## A. Authentication flow

| Area | State | Notes |
|---|---|---|
| Registration | Works | Email + password; OTP email verification. |
| Login (password) | Works | Issues access (15m) + refresh (30d). |
| Login (Google OAuth) | **Solid** | `verifyIdToken` with audience check. |
| Logout | Works | `/auth/logout` clears refresh; but **unthrottled**. |
| JWT access | `{sub,role,jti}` 15m, `localStorage.hc_token` | Attached by request interceptor. |
| JWT refresh | `{sub,jti}` 30d, hashed in DB, httpOnly cookie **+ echoed in JSON body** | Body echo should be removed. |
| Refresh rotation + reuse-detection | **Exists on backend, never used by client** | `authService.refreshToken` (`auth.service.js:33`) defined; no 401 silent-refresh interceptor in `api.js`; no `/auth/me` bootstrap. |
| Password reset | Works | OTP based. |

### Findings

- **P1 — 15-minute forced logout.** The client never calls `POST /auth/refresh-token`. On any 401 (non-public page) `api.js:49-52` clears auth and hard-redirects to `/login`. Fix: add a response-interceptor silent-refresh (single-flight, queue pending requests) + `/auth/me` bootstrap on app load.
- **P2 — Client-trusted role.** Role is read from the client-editable Zustand store (`healthcare-plus-auth`) with no `/auth/me` revalidation. Editing localStorage changes the client's *perceived* role (backend still enforces per-route, so this is UX/UI escalation only — but it means the UI can render the wrong dashboard). Fix: bootstrap identity from `/auth/me`.
- **P2 — Divergent role→home maps.** `utils/roleRedirect.js` (`ROLE_HOME_ROUTE`, singular) maps `RECEPTIONIST → /admin/dashboard`; `utils/constants.js` (`ROLE_HOME_ROUTES`, plural) maps `RECEPTIONIST → /receptionist/dashboard`. `Unauthorized.jsx` and `Navbar.jsx` use the constants version. `roleRedirect.js` is a stale duplicate. Fix: delete the duplicate; reconcile RECEPTIONIST target with the actual route guard.
- **P3 — OTP / email in console.** `auth.controller.js:135` `console.log`s OTP/email. OTP is brute-forceable (email optional → global hash lookup). Fix: remove logs; throttle; require email binding.
- **P3 — Unthrottled auth endpoints.** `/auth/refresh-token` and `/auth/logout` have no rate limit.

---

## B. Authorization (backend RBAC) & hospital isolation

The backend uses `authenticate` + `checkRole(...)` + `scopeToHospital` middleware. `scopeToHospital` resolves `req.hospitalId` for the acting staff user; services must then filter by it. **Where a read/write does not receive or apply `hospitalId`, cross-hospital access (IDOR) is possible.**

### P0 findings (fix first)

1. **Bill IDOR — `bills.service.js:69-85` + `bills.routes.js:20`.**
   - `getBillById` has **no default-deny**: for any role that is not explicitly `PATIENT`/`HOSPITAL_ADMIN`, it returns the bill without a hospital check → any staff role can read any hospital's bill.
   - The route `GET /bills/:id` (`bills.routes.js:20`) has `authenticate` only — **no `checkRole`, no `scopeToHospital`** → `req.hospitalId` is `undefined`, so even the admin branch's hospital filter can't apply.
   - **Also** `BILL_SELECT` (`bills.service.js:8-39`) **omits `patientId`**, so the patient-owner check compares `undefined !== requesterId` → **always 403 for the legitimate patient**.
   - **Fix (together):** add `patientId` to `BILL_SELECT`; add `scopeToHospital` to the route (and appropriate `checkRole`); make `getBillById` **default-deny** (explicitly allow PATIENT-owner, and staff only within `req.hospitalId`).

2. **Cross-hospital pharmacy confirm + bill — `pharmacyOrders.service.js:57-63`.** `pharmacistMatchAndConfirm` does `findUnique({ where: { id } })` ignoring `hospitalId`; `bills.controller.js:57` (`confirmPharmacyOrder`) passes no hospital scope. → a pharmacist can confirm/bill another hospital's order. **Fix:** thread `req.hospitalId`; verify the order belongs to it before confirm.

3. **Cross-hospital lab confirm + bill — `labFulfillment.service.js:24-30` (`confirmLabRequest`)** and **`:87-89` (`uploadReport`, a PHI write)**; `bills.controller.js:79,86`. Same pattern. **Fix:** scope to `req.hospitalId`.

### P1 findings

4. **Appointment read IDOR — `appointments.service.js:299-311`.** Read path exposed to unhandled roles; needs default-deny.
5. **Lab-request read IDOR — `labRequests.service.js:88-102`** and **prescription read — `prescriptions.service.js:92-107`.** Unhandled roles fall through without deny.
6. **Doctor-queue IDOR — `queue.service.js:77-86`.** Any doctor can read any doctor's queue (no `doctorId === req.user.id` check).

### General fix pattern

For every "read one / act on one" service that a staff role can reach:
```
// default-deny skeleton
if (role === 'PATIENT') { if (row.patientId !== userId) throw forbidden; }
else if (STAFF_ROLES.includes(role)) { if (row.hospitalId !== reqHospitalId) throw forbidden; }
else { throw forbidden; }   // <-- the missing default-deny
```
And ensure the **route** attaches `scopeToHospital` so `req.hospitalId` is populated for staff.

---

## C. Frontend route guarding

`components/auth/ProtectedRoute.jsx` (the only guard):
- `isAuthenticated = Boolean(token && user)` → unauthenticated ⇒ `Navigate('/login?redirect=…')` (deep link preserved).
- `allowedRoles` non-empty and `!allowedRoles.includes(user.role)` ⇒ `Navigate('/unauthorized')` (403 page, not silent home redirect).
- Direct-URL access to a wrong-role route **is blocked** client-side (the wrong-role page never mounts).
- **Caveat:** client-side only. Real enforcement is the backend RBAC above — which is where the P0/P1 IDORs matter.

- **P2 — RECEPTIONIST redirect mismatch:** `roleRedirect.js` sends RECEPTIONIST to `/admin/dashboard`, but that route group is gated `HOSPITAL_ADMIN` only ⇒ receptionist lands on `/unauthorized`. Reconcile with the receptionist route + the constants map.

---

## D. Verification steps (per fix)

- **Bill IDOR:** as a PATIENT, `GET /bills/{ownBillId}` returns 200 with data (regression: currently 403 due to missing `patientId`); `GET /bills/{otherHospitalBillId}` as staff returns 403.
- **Pharmacy/Lab cross-hospital:** as Hospital B pharmacist/lab, confirming a Hospital A order/request returns 403.
- **Queue:** doctor A cannot fetch doctor B's queue.
- **Refresh:** leave a tab idle > 15 min, perform an action → it succeeds via silent refresh instead of bouncing to login.
