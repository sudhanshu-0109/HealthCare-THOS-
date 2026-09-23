/**
 * Healthcare+ Final Demo Recording Script
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const VIDEO_DIR = 'C:\\Users\\heart\\Desktop\\HealthCare+\\Video';
const SS_DIR = path.join(VIDEO_DIR, 'screenshots');
fs.mkdirSync(VIDEO_DIR, { recursive: true });
fs.mkdirSync(SS_DIR, { recursive: true });

const BASE = 'http://localhost:5173';

const CREDS = {
  patient:    { email: 'patient@healthcareplus.dev',      password: 'Password123!', role: 'Patient' },
  doctor:     { email: 'dr.anil.shah@sterling.dev',       password: 'Password123!', role: 'Doctor' },
  pharmacist: { email: 'pharmacist@sterling.dev',         password: 'Password123!', role: 'Pharmacist' },
  lab:        { email: 'labstaff@sterling.dev',           password: 'Password123!', role: 'Lab Staff' },
  driver:     { email: 'driver@sterling.dev',             password: 'Password123!', role: 'Ambulance Driver' },
  admin:      { email: 'admin@sterling.dev',              password: 'Password123!', role: 'Hospital Admin' },
};

const pause = (ms) => new Promise(r => setTimeout(r, ms));

async function loginAs(page, role) {
  const cred = CREDS[role];
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 30000 });
  await pause(1500);
  const roleBtn = page.locator(`button:has-text("${cred.role}")`).first();
  if (await roleBtn.count() > 0) { await roleBtn.click(); await pause(500); }
  await page.locator('input[type="email"]').first().fill(cred.email);
  await pause(300);
  await page.locator('input[type="password"]').first().fill(cred.password);
  await pause(300);
  await page.locator('button[type="submit"]').first().click();
  await pause(5000);
  return page.url();
}

async function smoothScroll(page, distance = 400, steps = 8) {
  const stepPx = distance / steps;
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, stepPx);
    await pause(120);
  }
}

async function ss(page, name) {
  await page.screenshot({ path: path.join(SS_DIR, `${name}.png`), fullPage: false }).catch(() => {});
}

async function record() {
  console.log('=== Healthcare+ Demo Recording Starting ===');
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });

  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 },
    recordVideo: { dir: VIDEO_DIR, size: { width: 1400, height: 900 } },
    colorScheme: 'light',
    locale: 'en-IN',
    timezoneId: 'Asia/Kolkata',
  });

  const page = await context.newPage();

  try {
    // ── 01 LANDING PAGE ──────────────────────────────────────────
    console.log('[01] Landing Page...');
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
    await pause(3000);
    await smoothScroll(page, 600, 8);
    await pause(2000);
    await smoothScroll(page, 600, 8);
    await pause(2000);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await pause(2000);
    await ss(page, '01_landing');

    // ── 02 PATIENT LOGIN + HEALTH HUB ───────────────────────────
    console.log('[02] Patient Login...');
    // Find and click the Login / Sign In button
    const loginBtn = page.locator('a[href="/login"], button:has-text("Sign In"), a:has-text("Sign In"), a:has-text("Login")').first();
    if (await loginBtn.count() > 0) { await loginBtn.click(); await pause(2000); }
    else { await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 30000 }); await pause(2000); }

    // Patient is default role — just fill credentials
    await page.locator('input[type="email"]').first().fill(CREDS.patient.email);
    await pause(400);
    await page.locator('input[type="password"]').first().fill(CREDS.patient.password);
    await pause(400);
    await page.locator('button[type="submit"]').first().click();
    await pause(5000);
    console.log('Post-login URL:', page.url());
    await ss(page, '02_health_hub');
    await pause(4000); // Show health hub

    // ── 03 HOSPITAL / DOCTOR DISCOVERY ──────────────────────────
    console.log('[03] Hospital Discovery...');
    const hospCareBtn = page.locator('text=Hospital Care').first();
    if (await hospCareBtn.count() > 0) { await hospCareBtn.click(); await pause(4000); }
    else { await page.goto(`${BASE}/hospitals`, { waitUntil: 'networkidle', timeout: 20000 }); await pause(3000); }
    await ss(page, '03a_hospitals');
    await smoothScroll(page, 400, 6);
    await pause(2000);

    // Sterling Hospital workspace
    await page.goto(`${BASE}/hospitals/hosp-sterling`, { waitUntil: 'networkidle', timeout: 30000 });
    await pause(4000);
    await ss(page, '03b_sterling');
    await smoothScroll(page, 500, 7);
    await pause(3000);
    await ss(page, '03c_doctors');

    // ── 04 APPOINTMENT BOOKING ───────────────────────────────────
    console.log('[04] Appointment Booking...');
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await pause(1000);

    // Click Book Appointment
    const bookBtns = page.locator('button:has-text("Book Appointment")');
    if (await bookBtns.count() > 0) { await bookBtns.first().click(); await pause(5000); }
    else {
      await page.goto(`${BASE}/hospitals/hosp-sterling/doctors/561d55b4-a845-459e-83b7-cc9dad6cfcc3/book`, { waitUntil: 'networkidle', timeout: 30000 });
      await pause(5000);
    }
    await ss(page, '04a_slots');
    console.log('Booking URL:', page.url());

    // Select date (Sep 23)
    const sep23 = page.locator('button').filter({ hasText: '23' }).first();
    if (await sep23.count() > 0) { await sep23.click(); await pause(2000); }

    // Select 10:00 AM
    const slot = page.locator('button:has-text("10:00 AM")').first();
    if (await slot.count() > 0) { await slot.click(); await pause(1500); }
    else {
      const anySlot = page.locator('button').filter({ hasText: 'AM' }).first();
      if (await anySlot.count() > 0) { await anySlot.click(); await pause(1500); }
    }
    await ss(page, '04b_slot_picked');

    // Continue → type selection
    const cont1 = page.locator('button:has-text("Continue")').first();
    if (await cont1.count() > 0) { await cont1.click(); await pause(3000); }
    await ss(page, '04c_type');

    // Select In-Person
    const inPerson = page.locator('button').filter({ hasText: /In.Person|Offline/i }).first();
    if (await inPerson.count() > 0) { await inPerson.click(); await pause(2000); }

    // Continue → summary
    const cont2 = page.locator('button:has-text("Continue")').first();
    if (await cont2.count() > 0) { await cont2.click(); await pause(3000); }
    await ss(page, '04d_summary');
    await pause(3000);

    // Confirm / Pay
    const confirmBtn = page.locator('button').filter({ hasText: /Confirm|Pay|Book Now|Proceed/i }).first();
    if (await confirmBtn.count() > 0) { await confirmBtn.click(); await pause(8000); }
    await ss(page, '04e_confirmed');
    await pause(5000); // Hero pause
    console.log('Confirmation URL:', page.url());

    // ── 05 LIVE OPD QUEUE — HERO ─────────────────────────────────
    console.log('[05] Live OPD Queue...');
    await page.goto(`${BASE}/patient/appointments`, { waitUntil: 'networkidle', timeout: 20000 });
    await pause(4000);
    await ss(page, '05a_patient_appts');

    // Patient queue position at hospital
    await page.goto(`${BASE}/hospitals/hosp-sterling`, { waitUntil: 'networkidle', timeout: 20000 });
    await pause(2000);
    const myQ = page.locator('button:has-text("My Queue"), a:has-text("My Queue")').first();
    if (await myQ.count() > 0) { await myQ.click(); await pause(4000); await ss(page, '05b_queue_pos'); }

    // Doctor page
    const drPage = await context.newPage();
    await loginAs(drPage, 'doctor');
    await drPage.goto(`${BASE}/doctor/dashboard`, { waitUntil: 'networkidle', timeout: 20000 });
    await pause(2000);
    const qTab = drPage.locator('text=Patient Queue').first();
    if (await qTab.count() > 0) { await qTab.click(); await pause(4000); }
    await ss(drPage, '05c_dr_queue');
    await pause(4000); // Hero

    const callNext = drPage.locator('button:has-text("Call Next"), button:has-text("Next Patient")').first();
    if (await callNext.count() > 0) { await callNext.click(); await pause(3000); await ss(drPage, '05d_called_next'); }

    // Back to patient for real-time update
    await page.bringToFront();
    await pause(1000);
    await page.reload({ waitUntil: 'networkidle', timeout: 15000 });
    await pause(3000);
    await ss(page, '05e_queue_updated');

    // ── 06 FRACTIONAL QUEUE ──────────────────────────────────────
    console.log('[06] Fractional Queue...');
    await drPage.bringToFront();
    await ss(drPage, '06_queue_tokens');
    await pause(3000);

    // ── 07 DOCTOR CONSULTATION ───────────────────────────────────
    console.log('[07] Consultation...');
    // Try clicking on a patient card from queue
    const patCard = drPage.locator('[class*="card"], [class*="patient"], [class*="row"]').filter({ hasText: /Rahul|CONFIRMED|WAITING|call/i }).first();
    if (await patCard.count() > 0) { await patCard.click(); await pause(3000); }
    else {
      const apptTab = drPage.locator('text=Appointments').first();
      if (await apptTab.count() > 0) { await apptTab.click(); await pause(3000); }
    }
    await ss(drPage, '07a_consult_view');

    const startConsult = drPage.locator('button').filter({ hasText: /Start|Consult|Prescription|Write Rx/i }).first();
    if (await startConsult.count() > 0) { await startConsult.click(); await pause(3000); }
    await ss(drPage, '07b_prescription');
    await pause(3000);

    // ── 08 PHARMACY ──────────────────────────────────────────────
    console.log('[08] Pharmacy...');
    const pharmPage = await context.newPage();
    await loginAs(pharmPage, 'pharmacist');
    await pause(1000);
    await ss(pharmPage, '08a_pharmacy');
    await pause(3500);

    const newOrdersTab = pharmPage.locator('button:has-text("New Orders")').first();
    if (await newOrdersTab.count() > 0) { await newOrdersTab.click(); await pause(2000); }
    await ss(pharmPage, '08b_orders');
    await pause(2000);

    // ── 09 LAB ───────────────────────────────────────────────────
    console.log('[09] Lab...');
    const labPageCtx = await context.newPage();
    await loginAs(labPageCtx, 'lab');
    await pause(1000);
    await ss(labPageCtx, '09a_lab');
    await pause(3500);

    const pendTab = labPageCtx.locator('button:has-text("Pending")').first();
    if (await pendTab.count() > 0) { await pendTab.click(); await pause(2000); }
    await ss(labPageCtx, '09b_lab_pending');
    await pause(2000);

    // ── 10 HEALTHCARE PASSPORT ───────────────────────────────────
    console.log('[10] Healthcare Passport...');
    await page.bringToFront();
    await page.goto(`${BASE}/patient/passport`, { waitUntil: 'networkidle', timeout: 20000 });
    await pause(4000);
    const passBody = await page.locator('body').innerText().catch(() => '');
    if (passBody.includes('404') || passBody.includes('Not Found')) {
      await page.goto(`${BASE}/patient/timeline`, { waitUntil: 'networkidle', timeout: 20000 });
      await pause(3000);
    }
    await ss(page, '10_passport');
    await smoothScroll(page, 400, 6);
    await pause(4000); // Hero pause

    // ── 11 MENTAL WELLNESS ───────────────────────────────────────
    console.log('[11] Mental Wellness...');
    await page.goto(`${BASE}/health-hub`, { waitUntil: 'networkidle', timeout: 20000 });
    await pause(2000);
    const mentalBtn = page.locator('text=Mental Wellness').first();
    if (await mentalBtn.count() > 0) { await mentalBtn.click(); await pause(4000); }
    else { await page.goto(`${BASE}/mental-health`, { waitUntil: 'networkidle', timeout: 20000 }); await pause(3000); }
    await ss(page, '11_mental');
    await pause(3000);

    // ── 12 PHYSICAL HEALTH ───────────────────────────────────────
    console.log('[12] Physical Health...');
    await page.goto(`${BASE}/health-hub`, { waitUntil: 'networkidle', timeout: 20000 });
    await pause(1500);
    const physBtn = page.locator('text=Physical Health').first();
    if (await physBtn.count() > 0) { await physBtn.click(); await pause(4000); }
    else { await page.goto(`${BASE}/physical-health`, { waitUntil: 'networkidle', timeout: 20000 }); await pause(3000); }
    await ss(page, '12_physical');
    await pause(3000);

    // ── 13 EMERGENCY SOS — HERO ──────────────────────────────────
    console.log('[13] Emergency SOS...');
    await page.goto(`${BASE}/emergency`, { waitUntil: 'networkidle', timeout: 20000 });
    await pause(3000);
    await ss(page, '13a_emergency');

    // SOS hold interaction
    const sosBtn = page.locator('button').filter({ hasText: /SOS|HOLD|Emergency Call/i }).first();
    if (await sosBtn.count() > 0) {
      const box = await sosBtn.boundingBox();
      if (box) {
        const cx = box.x + box.width / 2;
        const cy = box.y + box.height / 2;
        await page.mouse.move(cx, cy);
        await page.mouse.down();
        await pause(3500);
        await ss(page, '13b_sos_holding');
        await page.mouse.up();
        await pause(3000);
      }
    } else {
      // Try finding any clickable emergency trigger
      const emrgBtn = page.locator('[class*="sos"], [class*="emergency"]').first();
      if (await emrgBtn.count() > 0) {
        const box = await emrgBtn.boundingBox();
        if (box) {
          await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
          await page.mouse.down();
          await pause(3500);
          await page.mouse.up();
          await pause(3000);
        }
      }
    }
    await ss(page, '13c_sos_result');

    // Confirm if dialog appears
    const confEmrg = page.locator('button').filter({ hasText: /Confirm|Send|Dispatch|Yes/i }).first();
    if (await confEmrg.count() > 0) { await confEmrg.click(); await pause(5000); }
    await ss(page, '13d_emergency_sent');
    await pause(4000); // Hero

    // Driver page
    const drvPage = await context.newPage();
    await loginAs(drvPage, 'driver');
    await pause(2000);
    await ss(drvPage, '13e_driver');
    await pause(4000); // Hero — driver sees emergency

    const acceptBtn = drvPage.locator('button').filter({ hasText: /Accept|Respond/i }).first();
    if (await acceptBtn.count() > 0) { await acceptBtn.click(); await pause(4000); await ss(drvPage, '13f_accepted'); }
    await pause(3000);

    // Patient — driver assigned
    await page.bringToFront();
    await pause(1000);
    await page.reload({ waitUntil: 'networkidle', timeout: 15000 });
    await pause(4000);
    await ss(page, '13g_driver_assigned');
    await pause(4000); // Hero

    // ── 14 HOSPITAL ADMIN ────────────────────────────────────────
    console.log('[14] Hospital Admin...');
    const adminPageCtx = await context.newPage();
    await loginAs(adminPageCtx, 'admin');
    await pause(2000);
    await ss(adminPageCtx, '14a_admin');
    await pause(3000);

    for (const item of ['Doctors', 'Appointments', 'Queue Monitor', 'Overview']) {
      const btn = adminPageCtx.locator(`text=${item}`).first();
      if (await btn.count() > 0) { await btn.click(); await pause(2000); }
    }
    await ss(adminPageCtx, '14b_admin_tour');
    await pause(2000);

    // ── 15 MULTI-TENANCY ─────────────────────────────────────────
    console.log('[15] Multi-Tenancy...');
    await page.bringToFront();
    await page.goto(`${BASE}/health-hub`, { waitUntil: 'networkidle', timeout: 20000 });
    await pause(1500);
    const hospCare2 = page.locator('text=Hospital Care').first();
    if (await hospCare2.count() > 0) { await hospCare2.click(); await pause(3000); }
    else { await page.goto(`${BASE}/hospitals`, { waitUntil: 'networkidle', timeout: 20000 }); await pause(3000); }
    await ss(page, '15a_multi_hosp');
    await smoothScroll(page, 600, 8);
    await pause(2000);
    await ss(page, '15b_hospital_scroll');

    // ── 16 CLOSING ───────────────────────────────────────────────
    console.log('[16] Closing...');
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 20000 });
    await pause(1000);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await pause(6000); // Final hold
    await ss(page, '16_closing');

    console.log('\n=== Recording complete ===');

  } catch (err) {
    console.error('Recording error:', err.message);
    await ss(page, 'error').catch(() => {});
  }

  // Save video
  const videoPath = await page.video()?.path();
  await context.close();
  await browser.close();

  if (videoPath && fs.existsSync(videoPath)) {
    const finalPath = path.join(VIDEO_DIR, 'Healthcare-Plus-Final-Demo.webm');
    fs.renameSync(videoPath, finalPath);
    const stats = fs.statSync(finalPath);
    console.log('\n=== VIDEO SAVED ===');
    console.log('Path:', finalPath);
    console.log('Size:', (stats.size / (1024 * 1024)).toFixed(2), 'MB');
  } else {
    console.error('Video file not found:', videoPath);
    const files = fs.readdirSync(VIDEO_DIR);
    console.log('Video dir contents:', files);
  }
}

record().catch(err => { console.error('FATAL:', err.message); process.exit(1); });
