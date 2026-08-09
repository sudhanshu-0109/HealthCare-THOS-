# healthcare+ Phase 2 — Architecture & Security Decisions

---

## 1. Dual-Token JWT Model vs Single Long-Lived Token

**Decision:** We adopted the **Dual-Token Model** (Short-lived Access Token + Long-lived Refresh Token).

- **Access Token:**
  - Type: JWT
  - Lifetime: `15 minutes` (`JWT_EXPIRES_IN=15m`)
  - Signed with: `JWT_SECRET`
  - Transmission: Sent in `Authorization: Bearer <token>` HTTP header
  - Storage: Stored in Zustand state (in-memory) & localStorage for hydration.

- **Refresh Token:**
  - Type: Signed JWT + DB-backed hash tracking
  - Lifetime: `30 days` (`JWT_REFRESH_EXPIRES_IN=30d`)
  - Signed with: `JWT_REFRESH_SECRET`
  - Transmission: Sent as an `httpOnly`, `sameSite=lax` cookie (`hc_refresh_token`) and supported in request body fallback.
  - Storage: Stored in the `RefreshToken` database table as a SHA-256 hash (`tokenHash`).

**Rationale:**
1. Short-lived access tokens reduce the blast radius if an access token is compromised.
2. DB-backed refresh tokens allow instant session revocation (e.g. on logout, password reset, or suspicious activity) without requiring a Redis cache.
3. Automatic rotation on each refresh ensures stolen refresh tokens are detected and automatically invalidate all sessions for that user.

---

## 2. Token Storage & Security Strategy

- **Access Token:** Received in JSON payload (`data.accessToken`) upon login/register. Kept in memory/Zustand state for client-side API requests.
- **Refresh Token:** Set as an `httpOnly` cookie by Express controller on successful authentication. Javascript running on the page cannot read `httpOnly` cookies, preventing token theft via XSS attacks.
- **Database Hashes:** Password reset tokens, email verification tokens, and refresh tokens are all stored as SHA-256 hashes in PostgreSQL. A database leak will not expose usable authentication or reset tokens.

---

## 3. Public Registration Restriction

- **Public Signup:** Restricted strictly to the `PATIENT` role.
- **Staff & Admins:** Roles (`DOCTOR`, `HOSPITAL_ADMIN`, `RECEPTIONIST`, `PHARMACIST`, `LAB_STAFF`, `AMBULANCE_DRIVER`) cannot be created through public registration.
- Admin APIs (Phase 3+) will allow `HOSPITAL_ADMIN` and `SUPER_ADMIN` to invite and create staff accounts within their respective hospital workspaces.

---

## 4. Non-Leaking User Enumeration Responses

- **Resend Verification:** Returns `200 OK` with a generic message regardless of whether the email address exists in the system.
- **Forgot Password:** Returns `200 OK` with a generic message regardless of whether the email address exists in the system.
- **Login:** Returns `401 Unauthorized` with a generic `"Invalid email or password"` message to prevent attackers from discovering registered email addresses through login attempts.
