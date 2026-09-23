/**
 * Workflow 2 - Patient Authentication Test
 */
const { chromium } = require('playwright');
const fs = require('fs');

const SS_DIR = 'C:/Users/heart/.gemini/antigravity-ide/brain/8b1a318e-0f09-4ad4-a019-cf3d47055c1f/scratch/screenshots';
fs.mkdirSync(SS_DIR, { recursive: true });

const PATIENT_EMAIL = 'patient@healthcareplus.dev';
const PATIENT_PASSWORD = 'Password123!';
const WRONG_PASSWORD = 'WrongPass999!';

async function testWorkflow2() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  
  const consoleErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  
  const results = { workflow: 'Workflow 2 - Patient Authentication', steps: [], issues: [] };

  try {
    // TEST 1: Navigate to login page
    console.log('\n=== TEST 1: Navigate to login page ===');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${SS_DIR}/02a_login_page.png`, fullPage: true });
    
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitBtn = page.locator('button[type="submit"]').first();
    
    const emailExists = await emailInput.count() > 0;
    const passwordExists = await passwordInput.count() > 0;
    const submitExists = await submitBtn.count() > 0;
    
    console.log('Form elements - Email:', emailExists, 'Password:', passwordExists, 'Submit:', submitExists);
    results.steps.push({ step: 'Login form elements', emailExists, passwordExists, submitExists });
    
    // TEST 2: Invalid credentials
    console.log('\n=== TEST 2: Invalid credentials ===');
    await emailInput.fill(PATIENT_EMAIL);
    await passwordInput.fill(WRONG_PASSWORD);
    await submitBtn.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${SS_DIR}/02b_invalid_login.png`, fullPage: true });
    
    const currentUrl2 = page.url();
    const pageText2 = await page.locator('body').innerText().catch(() => '');
    const hasError = pageText2.toLowerCase().includes('invalid') || 
                     pageText2.toLowerCase().includes('incorrect') || 
                     pageText2.toLowerCase().includes('wrong') ||
                     pageText2.toLowerCase().includes('error') ||
                     pageText2.toLowerCase().includes('failed');
    
    console.log('After invalid login - URL:', currentUrl2, 'Error shown:', hasError);
    results.steps.push({ step: 'Invalid credentials', stayedOnLoginPage: currentUrl2.includes('login'), errorShown: hasError });
    
    if (!currentUrl2.includes('login')) results.issues.push('CRITICAL: Invalid credentials redirected away!');
    
    // TEST 3: Valid patient login
    console.log('\n=== TEST 3: Valid patient login ===');
    const emailInput3 = page.locator('input[type="email"]').first();
    const passwordInput3 = page.locator('input[type="password"]').first();
    const submitBtn3 = page.locator('button[type="submit"]').first();
    
    await emailInput3.fill(PATIENT_EMAIL);
    await passwordInput3.fill(PATIENT_PASSWORD);
    await submitBtn3.click();
    await page.waitForTimeout(5000);
    await page.screenshot({ path: `${SS_DIR}/02c_after_valid_login.png`, fullPage: true });
    
    const urlAfterLogin = page.url();
    const textAfterLogin = await page.locator('body').innerText().catch(() => '');
    console.log('URL after valid login:', urlAfterLogin);
    console.log('Text snippet:', textAfterLogin.substring(0, 400));
    
    const isPatientArea = urlAfterLogin.includes('patient') || urlAfterLogin.includes('health-hub') || urlAfterLogin.includes('dashboard');
    const isStillOnLogin = urlAfterLogin.includes('login');
    
    results.steps.push({ step: 'Valid patient login', redirectedUrl: urlAfterLogin, isPatientArea, isStillOnLogin });
    
    if (isStillOnLogin) {
      results.issues.push('CRITICAL: Valid patient login did not redirect!');
      const errText = await page.locator('[class*="error"], [class*="alert"]').first().innerText().catch(() => 'no error element');
      console.log('Error on page:', errText);
    }
    
    if (!isStillOnLogin) {
      // TEST 4: Session persistence
      console.log('\n=== TEST 4: Session persistence ===');
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      const urlAfterRefresh = page.url();
      await page.screenshot({ path: `${SS_DIR}/02d_after_refresh.png`, fullPage: true });
      const stillAuth = !urlAfterRefresh.includes('login');
      console.log('URL after refresh:', urlAfterRefresh, 'Still authenticated:', stillAuth);
      results.steps.push({ step: 'Session persistence', urlAfterRefresh, stillAuthenticated: stillAuth });
      if (!stillAuth) results.issues.push('Session not persisted after refresh!');
      
      // TEST 5: RBAC
      console.log('\n=== TEST 5: RBAC - Patient vs Doctor dashboard ===');
      await page.goto('http://localhost:5173/doctor/dashboard', { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(2000);
      const urlAfterDocAttempt = page.url();
      await page.screenshot({ path: `${SS_DIR}/02e_patient_rbac.png`, fullPage: true });
      const deniedAccess = !urlAfterDocAttempt.includes('doctor/dashboard');
      console.log('Patient->Doctor URL:', urlAfterDocAttempt, 'Access denied:', deniedAccess);
      results.steps.push({ step: 'RBAC patient vs doctor', resultUrl: urlAfterDocAttempt, accessDenied: deniedAccess });
      if (!deniedAccess) results.issues.push('SECURITY: Patient can access doctor dashboard!');
      
      // TEST 6: Logout
      console.log('\n=== TEST 6: Logout ===');
      await page.goto('http://localhost:5173/patient/dashboard', { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(2000);
      
      const bodyText = await page.locator('body').innerText().catch(() => '');
      console.log('Patient dashboard text snippet:', bodyText.substring(0, 500));
      
      const logoutBtn = page.locator('button:has-text("Logout"), button:has-text("Sign Out"), button:has-text("Log Out")').first();
      const logoutCount = await logoutBtn.count();
      console.log('Logout button found:', logoutCount > 0);
      
      if (logoutCount > 0) {
        await logoutBtn.click();
        await page.waitForTimeout(3000);
        const urlAfterLogout = page.url();
        await page.screenshot({ path: `${SS_DIR}/02f_after_logout.png`, fullPage: true });
        const loggedOut = urlAfterLogout.includes('login') || urlAfterLogout === 'http://localhost:5173/';
        console.log('After logout URL:', urlAfterLogout, 'Logged out:', loggedOut);
        results.steps.push({ step: 'Logout', urlAfterLogout, loggedOut });
      } else {
        results.steps.push({ step: 'Logout', status: 'Button not found - may need profile/avatar click first' });
      }
    }
    
    results.consoleErrors = consoleErrors.filter(e => !e.includes('GSI_LOGGER'));
    results.finalStatus = results.issues.filter(i => i.startsWith('CRITICAL') || i.startsWith('SECURITY')).length === 0 ? 'PASS' : 'FAIL';
    
  } catch(err) {
    results.error = err.message;
    results.finalStatus = 'FAIL';
    console.error('Fatal error:', err.message);
    await page.screenshot({ path: `${SS_DIR}/02_fatal.png` }).catch(() => {});
  }
  
  await browser.close();
  
  fs.writeFileSync(
    'C:/Users/heart/.gemini/antigravity-ide/brain/8b1a318e-0f09-4ad4-a019-cf3d47055c1f/scratch/workflow2_report.json',
    JSON.stringify(results, null, 2)
  );
  
  console.log('\n=== WORKFLOW 2 FINAL:', results.finalStatus, '===');
  if (results.issues.length > 0) console.log('Issues:', results.issues);
}

testWorkflow2().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
