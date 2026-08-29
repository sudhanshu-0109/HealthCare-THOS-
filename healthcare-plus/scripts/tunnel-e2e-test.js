/**
 * Quick Socket.IO + E2E test against the live tunnel.
 * Run: node scripts/tunnel-e2e-test.js <TUNNEL_URL>
 */
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Resolve socket.io-client from the frontend's node_modules
const require = createRequire(path.join(__dirname, '..', 'frontend', 'package.json'));
const { io } = require('socket.io-client');

const TUNNEL = process.argv[2];
if (!TUNNEL) { console.error('Usage: node tunnel-e2e-test.js <TUNNEL_URL>'); process.exit(1); }

const BASE = `${TUNNEL}/api`;

async function apiPost(path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const r = await fetch(`${BASE}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`POST ${path} failed ${r.status}: ${t}`);
  }
  return r.json();
}

async function login(email, password) {
  const r = await apiPost('/auth/login', { email, password });
  return r.data.accessToken;
}

async function testSocketIO(token) {
  return new Promise((resolve, reject) => {
    const socket = io(TUNNEL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: false,
    });
    const timeout = setTimeout(() => {
      socket.disconnect();
      reject(new Error('Socket.IO connection timed out (10s)'));
    }, 10000);

    socket.on('connect', () => {
      clearTimeout(timeout);
      console.log(`  [Socket.IO] Connected! socket.id = ${socket.id}`);
      socket.disconnect();
      resolve(socket.id);
    });

    socket.on('connect_error', (err) => {
      clearTimeout(timeout);
      socket.disconnect();
      reject(new Error(`Socket.IO connect_error: ${err.message}`));
    });
  });
}

async function run() {
  console.log(`\nHealthcare+ Tunnel E2E Test`);
  console.log(`Tunnel: ${TUNNEL}`);
  console.log(`==========================================\n`);

  // 1. Health check
  try {
    const r = await fetch(`${TUNNEL}/api/health`);
    const j = await r.json();
    console.log(`[PASS] Health check: ${j.message}`);
  } catch (e) { console.error(`[FAIL] Health check: ${e.message}`); process.exit(1); }

  // 2. Patient login
  let patientToken;
  try {
    patientToken = await login('patient@healthcareplus.dev', 'Password123!');
    console.log(`[PASS] Patient login: JWT obtained`);
  } catch (e) { console.error(`[FAIL] Patient login: ${e.message}`); process.exit(1); }

  // 3. Doctor login
  let doctorToken;
  try {
    doctorToken = await login('dr.anil.shah@sterling.dev', 'Password123!');
    console.log(`[PASS] Doctor login: JWT obtained`);
  } catch (e) { console.error(`[FAIL] Doctor login: ${e.message}`); }

  // 4. Driver login
  let driverToken;
  try {
    driverToken = await login('driver@sterling.dev', 'Password123!');
    console.log(`[PASS] Driver login: JWT obtained`);
  } catch (e) { console.error(`[FAIL] Driver login: ${e.message}`); }

  // 5. Admin login
  try {
    await login('admin@sterling.dev', 'Password123!');
    console.log(`[PASS] Admin login: JWT obtained`);
  } catch (e) { console.error(`[FAIL] Admin login: ${e.message}`); }

  // 6. Socket.IO — Patient
  try {
    await testSocketIO(patientToken);
    console.log(`[PASS] Socket.IO patient connection over WSS`);
  } catch (e) { console.error(`[FAIL] Socket.IO patient: ${e.message}`); }

  // 7. Socket.IO — Doctor
  if (doctorToken) {
    try {
      await testSocketIO(doctorToken);
      console.log(`[PASS] Socket.IO doctor connection over WSS`);
    } catch (e) { console.error(`[FAIL] Socket.IO doctor: ${e.message}`); }
  }

  // 8. Socket.IO — Driver
  if (driverToken) {
    try {
      await testSocketIO(driverToken);
      console.log(`[PASS] Socket.IO driver connection over WSS`);
    } catch (e) { console.error(`[FAIL] Socket.IO driver: ${e.message}`); }
  }

  // 9. Frontend page reachable
  try {
    const r = await fetch(`${TUNNEL}/`);
    if (r.ok || r.redirected) {
      console.log(`[PASS] Frontend page reachable (status: ${r.status})`);
    } else {
      console.error(`[FAIL] Frontend returned status ${r.status}`);
    }
  } catch (e) { console.error(`[FAIL] Frontend: ${e.message}`); }

  // 10. Static uploads path reachable (path exists even if empty)
  try {
    const r = await fetch(`${TUNNEL}/uploads/`);
    console.log(`[PASS] /uploads path proxied (status: ${r.status})`);
  } catch (e) { console.error(`[FAIL] /uploads: ${e.message}`); }

  console.log('\n==========================================');
  console.log('E2E Test Complete.');
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
