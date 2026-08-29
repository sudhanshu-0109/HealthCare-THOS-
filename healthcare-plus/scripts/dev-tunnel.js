#!/usr/bin/env node
/**
 * scripts/dev-tunnel.js
 *
 * Starts the Healthcare+ full-stack development environment WITH a
 * Cloudflare Quick Tunnel so external devices can access the app over HTTPS.
 *
 * Starts (in order):
 *   1. Express backend     -> http://localhost:5000
 *   2. Vite frontend       -> http://localhost:5173  (proxies /api + /socket.io + /uploads)
 *   3. cloudflared tunnel  -> https://<random>.trycloudflare.com -> http://localhost:5173
 *
 * Usage:
 *   node scripts/dev-tunnel.js
 *   -- or --
 *   npm run dev:tunnel   (from healthcare-plus/ root)
 *
 * Requirements:
 *   tools/cloudflared.exe must exist (download from GitHub Releases).
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import net from 'net';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const BACKEND_DIR = path.join(ROOT, 'backend');
const FRONTEND_DIR = path.join(ROOT, 'frontend');
const CLOUDFLARED = path.join(ROOT, 'tools', 'cloudflared.exe');

const BACKEND_PORT = 5000;
const FRONTEND_PORT = 5173;

// ANSI colour helpers
const c = {
  reset: '\x1b[0m',
  bold:  '\x1b[1m',
  cyan:  '\x1b[36m',
  green: '\x1b[32m',
  yellow:'\x1b[33m',
  grey:  '\x1b[90m',
  red:   '\x1b[31m',
};

function log(tag, msg) {
  process.stdout.write(`${c.grey}[${tag}]${c.reset} ${msg}\n`);
}

// Validate cloudflared binary
if (!fs.existsSync(CLOUDFLARED)) {
  console.error(`\n${c.red}cloudflared binary not found at:${c.reset} ${CLOUDFLARED}`);
  console.error(`  Download it from https://github.com/cloudflare/cloudflared/releases\n`);
  process.exit(1);
}

// Process registry for graceful shutdown
const children = [];
let shuttingDown = false;

function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\n${c.yellow}Shutting down all processes...${c.reset}`);
  children.forEach(p => {
    try { p.kill('SIGTERM'); } catch (_) {}
  });
  setTimeout(() => process.exit(0), 1500);
}
process.on('SIGINT',  shutdown);
process.on('SIGTERM', shutdown);

/**
 * Spawn a child process and resolve when readyPattern appears in its output.
 * If readyPattern is null, resolves immediately.
 */
function spawnAndWait(label, command, args, cwd, readyPattern, timeoutMs) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      cwd,
      shell: false,
      env: { ...process.env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    children.push(proc);

    let resolved = false;
    const done = () => { if (!resolved) { resolved = true; resolve(proc); } };

    const pfx = `${c.grey}[${label}]${c.reset}`;

    // Strip ANSI escape codes for pattern matching so colorized CLIs (Vite etc.) work correctly.
    // eslint-disable-next-line no-control-regex
    const stripAnsi = (str) => str.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '');

    const checkReady = (text) => {
      if (!resolved && readyPattern && readyPattern.test(stripAnsi(text))) done();
    };

    proc.stdout.on('data', d => {
      const text = d.toString();
      process.stdout.write(pfx + ' ' + text);
      checkReady(text);
    });
    proc.stderr.on('data', d => {
      const text = d.toString();
      process.stderr.write(pfx + ' ' + text);
      checkReady(text);
    });

    proc.on('exit', code => {
      if (!shuttingDown && !resolved && code !== null && code !== 0) {
        reject(new Error(`[${label}] exited with code ${code}`));
      }
    });

    if (!readyPattern) done();

    if (timeoutMs && timeoutMs > 0) {
      setTimeout(() => {
        if (!resolved) reject(new Error(`[${label}] did not become ready within ${timeoutMs}ms`));
      }, timeoutMs);
    }
  });
}

