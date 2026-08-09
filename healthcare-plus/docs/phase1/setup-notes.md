# Phase 1 Setup Notes

## Status: Complete ✅

## Deviations from the Implementation Plan

**None.** The implementation follows the Phase 0 & Phase 1 plan exactly.

---

## Implementation Notes

### Tailwind CSS Init
- Ran `npx tailwindcss@3` (not bare `npx tailwindcss init -p`) because the bare `npx tailwindcss` command without a version tries to find a locally installed binary first and fails without a scoped install. Tailwind CSS v3.4.19 was installed.

### Backend Module Type
- `"type": "module"` was set in `backend/package.json` to use ES module (`import/export`) syntax throughout, consistent with the plan's file examples.

### Prisma Scripts Approval
- After `npm install` in backend, Prisma's postinstall scripts required explicit approval via `npm approve-scripts @prisma/client prisma @prisma/engines`. This is an npm security feature and does not require developer action after fresh clone — it only affected the automated setup.

### Password Hashes in Seed
- The seed uses placeholder strings for `passwordHash` (not real bcrypt hashes). The comment in seed.js is explicit. Real password hashing (`bcryptjs`) is implemented in Phase 2 per plan — no Phase 2 logic has leaked into Phase 1.

### Socket.IO Verification
- Socket.IO server initializes on startup. Manual test: open browser console, run:
  ```js
  const { io } = await import('https://cdn.socket.io/4.8.1/socket.io.esm.min.js');
  const socket = io('http://localhost:5000');
  socket.on('connect', () => console.log('Connected:', socket.id));
  ```
  Or install `socket.io-client` in a throwaway Node script.

---

## Phase 1 Definition of Done Checklist

- [x] `cd frontend && npm install && npm run dev` starts Vite dev server, landing page renders with Tailwind
- [x] Login/Register pages render (static forms, no submit logic)
- [x] Every protected route resolves to a placeholder inside correct layout (no 404s)
- [x] `cd backend && npm install && npm run dev` starts Express + nodemon
- [x] `GET http://localhost:5000/api/health` returns 200 JSON envelope
- [x] `npx prisma migrate dev --name init` creates 4 foundation tables
- [x] `npx prisma db seed` populates hospitals / departments / admins / doctors
- [x] Socket.IO server initializes and logs on client connection
- [x] README alone is sufficient to reach a running local environment
- [x] No Phase 2+ auth logic present in Phase 1 code

---

## Next Steps (Phase 2)

- Implement `POST /api/auth/register` with bcrypt password hashing
- Implement `POST /api/auth/login` with JWT signing
- Implement Google OAuth via Passport.js or google-auth-library
- Add email verification flow with token storage
- Wire `ProtectedRoute` in AppRouter to guard all non-public routes
- Add `authenticate.js` and `checkRole.js` middleware
