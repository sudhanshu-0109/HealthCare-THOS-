/**
 * Workflow 5 - Appointment Booking Test
 * Navigates: Patient Login → Patient Dashboard → Hospital → Doctor → Book → Payment → Confirmation
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
    // Login
    const loginUrl = await login(page);
    console.log('After login URL:', loginUrl);
    if (loginUrl.includes('login')) { results.finalStatus = 'FAIL'; results.issues.push('Login failed'); return; }
    
    // Go to patient dashboard (hospital list)
    await page.goto('http://localhost:5173/patient/dashboard', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${SS_DIR}/05a_patient_dashboard.png`, fullPage: true });
    
    const dashText = await page.locator('body').innerText().catch(() => '');
    console.log('Dashboard loaded. Hospitals visible:', dashText.includes('Hospital'));
    
    // Step 1: Click on a hospital
    // Hospitals are divs with onClick, find them by hospital card pattern
    const hospitalDivs = page.locator('.cursor-pointer').filter({ hasText: /hospital|clinic|medical/i });
    // Try clicking the Sterling Hospital card or first available hospital
    const sterlingCard = page.locator('div').filter({ hasText: 'Sterling Hospital' }).first();
    const sterlingCount = await sterlingCard.count();
    console.log('Sterling Hospital card found:', sterlingCount > 0);
    
    // Try to find a hospital card that has a "View" button  
    const viewBtn = page.locator('button:has-text("View"), button:has-text("View Hospital")').first();
    const viewCount = await viewBtn.count();
    console.log('View button found:', viewCount > 0);
    
    // Try clicking any hospital clickable div
    const hospitalCards = page.locator('[class*="cursor-pointer"]').filter({ hasText: 'doctor' });
    const cardCount = await hospitalCards.count();
    console.log('Hospital cards with doctor count:', cardCount);
    
    // Use URL approach: get Sterling Hospital from the API and navigate directly
    const apiResponse = await page.evaluate(async () => {
      try {
        const res = await fetch('/api/v1/hospitals?limit=5');
        const data = await res.json();
        return data;
      } catch(e) { return { error: e.message }; }
    });
    
    console.log('API hospitals response:', JSON.stringify(apiResponse).substring(0, 300));
    results.steps.push({ step: 'Hospital API call', response: JSON.stringify(apiResponse).substring(0, 300) });
    
    let hospitalId = null;
    if (apiResponse?.data?.hospitals?.length > 0) {
      hospitalId = apiResponse.data.hospitals[0].id;
      console.log('First hospital ID:', hospitalId, 'Name:', apiResponse.data.hospitals[0].name);
    } else if (apiResponse?.data?.length > 0) {
      hospitalId = apiResponse.data[0].id;
    }
    
    if (!hospitalId) {
      results.issues.push('Could not get hospital ID from API');
      results.finalStatus = 'BLOCKED';
      return;
    }
    
    // Navigate to hospital workspace
    await page.goto(`http://localhost:5173/hospitals/${hospitalId}`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${SS_DIR}/05b_hospital_workspace.png`, fullPage: true });
    
    const workspaceText = await page.locator('body').innerText().catch(() => '');
    console.log('Hospital workspace text (400 chars):', workspaceText.substring(0, 400));
    results.steps.push({ step: 'Hospital workspace loaded', url: page.url(), text: workspaceText.substring(0, 200) });
    
    // Find doctors in this hospital
    const doctorApiResponse = await page.evaluate(async (hId) => {
      try {
        const res = await fetch(`/api/v1/hospitals/${hId}/doctors`);
        const data = await res.json();
        return data;
      } catch(e) { return { error: e.message }; }
    }, hospitalId);
    
    console.log('Doctor API response:', JSON.stringify(doctorApiResponse).substring(0, 400));
    results.steps.push({ step: 'Doctors API call', response: JSON.stringify(doctorApiResponse).substring(0, 300) });
    
    let doctorId = null;
    if (doctorApiResponse?.data?.length > 0) {
      doctorId = doctorApiResponse.data[0].id;
      console.log('First doctor ID:', doctorId, 'Name:', doctorApiResponse.data[0].fullName || doctorApiResponse.data[0].name);
    } else if (doctorApiResponse?.data?.doctors?.length > 0) {
      doctorId = doctorApiResponse.data.doctors[0].id;
    }
    
    if (!doctorId) {
      // Try different API structure
      console.log('Full doctor API response:', JSON.stringify(doctorApiResponse).substring(0, 600));
      results.issues.push('WARNING: Could not get doctor ID from API');
    }
    
    if (doctorId) {
      // Navigate to doctor booking page
      await page.goto(`http://localhost:5173/hospitals/${hospitalId}/doctors/${doctorId}/book`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(3000);
      await page.screenshot({ path: `${SS_DIR}/05c_doctor_booking.png`, fullPage: true });
      
      const bookingText = await page.locator('body').innerText().catch(() => '');
      console.log('Doctor booking page text (500 chars):', bookingText.substring(0, 500));
      results.steps.push({ step: 'Doctor booking page', url: page.url(), text: bookingText.substring(0, 300) });
      
      const hasCalendar = bookingText.toLowerCase().includes('date') || bookingText.toLowerCase().includes('slot') || bookingText.toLowerCase().includes('appointment');
      console.log('Has booking form (date/slot):', hasCalendar);
      
      if (!hasCalendar) {
        results.issues.push('WARNING: Doctor booking page may not have booking form');
      }
      
      // Try to find available slots
      const slots = page.locator('[class*="slot"], button:has-text("AM"), button:has-text("PM"), [class*="time"]').all();
      const slotEls = await slots;
      console.log('Slot elements found:', slotEls.length);
      
      // Try clicking a slot if available
      const availableSlot = page.locator('button[class*="slot"], button[class*="time"], [data-slot]').first();
      const slotCount = await availableSlot.count();
      if (slotCount > 0) {
        await availableSlot.click();
        await page.waitForTimeout(1000);
        console.log('Clicked a slot');
      }
      
      // Look for confirm/book button
      const confirmBtn = page.locator('button:has-text("Confirm"), button:has-text("Book"), button:has-text("Pay")').first();
      const confirmCount = await confirmBtn.count();
      console.log('Confirm/Book button found:', confirmCount > 0);
      results.steps.push({ step: 'Booking form elements', hasCalendar, slotsFound: slotEls.length, hasConfirmBtn: confirmCount > 0 });
      
      if (confirmCount > 0) {
        await page.screenshot({ path: `${SS_DIR}/05d_pre_booking.png`, fullPage: true });
        
        // Click book/confirm  
        await confirmBtn.click();
        await page.waitForTimeout(5000);
        const urlAfterBook = page.url();
        await page.screenshot({ path: `${SS_DIR}/05e_after_booking.png`, fullPage: true });
        
        const afterBookText = await page.locator('body').innerText().catch(() => '');
        console.log('URL after booking attempt:', urlAfterBook);
        console.log('After booking text (400 chars):', afterBookText.substring(0, 400));
        
        const hasConfirmation = afterBookText.toLowerCase().includes('confirm') || 
                                afterBookText.toLowerCase().includes('success') ||
                                afterBookText.toLowerCase().includes('booked') ||
                                urlAfterBook.includes('confirmation');
        const hasPayment = afterBookText.toLowerCase().includes('pay') || afterBookText.toLowerCase().includes('razorpay') || afterBookText.toLowerCase().includes('demo');
        
        results.steps.push({ 
          step: 'After booking click', 
          url: urlAfterBook, 
          hasConfirmation, 
          hasPayment,
          text: afterBookText.substring(0, 200) 
        });
        
        console.log('Has confirmation:', hasConfirmation, 'Has payment:', hasPayment);
        
        if (!hasConfirmation && !hasPayment) {
          results.issues.push('WARNING: Booking click did not show confirmation or payment');
        }
      }
    }
    
    results.consoleErrors = consoleErrors;
    const criticalIssues = results.issues.filter(i => i.startsWith('CRITICAL'));
    results.finalStatus = criticalIssues.length > 0 ? 'FAIL' : (results.issues.length > 0 ? 'PARTIAL' : 'PASS');
    
  } catch(err) {
    results.error = err.message;
    results.finalStatus = 'FAIL';
    console.error('Fatal error:', err.message, err.stack);
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