// ─── Start backend ────────────────────────────────────────────────────────
console.log(`\n${c.cyan}${c.bold}Healthcare+ Tunnel -- Starting...${c.reset}\n`);
log('backend', `Starting Express on :${BACKEND_PORT}`);
await spawnAndWait(
  'backend',
  'node',
  ['src/server.js'],
  BACKEND_DIR,
  /healthcare\+ API running|Health:/i,
  60000
);
log('backend', `${c.green}Ready on http://localhost:${BACKEND_PORT}${c.reset}`);

// ─── Start frontend ───────────────────────────────────────────────────────
log('frontend', `Starting Vite on :${FRONTEND_PORT}`);
// Wait for Vite to print 'ready in' OR 'localhost:' — both appear in its startup output.
await spawnAndWait(
  'frontend',
  'cmd.exe',
  ['/c', path.join(FRONTEND_DIR, 'node_modules', '.bin', 'vite.cmd')],
  FRONTEND_DIR,
  /ready in|localhost:5173/i,
  120000
);
// Brief pause so Vite finishes any post-ready dep bundling before tunnel tries to connect.
await new Promise(r => setTimeout(r, 3000));
log('frontend', `${c.green}Ready on http://localhost:${FRONTEND_PORT}${c.reset}`);

// ─── Start cloudflared tunnel and capture URL ────────────────────────────
log('tunnel', 'Starting Cloudflare Quick Tunnel...');

let tunnelUrl = null;

const tunnelUrlPromise = new Promise((resolve, reject) => {
  const tunnel = spawn(CLOUDFLARED, [
    'tunnel', '--url', `http://localhost:${FRONTEND_PORT}`, '--no-autoupdate',
  ], {
    cwd: ROOT,
    shell: false,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env },
  });
  children.push(tunnel);

  const urlRe = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/;

  const capture = (chunk) => {
    const text = chunk.toString();
    process.stderr.write(`${c.grey}[tunnel]${c.reset} ${text}`);
    const match = text.match(urlRe);
    if (match && !tunnelUrl) {
      tunnelUrl = match[0];
      resolve(tunnelUrl);
    }
  };

  tunnel.stdout.on('data', capture);
  tunnel.stderr.on('data', capture);

  tunnel.on('exit', code => {
    if (!shuttingDown && !tunnelUrl) {
      reject(new Error(`cloudflared exited with code ${code} before providing a URL`));
    }
  });
});

// Wait up to 45 s for the tunnel URL
const timeoutPromise = new Promise((_, reject) =>
  setTimeout(() => reject(new Error('Cloudflare tunnel did not produce a URL within 45s')), 45000)
);

try {
  tunnelUrl = await Promise.race([tunnelUrlPromise, timeoutPromise]);
} catch (err) {
  console.error(`${c.red}${err.message}${c.reset}`);
  console.error('  Check your internet connection and try again.');
  shutdown();
  process.exit(1);
}

// ─── Print the developer dashboard banner ────────────────────────────────
const border = '='.repeat(62);
const line   = (k, v) => `  ${c.bold}${k.padEnd(24)}${c.reset}${c.green}${v}${c.reset}`;

console.log(`\n${c.cyan}${c.bold}${border}`);
console.log(`  Healthcare+ Tunnel`);
console.log(`${border}${c.reset}`);
console.log('');
console.log(line('Frontend Local:', `http://localhost:${FRONTEND_PORT}`));
console.log(line('Backend Local:', `http://localhost:${BACKEND_PORT}`));
console.log('');
console.log(line('PUBLIC URL (tunnel):', tunnelUrl));
console.log(line('Socket (same-origin):', tunnelUrl));
console.log(line('API:', `${tunnelUrl}/api`));
console.log('');
console.log(`  ${c.yellow}${c.bold}Scan or open the PUBLIC URL on any phone/tablet.${c.reset}`);
console.log(`  ${c.grey}Note: Tunnel URL changes every restart (Cloudflare Quick Tunnel).${c.reset}`);
console.log(`  ${c.grey}Press Ctrl+C to stop all processes.${c.reset}`);
console.log(`${c.cyan}${c.bold}${border}${c.reset}\n`);
