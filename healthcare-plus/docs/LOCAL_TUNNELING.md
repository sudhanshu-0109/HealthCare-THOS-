# Healthcare+ Local Tunneling Guide

> Access your local Healthcare+ development environment from **any phone, tablet, or external laptop** via a secure HTTPS Cloudflare Tunnel — without deploying or moving any services.

---

## Architecture

```
  PHONE / TABLET / LAPTOP
           │
           ▼ HTTPS (TLS 1.3)
  ┌─────────────────────────────────────┐
  │  Cloudflare Quick Tunnel            │
  │  https://<random>.trycloudflare.com │
  └──────────────────┬──────────────────┘
                     │
                     ▼
  ┌─────────────────────────────────────┐
  │  Vite Dev Server (localhost:5173)   │
  │  ┌──────────────────────────────┐   │
  │  │  Proxy rules:                │   │
  │  │  /api        → :5000         │   │
  │  │  /socket.io  → :5000  (ws)   │   │
  │  │  /uploads    → :5000         │   │
  │  └──────────────────────────────┘   │
  └─────────────────────────────────────┘
                     │
                     ▼
  ┌─────────────────────────────────────┐
  │  Express + Socket.IO (localhost:5000)│
  │  PostgreSQL (localhost:5432)         │
  └─────────────────────────────────────┘
```

**Why single-tunnel + Vite proxy?**

- Single HTTPS origin → iOS Safari cookie isolation (ITP) is bypassed
- WebSocket upgrade (`/socket.io`) proxied natively by Vite
- No dual-URL synchronization needed; `.env` stays unchanged
- Identical behavior locally and through the tunnel

---

## Quick Start

### Prerequisites

- `tools/cloudflared.exe` — already downloaded to this repo at `healthcare-plus/tools/cloudflared.exe`
- Node.js ≥ 18
- PostgreSQL running locally
- Both `frontend/` and `backend/` `node_modules/` installed

### One-Command Startup

```bash
# From healthcare-plus/ directory:
npm run dev:tunnel
```

Or equivalently:

```bash
node scripts/dev-tunnel.js
```

This starts everything and prints a dashboard like:

```
==============================================================
  Healthcare+ Tunnel
==============================================================

  Frontend Local:         http://localhost:5173
  Backend Local:          http://localhost:5000

  PUBLIC URL (tunnel):    https://xxxx-yyyy-zzzz.trycloudflare.com
  Socket (same-origin):   https://xxxx-yyyy-zzzz.trycloudflare.com
  API:                    https://xxxx-yyyy-zzzz.trycloudflare.com/api

  Scan or open the PUBLIC URL on any phone/tablet.
  Note: Tunnel URL changes every restart (Cloudflare Quick Tunnel).
  Press Ctrl+C to stop all processes.
==============================================================
```

### Normal Local Development (unchanged)

```bash
cd backend && npm run dev   # Backend on :5000
cd frontend && npm run dev  # Frontend on :5173
```

---

## Environment Variables

### Frontend (`frontend/.env`)

| Variable | Purpose | Tunnel Value |
|---|---|---|
| `VITE_API_URL` | REST API base URL | Leave unset (uses `/api` relative path) |
| `VITE_SOCKET_URL` | Socket.IO URL override | Leave unset (uses same-origin) |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth | Unchanged |
| `VITE_RAZORPAY_KEY_ID` | Razorpay client key | Unchanged |

### Backend (`backend/.env`)

| Variable | Purpose | Tunnel Note |
|---|---|---|
| `CLIENT_URL` | Allowed CORS origin | Keep as `http://localhost:5173` |
| `PORT` | Backend port | Keep as `5000` |
| All others | Auth, DB, email | Unchanged |

> **Security:** `*.trycloudflare.com` origins are allowed by the CORS and Socket.IO policies **only when `NODE_ENV !== 'production'`**. This is automatically enforced.

---

## Socket.IO Over Tunnel

Socket.IO connects to the **same origin** as the page (empty string URL). Vite's proxy upgrades WebSocket connections on `/socket.io` to the local backend.

```
Browser page at:     https://xxx.trycloudflare.com
Socket.IO connects:  wss://xxx.trycloudflare.com/socket.io  (Cloudflare upgrades → ws)
Vite proxies to:     ws://localhost:5000/socket.io
Backend receives:    authenticated WebSocket connection
```

All real-time features work through the tunnel:
- ✅ OPD Queue updates
- ✅ Patient notifications
- ✅ Emergency SOS dispatch
- ✅ Ambulance GPS tracking
- ✅ Doctor ↔ Patient video signaling

---

## GPS / Geolocation

`navigator.geolocation` requires HTTPS. Cloudflare Tunnel provides full HTTPS, so:

