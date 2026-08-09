# Phase 17 — Security Review
## Audit Date: 2026-08-08 | Scope: Phases 0–17 (all backend code)

---

## Methodology

This review is evidence-based and read-only. Findings are drawn from inspecting actual code paths, not assumptions. Each finding is labeled by severity: **CRITICAL / HIGH / MEDIUM / LOW / INFO**.

---

## 1. Authentication & Token Security

### 1.1 JWT Implementation

**Finding**: `signAccessToken` and `signRefreshToken` in `utils/jwt.js` use separate secrets (`JWT_SECRET`, `JWT_REFRESH_SECRET`). Access tokens expire at 15m, refresh tokens at 7d.

**Status**: ✅ PASS — Short-lived access tokens, separate refresh secret.

### 1.2 Token Storage

**Finding**: `localStorage.getItem('hc_token')` is used in `services/api.js`. JWTs in localStorage are accessible to JavaScript (XSS risk).

**Severity**: MEDIUM

**Mitigation already in place**: CSP headers via `helmet` (check `app.js`). `httpOnly` cookies are the stronger alternative but require CORS + SameSite config.

**Recommendation**: For v1 production: document this as a known risk in runbook. For v1.1: migrate to httpOnly refresh cookie + short-lived memory access token.

### 1.3 Refresh Token Handling

**Finding**: Refresh tokens are stored hashed in the DB via `refreshTokenHash`. On logout, the token is revoked in DB. Rotation on each use is implemented.

**Status**: ✅ PASS — Server-side revocable refresh tokens.

---

## 2. Authorization & RBAC

### 2.1 Role Enforcement

**Finding**: All routes use `checkRole(...)` middleware. Role constants are: PATIENT, DOCTOR, HOSPITAL_ADMIN, PHARMACIST, LAB_STAFF, AMBULANCE_DRIVER, SUPER_ADMIN.

**Status**: ✅ PASS — RBAC is enforced at route level.

### 2.2 Hospital Isolation

**Finding**: `scopeToHospital.js` middleware enforces that hospital-specific staff can only access resources belonging to their hospital. The `scopeToHospital.test.js` test suite covers this.

**Status**: ✅ PASS — Hospital scope is enforced middleware-level.

### 2.3 Ownership Checks

**Finding**: Patient-specific endpoints verify `appointment.patientId === req.user.id`, `consultation.doctorId === req.user.id`, etc. in service layer.

**Status**: ✅ PASS — Ownership checked at service layer (not just controller).

### 2.4 Phase 13 Cross-Hospital Exception

**Finding**: Emergency dispatch (Phase 13) intentionally allows ambulance drivers from any hospital to accept requests from any location. This is documented as a deliberate exception.

**Status**: ✅ EXPECTED — Documented exception in `docs/phase13/decisions.md`.

---

## 3. Input Validation

### 3.1 Zod Schemas

**Finding**: Zod is used throughout controllers for body validation. Password complexity is enforced. Email format is validated. String length limits are set on most fields.

**Status**: ✅ PASS — Zod schemas on all mutating endpoints.

### 3.2 SQL Injection

**Finding**: All DB queries use Prisma ORM. Prisma uses parameterized queries. No raw SQL string concatenation found in application code (exception: the Phase 15 migration SQL — correctly written with only safe enum values, not user input).

**Status**: ✅ PASS — Prisma ORM protects against SQL injection.

### 3.3 File Uploads

**Finding**: Lab report upload uses a `reportFileUrl` string field (URL to file). No multer or direct disk write found. File handling is external (CDN URL).

**Status**: ✅ PASS — No server-side file storage attack surface.

---

## 4. Payment Security

### 4.1 Razorpay Signature Verification

**Finding**: `verifyPaymentSignature` in `razorpay.service.js` uses HMAC-SHA256 to verify `razorpay_signature`. Server-side verification is done in `billing.service.js#verifyAndCompletePayment` before marking bill PAID.

**Status**: ✅ PASS — Cryptographic payment verification.

### 4.2 Double-Payment Prevention

**Finding**: `verifyAndCompletePayment` checks `bill.status === 'PAID'` and returns `{ alreadyPaid: true }` for idempotent webhook replays.

**Status**: ✅ PASS — Idempotent payment handling.

### 4.3 Mock Mode

**Finding**: When `RAZORPAY_KEY_ID` is not set, the service runs in mock mode. This is clearly logged to console. The mock generates fake order IDs that will never validate against real signatures.

**Severity**: LOW — Risk only in mis-configured production. Mitigated by the console warning.

**Recommendation**: Add a startup check that throws if `NODE_ENV=production` and mock mode is active.

---

## 5. Emergency Dispatch (Phase 13)

### 5.1 Authentication on Socket Handlers

**Finding**: All Socket.IO events are authenticated via JWT middleware on connection. The `registerEmergencyHandlers` function receives `socket.user` which is already verified.

**Status**: ✅ PASS — No unauthenticated socket paths.

### 5.2 Driver Location Broadcast

**Finding**: Driver location updates are emitted only to the `emergency:{requestId}` room. The patient requesting help is in that room. Other patients and staff are not.

**Status**: ✅ PASS — Location scoped to request room.

---

## 6. Notification System (Phase 15)

### 6.1 Server-Authoritative Notifications

**Finding**: `notification:new` events are only emitted from `notifications.service.js#notify()` (server-side). No client-emitted notification creation paths exist.

**Status**: ✅ PASS — No notification spoofing possible.

### 6.2 Notification Ownership

**Finding**: `markNotificationRead` in `notifications.service.js` checks `notif.userId !== userId` and throws before updating.

**Status**: ✅ PASS — Notifications owned by recipient.

---

## 7. Rate Limiting

**Finding**: `rateLimiter.js` applies `express-rate-limit` to the API. Auth-specific stricter limits are applied to `/api/auth` routes.

**Status**: ✅ PASS — Rate limiting in place.

---

## 8. Security Headers

**Finding**: `helmet` is applied in `app.js`. This enables HSTS, X-Frame-Options, X-XSS-Protection, Content-Type-Options, and a default CSP.

**Status**: ✅ PASS — Helmet security headers enabled.

---

## 9. CORS

**Finding**: CORS is configured in `app.js` with `origin: CLIENT_URL`. Socket.IO CORS also checks against `CLIENT_URL` and localhost for dev.

**Status**: ✅ PASS — CORS origin whitelist enforced.

---

## 10. Summary Risk Table

| Area | Status | Notes |
|---|---|---|
| JWT + Auth | ✅ PASS | Short-lived tokens, server-side revocation |
| RBAC | ✅ PASS | checkRole + scopeToHospital |
| Ownership checks | ✅ PASS | Service-layer enforcement |
| Input validation | ✅ PASS | Zod schemas on all mutations |
| SQL injection | ✅ PASS | Prisma ORM parameterized queries |
| Payment verification | ✅ PASS | HMAC-SHA256 + idempotent |
| Socket auth | ✅ PASS | JWT on connect |
| Notification auth | ✅ PASS | Server-authoritative only |
| Rate limiting | ✅ PASS | express-rate-limit applied |
| Security headers | ✅ PASS | helmet applied |
| CORS | ✅ PASS | Origin whitelist |
| JWT in localStorage | ⚠️ MEDIUM | XSS risk; documented known gap for v1.1 |
| Razorpay mock in prod | ⚠️ LOW | Mis-config risk; needs startup guard |
| Emergency cross-hospital | ℹ️ INFO | Intentional exception, documented |
