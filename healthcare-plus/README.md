# healthcare+

> A full-stack healthcare platform connecting patients with hospitals, doctors, and emergency services.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React + Vite |
| Routing | React Router v6 |
| Styling | Tailwind CSS |
| State | Zustand |
| HTTP Client | Axios |
| Realtime | Socket.IO |
| Backend | Node.js + Express |
| ORM | Prisma |
| Database | PostgreSQL |
| Payments | Razorpay (Phase 9) |
| Storage | Cloudinary (Phase 3+) |

---

## Prerequisites

- **Node.js** v18 or higher
- **PostgreSQL** running locally (or a connection string from a managed provider like Supabase, Railway, or Render)
- **npm** v9 or higher

---

## Local Setup

### 1. Clone and navigate to the project

```bash
git clone <your-repo-url>
cd healthcare-plus
```

---

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file and fill in required values
cp .env.example .env
# → Open .env and set DATABASE_URL and JWT_SECRET at minimum

# Run Prisma migration (creates the foundation tables in your PostgreSQL database)
npx prisma migrate dev --name init

# Seed the database with initial data
npx prisma db seed

# (Optional) Launch Prisma Studio to inspect data visually
npx prisma studio

# Start the backend dev server
npm run dev
```

**Expected output:**
```
🚀 healthcare+ API running
   Port:        5000
   Environment: development
   Health:      http://localhost:5000/api/health
```

**Verify backend:**
```bash
curl http://localhost:5000/api/health
# Expected: { "success": true, "message": "healthcare+ API is running", "timestamp": "..." }
```

---

### 3. Frontend Setup

Open a **new terminal** tab:

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# → VITE_API_URL should already point to http://localhost:5000/api

# Start the frontend dev server
npm run dev
```

**Expected output:**
```
VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

Visit **http://localhost:5173** — the landing page should render with Tailwind styles and navigation working.

---

## Seeded Accounts

After running `npx prisma db seed`, the following accounts are created (passwords are placeholder hashes — real auth is implemented in Phase 2):

| Email | Role |
|---|---|
| superadmin@healthcareplus.dev | SUPER_ADMIN |
| admin.citygeneralhospital@healthcareplus.dev | HOSPITAL_ADMIN |
| admin.apollomedical@healthcareplus.dev | HOSPITAL_ADMIN |
| dr.ananya.sharma@healthcareplus.dev | DOCTOR |
| dr.rajesh.iyer@healthcareplus.dev | DOCTOR |
| dr.priya.menon@healthcareplus.dev | DOCTOR |
| dr.vikram.nair@healthcareplus.dev | DOCTOR |
| dr.deepa.krishna@healthcareplus.dev | DOCTOR |

---

## Project Structure

```
healthcare-plus/
├── .gitignore
├── README.md
├── frontend/              React + Vite app
│   ├── src/
│   │   ├── router/        AppRouter.jsx — full route tree
│   │   ├── layouts/       PublicLayout, PatientLayout, DashboardLayout
│   │   ├── components/    Shared UI components
│   │   ├── pages/         Page components per role
│   │   ├── hooks/         useAuth.js
│   │   ├── services/      api.js (Axios instance)
│   │   ├── store/         authStore.js (Zustand)
│   │   └── utils/         constants.js
│   └── .env.example
├── backend/               Express + Prisma API
│   ├── src/
│   │   ├── app.js         Express app config
│   │   ├── server.js      HTTP server + Socket.IO
│   │   ├── config/        env.js, cors.js
│   │   ├── routes/        index.js + health.routes.js
│   │   ├── controllers/   health.controller.js
│   │   ├── middleware/     errorHandler, notFound, requestLogger
│   │   ├── utils/         ApiError.js, asyncHandler.js
│   │   ├── sockets/       index.js (stub)
│   │   └── prisma/        client.js
│   ├── prisma/
│   │   ├── schema.prisma  Foundation schema
│   │   └── seed.js        Database seeder
│   └── .env.example
└── docs/
    └── phase0/            Architecture docs, ER diagram, API spec
```

---

## Phase Roadmap

| Phase | Description | Status |
|---|---|---|
| Phase 0 | Product Planning & System Architecture | ✅ Complete |
| Phase 1 | Project Setup & PERN Foundation | ✅ Complete |
| Phase 2 | Authentication (JWT + Google OAuth) | ⬜ Pending |
| Phase 3 | Hospital, Department, Doctor Management | ⬜ Pending |
| Phase 4 | Appointment Booking & Management | ⬜ Pending |
| Phase 5 | Healthcare Passport, Consultation, Prescription | ⬜ Pending |
| Phase 6 | Queue System + Socket.IO | ⬜ Pending |
| Phase 7 | Pharmacy Orders & Medicine Reminders | ⬜ Pending |
| Phase 8 | Lab Requests & Reports | ⬜ Pending |
| Phase 9 | Billing & Razorpay Payments | ⬜ Pending |
| Phase 10 | Emergency SOS & Ambulance Dispatch | ⬜ Pending |
| Phase 11 | Notifications | ⬜ Pending |
| Phase 12 | Analytics, Audit Logs, Super Admin | ⬜ Pending |

---

## Documentation

All Phase 0 architecture documents are in `docs/phase0/`:
- `roles-permission-matrix.md` — 19 modules × 8 roles
- `er-diagram.md` — Full Mermaid ER diagram
- `schema.prisma` — Full design-reference Prisma schema
- `api-structure.md` — Every REST route
- `frontend-page-map.md` — Full route tree per role
- `backend-module-map.md` — File naming contract
- `workflows.md` — 12 core workflow diagrams
- `wireframes.md` — 6 ASCII wireframes
