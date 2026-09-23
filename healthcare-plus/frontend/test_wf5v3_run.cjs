/**
 * Workflow 5 - Appointment Booking Test v2
 * Uses proper API paths and navigates through the UI
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
  return page.url();
}

async function testWorkflow5() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  
  const consoleErrors = [];
  page.on('console', msg => { 
    if (msg.type() === 'error') {
      const txt = msg.text();
      if (!txt.includes('GSI_LOGGER') && !txt.includes('Given origin')) {
        consoleErrors.push(txt);
      }
    }
  });
  
  const results = { workflow: 'Workflow 5 - Appointment Booking', steps: [], issues: [] };

  try {
    // Login first
    const loginUrl = await login(page);
    console.log('After login URL:', loginUrl);
    if (loginUrl.includes('login')) { results.finalStatus = 'FAIL'; results.issues.push('Login failed'); return; }
    
    // Step 1: Navigate to patient dashboard
    await page.goto('http://localhost:5173/patient/dashboard', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${SS_DIR}/05a_patient_dashboard.png` });
    console.log('Patient dashboard loaded');
    
    // Step 2: Get hospitals list using the authenticated session
    const hospitalsData = await page.evaluate(async () => {
      const token = sessionStorage.getItem('hc_token') || localStorage.getItem('hc_token');
      const res = await fetch('/api/hospitals?limit=3', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return res.json();
    });
    
    console.log('Hospitals API status:', hospitalsData.success, 'Count:', hospitalsData.data?.length);
    results.steps.push({ step: 'Hospitals API', count: hospitalsData.data?.length });
    
    if (!hospitalsData.data?.length) {
      results.issues.push('No hospitals found');
      results.finalStatus = 'FAIL';
      return;
    }
    
    // Use Sterling Hospital (hosp-sterling) as it has seeded doctors
    const targetHospitalId = 'hosp-sterling';
    console.log('Using Sterling Hospital:', targetHospitalId);
    
    // Step 3: Navigate to Sterling Hospital workspace
    await page.goto(`http://localhost:5173/hospitals/${targetHospitalId}`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(4000);
    await page.screenshot({ path: `${SS_DIR}/05b_hospital_workspace.png`, fullPage: true });
    
    const workspaceText = await page.locator('body').innerText().catch(() => '');
    console.log('Hospital workspace URL:', page.url());
    console.log('Hospital workspace text (600 chars):', workspaceText.substring(0, 600));
    results.steps.push({ step: 'Hospital workspace', url: page.url(), loaded: !workspaceText.includes('404') });
    
    // Step 4: Get doctors from API using authenticated session
    const doctorsData = await page.evaluate(async (hId) => {
      const token = sessionStorage.getItem('hc_token') || localStorage.getItem('hc_token');
      const res = await fetch(`/api/doctors?hospitalId=${hId}&limit=3`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return res.json();
    }, targetHospitalId);
    
    console.log('Doctors API:', JSON.stringify(doctorsData).substring(0, 400));
    results.steps.push({ step: 'Doctors API', response: JSON.stringify(doctorsData).substring(0, 300) });
    
    let doctorId = null;
    if (doctorsData.data?.length > 0) {
      doctorId = doctorsData.data[0].id;
      console.log('Using doctor:', doctorId, doctorsData.data[0].fullName);
    } else if (Array.isArray(doctorsData.data)) {
      console.log('Empty doctors array for this hospital');
      // Try another approach - use availability API to get doctor IDs
    }
    
    if (!doctorId) {
      // Try to find doctor IDs from the workspace UI
      const bookLinks = await page.locator('button:has-text("Book"), a[href*="book"]').all();
      console.log('Book buttons found on workspace:', bookLinks.length);
      
      if (bookLinks.length > 0) {
        const href = await bookLinks[0].getAttribute('href').catch(() => null);
        if (href) doctorId = href.split('/').slice(-2)[0];
      }
    }
    
    if (!doctorId) {
      results.issues.push('Could not find doctor - trying Sterling Hospital specific doctor IDs');
      // From seed data - Dr. Anil Shah at Sterling
      // Try to click a doctor button in the workspace
      const doctorBtn = page.locator('button:has-text("Book Appointment"), button:has-text("Book Now"), .cursor-pointer').first();
      const doctorBtnCount = await doctorBtn.count();
      console.log('Doctor button in workspace:', doctorBtnCount > 0);
      
      if (doctorBtnCount > 0) {
        await doctorBtn.click();
        await page.waitForTimeout(3000);
        const urlAfterClick = page.url();
        console.log('URL after clicking doctor button:', urlAfterClick);
        await page.screenshot({ path: `${SS_DIR}/05c_after_doctor_click.png`, fullPage: true });
        results.steps.push({ step: 'Doctor button click', url: urlAfterClick });
      }
    } else {
      // Step 5: Navigate to doctor booking page directly
      const bookingUrl = `/hospitals/${targetHospitalId}/doctors/${doctorId}/book`;
      console.log('Navigating to booking URL:', bookingUrl);
      await page.goto(`http://localhost:5173${bookingUrl}`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(4000);
      await page.screenshot({ path: `${SS_DIR}/05c_doctor_booking.png`, fullPage: true });
      
      const bookingText = await page.locator('body').innerText().catch(() => '');
      console.log('Booking page URL:', page.url());
      console.log('Booking page text (500 chars):', bookingText.substring(0, 500));
      results.steps.push({ step: 'Doctor booking page', url: page.url(), text: bookingText.substring(0, 300) });
      
      // Step 6: Find and click available slots
      const hasCalendar = bookingText.includes('AM') || bookingText.includes('PM') || bookingText.includes('slot') || bookingText.includes('available');
      console.log('Calendar/slots visible:', hasCalendar);
      
      // Find tomorrow's date button if needed
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toDateString();
      
      // Try to find a slot button
      const slotButton = page.locator('button[class*="available"], button:has-text("AM"), button:has-text(":00"), [class*="slot"]:not([disabled])').first();
      const slotCount = await slotButton.count();
      console.log('Slot buttons found:', slotCount);
      
      if (slotCount > 0) {
        await slotButton.click();
        await page.waitForTimeout(1000);
        console.log('Clicked a time slot');
      }
      
      // Try to find and click "Book" or "Confirm" button
      const bookBtn = page.locator('button:has-text("Book Appointment"), button:has-text("Confirm Booking"), button:has-text("Book"), button:has-text("Confirm")').first();
      const bookBtnCount = await bookBtn.count();
      console.log('Book/Confirm button found:', bookBtnCount > 0);
      
      await page.screenshot({ path: `${SS_DIR}/05d_booking_form.png`, fullPage: true });
      results.steps.push({ step: 'Booking form', hasCalendar, slotCount, bookBtnCount });
      
      if (bookBtnCount > 0) {
        await bookBtn.click();
        await page.waitForTimeout(6000);
        const urlAfterBook = page.url();
        await page.screenshot({ path: `${SS_DIR}/05e_after_booking.png`, fullPage: true });
        
        const afterText = await page.locator('body').innerText().catch(() => '');
        console.log('URL after booking:', urlAfterBook);
        console.log('After booking text (500 chars):', afterText.substring(0, 500));
        
        const isConfirmation = urlAfterBook.includes('confirmation') || afterText.toLowerCase().includes('confirmed') || afterText.toLowerCase().includes('booked');
        const isPayment = afterText.toLowerCase().includes('pay') || afterText.toLowerCase().includes('razorpay') || afterText.toLowerCase().includes('demo payment');
        const hasToken = afterText.toLowerCase().includes('token') || afterText.toLowerCase().includes('queue');
        
        results.steps.push({ 
          step: 'After booking', 
          url: urlAfterBook, 
          isConfirmation, 
          isPayment, 
          hasToken,
          text: afterText.substring(0, 300)
        });
        
        console.log('Booking result - Confirmation:', isConfirmation, 'Payment:', isPayment, 'Token:', hasToken);
        
        if (!isConfirmation && !isPayment) {
          results.issues.push('WARNING: Booking did not lead to confirmation or payment page');
        }
        
        // If payment flow, check demo payment
        if (isPayment) {
          const demoPayBtn = page.locator('button:has-text("Demo"), button:has-text("Pay"), button:has-text("Complete Payment")').first();
          const demoCount = await demoPayBtn.count();
          console.log('Demo pay button:', demoCount > 0);
          
          if (demoCount > 0) {
            await demoPayBtn.click();
            await page.waitForTimeout(5000);
            const urlAfterPay = page.url();
            await page.screenshot({ path: `${SS_DIR}/05f_after_payment.png`, fullPage: true });
            const afterPayText = await page.locator('body').innerText().catch(() => '');
            console.log('URL after payment:', urlAfterPay);
            console.log('After payment text:', afterPayText.substring(0, 400));
            results.steps.push({ step: 'After payment', url: urlAfterPay, text: afterPayText.substring(0, 300) });
          }
        }
      }
    }
    
    results.consoleErrors = consoleErrors;
    const criticalIssues = results.issues.filter(i => i.startsWith('CRITICAL'));
    results.finalStatus = criticalIssues.length > 0 ? 'FAIL' : (results.issues.length > 0 ? 'PARTIAL' : 'PASS');
    
  } catch(err) {
    results.error = err.message;
    results.finalStatus = 'FAIL';
    console.error('Fatal error:', err.message);
    await page.screenshot({ path: `${SS_DIR}/05_fatal.png` }).catch(() => {});
  }
  
  await browser.close();
  
  fs.writeFileSync(
    'C:/Users/heart/.gemini/antigravity-ide/brain/8b1a318e-0f09-4ad4-a019-cf3d47055c1f/scratch/workflow5_report.json',
    JSON.stringify(results, null, 2)
  );
  
  console.log('\n=== WORKFLOW 5 FINAL:', results.finalStatus, '===');
  if (results.issues.length > 0) console.log('Issues:', results.issues);
  if (consoleErrors.length > 0) console.log('Console errors:', consoleErrors.slice(0, 5));
}

testWorkflow5().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
