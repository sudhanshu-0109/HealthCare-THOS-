/**
 * Multi-Role Workflows 6-14 — FIXED
 * Handles role-selector in login form
 */
const { chromium } = require('playwright');
const fs = require('fs');

const SS_DIR = 'C:/Users/heart/.gemini/antigravity-ide/brain/8b1a318e-0f09-4ad4-a019-cf3d47055c1f/scratch/screenshots';
fs.mkdirSync(SS_DIR, { recursive: true });

const CREDS = {
  doctor:       { email: 'dr.anil.shah@sterling.dev',     password: 'Password123!', roleLabel: 'Doctor',             name: 'Dr. Anil Shah' },
  admin:        { email: 'admin@sterling.dev',             password: 'Password123!', roleLabel: 'Hospital Admin',     name: 'Vikramaditya Admin' },
  receptionist: { email: 'receptionist@sterling.dev',     password: 'Password123!', roleLabel: 'Receptionist',        name: 'Anita Roy' },
  pharmacist:   { email: 'pharmacist@sterling.dev',        password: 'Password123!', roleLabel: 'Pharmacist',          name: 'Ramesh Gupta' },
  labstaff:     { email: 'labstaff@sterling.dev',          password: 'Password123!', roleLabel: 'Lab Staff',           name: 'Suresh Kumar' },
  driver:       { email: 'driver@sterling.dev',            password: 'Password123!', roleLabel: 'Ambulance Driver',    name: 'Mahesh Driver' },
  superadmin:   { email: 'superadmin@healthcareplus.dev',  password: 'Password123!', roleLabel: 'Super Admin',         name: 'Super Admin' },
};

// Login with role selection
async function loginAs(page, role) {
  const cred = CREDS[role];
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);
  
  // Step 1: Select role button
  const roleButton = page.locator(`button:has-text("${cred.roleLabel}")`).first();
  const roleCount = await roleButton.count();
  console.log(`  Role button "${cred.roleLabel}" found: ${roleCount > 0}`);
  if (roleCount > 0) {
    await roleButton.click();
    await page.waitForTimeout(500);
  }
  
  // Step 2: Fill credentials
  await page.locator('input[type="email"]').first().fill(cred.email);
  await page.locator('input[type="password"]').first().fill(cred.password);
  
  // Step 3: Submit
  await page.locator('button[type="submit"]').first().click();
  await page.waitForTimeout(5000);
  
  return page.url();
}

// Test a role: login, screenshot, return result
async function testRole(browser, role, expectedUrlPart, ssPrefix) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  const consoleErrs = [];
  page.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('GSI_LOGGER')) {
      consoleErrs.push(msg.text());
    }
  });
  
  const url = await loginAs(page, role);
  const bodyText = await page.locator('body').innerText().catch(() => '');
  await page.screenshot({ path: `${SS_DIR}/${ssPrefix}_${role}_dashboard.png`, fullPage: true });
  
  const success = !url.includes('login');
  const urlMatchesRole = url.includes(expectedUrlPart);
  
  console.log(`[${role.toUpperCase()}] URL: ${url}`);
  console.log(`[${role.toUpperCase()}] Success: ${success} | URLMatch: ${urlMatchesRole}`);
  console.log(`[${role.toUpperCase()}] Body (250 chars):`, bodyText.substring(0, 250));
  
  let extraChecks = {};
  
  // Role-specific extra checks
  if (success && role === 'doctor') {
    // Check queue API
    const queueData = await page.evaluate(async () => {
      const t = sessionStorage.getItem('hc_token') || localStorage.getItem('hc_token');
      const today = new Date().toISOString().split('T')[0];
      try {
        const r = await fetch(`/api/queue/doctor?date=${today}`, { headers: { Authorization: `Bearer ${t}` } });
        return r.json();
      } catch(e) { return { error: e.message }; }
    });
    console.log('[DOCTOR QUEUE API]:', JSON.stringify(queueData).substring(0, 200));
    extraChecks.queueApi = queueData;
    
    // Check appointments API
    const apptData = await page.evaluate(async () => {
      const t = sessionStorage.getItem('hc_token') || localStorage.getItem('hc_token');
      try {
        const r = await fetch('/api/appointments', { headers: { Authorization: `Bearer ${t}` } });
        return r.json();
      } catch(e) { return { error: e.message }; }
    });
    console.log('[DOCTOR APPOINTMENTS API]:', JSON.stringify(apptData).substring(0, 200));
    extraChecks.appointmentsApi = apptData;
    
    // RBAC: Doctor cannot access patient dashboard
    await page.goto('http://localhost:5173/patient/dashboard', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1500);
    const rbacUrl = page.url();
    extraChecks.rbacPatientAccess = rbacUrl.includes('patient/dashboard');
    console.log('[DOCTOR RBAC] Patient URL:', rbacUrl, 'Allowed:', extraChecks.rbacPatientAccess);
    if (extraChecks.rbacPatientAccess) console.log('!!! SECURITY BUG: Doctor can access patient dashboard !!!');
  }
  
  if (success && role === 'admin') {
    // Admin analytics
    const analyticsData = await page.evaluate(async () => {
      const t = sessionStorage.getItem('hc_token') || localStorage.getItem('hc_token');
      try {
        const r = await fetch('/api/analytics/hospital', { headers: { Authorization: `Bearer ${t}` } });
        return r.json();
      } catch(e) { return { error: e.message }; }
    });
    console.log('[ADMIN ANALYTICS API]:', JSON.stringify(analyticsData).substring(0, 300));
    extraChecks.analyticsApi = analyticsData;
  }
  
  if (success && role === 'superadmin') {
    // Super admin: all hospitals
    const allHospitals = await page.evaluate(async () => {
      const t = sessionStorage.getItem('hc_token') || localStorage.getItem('hc_token');
      try {
        const r = await fetch('/api/hospitals/all', { headers: { Authorization: `Bearer ${t}` } });
        return r.json();
      } catch(e) { return { error: e.message }; }
    });
    console.log('[SUPER ADMIN] All hospitals:', allHospitals.success, 'Count:', allHospitals.data?.length);
    extraChecks.allHospitals = { success: allHospitals.success, count: allHospitals.data?.length };
  }
  
  await context.close();
  
  return { 
    role, 
    url, 
    success, 
    urlMatchesRole,
    bodyPreview: bodyText.substring(0, 200),
    consoleErrors: consoleErrs.length,
    extraChecks
  };
}

