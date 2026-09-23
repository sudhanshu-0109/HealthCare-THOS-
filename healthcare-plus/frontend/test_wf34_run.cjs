/**
 * Workflow 3 & 4 - Health Hub + Hospital Discovery Test
 */
const { chromium } = require('playwright');
const fs = require('fs');

const SS_DIR = 'C:/Users/heart/.gemini/antigravity-ide/brain/8b1a318e-0f09-4ad4-a019-cf3d47055c1f/scratch/screenshots';
fs.mkdirSync(SS_DIR, { recursive: true });

const PATIENT_EMAIL = 'patient@healthcareplus.dev';
const PATIENT_PASSWORD = 'Password123!';

async function login(page) {
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);
  await page.locator('input[type="email"]').first().fill(PATIENT_EMAIL);
  await page.locator('input[type="password"]').first().fill(PATIENT_PASSWORD);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForTimeout(4000);
  const url = page.url();
  console.log('After login URL:', url);
  return url;
}

async function testWorkflows34() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  
  const consoleErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  
  const results = { workflow: 'Workflow 3+4 - Health Hub + Hospital Discovery', steps: [], issues: [] };

  try {
    // Login first
    const loginUrl = await login(page);
    if (loginUrl.includes('login')) {
      results.issues.push('CRITICAL: Could not login');
      results.finalStatus = 'FAIL';
      return;
    }

    // ── WORKFLOW 3: HEALTH HUB ─────────────────────────────────────
    console.log('\n=== WORKFLOW 3: HEALTH HUB ===');
    
    // Navigate to health hub
    await page.goto('http://localhost:5173/health-hub', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${SS_DIR}/03a_health_hub.png`, fullPage: true });
    
    const hubText = await page.locator('body').innerText().catch(() => '');
    console.log('Health Hub text (500 chars):', hubText.substring(0, 500));
    
    const hasHospitalCare = hubText.toLowerCase().includes('hospital care');
    const hasMentalWellness = hubText.toLowerCase().includes('mental wellness');
    const hasPhysicalHealth = hubText.toLowerCase().includes('physical health') || hubText.toLowerCase().includes('physical wellness');
    
    console.log('Health Hub sections - Hospital Care:', hasHospitalCare, 'Mental Wellness:', hasMentalWellness, 'Physical Health:', hasPhysicalHealth);
    results.steps.push({ step: 'Health Hub loaded', hasHospitalCare, hasMentalWellness, hasPhysicalHealth, url: page.url() });
    
    if (!hasHospitalCare || !hasMentalWellness || !hasPhysicalHealth) {
      results.issues.push('WARNING: Health Hub missing sections');
    }
    
    // Test Hospital Care navigation
    const hospitalCareLink = page.locator('a:has-text("Hospital Care"), button:has-text("Hospital Care"), :has-text("Explore Hospital Care")').first();
    const hcCount = await hospitalCareLink.count();
    console.log('Hospital Care link count:', hcCount);
    
    if (hcCount > 0) {
      await hospitalCareLink.click();
      await page.waitForTimeout(3000);
      const urlAfterHC = page.url();
      await page.screenshot({ path: `${SS_DIR}/03b_hospital_care_nav.png`, fullPage: true });
      console.log('After Hospital Care click URL:', urlAfterHC);
      results.steps.push({ step: 'Hospital Care navigation', url: urlAfterHC });
      
      // Go back to health hub
      await page.goto('http://localhost:5173/health-hub', { waitUntil: 'networkidle', timeout: 20000 });
      await page.waitForTimeout(1500);
    }
    
    // Test Mental Wellness navigation
    const mentalLink = page.locator('a:has-text("Mental Wellness"), button:has-text("Mental Wellness"), :has-text("Explore Mental Wellness")').first();
    const mwCount = await mentalLink.count();
    if (mwCount > 0) {
      await mentalLink.click();
      await page.waitForTimeout(3000);
      const urlAfterMW = page.url();
      await page.screenshot({ path: `${SS_DIR}/03c_mental_wellness.png`, fullPage: true });
      console.log('After Mental Wellness click URL:', urlAfterMW);
      results.steps.push({ step: 'Mental Wellness navigation', url: urlAfterMW });
      await page.goto('http://localhost:5173/health-hub', { waitUntil: 'networkidle', timeout: 20000 });
      await page.waitForTimeout(1500);
    }
    
    // Test Physical Health navigation
    const physicalLink = page.locator('a:has-text("Physical Health"), button:has-text("Physical Health"), :has-text("Explore Physical")').first();
    const phCount = await physicalLink.count();
    if (phCount > 0) {
      await physicalLink.click();
      await page.waitForTimeout(3000);
      const urlAfterPH = page.url();
      await page.screenshot({ path: `${SS_DIR}/03d_physical_health.png`, fullPage: true });
      console.log('After Physical Health click URL:', urlAfterPH);
      results.steps.push({ step: 'Physical Health navigation', url: urlAfterPH });
    }
    
    // ── WORKFLOW 4: HOSPITAL DISCOVERY ────────────────────────────
    console.log('\n=== WORKFLOW 4: HOSPITAL DISCOVERY ===');
    
    // Navigate to patient dashboard (has hospitals)
    await page.goto('http://localhost:5173/patient/dashboard', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${SS_DIR}/04a_patient_dashboard.png`, fullPage: true });
    
    const dashText = await page.locator('body').innerText().catch(() => '');
    console.log('Patient Dashboard text (600 chars):', dashText.substring(0, 600));
    
    const hasHospitals = dashText.toLowerCase().includes('hospital');
    console.log('Hospital list visible:', hasHospitals);
    results.steps.push({ step: 'Patient dashboard loaded', hasHospitals, url: page.url() });
    
    // Find and click a hospital
    const hospitalLink = page.locator('a[href*="/hospitals/"]').first();
    const hospitalLinkCount = await hospitalLink.count();
    console.log('Hospital links found:', hospitalLinkCount);
    
    if (hospitalLinkCount > 0) {
      const hospitalHref = await hospitalLink.getAttribute('href');
      console.log('Clicking hospital:', hospitalHref);
      await hospitalLink.click();
      await page.waitForTimeout(4000);
      const urlAfterHospital = page.url();
      await page.screenshot({ path: `${SS_DIR}/04b_hospital_workspace.png`, fullPage: true });
      
      const workspaceText = await page.locator('body').innerText().catch(() => '');
      console.log('Hospital workspace URL:', urlAfterHospital);
      console.log('Hospital workspace text (500 chars):', workspaceText.substring(0, 500));
      
      const hasDoctors = workspaceText.toLowerCase().includes('doctor');
      const hasDepartments = workspaceText.toLowerCase().includes('department');
      
      results.steps.push({ 
        step: 'Hospital workspace', 
        url: urlAfterHospital, 
        hasDoctors, 
        hasDepartments 
      });
      
      // Find a doctor/book button
      const bookBtn = page.locator('a[href*="book"], button:has-text("Book"), :has-text("View Doctor"), :has-text("Book Appointment")').first();
      const bookCount = await bookBtn.count();
      console.log('Book/Doctor links found:', bookCount);
      
      if (bookCount > 0) {
        const bookHref = await bookBtn.getAttribute('href').catch(() => null);
        console.log('Book link href:', bookHref);
        results.steps.push({ step: 'Book appointment link found', href: bookHref });
      }
    } else {
      console.log('No hospital links found on patient dashboard');
      // Maybe hospitals are on a different route - try /hospitals
      await page.goto('http://localhost:5173/hospitals', { waitUntil: 'networkidle', timeout: 20000 });
      await page.waitForTimeout(2000);
      const hospitalsPageText = await page.locator('body').innerText().catch(() => '');
      console.log('/hospitals page text (400 chars):', hospitalsPageText.substring(0, 400));
      await page.screenshot({ path: `${SS_DIR}/04b_hospitals_route.png`, fullPage: true });
      results.steps.push({ step: 'Hospitals route', url: page.url(), text: hospitalsPageText.substring(0, 200) });
    }
    
    results.consoleErrors = consoleErrors.filter(e => !e.includes('GSI_LOGGER'));
    const hasCritical = results.issues.filter(i => i.startsWith('CRITICAL')).length > 0;
    results.finalStatus = hasCritical ? 'FAIL' : 'PASS';
    
  } catch(err) {
    results.error = err.message;
    results.finalStatus = 'FAIL';
    console.error('Fatal error:', err.message);
    await page.screenshot({ path: `${SS_DIR}/03_fatal.png` }).catch(() => {});
  }
  
  await browser.close();
  
  fs.writeFileSync(
    'C:/Users/heart/.gemini/antigravity-ide/brain/8b1a318e-0f09-4ad4-a019-cf3d47055c1f/scratch/workflow34_report.json',
    JSON.stringify(results, null, 2)
  );
  
  console.log('\n=== WORKFLOWS 3+4 FINAL:', results.finalStatus, '===');
  if (results.issues.length > 0) console.log('Issues:', results.issues);
}

testWorkflows34().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