- Patient SOS (geolocation.getCurrentPosition) — works on real phones
- Driver live tracking (geolocation.watchPosition) — works on real phones
- The application **never mocks or fakes location** — real GPS coordinates are used

---

## Google Maps (Emergency Tracking)

Healthcare+ uses the **Google Maps JavaScript API** with **Google Directions API** for real-time ambulance tracking.

### Required setup

1. Add your API key to `frontend/.env` (this file is git-ignored):
   ```
   VITE_GOOGLE_MAPS_API_KEY=your_key_here
   ```
2. Enable the following APIs in [Google Cloud Console](https://console.cloud.google.com/apis/library):
   - **Maps JavaScript API**
   - **Directions API**
3. Restrict the API key to **HTTP referrers** matching your dev + tunnel URLs:
   - `http://localhost:*`
   - `https://your-tunnel-domain.trycloudflare.com/*`

---


## Google OAuth

The `@react-oauth/google` button uses an **OAuth popup flow** and works with the Cloudflare Tunnel URL **provided you register it** in Google Cloud Console.

### MANUAL ACTION REQUIRED (only needed for Google OAuth through the tunnel)

1. Go to [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
2. Select your OAuth 2.0 Client ID
3. Under **Authorized JavaScript origins**, add:
   ```
   https://xxxx-yyyy-zzzz.trycloudflare.com
   ```
4. Save

> ⚠️ Quick Tunnel URLs change on every restart. You'll need to update this each session for Google OAuth.  
> **Standard email/password login works without any Google Cloud changes.**

---

## File Uploads

Lab report uploads are stored in `backend/uploads/` and served at `/uploads/filename`. The Vite proxy forwards `/uploads` to the backend. URLs stored in the database are relative paths (`/uploads/file-xxx.pdf`) that resolve correctly on all origins.

---

## Razorpay Payments

Razorpay's hosted checkout widget works from any origin. If `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are configured, real payments work through the tunnel. If not configured, mock mode is used (backend accepts mock signatures).

> For Razorpay webhooks, you would need to expose the backend separately or use Razorpay's test mode which doesn't require webhooks for basic verification.

---

## Known Limitations

| Limitation | Detail |
|---|---|
| **URL changes on restart** | Cloudflare Quick Tunnels get a new random subdomain every time. For stable URLs, use a [Named Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps) (requires free account). |
| **Google OAuth** | Requires re-registering the new URL in Google Cloud Console each session |
| **Tunnel uptime** | Quick Tunnels have no uptime SLA. For demos, keep the terminal open. |
| **Latency** | Internet round-trip adds ~50-150ms latency vs localhost. This is normal and not an application bug. |
| **Mobile Safari httpOnly cookies** | Not affected — same-origin architecture means the refresh token cookie is sent correctly |

---

## Troubleshooting

### "CORS error" in browser console
- Check `backend/src/config/cors.js` — `*.trycloudflare.com` is allowed in `NODE_ENV !== 'production'`
- Verify `NODE_ENV=development` in `backend/.env`

### Socket.IO not connecting
- Confirm the tunnel URL is the one in the browser address bar
- Vite proxy must have `/socket.io` route with `ws: true` — already configured
- Check browser console: `[Socket] Connection error: ...`

### 502 Bad Gateway from tunnel
- The Vite dev server may have crashed — restart `npm run dev:tunnel`

### Geolocation denied on phone
- HTTPS is required (✅ provided by Cloudflare Tunnel)
- User must grant browser location permission
- Check that the site is not in an incognito window where permissions auto-deny

### Vite "allowedHosts" error
- `allowedHosts: true` is set in `vite.config.js` — no host check will ever block external access

---

## How to Test Patient + Doctor + Driver Together

Open three browser tabs (or three different devices):

| Device/Tab | URL | Login |
|---|---|---|
| Patient | `https://xxx.trycloudflare.com/login` | `patient@healthcareplus.dev` / `Password123!` |
| Doctor | `https://xxx.trycloudflare.com/login` | `dr.anil.shah@sterling.dev` / `Password123!` |
| Driver | `https://xxx.trycloudflare.com/login` | `driver@sterling.dev` / `Password123!` |

**Real-time Queue Test:**
1. Patient books appointment (or use existing queue token)
2. Doctor opens OPD queue
3. Doctor calls next patient → Patient receives notification without refresh

**Emergency Test:**
1. Patient presses SOS → grant location permission
2. Driver dashboard shows new emergency request
3. Driver accepts → Patient sees driver location on map
4. Driver moves → map updates live without refresh

---

## Re-downloading cloudflared

If `tools/cloudflared.exe` is missing:

```powershell
curl.exe -L -o tools/cloudflared.exe `
  https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe
.\tools\cloudflared.exe --version
```

---

*Last updated: 2026-08-27*
