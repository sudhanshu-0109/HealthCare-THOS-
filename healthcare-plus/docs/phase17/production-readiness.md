# Phase 17 — Production Readiness Checklist
## Status as of 2026-08-08 (Phases 0–17 Complete)

---

## ✅ Ready Items

### Backend
- [x] Express server with `helmet`, `cors`, `morgan`, `express-rate-limit`
- [x] Prisma ORM with PostgreSQL migrations (Phases 0–15 applied)
- [x] JWT authentication (access 15m + refresh 7d, server-side revocable)
- [x] Zod input validation on all mutating endpoints
- [x] RBAC via `checkRole` middleware (7 roles)
- [x] Hospital isolation via `scopeToHospital` middleware
- [x] Socket.IO with JWT auth middleware
- [x] Razorpay payment integration with HMAC-SHA256 verification
- [x] Email delivery via Nodemailer / Resend (configurable)
- [x] Notification system (DB + Socket.IO push + selective email)
- [x] Emergency dispatch with real-time location tracking
- [x] Audit logging for admin actions
- [x] Error handling via `errorHandler.js` with `ApiError` classification
- [x] Test suite: 11 suites, 29 tests, all pass

### Frontend
- [x] Vite + React 19 SPA
- [x] React Router v7 with role-based route guards
- [x] Zustand auth store
- [x] Axios with interceptors (JWT attach, 401 redirect)
- [x] Socket.IO client with auth
- [x] All role dashboards: Patient, Doctor, Admin, Driver, Lab, SuperAdmin
- [x] NotificationBell with real-time Socket.IO integration
- [x] ConfirmDialog shared component
- [x] EmptyState, Loader, ErrorBoundary common components
- [x] Mobile bottom nav with safe area fix (`pb-20 lg:pb-0`)

---

## ⚠️ Pre-Deployment Required Actions

### Secrets & Environment

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Min 64 chars random string |
| `JWT_REFRESH_SECRET` | ✅ | Different from JWT_SECRET |
| `RAZORPAY_KEY_ID` | ✅ | Live key for production |
| `RAZORPAY_KEY_SECRET` | ✅ | Live secret for production |
| `RAZORPAY_WEBHOOK_SECRET` | ✅ | From Razorpay dashboard |
| `EMAIL_HOST` / `EMAIL_USER` / `EMAIL_PASSWORD` | Optional | Or `RESEND_API_KEY` |
| `RESEND_API_KEY` | Optional | Alternative to SMTP |
| `EMAIL_FROM` | Optional | Sender address |
| `CLIENT_URL` | ✅ | Frontend URL for CORS |
| `NODE_ENV` | ✅ | Set to `production` |
| `GEMINI_API_KEY` | Optional | For AI symptom checker |
| `GOOGLE_CLIENT_ID` | Optional | For Google OAuth login |
| `PORT` | Optional | Default 5000 |

### Database
- [ ] Run `npx prisma migrate deploy` on production DB
- [ ] Run `npx prisma db seed` if initial hospital/admin data needed
- [ ] Enable PostgreSQL connection pooling (PgBouncer or Supabase pooler recommended)

### Application

- [ ] Add startup guard: if `NODE_ENV=production` and Razorpay is in mock mode → throw at boot
- [ ] Review rate limits: current defaults may be too permissive for auth endpoints under load
- [ ] Enable production logging (structured JSON logs, not morgan dev format)
- [ ] Configure `ALLOWED_ORIGINS` array for multi-domain CORS if frontend is on separate domain

### Infrastructure
- [ ] TLS/SSL termination at load balancer (or caddy/nginx)
- [ ] WebSocket support enabled on load balancer (sticky sessions or Redis adapter for Socket.IO horizontal scaling)
- [ ] Health check endpoint: `GET /api/health` returns 200

---

## Known v1 Limitations (Documented, Not Blocking)

| Limitation | Severity | Plan |
|---|---|---|
| JWT stored in localStorage (XSS risk) | Medium | Migrate to httpOnly cookie in v1.1 |
| No Razorpay webhook endpoint for async payment confirmation | Medium | Webhook handler shell exists; needs Razorpay dashboard config |
| Socket.IO not horizontally scalable (single-node) | Medium | Add Redis adapter for multi-instance |
| Lab report file upload uses CDN URL (no server-side validation) | Low | Add URL validation or signed upload in v1.1 |
| No email queue (email sending is synchronous) | Low | Add Bull/BullMQ queue in v1.1 for retry/backoff |
| Crowd status is randomized (no real sensor input) | Info | Real integration in v2 |

---

## Test Coverage Summary

| Suite | Tests | Status |
|---|---|---|
| auth.test.js | 8 | ✅ PASS |
| consultations.test.js | 3 | ✅ PASS |
| billing.test.js | 1 | ✅ PASS |
| notifications.test.js | 2 | ✅ PASS |
| emergencyDispatch.test.js | 3 | ✅ PASS |
| analytics.test.js | 2 | ✅ PASS |
| auditLog.test.js | 2 | ✅ PASS |
| crowdStatus.test.js | 2 | ✅ PASS |
| ai.test.js | 2 | ✅ PASS |
| scopeToHospital.test.js | 2 | ✅ PASS |
| geo.test.js | 2 | ✅ PASS |
| **Total** | **29** | **✅ 29/29 PASS** |