async function runAllRoleTests() {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  const issues = [];
  
  const roleTests = [
    { role: 'doctor',       expectedUrl: 'doctor',       prefix: '06', workflow: 'W6-7 Doctor' },
    { role: 'admin',        expectedUrl: 'hospital',     prefix: '08', workflow: 'W8-9 Hospital Admin' },
    { role: 'receptionist', expectedUrl: 'receptionist', prefix: '10', workflow: 'W10 Receptionist' },
    { role: 'pharmacist',   expectedUrl: 'pharmacist',   prefix: '11', workflow: 'W11 Pharmacist' },
    { role: 'labstaff',     expectedUrl: 'lab',          prefix: '12', workflow: 'W12 Lab Staff' },
    { role: 'driver',       expectedUrl: 'driver',       prefix: '13', workflow: 'W13 Driver' },
    { role: 'superadmin',   expectedUrl: 'super',        prefix: '14', workflow: 'W14 Super Admin' },
  ];
  
  for (const test of roleTests) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`WORKFLOW: ${test.workflow}`);
    console.log('='.repeat(50));
    
    const r = await testRole(browser, test.role, test.expectedUrl, test.prefix);
    results.push({ workflow: test.workflow, ...r });
    
    if (!r.success) issues.push(`FAIL: ${test.workflow} login failed (stayed on login page)`);
    if (r.success && !r.urlMatchesRole) issues.push(`WARN: ${test.workflow} redirected to unexpected URL: ${r.url}`);
    if (r.extraChecks?.rbacPatientAccess) issues.push(`SECURITY: Doctor can access patient/dashboard!`);
  }
  
  await browser.close();
  
  const failCount = results.filter(r => !r.success).length;
  const finalStatus = failCount === 0 ? 'PASS' : (failCount <= 2 ? 'PARTIAL' : 'FAIL');
  
  const report = { finalStatus, failCount, totalRoles: results.length, results, issues };
  fs.writeFileSync(
    'C:/Users/heart/.gemini/antigravity-ide/brain/8b1a318e-0f09-4ad4-a019-cf3d47055c1f/scratch/workflow614_report.json',
    JSON.stringify(report, null, 2)
  );
  
  console.log('\n' + '='.repeat(50));
  console.log(`WORKFLOWS 6-14 FINAL: ${finalStatus}`);
  console.log(`Passed: ${results.length - failCount}/${results.length}`);
  results.forEach(r => console.log(`  ${r.success ? '✓' : '✗'} ${r.workflow}: ${r.url}`));
  if (issues.length > 0) console.log('Issues:', issues);
  console.log('='.repeat(50));
}

runAllRoleTests().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
