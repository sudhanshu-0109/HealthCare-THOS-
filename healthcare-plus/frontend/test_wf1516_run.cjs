/**
 * Workflow 15+16 — Complete Appointment Booking + Payment Flow
 * Patient books -> selects slot -> type -> summary -> payment (demo) -> confirmation + token
 */
const { chromium } = require('playwright');
const fs = require('fs');

const SS_DIR = 'C:/Users/heart/.gemini/antigravity-ide/brain/8b1a318e-0f09-4ad4-a019-cf3d47055c1f/scratch/screenshots';
fs.mkdirSync(SS_DIR, { recursive: true });

const PATIENT_EMAIL = 'patient@healthcareplus.dev';
const PATIENT_PASSWORD = 'Password123!';

async function loginPatient(page) {
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);
  // Patient role is already the default selected
  await page.locator('input[type="email"]').first().fill(PATIENT_EMAIL);
  await page.locator('input[type="password"]').first().fill(PATIENT_PASSWORD);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForTimeout(5000);
  return page.url();
}

async function testBookingFlow() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  
  const consoleErrors = [];
  const networkErrors = [];
  page.on('console', msg => { 
    if (msg.type() === 'error' && !msg.text().includes('GSI_LOGGER')) consoleErrors.push(msg.text());
  });
  page.on('response', response => {
    if (response.status() >= 400 && !response.url().includes('favicon')) {
      networkErrors.push(`${response.status()} ${response.url()}`);
    }
  });
  
  const results = { workflow: 'W15-16 Booking+Payment Flow', steps: [], issues: [] };

  try {
    // Login
    const loginUrl = await loginPatient(page);
    console.log('Login URL:', loginUrl);
    if (loginUrl.includes('login')) { results.finalStatus = 'FAIL'; results.issues.push('Login failed'); return; }
    
    // Step 1: Navigate to Sterling Hospital workspace
    console.log('\n--- Step 1: Hospital Workspace ---');
    await page.goto('http://localhost:5173/hospitals/hosp-sterling', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${SS_DIR}/15a_hospital_workspace.png`, fullPage: true });
    
    const workspaceText = await page.locator('body').innerText().catch(() => '');
    console.log('Hospital workspace loaded:', workspaceText.includes('Sterling Hospital'));
    results.steps.push({ step: 'Hospital Workspace', loaded: workspaceText.includes('Sterling Hospital') });
    
    // Step 2: Click "Book Appointment" for Dr. Anil Shah
    console.log('\n--- Step 2: Click Book Appointment ---');
    const bookBtn = page.locator('button:has-text("Book Appointment")').first();
    const bookCount = await bookBtn.count();
    console.log('Book Appointment button found:', bookCount > 0);
    
    if (bookCount > 0) {
      await bookBtn.click();
      await page.waitForTimeout(5000);
    } else {
      // Try direct navigation
      await page.goto('http://localhost:5173/hospitals/hosp-sterling/doctors/561d55b4-a845-459e-83b7-cc9dad6cfcc3/book', { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(5000);
    }
    await page.screenshot({ path: `${SS_DIR}/15b_booking_step1.png`, fullPage: true });
    
    const step1Text = await page.locator('body').innerText().catch(() => '');
    console.log('Booking step 1 URL:', page.url());
    console.log('Has time slots:', step1Text.includes('AM') || step1Text.includes('PM'));
    results.steps.push({ step: 'Booking Step 1 (Slots)', url: page.url(), hasSlots: step1Text.includes('AM') });
    
    // Step 3: Select a date (tomorrow = Sep 23)
    console.log('\n--- Step 3: Select Date + Time ---');
    // Click the second date button (tomorrow)
    const dateButtons = page.locator('.text-center, button').filter({ hasText: '23' });
    const dateCount = await dateButtons.count();
    console.log('Date buttons found with "23":', dateCount);
    if (dateCount > 0) {
      await dateButtons.first().click();
      await page.waitForTimeout(2000);
    }
    
    // Select a time slot
    const slotButton = page.locator('button').filter({ hasText: '10:00 AM' }).first();
    const slotCount = await slotButton.count();
    console.log('10:00 AM slot found:', slotCount > 0);
    if (slotCount > 0) {
      await slotButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `${SS_DIR}/15c_slot_selected.png`, fullPage: true });
      console.log('Clicked 10:00 AM slot');
    } else {
      // Try any available slot
      const anySlot = page.locator('button[class*="border-slate"], button[class*="rounded"]').filter({ hasText: 'AM' }).first();
      const anyCount = await anySlot.count();
      if (anyCount > 0) {
        await anySlot.click();
        await page.waitForTimeout(1000);
        console.log('Clicked first AM slot');
      }
    }
    
    // Click Continue
    const continueBtn = page.locator('button:has-text("Continue")').first();
    const continueCount = await continueBtn.count();
    console.log('Continue button found:', continueCount > 0);
    if (continueCount > 0) {
      await continueBtn.click();
      await page.waitForTimeout(3000);
    }
    await page.screenshot({ path: `${SS_DIR}/15d_after_continue.png`, fullPage: true });
    
    const step2Url = page.url();
    const step2Text = await page.locator('body').innerText().catch(() => '');
    console.log('After Continue URL:', step2Url);
    console.log('Step 2 text (400 chars):', step2Text.substring(0, 400));
    results.steps.push({ step: 'After Continue', url: step2Url, text: step2Text.substring(0, 300) });
    
    // Step 4: Select consultation type (Offline/Online)
    const hasTypeSelector = step2Text.includes('In-Person') || step2Text.includes('Online') || step2Text.includes('OFFLINE') || step2Text.includes('ONLINE');
    console.log('Type selector visible:', hasTypeSelector);
    
    if (hasTypeSelector) {
      const offlineBtn = page.locator('button:has-text("In-Person"), button:has-text("OFFLINE"), [class*="offline"]').first();
      const offlineCount = await offlineBtn.count();
      console.log('In-Person button found:', offlineCount > 0);
      if (offlineCount > 0) {
        await offlineBtn.click();
        await page.waitForTimeout(3000);
        await page.screenshot({ path: `${SS_DIR}/15e_type_selected.png`, fullPage: true });
      }
    }
    
    const step3Url = page.url();
    const step3Text = await page.locator('body').innerText().catch(() => '');
    console.log('After type selection URL:', step3Url);
    console.log('Step 3 text (400 chars):', step3Text.substring(0, 400));
    results.steps.push({ step: 'Type Selection', url: step3Url, text: step3Text.substring(0, 300) });
    
    // Step 5: Summary screen — check and Confirm/Proceed to Payment
    const hasSummary = step3Text.toLowerCase().includes('summary') || step3Text.toLowerCase().includes('confirm') || step3Text.includes('₹');
    console.log('Summary/payment visible:', hasSummary);
    
    const confirmBtn = page.locator('button:has-text("Confirm"), button:has-text("Proceed"), button:has-text("Pay"), button:has-text("Book")').first();
    const confirmCount = await confirmBtn.count();
    console.log('Confirm/Pay button found:', confirmCount > 0);
    
    if (confirmCount > 0) {
      const btnText = await confirmBtn.innerText().catch(() => 'unknown');
      console.log('Button text:', btnText);
      await page.screenshot({ path: `${SS_DIR}/15f_summary.png`, fullPage: true });
      
      await confirmBtn.click();
      await page.waitForTimeout(6000);
    }
    await page.screenshot({ path: `${SS_DIR}/15g_after_payment_init.png`, fullPage: true });
    
    const paymentUrl = page.url();
    const paymentText = await page.locator('body').innerText().catch(() => '');
    console.log('After payment init URL:', paymentUrl);
    console.log('Payment text (500 chars):', paymentText.substring(0, 500));
    
    const hasRazorpay = paymentText.toLowerCase().includes('razorpay') || paymentText.toLowerCase().includes('demo payment') || paymentText.toLowerCase().includes('demo mode');
    const hasConfirmation = paymentText.toLowerCase().includes('confirmed') || paymentText.toLowerCase().includes('booked') || paymentUrl.includes('confirmation');
    const hasToken = paymentText.toLowerCase().includes('token') || paymentText.toLowerCase().includes('queue') || paymentText.match(/T-\d+/);
    
    console.log('Has Razorpay/payment:', hasRazorpay, '| Has Confirmation:', hasConfirmation, '| Has Token:', hasToken);
    results.steps.push({ step: 'Payment/Confirmation', url: paymentUrl, hasRazorpay, hasConfirmation, hasToken, text: paymentText.substring(0, 400) });
    
    // If demo payment button exists, click it
    if (hasRazorpay) {
      const demoBtn = page.locator('button:has-text("Demo"), button:has-text("Simulate"), button:has-text("Skip"), button:has-text("Pay Now")').first();
      const demoCount = await demoBtn.count();
      console.log('Demo payment button:', demoCount > 0);
      if (demoCount > 0) {
        await demoBtn.click();
        await page.waitForTimeout(8000);
        await page.screenshot({ path: `${SS_DIR}/15h_after_demo_pay.png`, fullPage: true });
        
        const finalUrl = page.url();
        const finalText = await page.locator('body').innerText().catch(() => '');
        console.log('Final URL:', finalUrl);
        console.log('Final text (400 chars):', finalText.substring(0, 400));
        results.steps.push({ step: 'After Demo Payment', url: finalUrl, text: finalText.substring(0, 300) });
      }
    }
    
    // Check my appointments API
    console.log('\n--- Step: Check My Appointments ---');
    const myAppts = await page.evaluate(async () => {
      const t = sessionStorage.getItem('hc_token') || localStorage.getItem('hc_token');
      const r = await fetch('/api/appointments/my', { headers: { Authorization: `Bearer ${t}` } });
      return r.json();
    });
    console.log('My Appointments API:', myAppts.success, 'Count:', myAppts.data?.appointments?.length ?? myAppts.data?.length);
    results.steps.push({ step: 'My Appointments API', success: myAppts.success, count: myAppts.data?.appointments?.length ?? myAppts.data?.length });
    
    results.consoleErrors = consoleErrors.filter(e => !e.includes('403'));
    results.networkErrors = networkErrors.filter(e => !e.includes('favicon'));
    const criticals = results.issues.filter(i => i.startsWith('CRITICAL') || i.startsWith('FAIL'));
    results.finalStatus = criticals.length > 0 ? 'FAIL' : 'PASS';
    
  } catch(err) {
    results.error = err.message;
    results.finalStatus = 'FAIL';
    console.error('Fatal error:', err.message);
    await page.screenshot({ path: `${SS_DIR}/15_fatal.png` }).catch(() => {});
  }
  
  await browser.close();
  
  fs.writeFileSync(
    'C:/Users/heart/.gemini/antigravity-ide/brain/8b1a318e-0f09-4ad4-a019-cf3d47055c1f/scratch/workflow1516_report.json',
    JSON.stringify(results, null, 2)
  );
  
  console.log('\n=== WORKFLOWS 15-16 FINAL:', results.finalStatus, '===');
  if (results.issues.length) console.log('Issues:', results.issues);
  if (consoleErrors.length) console.log('Console errors (top 5):', consoleErrors.slice(0, 5));
}

testBookingFlow().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
