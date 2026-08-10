# GOOGLE MAPS INTEGRATION PLAN (real emergency tracking + ETA)

_Goal: replace the fake CSS/SVG map and fake ETA with a real Google Map, real geolocation for both patient and ambulance, driver location streamed over the existing socket, and a real distance/route-based ETA. **No committed secrets** — keys come from environment variables._

---

## 1. Current state (what's fake)

- No map library anywhere (`google.maps`/`leaflet`/`mapbox` = 0 references).
- `components/emergency/LiveTrackingMap.jsx` = CSS radar; driver marker hardcoded `top-12 left-16`, ignores coords.
- `EmergencyTracking.jsx` map (`:110-128`) = animated dot at a fixed position; ETA (`:174`) = `8 - elapsed/30`.
- Driver sends location only on go-online + en-route (`driver/Dashboard.jsx`), **not** streamed.
- Backend **stores** real coords (`Ambulance.currentLatitude/Longitude`, `locationUpdatedAt`) and **emits** `emergency:location-update`, but nothing consumes it on the patient side.

---

## 2. Secrets & configuration (no secrets in repo)

**Frontend** (Vite exposes only `VITE_`-prefixed vars — this key is a *browser* key, restricted by HTTP referrer + API in the Google Cloud console):
- Add `VITE_GOOGLE_MAPS_API_KEY` to `frontend/.env` (git-ignored) and document it in `frontend/.env.example` with an empty value + comment.

**Backend** (used for server-side Distance Matrix / Directions if we compute ETA server-side — this key is restricted by IP/API, kept out of the browser):
- Add `GOOGLE_MAPS_API_KEY` to `backend/.env` (git-ignored) and to `backend/src/config/env.js` as an **optional** var + `.env.example`.

Verify both `.env` files are already git-ignored before adding keys. Never log the key. If no key is present, the map component should degrade gracefully (show a "map unavailable — configure VITE_GOOGLE_MAPS_API_KEY" placeholder) rather than crash — mirroring the Razorpay mock-mode pattern.

---

## 3. Library choice

Use **`@react-google-maps/api`** (React 19 compatible, declarative `<GoogleMap>`, `<Marker>`, `<DirectionsRenderer>`, `useJsApiLoader` for script loading). Add to `frontend` only. Pin an exact version. Rationale: avoids hand-rolling the `<script>` loader and lifecycle; matches the declarative React style already in the codebase.

Alternative if a dependency is undesirable: load the Maps JS API via a `useJsApiLoader`-style hook we write, but the library is the lower-risk choice.

---

## 4. ETA strategy

Two options; **recommend server-side** to keep the key restricted and the number authoritative:

- **Server-side (recommended):** a small endpoint (e.g. `GET /emergency/:id/eta` or fold into `GET /:id/status`) calls Google **Distance Matrix API** with driver coords → patient coords and returns `{ etaSeconds, distanceMeters }`. Emit ETA alongside `emergency:location-update` so the patient sees it update as the driver moves. Falls back to a haversine straight-line estimate (reusing `calculateDistance` already in `emergencyDispatch.service.js`) if the API/key is unavailable.
- **Client-side:** use `DirectionsService` in the browser to draw the route and read `route.legs[0].duration`. Simpler but exposes more usage to the browser key and re-requests on every move.

Either way: **ETA is derived from real coordinates + Google distance/route data — never a decrementing timer.**

---

## 5. Driver location streaming (real, socket-driven)

Driver side (`driver/Dashboard.jsx`), only while an emergency is active (DRIVER_ASSIGNED → ARRIVED):
- Start `navigator.geolocation.watchPosition(...)`; on each update `POST /driver/location` (existing endpoint) with `{ latitude, longitude }`.
- Backend `updateDriverLocation` already persists to `Ambulance` and emits `emergency:location-update` to `emergency:{requestId}`.
- Throttle to ~1 update / 3–5 s to bound cost; `clearWatch` when the emergency ends or the driver goes offline.

No `setInterval` with fake coordinates anywhere — the coordinates come from the device GPS.

---

## 6. Patient tracking (real map + real socket) — rewrite of `EmergencyTracking.jsx`

Replace the simulated page with:
1. **On mount:** `GET /emergency/:id/status` (correct path) → initial `{ status, driver, driverLat, driverLng, patientLat, patientLng }`.
2. **Socket:** `getSocket()` → `join-emergency-room` (`emergency:{requestId}`); listen:
   - `emergency:accepted` → driver assigned; show driver card.
   - `emergency:location-update` → move the driver marker to the new lat/lng; recompute/receive ETA.
   - `emergency:status-update` → advance the real stage (`DRIVER_ASSIGNED → EN_ROUTE → PICKED_UP → ARRIVED`).
   - Leave the room / disconnect listeners on unmount.
3. **Map:** `<GoogleMap>` centered to fit patient + driver; a patient marker (from `navigator.geolocation`) and a driver marker (from socket updates); optional `<DirectionsRenderer>` for the route.
4. **Delete** the `setTimeout` progression (`:62-77`), the fake ETA (`:174`), and the CSS radar (`:110-128`). Keep the elapsed-time clock (display only).
5. **Status map:** use the real `EmergencyStatus` values; drop `ACCEPTED / AT_HOSPITAL`.

Retire or rewrite `components/emergency/LiveTrackingMap.jsx` to render the real `<GoogleMap>` given `patient{lat,lng}` + `driver{lat,lng}` props (remove the hardcoded marker position).

---

## 7. Files touched (planned)

| File | Change |
|---|---|
| `frontend/.env.example`, `backend/.env.example` | document the two keys (empty values) |
| `backend/src/config/env.js` | optional `GOOGLE_MAPS_API_KEY` |
| `frontend/package.json` | add `@react-google-maps/api` (pinned) |
| `frontend/src/pages/patient/EmergencyTracking.jsx` | full rewrite (real map + socket, delete timers) |
| `frontend/src/components/emergency/LiveTrackingMap.jsx` | real `<GoogleMap>` or retire |
| `frontend/src/pages/driver/Dashboard.jsx` | `watchPosition` streaming while active |
| backend emergency (controller/service/route) | optional `eta` endpoint via Distance Matrix + emit ETA |

---

## 8. Verification

- With a valid key: patient sees a real map; the driver marker moves as the driver device physically moves (multi-device test); ETA changes with distance, never counts down on its own.
- Without a key: graceful "map unavailable" placeholder; no crash; stage/status still advance from real socket events.
- Confirm no key value is printed to logs or committed (grep the diff for the key before commit).
