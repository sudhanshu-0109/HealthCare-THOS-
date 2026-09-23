/**
 * Multi-Role Workflows 6-14
 * Uses correct credentials from CREDENTIALS.md
 */
const { chromium } = require('playwright');
const fs = require('fs');

const SS_DIR = 'C:/Users/heart/.gemini/antigravity-ide/brain/8b1a318e-0f09-4ad4-a019-cf3d47055c1f/scratch/screenshots';
fs.mkdirSync(SS_DIR, { recursive: true });

const CREDS = {
  doctor: { email: 'dr.anil.shah@sterling.dev', password: 'Password123!', name: 'Dr. Anil Shah' },
  admin:  { email: 'admin@sterling.dev',         password: 'Password123!', name: 'Vikramaditya Admin' },
  receptionist: { email: 'receptionist@sterling.dev', password: 'Password123!', name: 'Anita Roy' },
  pharmacist: { email: 'pharmacist@sterling.dev', password: 'Password123!', name: 'Ramesh Gupta' },
  labstaff: { email: 'labstaff@sterling.dev',    password: 'Password123!', name: 'Suresh Kumar' },
  driver: { email: 'driver@sterling.dev',         password: 'Password123!', name: 'Mahesh Driver' },
  superadmin: { email: 'superadmin@healthcareplus.dev', password: 'Password123!', name: 'Super Admin' },
};

async function loginAs(page, role) {
  const cred = CREDS[role];
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);
  await page.locator('input[type="email"]').first().fill(cred.email);
  await page.locator('input[type="password"]').first().fill(cred.password);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForTimeout(4000);
  return { url: page.url(), role };
}

async function testRole(page, role, expectedUrlPart, ssPrefix) {
  const result = await loginAs(page, role);
  const success = result.url.includes(expectedUrlPart) && !result.url.includes('login');
  const bodyText = await page.locator('body').innerText().catch(() => '');
  await page.screenshot({ path: `${SS_DIR}/${ssPrefix}_${role}_dashboard.png`, fullPage: true });
  console.log(`[${role.toUpperCase()}] URL: ${result.url} | Expected: ${expectedUrlPart} | SUCCESS: ${success}`);
  console.log(`[${role.toUpperCase()}] Dashboard text (300 chars):`, bodyText.substring(0, 300));
  return { role, url: result.url, success, bodyPreview: bodyText.substring(0, 200) };
}

