# ROUTE / PAGE-COMPLETENESS AUDIT

_Frontend routing (`frontend/src/router/AppRouter.jsx`) + page mounting/hydration. Severity as elsewhere._

---

## 1. Guarding (see AUTH-AUTHORIZATION-AUDIT §C)

`ProtectedRoute` correctly blocks wrong-role and unauthenticated access client-side. RECEPTIONIST home-route mismatch noted there.

---

## 2. The monolithic-dashboard problem (P1)

**None of the four monolithic dashboards read the URL.** Each holds its section in local `useState`, so every sub-route mapped to the same component renders identical content (its default tab):

- `admin/Dashboard.jsx:603` `useState('overview')` — imports nothing from `react-router-dom`.
- `superadmin/Dashboard.jsx:306` `useState('overview')`.
- `patient/Dashboard.jsx:840` `useState('home')`.
- `doctor/Dashboard.jsx:613` `useState('overview')`.

**Consequences:**
- All 8 `/admin/*` routes (`AppRouter.jsx:110-118`) render `<HospitalAdminDashboard/>` **always on Overview**; `/admin/departments`, `/admin/doctors`, … do not deep-link.
- Admin `NAV_ITEMS` (`Dashboard.jsx:20-33`) has **no tab** for Analytics / Audit-Log / Revenue ⇒ `/admin/analytics`, `/admin/audit-log`, `/admin/revenue` are **unreachable features**, despite complete dead page files existing for them.
- Superadmin `NAV_ITEMS` has only `overview` + `hospitals` ⇒ `/superadmin/users|analytics|audit-logs` unreachable.
- The patient dashboard's 5 sub-routes also ignore the URL but its in-page tabs work, so it's a UX gap rather than a broken feature.

---

## 3. Nav systems (only one is live)

- **`layout/DashboardShell.jsx` (LIVE, all 7 dashboards):** nav is `<button onClick={() => setActiveItem(id)}>` — in-page tab state, **no route change**. Mobile bottom nav renders only `navItems.slice(0,5)` (`:199`) → admin's 12 tabs: only 5 reachable from the bottom bar. Header title derives from `activeItem`, so URL and visible section can disagree.
- **`components/common/Sidebar.jsx` (DEAD):** only imported by `layouts/DashboardLayout.jsx` / `layouts/PatientLayout.jsx`, **neither of which is mounted in `AppRouter`**. Many of its `NavLink to=` targets (`/pharmacy/orders`, `/lab/requests`, `/billing`, `/emergency`, `/notifications`, `/admin/queue`, …) have **no route** → would 404 if mounted.
- **`components/common/Navbar.jsx` (LIVE, public Landing only):** all links functional.

---

## 4. Per-dashboard hydration

| Route | Component | Fetches on mount | Loading/Empty/Error | Verdict |
|---|---|---|---|---|
| `/patient/dashboard` (+4 aliases) | patient/Dashboard | ✅ all tabs | ✅ full | Solid (sub-routes ignore URL) |
| `/doctor/dashboard` | doctor/Dashboard | ✅ `/doctors/me`, queue, history | ✅ + Socket.IO live queue | **Best-integrated** |
| `/lab/dashboard` | lab/Dashboard | ✅ `getHospitalLabRequests` | ✅ full | Solid (but fakes 2 transitions — see workflow audit) |
| `/pharmacy/dashboard` | pharmacy/Dashboard | ✅ `getHospitalOrders` | ✅ full | Solid |
| `/driver/dashboard` | driver/Dashboard | ⚠️ **no REST hydration** — Socket + local state only; History is a static stub | partial | Functional but loses state on refresh |
| `/admin/dashboard` (+7) | admin/Dashboard | ⚠️ mixed; **MedicinesTab crashes**; Queue/Emergency placeholders; Settings hardcoded | Overview has no loading/error UI | **Broken in parts** |
| `/admin/analytics|audit-log|revenue` | admin/Dashboard | no matching tab | — | **Unreachable** |
| `/receptionist/dashboard` | admin/Dashboard | as admin | as admin | Reuses admin wholesale |
| `/superadmin/dashboard` (+4) | superadmin/Dashboard | ✅ `getHospitals` | `loading` set but not gated → zero-flash | Partial; users/analytics/audit-logs unreachable |

---

## 5. Crash on mount (P0)

`admin/Dashboard.jsx:432` — `const [medicines, setMedicines] = useState(MOCK_MEDICINES);` — **`MOCK_MEDICINES` is never defined** (grep: only this usage). Opening the **Medicines** tab throws `ReferenceError`. Because `App.jsx:13` wraps everything in one `ErrorBoundary`, this takes down the **entire admin dashboard**. **Fix:** replace with `useState([])` and fetch real medicines (or leave empty until the medicines feature is wired).

No other routed component has an undefined import or missing-param crash.

---

## 6. Dead page files vs live sections

All 10 dead files fetch real data and several are **richer** than the live section:

| Dead file | Live equivalent | Relationship |
|---|---|---|
| `admin/Analytics.jsx` | none | **Missing feature** — dead file complete |
| `admin/AuditLog.jsx` | none | **Missing feature** |
| `admin/Revenue.jsx` | none | **Missing feature** |
| `admin/QueueMonitor.jsx` (fetch + Socket + force-skip) | empty placeholder tab | **Dead file far richer** |
| `admin/Departments/Doctors/Staff.jsx` | live tabs | rough parity |
| `superadmin/Hospitals.jsx` | live Hospitals tab | parity-plus |
| `superadmin/Users.jsx` | none | **Missing feature** (thinnest) |
| `patient/Billing.jsx` (filters + receipt + Razorpay) | live BillingTab (uses fake PaymentModal) | **Dead file richer & realer** |

Also dead: `layouts/DashboardLayout.jsx`, `layouts/PatientLayout.jsx`, `utils/roleRedirect.js`, and the two hardcoded mock arrays in admin (`ACTIVITIES`, duplicate Departments stat).

---

## 7. Ranked priorities

- **P0** — `MOCK_MEDICINES` crash (`admin/Dashboard.jsx:432`).
- **P1** — Admin/superadmin sub-routes render the same monolith on Overview; Analytics/AuditLog/Revenue/Users unreachable. Decision needed: **(a)** derive `activeItem` from `useLocation()` and add the missing tabs, or **(b)** route each sub-path to the existing (richer) dead page. Recommendation: **(b)** for Analytics/AuditLog/Revenue/QueueMonitor/Users (they already exist and are complete); keep tab-based nav for the rest.
- **P2** — Driver dashboard hydration on refresh; superadmin `loading` gate; admin duplicate stat + dead `ACTIVITIES`.
- **P3** — Mobile bottom-nav `slice(0,5)` hides admin tabs; hardcoded notification `badge:2`; delete dead `Sidebar`/layouts/`roleRedirect` or wire them in.
