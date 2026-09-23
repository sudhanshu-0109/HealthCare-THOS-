/**
 * Workflows 6+7 — Doctor Authentication + Doctor Dashboard
 */
const { chromium } = require('playwright');
const fs = require('fs');

const SS_DIR = 'C:/Users/heart/.gemini/antigravity-ide/brain/8b1a318e-0f09-4ad4-a019-cf3d47055c1f/scratch/screenshots';
fs.mkdirSync(SS_DIR, { recursive: true });

const DOCTOR_EMAIL = 'doctor@healthcareplus.dev';
const DOCTOR_PASSWORD = 'Password123!';
const PATIENT_EMAIL = 'patient@healthcareplus.dev';
const PATIENT_PASSWORD = 'Password123!';

async function login(page, email, password) {
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);
  await page.locator('input[type="email"]').first().fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForTimeout(4000);
  return page.url();
}

async function testWorkflows67() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  
  const consoleErrors = [];
  page.on('console', msg => { 
    if (msg.type() === 'error' && !msg.text().includes('GSI_LOGGER')) {
      consoleErrors.push(msg.text());
    }
  });
  
  const results = { workflow: 'Workflow 6+7 - Doctor Auth + Dashboard', steps: [], issues: [] };

  try {
    // ── WORKFLOW 6: Doctor Login ────────────────────────────────────
    console.log('\n=== WORKFLOW 6: Doctor Login ===');
    const loginUrl = await login(page, DOCTOR_EMAIL, DOCTOR_PASSWORD);
    console.log('Doctor login URL:', loginUrl);
    await page.screenshot({ path: `${SS_DIR}/06a_doctor_login_result.png`, fullPage: true });
    
    const isDoctorDash = loginUrl.includes('doctor') && !loginUrl.includes('login');
    results.steps.push({ step: 'Doctor login', url: loginUrl, isDoctorDash });
    
    if (!isDoctorDash) {
      results.issues.push('CRITICAL: Doctor login did not redirect to doctor dashboard');
      console.log('Body text:', (await page.locator('body').innerText().catch(() => '')).substring(0, 300));
    }
    
    // ── WORKFLOW 7: Doctor Dashboard ────────────────────────────────
    console.log('\n=== WORKFLOW 7: Doctor Dashboard ===');
    const dashText = await page.locator('body').innerText().catch(() => '');
    console.log('Doctor dashboard text (600 chars):', dashText.substring(0, 600));
    
    const hasTodaysQueue = dashText.toLowerCase().includes('queue') || dashText.toLowerCase().includes('token');
    const hasAppointments = dashText.toLowerCase().includes('appointment');
    const hasPatients = dashText.toLowerCase().includes('patient');
    const hasQueueLive = dashText.toLowerCase().includes('live') || dashText.toLowerCase().includes('waiting');
    
    console.log('Dashboard sections - Queue:', hasTodaysQueue, 'Appointments:', hasAppointments, 'Patients:', hasPatients, 'Live:', hasQueueLive);
    results.steps.push({ step: 'Doctor dashboard content', hasTodaysQueue, hasAppointments, hasPatients, url: page.url() });
    
    // Test RBAC: Doctor cannot access patient routes
    console.log('\n=== TEST: RBAC Doctor vs Patient ===');
    await page.goto('http://localhost:5173/patient/dashboard', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);
    const urlAfterPatientAttempt = page.url();
    await page.screenshot({ path: `${SS_DIR}/06b_doctor_rbac.png` });
    const deniedAccess = !urlAfterPatientAttempt.includes('patient/dashboard');
    console.log('Doctor->Patient URL:', urlAfterPatientAttempt, 'Access denied:', deniedAccess);
    results.steps.push({ step: 'RBAC doctor vs patient', url: urlAfterPatientAttempt, accessDenied: deniedAccess });
    if (!deniedAccess) results.issues.push('SECURITY: Doctor can access patient dashboard!');
    
    // Test RBAC: Doctor cannot access hospital-admin routes
    console.log('\n=== TEST: RBAC Doctor vs Admin ===');
    await page.goto('http://localhost:5173/hospital/dashboard', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);
    const urlAfterAdminAttempt = page.url();
    console.log('Doctor->Admin URL:', urlAfterAdminAttempt);
    const deniedAdmin = !urlAfterAdminAttempt.includes('hospital/dashboard');
    results.steps.push({ step: 'RBAC doctor vs admin', url: urlAfterAdminAttempt, accessDenied: deniedAdmin });
    
    // Navigate back to doctor dashboard
    await page.goto(`http://localhost:5173${loginUrl.replace('http://localhost:5173', '')}`, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${SS_DIR}/07_doctor_dashboard_full.png`, fullPage: true });
    
    // Check if doctor can mark patient as complete (queue management)
    const doctorDashText2 = await page.locator('body').innerText().catch(() => '');
    console.log('Doctor dashboard after nav (400 chars):', doctorDashText2.substring(0, 400));
    
    const hasStartConsult = doctorDashText2.toLowerCase().includes('consult') || 
                            doctorDashText2.toLowerCase().includes('start') ||
                            doctorDashText2.toLowerCase().includes('call');
    results.steps.push({ step: 'Doctor can start consultation', hasConsultOption: hasStartConsult });
    
    // ── WORKFLOW 8: Queue/OPD Management (from doctor side) ─────────
    console.log('\n=== WORKFLOW 8: Queue Management ===');
    // Check queue status via API
    const queueData = await page.evaluate(async () => {
      const token = sessionStorage.getItem('hc_token') || localStorage.getItem('hc_token');
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch(`/api/queue/doctor?date=${today}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return res.json();
    });
    console.log('Queue API response:', JSON.stringify(queueData).substring(0, 400));
    results.steps.push({ step: 'Queue API', response: JSON.stringify(queueData).substring(0, 200) });
    
    // ── TEST: Prescription writing ──────────────────────────────────
    console.log('\n=== WORKFLOW 9: Prescription Writing (API) ===');
    // Get appointments first
    const apptData = await page.evaluate(async () => {
      const token = sessionStorage.getItem('hc_token') || localStorage.getItem('hc_token');
      const res = await fetch('/api/appointments?role=DOCTOR&limit=5', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return res.json();
    });
    console.log('Appointments API:', JSON.stringify(apptData).substring(0, 400));
    results.steps.push({ step: 'Appointments API (doctor)', response: JSON.stringify(apptData).substring(0, 200) });
    
    results.consoleErrors = consoleErrors.filter(e => !e.includes('GSI'));
    const critical = results.issues.filter(i => i.startsWith('CRITICAL') || i.startsWith('SECURITY'));
    results.finalStatus = critical.length > 0 ? 'FAIL' : 'PASS';
    
  } catch(err) {
    results.error = err.message;
    results.finalStatus = 'FAIL';
    console.error('Fatal error:', err.message);
    await page.screenshot({ path: `${SS_DIR}/06_fatal.png` }).catch(() => {});
  }
  
  await browser.close();
  
  fs.writeFileSync(
    'C:/Users/heart/.gemini/antigravity-ide/brain/8b1a318e-0f09-4ad4-a019-cf3d47055c1f/scratch/workflow67_report.json',
    JSON.stringify(results, null, 2)
  );
  
  console.log('\n=== WORKFLOWS 6+7 FINAL:', results.finalStatus, '===');
  if (results.issues.length > 0) console.log('Issues:', results.issues);
}

testWorkflows67().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