async function testMultiRole() {
  const browser = await chromium.launch({ headless: true });
  const results = { workflows: [], issues: [] };

  // ── Workflow 6+7: Doctor ──────────────────────────────────────────
  console.log('\n==== WORKFLOW 6+7: DOCTOR ====');
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    page.on('console', msg => { if (msg.type() === 'error' && !msg.text().includes('GSI')) console.log('[CONSOLE ERR]', msg.text()); });
    
    const r = await testRole(page, 'doctor', 'doctor', '06');
    results.workflows.push({ workflow: 'W6-7 Doctor Login+Dashboard', ...r });
    if (!r.success) results.issues.push('W6: Doctor login failed');
    
    if (r.success) {
      // Test RBAC: doctor → patient dashboard
      await page.goto('http://localhost:5173/patient/dashboard', { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(1500);
      const rbacUrl = page.url();
      const denied = !rbacUrl.includes('patient/dashboard');
      console.log('[DOCTOR RBAC] patient/dashboard attempt:', rbacUrl, '| Denied:', denied);
      results.workflows.push({ workflow: 'W6-7 Doctor RBAC vs Patient', denied, rbacUrl });
      if (!denied) results.issues.push('SECURITY: Doctor can access patient dashboard!');
      
      // Check queue API
      const queueData = await page.evaluate(async () => {
        const t = sessionStorage.getItem('hc_token') || localStorage.getItem('hc_token');
        const today = new Date().toISOString().split('T')[0];
        const r = await fetch(`/api/queue/doctor?date=${today}`, { headers: { Authorization: `Bearer ${t}` } });
        return r.json();
      });
      console.log('[DOCTOR QUEUE API]', JSON.stringify(queueData).substring(0, 300));
      results.workflows.push({ workflow: 'W7 Doctor Queue API', success: queueData.success !== false, data: JSON.stringify(queueData).substring(0, 200) });
    }
    await context.close();
  }

  // ── Workflow 8+9: Hospital Admin ────────────────────────────────
  console.log('\n==== WORKFLOW 8+9: HOSPITAL ADMIN ====');
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    page.on('console', msg => { if (msg.type() === 'error' && !msg.text().includes('GSI')) console.log('[CONSOLE ERR]', msg.text()); });
    
    const r = await testRole(page, 'admin', 'hospital', '08');
    results.workflows.push({ workflow: 'W8-9 Hospital Admin Login+Dashboard', ...r });
    if (!r.success) results.issues.push('W8: Hospital Admin login failed');
    
    if (r.success) {
      // Test analytics API
      const analyticsData = await page.evaluate(async () => {
        const t = sessionStorage.getItem('hc_token') || localStorage.getItem('hc_token');
        const r = await fetch('/api/analytics/hospital', { headers: { Authorization: `Bearer ${t}` } });
        return r.json();
      });
      console.log('[ADMIN ANALYTICS API]', JSON.stringify(analyticsData).substring(0, 300));
      results.workflows.push({ workflow: 'W9 Hospital Admin Analytics API', 
        success: analyticsData.success !== false, 
        data: JSON.stringify(analyticsData).substring(0, 200) 
      });
    }
    await context.close();
  }

  // ── Workflow 10: Receptionist ────────────────────────────────────
  console.log('\n==== WORKFLOW 10: RECEPTIONIST ====');
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    const r = await testRole(page, 'receptionist', 'receptionist', '10');
    results.workflows.push({ workflow: 'W10 Receptionist Login+Dashboard', ...r });
    if (!r.success) results.issues.push('W10: Receptionist login failed');
    await context.close();
  }

  // ── Workflow 11: Pharmacist ──────────────────────────────────────
  console.log('\n==== WORKFLOW 11: PHARMACIST ====');
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    const r = await testRole(page, 'pharmacist', 'pharmacist', '11');
    results.workflows.push({ workflow: 'W11 Pharmacist Login+Dashboard', ...r });
    if (!r.success) results.issues.push('W11: Pharmacist login failed');
    await context.close();
  }

  // ── Workflow 12: Lab Staff ───────────────────────────────────────
  console.log('\n==== WORKFLOW 12: LAB STAFF ====');
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    const r = await testRole(page, 'labstaff', 'lab', '12');
    results.workflows.push({ workflow: 'W12 Lab Staff Login+Dashboard', ...r });
    if (!r.success) results.issues.push('W12: Lab Staff login failed');
    await context.close();
  }

  // ── Workflow 13: Ambulance Driver ────────────────────────────────
  console.log('\n==== WORKFLOW 13: AMBULANCE DRIVER ====');
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    const r = await testRole(page, 'driver', 'driver', '13');
    results.workflows.push({ workflow: 'W13 Ambulance Driver Login+Dashboard', ...r });
    if (!r.success) results.issues.push('W13: Ambulance Driver login failed');
    await context.close();
  }

  // ── Workflow 14: Super Admin ─────────────────────────────────────
  console.log('\n==== WORKFLOW 14: SUPER ADMIN ====');
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    const r = await testRole(page, 'superadmin', 'super', '14');
    results.workflows.push({ workflow: 'W14 Super Admin Login+Dashboard', ...r });
    if (!r.success) results.issues.push('W14: Super Admin login failed');
    
    if (r.success) {
      // Test super admin hospitals API
      const allHospitals = await page.evaluate(async () => {
        const t = sessionStorage.getItem('hc_token') || localStorage.getItem('hc_token');
        const r = await fetch('/api/hospitals/all', { headers: { Authorization: `Bearer ${t}` } });
        return r.json();
      });
      console.log('[SUPER ADMIN] All hospitals:', allHospitals.success, 'Count:', allHospitals.data?.length);
      results.workflows.push({ workflow: 'W14 Super Admin Hospitals API', 
        success: allHospitals.success, 
        count: allHospitals.data?.length 
      });
    }
    await context.close();
  }

  await browser.close();

  const criticals = results.issues.filter(i => i.startsWith('SECURITY') || i.startsWith('W'));
  const finalStatus = criticals.length === 0 ? 'PASS' : 'PARTIAL';

  fs.writeFileSync(
    'C:/Users/heart/.gemini/antigravity-ide/brain/8b1a318e-0f09-4ad4-a019-cf3d47055c1f/scratch/workflow614_report.json',
    JSON.stringify({ ...results, finalStatus }, null, 2)
  );

  console.log('\n============================');
  console.log('WORKFLOWS 6-14 FINAL:', finalStatus);
  console.log('Issues:', results.issues);
  console.log('============================');
}

testMultiRole().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
