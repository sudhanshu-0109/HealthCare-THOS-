# REAL-TIME (Socket.IO) AUDIT

_Server: `backend/src/sockets/index.js`, `emergencyHandlers.js`. Client: `frontend/src/services/socket.js` + per-page hooks. Contract recap in CODEBASE-UNDERSTANDING §5._

---

## 1. Connection & auth

- Client singleton `getSocket()` (`socket.js`): returns the existing socket if connected; otherwise **disconnects, nulls, and recreates** with `auth:{ token }`.
- Server verifies `handshake.auth.token` → `socket.user = { id, role }`. Auto-joins `user:{id}` (all) and `patient:{id}` (patients); `driver:{id}` (drivers, in `emergencyHandlers`).
- CORS allows any localhost port (fine for dev / tunneled multi-device testing).

**P1 — listener orphaning on reconnect.** Because `getSocket()` recreates the socket instance on a transient disconnect, any component that captured the *old* instance (or registered handlers on it) loses its subscriptions after a reconnect, with no re-register. `onSocketEvent` returns an unsub tied to the instance it saw. Fix: register listeners against a stable emitter and re-bind on `connect`/`reconnect`, or centralize event fan-out so components subscribe to a wrapper, not the raw socket.

---

## 2. Rooms vs emissions (which subscriptions are actually fed)

| Room | Who joins | Server emits to it? |
|---|---|---|
| `user:{id}` | everyone (auto) | notifications, payment results |
| `patient:{id}` | patients (auto) | queue/appointment updates targeted to patient |
| `doctor:{doctorId}:{date}` | doctor dashboard (`joinDoctorQueue`) | ✅ `queue:updated` |
| `hospital:{hospitalId}:queue` | admin QueueMonitor | **❌ never emitted to** — dead subscription |
| `emergency:{requestId}` | driver (on assign) + patient (should) | ✅ `emergency:accepted / location-update / status-update` |
| `driver:{userId}` | drivers (auto) | ✅ `emergency:new-request` |

**P1 — admin QueueMonitor is a dead subscription.** The dead-but-complete `admin/QueueMonitor.jsx` joins `hospital:{hospitalId}:queue`, but `queue.service.js` only emits to `doctor:{doctorId}:{date}` (and token-called). Fix: in `queue.service.js` `emitQueueUpdate`, **also** emit to `hospital:{hospitalId}:queue` so the admin monitor updates live.

**P2 — `callNext` emits only `queue:token-called`, not `queue:updated`.** Patient `PatientQueueTracker` listens for the token-call and flashes correctly, but list-consumers that only listen for `queue:updated` won't refresh on a call-next. Confirm both are emitted where both matter.

---

## 3. Real-time by workflow

| Workflow | Real-time status |
|---|---|
| Doctor queue (call patient) | **REAL** — `useDoctorQueue.js` joins room, listens `queue:updated`; `PatientQueueTracker` listens for the token call and shows a banner. Works. |
| Appointment appears on doctor device | via queue/appointment fetch + socket; functional. |
| Pharmacy order progression | **REAL** — manual, button-driven `advancePharmacyOrderStatus`; no auto-progression. (Real-time push to patient depends on server emit on status change — verify patient sees updates without manual refresh.) |
| Lab request progression | Partly real; frontend **fakes** two transitions (see COMPLETE-WORKFLOW-AUDIT). |
| Emergency — driver side | **REAL** — listens `emergency:new-request`. |
| Emergency — patient side | **BROKEN / SIMULATED** — see below (the single biggest real-time gap). |

---

## 4. Patient emergency tracking — the biggest real-time defect (P0/P1)

`frontend/src/pages/patient/EmergencyTracking.jsx`:
- **No socket at all** — never imports the socket, never joins `emergency:{requestId}`, never listens `emergency:accepted / location-update / status-update`.
- **Fake progression** — `useEffect` at `:62-77` runs an unconditional `setTimeout` chain `[3000,5000,12000,6000,8000,5000]` that auto-advances the stage 0→6 regardless of the backend.
- **Wrong fetch path** — `:35` `GET /emergency/requests/${requestId}`; the real route is `GET /emergency/:id/status`. The 404 is silently caught (`:57`).
- **Wrong status map** — `:39-43` uses `ACCEPTED / AT_HOSPITAL` which are **not** in `EmergencyStatus`; real values are `DRIVER_ASSIGNED / PICKED_UP / ARRIVED`.
- **Fake ETA** — `:174` `(driver?.eta||8) - Math.floor(elapsed/30)`.
- **Fake map** — `:110-128` CSS radar with a hardcoded-position bouncing dot; `components/emergency/LiveTrackingMap.jsx` marker hardcoded `top-12 left-16`.

**Fix (real-time part):** delete the timer chain; fetch initial state from `GET /emergency/:id/status`; `getSocket()` + join `emergency:{requestId}`; map real statuses to stages; update driver marker from `emergency:location-update`; render arrival from `emergency:status-update`. (Map + ETA covered in GOOGLE-MAPS-INTEGRATION-PLAN.)

**Driver-side gaps (P2):** `driver/Dashboard.jsx` has no active-request restore on refresh (local state only), History tab is a stub, and location is sent only on go-online + en-route (not streamed). For real tracking the driver must stream location (e.g. `watchPosition` → `POST /driver/location`) while an emergency is active.

---

## 5. Ranked priorities

- **P0/P1** — Wire `EmergencyTracking.jsx` to real sockets + correct fetch path + real status map; delete the setTimeout progression.
- **P1** — Emit `queue:updated` to `hospital:{hospitalId}:queue` for the admin monitor; fix socket listener re-binding on reconnect.
- **P2** — Driver continuous location streaming during active emergency; ensure `callNext` emits both events where needed.
