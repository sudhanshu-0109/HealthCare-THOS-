const { chromium } = require('c:/Users/heart/Desktop/HealthCare+/healthcare-plus/frontend/node_modules/playwright');
const path = require('path');
const fs = require('fs');

const BASE = 'http://localhost:5173';
const VIDEO_DIR = path.resolve('C:/Users/heart/Desktop/HealthCare+/Video');
const REPORT_PDF = path.resolve('C:/Users/heart/Desktop/HealthCare+/healthcare-plus/Sterling_Accuris_Pathology_Report.pdf');

// Helper to pause execution with deliberate demo pacing
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log('====================================================');
  console.log(' HEALTHCARE+ — FINAL SIH PRODUCT DEMO RECORDING');
  console.log('====================================================');

  if (!fs.existsSync(VIDEO_DIR)) {
    fs.mkdirSync(VIDEO_DIR, { recursive: true });
  }

  const browser = await chromium.launch({
    headless: true, // running headless in environment with virtual screen
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--window-size=1280,720',
    ]
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: {
      dir: VIDEO_DIR,
      size: { width: 1280, height: 720 }
    },
    permissions: ['geolocation'],
    geolocation: { latitude: 22.3072, longitude: 73.1812 }, // Real Vadodara coordinates
  });

  const page = await context.newPage();

  // Helper for human-like typing
  async function typeHuman(selector, text) {
    await page.click(selector);
    await page.fill(selector, '');
    for (const char of text) {
      await page.type(selector, char, { delay: 30 });
    }
  }

  // Helper for logging in via UI role tabs
  async function loginAs(roleText, email, password = 'Password123!') {
    console.log(`[AUTH] Switching to ${roleText} (${email})...`);
    await page.evaluate(() => {
      try {
        sessionStorage.clear();
        localStorage.clear();
      } catch (e) {}
    }).catch(() => {});
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
    await sleep(600);

    const roleBtn = page.locator('button').filter({ hasText: new RegExp(`^${roleText}$`, 'i') }).first();
    if (await roleBtn.count() > 0) {
      await roleBtn.click();
      await sleep(400);
    }
    
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);

    await sleep(400);
    const submitBtn = page.locator('button[type="submit"]').first();
    await submitBtn.click();
    await sleep(2200);
  }

  try {
    // ══════════════════════════════════════════════════════════════
    // 01 — OPENING: HEALTHCARE+ LANDING (14s)
    // ══════════════════════════════════════════════════════════════
    console.log('>>> [01] OPENING: Healthcare+ Landing Page...');
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
    await sleep(3500);

    // Smooth scroll down to highlight the 3 core pillars
    await page.evaluate(() => window.scrollBy({ top: 450, behavior: 'smooth' }));
    await sleep(4000);
    await page.evaluate(() => window.scrollBy({ top: -450, behavior: 'smooth' }));
    await sleep(3500);

    // Click Login / Get Started
    const loginNav = page.locator('a, button').filter({ hasText: /Login|Sign in|Get Started/i }).first();
    if (await loginNav.count() > 0) {
      await loginNav.click();
    } else {
      await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
    }
    await sleep(1500);

    // ══════════════════════════════════════════════════════════════
    // 02 — PATIENT LOGIN + HEALTH HUB (14s)
    // ══════════════════════════════════════════════════════════════
    console.log('>>> [02] Patient Login & Unified Health Hub...');
    await page.click('button:has-text("Patient")');
    await sleep(500);
    await page.fill('input[type="email"]', 'patient@healthcareplus.dev');
    await page.fill('input[type="password"]', 'Password123!');
    await sleep(400);
    await page.click('button[type="submit"]');
    await sleep(2500);

    // Open Health Hub
    await page.goto(`${BASE}/health-hub`, { waitUntil: 'networkidle' });
    await sleep(4000);

    // Hover over the 3 ecosystem pillars
    const cards = page.locator('a, div').filter({ hasText: /Hospital Care|Mental Wellness|Physical Health/i });
    if (await cards.count() > 0) {
      await cards.first().hover();
      await sleep(1500);
    }
    await sleep(2500);

    // ══════════════════════════════════════════════════════════════
    // 03 — HOSPITAL + DOCTOR DISCOVERY (18s)
    // ══════════════════════════════════════════════════════════════
    console.log('>>> [03] Hospital & Doctor Discovery in Vadodara...');
    await page.goto(`${BASE}/hospitals`, { waitUntil: 'networkidle' });
    await sleep(3000);

    // Smooth scroll through verified hospitals
    await page.evaluate(() => window.scrollBy({ top: 350, behavior: 'smooth' }));
    await sleep(3000);

    // Select Sterling Hospital
    const sterlingBtn = page.locator('text=Sterling Hospital').first();
    if (await sterlingBtn.count() > 0) {
      await sterlingBtn.click();
    } else {
      await page.goto(`${BASE}/hospitals/hosp-sterling`, { waitUntil: 'networkidle' });
    }
    await sleep(3500);

    // Navigate to Dr. Anil Shah's booking screen
    const bookDoctorBtn = page.locator('button, a').filter({ hasText: /Book Appointment|Book Consultation/i }).first();
    if (await bookDoctorBtn.count() > 0) {
      await bookDoctorBtn.click();
    } else {
      await page.goto(`${BASE}/hospitals/hosp-sterling/doctors/561d55b4-a845-459e-83b7-cc9dad6cfcc3/book`, { waitUntil: 'networkidle' });
    }
    await sleep(3000);

    // ══════════════════════════════════════════════════════════════
    // 04 — APPOINTMENT BOOKING — REAL BOOKING IN VIDEO (30s)
    // ══════════════════════════════════════════════════════════════
    console.log('>>> [04] Live Real Database Appointment Booking...');
    // Slot selection: find an enabled slot (e.g. 10:00 AM, 10:15 AM)
    const slotButtons = page.locator('button').filter({ hasText: /(?:AM|PM)/ });
    const slotCount = await slotButtons.count();
    let bookedSlotTime = '10:00 AM';

    for (let i = 0; i < slotCount; i++) {
      const btn = slotButtons.nth(i);
      const disabled = await btn.isDisabled();
      if (!disabled) {
        bookedSlotTime = await btn.innerText();
        console.log(`Selecting open slot: ${bookedSlotTime}`);
        await btn.click();
        await sleep(1500);
        break;
      }
    }

    // Step 2: Continue to Consultation Mode
    const continueBtn = page.locator('button:has-text("Continue")').first();
    await continueBtn.click();
    await sleep(2000);

    // Step 3: Select In-Person Consultation
    const inPersonBtn = page.locator('button').filter({ hasText: /In-Person|Classic/i }).first();
    await inPersonBtn.click();
    await sleep(2000);

    // Step 4: Proceed to Payment
    const proceedPayBtn = page.locator('button:has-text("Proceed to Payment")').first();
    await proceedPayBtn.click();
    await sleep(2500);

    // Step 5: Click Pay (instant verification < 60ms)
    const payBtn = page.locator('button').filter({ hasText: /Pay ₹/i }).first();
    await payBtn.click();
    await sleep(3500);

    // Hold on "Appointment Confirmed!" modal (Hero Moment)
    console.log('Holding on confirmed booking modal with Queue Token...');
    await sleep(5500);

    // ══════════════════════════════════════════════════════════════
    // 05 — PATIENT APPOINTMENTS (14s)
    // ══════════════════════════════════════════════════════════════
    console.log('>>> [05] Patient Appointments View...');
    const dashBtn = page.locator('button:has-text("Go to Dashboard")').first();
    if (await dashBtn.count() > 0) {
      await dashBtn.click();
      await sleep(1500);
    }
    await page.goto(`${BASE}/patient/appointments`, { waitUntil: 'networkidle' });
    await sleep(4000);

    // Showcase confirmed appointment with Dr. Anil Shah and Queue Token
    await page.evaluate(() => window.scrollBy({ top: 200, behavior: 'smooth' }));
    await sleep(3500);
    await page.evaluate(() => window.scrollBy({ top: -200, behavior: 'smooth' }));
    await sleep(2000);

    // ══════════════════════════════════════════════════════════════
    // 06 — LIVE OPD QUEUE — HERO (40s)
    // ══════════════════════════════════════════════════════════════
    console.log('>>> [06] LIVE OPD Queue Hero — Realtime Synchronized...');
    // Patient opens Live Queue Tracker
    const viewQueueBtn = page.locator('button, a').filter({ hasText: /View Queue/i }).first();
    if (await viewQueueBtn.count() > 0) {
      await viewQueueBtn.click();
      await sleep(4500);
    }

    // Switch to Doctor session
    await loginAs('Doctor', 'dr.anil.shah@sterling.dev');
    await page.goto(`${BASE}/doctor/queue`, { waitUntil: 'networkidle' });
    await sleep(4000);

    // Doctor calls next or progresses consult
    const startConsultBtn = page.locator('button:has-text("Start Consult")').first();
    const completeNextBtn = page.locator('button:has-text("Complete & Next")').first();
    const callNextBtn = page.locator('button').filter({ hasText: /Call Next/i }).first();

    if (await startConsultBtn.count() > 0) {
      console.log('Doctor starting consult...');
      await startConsultBtn.click();
      await sleep(2500);
    } else if (await completeNextBtn.count() > 0) {
      console.log('Doctor completing & moving to next...');
      await completeNextBtn.click();
      await sleep(2500);
    } else if (await callNextBtn.count() > 0) {
      console.log('Doctor calling next patient...');
      await callNextBtn.click();
      await sleep(2500);
    }
    await sleep(3500);

    // Switch back to Patient session
    await loginAs('Patient', 'patient@healthcareplus.dev');
    await page.goto(`${BASE}/patient/appointments`, { waitUntil: 'networkidle' });
    await sleep(2500);
    const viewQueueBtn2 = page.locator('button, a').filter({ hasText: /View Queue/i }).first();
    if (await viewQueueBtn2.count() > 0) {
      await viewQueueBtn2.click();
    }
    // Hold on patient's synchronized queue tracker (Hero moment)
    console.log('Holding on synchronized live queue tracker...');
    await sleep(5000);

    // ══════════════════════════════════════════════════════════════
    // 07 — LITE / FRACTIONAL APPOINTMENT WORKFLOW (22s)
    // ══════════════════════════════════════════════════════════════
    console.log('>>> [07] Lite / Fractional Appointment Concept (T-3.5)...');
    await loginAs('Doctor', 'dr.anil.shah@sterling.dev');
    await page.goto(`${BASE}/doctor/queue`, { waitUntil: 'networkidle' });
    await sleep(3000);

    // Smooth scroll down to waiting queue list showing fractional token (T-3.5)
    await page.evaluate(() => window.scrollBy({ top: 350, behavior: 'smooth' }));
    await sleep(3500);
    
    // Highlight fractional follow-up token
    const fracToken = page.locator('text=T-3.5').first();
    if (await fracToken.count() > 0) {
      console.log('Found fractional token T-3.5!');
      await fracToken.hover();
      await sleep(3000);
    }
    await sleep(2000);
    await page.evaluate(() => window.scrollBy({ top: -350, behavior: 'smooth' }));
    await sleep(1500);

    // ══════════════════════════════════════════════════════════════
    // 08 — DOCTOR CONSULTATION (20s)
    // ══════════════════════════════════════════════════════════════
    console.log('>>> [08] Doctor Consultation OS & E-Prescription...');
    const startConsult2 = page.locator('button:has-text("Start Consult")').first();
    if (await startConsult2.count() > 0) {
      await startConsult2.click();
      await sleep(2000);
    }

    // Click Prescribe
    const prescribeBtn = page.locator('button:has-text("Prescribe")').first();
    if (await prescribeBtn.count() > 0) {
      await prescribeBtn.click();
      await sleep(2000);

      // Add prescription details
      const notesArea = page.locator('textarea').first();
      if (await notesArea.count() > 0) {
        await typeHuman('textarea', 'Patient presents with mild fatigue and blood pressure review. Recommended lifestyle modifications and follow-up.');
        await sleep(1500);
      }

      const saveRxBtn = page.locator('button').filter({ hasText: /Save Prescription|Create Prescription|Issue/i }).first();
      if (await saveRxBtn.count() > 0) {
        await saveRxBtn.click();
        await sleep(2500);
      }
    }
    await sleep(2000);

    // ══════════════════════════════════════════════════════════════
    // 09 — PRESCRIPTION → PHARMACY (20s)
    // ══════════════════════════════════════════════════════════════
    console.log('>>> [09] Pharmacy Staff Order Fulfillment...');
    await loginAs('Pharmacist', 'pharmacist@sterling.dev');
    await page.goto(`${BASE}/pharmacy/dashboard`, { waitUntil: 'networkidle' });
    await sleep(3500);

    // Show orders list and advance preparing orders
    const actionBtn = page.locator('button').filter({ hasText: /Prepare|Hand Over|Confirm|Accept|Complete/i }).first();
    if (await actionBtn.count() > 0) {
      await actionBtn.click();
      await sleep(3000);
    }
    await sleep(3000);

    // ══════════════════════════════════════════════════════════════
    // 10 — DOCTOR → LAB REQUEST (16s)
    // ══════════════════════════════════════════════════════════════
    console.log('>>> [10] Doctor Creates Laboratory Request...');
    await loginAs('Doctor', 'dr.anil.shah@sterling.dev');
    await page.goto(`${BASE}/doctor/queue`, { waitUntil: 'networkidle' });
    await sleep(2500);

    const labReqBtn = page.locator('button:has-text("Lab Request")').first();
    if (await labReqBtn.count() > 0) {
      await labReqBtn.click();
      await sleep(2000);

      // Expand category and pick test
      const catBtn = page.locator('button').filter({ hasText: /Biochemistry|Hematology|General/i }).first();
      if (await catBtn.count() > 0) {
        await catBtn.click();
        await sleep(1000);
      }

      const testBtn = page.locator('button').filter({ hasText: /Hemoglobin|Creatinine|Complete Blood Count|Lipid/i }).first();
      if (await testBtn.count() > 0) {
        await testBtn.click();
        await sleep(1000);
      }

      // Enter clinical note
      const clinicalNotes = page.locator('textarea').first();
      if (await clinicalNotes.count() > 0) {
        await typeHuman('textarea', 'Evaluate baseline lipid profile and complete blood count.');
        await sleep(1000);
      }

      const submitLabBtn = page.locator('button').filter({ hasText: /Create Lab Request|Submit Request|Send Request/i }).first();
      if (await submitLabBtn.count() > 0) {
        await submitLabBtn.click();
        await sleep(2500);
      }
    }
    await sleep(2000);

    // ══════════════════════════════════════════════════════════════
    // 11 — LAB WORKFLOW + PROVIDED REPORT FILE — HERO (40s)
    // ══════════════════════════════════════════════════════════════
    console.log('>>> [11] Lab Staff Processes Request & Uploads Provided PDF...');
    await loginAs('Lab Staff', 'labstaff@sterling.dev');
    await page.goto(`${BASE}/lab/dashboard`, { waitUntil: 'networkidle' });
    await sleep(3500);

    // Switch to Processing tab
    const procTab = page.locator('button').filter({ hasText: /^Processing/i }).first();
    if (await procTab.count() > 0) {
      await procTab.click();
      await sleep(2000);
    }

    // Click Upload Report
    const uploadReportBtn = page.locator('button').filter({ hasText: /Upload Report/i }).first();
    if (await uploadReportBtn.count() > 0) {
      await uploadReportBtn.click();
      await sleep(2500);

      // Locate the UploadReportModal specifically
      const modal = page.locator('.fixed.inset-0').last();

      // UPLOAD THE EXACT USER-PROVIDED LAB REPORT FILE!
      const fileInput = modal.locator('input[type="file"]').first();
      if (await fileInput.count() > 0) {
        console.log(`Uploading provided lab report PDF: ${REPORT_PDF}`);
        await fileInput.setInputFiles(REPORT_PDF);
        await sleep(2000);
      }

      // Summary text
      const summaryInput = modal.locator('textarea').first();
      if (await summaryInput.count() > 0) {
        await summaryInput.fill('Sterling Accuris Pathology Lab Report: Hematology and biochemistry markers within normal limits.');
        await sleep(1500);
      }

      // Submit upload inside modal
      const submitUpload = modal.locator('button.bg-cyan-600').filter({ hasText: /Upload Report/i }).first();
      if (await submitUpload.count() > 0) {
        console.log('Submitting report inside modal...');
        await submitUpload.click();
        await sleep(4000);
      }

      // Close modal if still visible
      const closeBtn = modal.locator('button:has-text("Close Modal")').first();
      if (await closeBtn.count() > 0 && await closeBtn.isVisible()) {
        await closeBtn.click();
        await sleep(1000);
      }
    }

    // Switch to Patient to view uploaded report
    console.log('Switching to Patient to verify delivered lab report...');
    await loginAs('Patient', 'patient@healthcareplus.dev');
    await page.goto(`${BASE}/patient/lab`, { waitUntil: 'networkidle' });
    await sleep(4500);
    // Hold on delivered lab report (Hero moment)
    console.log('Holding on delivered lab report in Patient view...');
    await sleep(4500);

    // ══════════════════════════════════════════════════════════════
    // 12 — HEALTHCARE PASSPORT / MEDICAL TIMELINE (16s)
    // ══════════════════════════════════════════════════════════════
    console.log('>>> [12] Patient Healthcare Passport & Unified Care Timeline...');
    await page.goto(`${BASE}/patient/passport`, { waitUntil: 'networkidle' });
    await sleep(3500);

    // Open Timeline
    await page.goto(`${BASE}/patient/timeline`, { waitUntil: 'networkidle' });
    await sleep(3500);
    await page.evaluate(() => window.scrollBy({ top: 300, behavior: 'smooth' }));
    await sleep(3500);
    await page.evaluate(() => window.scrollBy({ top: -300, behavior: 'smooth' }));
    await sleep(2000);

    // ══════════════════════════════════════════════════════════════
    // 13 — MENTAL WELLNESS (10s)
    // ══════════════════════════════════════════════════════════════
    console.log('>>> [13] Mental Wellness Hub & Daily Check-in...');
    await page.goto(`${BASE}/health-hub/mental-wellness`, { waitUntil: 'networkidle' });
    await sleep(3000);

    // Select mood
    const goodMoodBtn = page.locator('button').filter({ hasText: /Good|Thriving|Calm/i }).first();
    if (await goodMoodBtn.count() > 0) {
      await goodMoodBtn.click();
      await sleep(1500);
    }

    const checkInBtn = page.locator('button:has-text("Submit Check-In")').first();
    if (await checkInBtn.count() > 0) {
      await checkInBtn.click();
      await sleep(2500);
    }
    await sleep(2000);

    // ══════════════════════════════════════════════════════════════
    // 14 — PHYSICAL HEALTH (10s)
    // ══════════════════════════════════════════════════════════════
    console.log('>>> [14] Physical Health & Activity Tracking...');
    await page.goto(`${BASE}/health-hub/physical-health`, { waitUntil: 'networkidle' });
    await sleep(3500);

    // Scroll slightly to view workout schedule and metrics
    await page.evaluate(() => window.scrollBy({ top: 250, behavior: 'smooth' }));
    await sleep(3500);
    await page.evaluate(() => window.scrollBy({ top: -250, behavior: 'smooth' }));
    await sleep(1500);

    // ══════════════════════════════════════════════════════════════
    // 15 — EMERGENCY SOS — MAJOR HERO SECTION (65s)
    // ══════════════════════════════════════════════════════════════
    console.log('>>> [15] EMERGENCY SOS HERO — Real Geolocation & Ambulance Tracking...');
    await page.goto(`${BASE}/patient/dashboard`, { waitUntil: 'networkidle' });
    await sleep(3000);

    // Find the SOS button on home tab
    const sosBtn = page.locator('button').filter({ hasText: /SOS/i }).first();
    if (await sosBtn.count() > 0) {
      console.log('Holding SOS button for 3.2 seconds physically...');
      const box = await sosBtn.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await sleep(3200); // 3.2-second physical hold
        await page.mouse.up();
      }
      await sleep(1500);

      // Confirm SOS modal appears
      const confirmSosBtn = page.locator('button').filter({ hasText: /Yes, Send SOS|Confirm/i }).first();
      if (await confirmSosBtn.count() > 0) {
        console.log('Confirming Emergency SOS with real device coordinates...');
        await confirmSosBtn.click();
        await sleep(3500);
      }
    }

    // Patient is now on live tracking screen or dispatching
    console.log('Emergency dispatch initiated with real device coordinates (22.3072, 73.1812)!');
    await sleep(4500);

    // Switch to Ambulance Driver to accept the emergency
    console.log('Ambulance Driver receives incoming emergency alert...');
    await loginAs('Ambulance Driver', 'driver@sterling.dev');
    await page.goto(`${BASE}/driver/dashboard`, { waitUntil: 'networkidle' });
    await sleep(3500);

    // Driver accepts
    const acceptEmergencyBtn = page.locator('button:has-text("Accept")').first();
    if (await acceptEmergencyBtn.count() > 0) {
      console.log('Ambulance driver accepted emergency request!');
      await acceptEmergencyBtn.click();
      await sleep(3000);
    }

    // Driver updates status to En Route
    const enRouteBtn = page.locator('button').filter({ hasText: /En Route/i }).first();
    if (await enRouteBtn.count() > 0) {
      console.log('Ambulance driver marked En Route!');
      await enRouteBtn.click();
      await sleep(3000);
    }
    await sleep(3000);

    // Switch back to Patient to view live map tracking with driver assigned
    console.log('Patient viewing live ambulance map tracking...');
    await loginAs('Patient', 'patient@healthcareplus.dev');
    await page.goto(`${BASE}/patient/dashboard`, { waitUntil: 'networkidle' });
    await sleep(2500);

    // Navigate to emergency tracking tab if needed
    const emergTab = page.locator('button, a').filter({ hasText: /Emergency/i }).first();
    if (await emergTab.count() > 0) {
      await emergTab.click();
      await sleep(2500);
    }
    // Hold on Live Emergency Tracking Map (Major Hero Moment)
    console.log('Holding on live emergency tracking map...');
    await sleep(7000);

    // ══════════════════════════════════════════════════════════════
    // 16 — HOSPITAL ADMIN OPERATIONAL VIEW (20s)
    // ══════════════════════════════════════════════════════════════
    console.log('>>> [16] Hospital Admin Operations & Realtime Monitoring...');
    await loginAs('Hospital Admin', 'admin@sterling.dev');
    await page.goto(`${BASE}/admin/dashboard`, { waitUntil: 'networkidle' });
    await sleep(4000);

    // Sweep: Queue Monitor tab
    const queueTab = page.locator('button').filter({ hasText: /Queue/i }).first();
    if (await queueTab.count() > 0) {
      await queueTab.click();
      await sleep(3000);
    }

    // Sweep: Doctors tab
    const docTab = page.locator('button').filter({ hasText: /Doctors/i }).first();
    if (await docTab.count() > 0) {
      await docTab.click();
      await sleep(3000);
    }

    // Sweep: Billing tab
    const billTab = page.locator('button').filter({ hasText: /Billing/i }).first();
    if (await billTab.count() > 0) {
      await billTab.click();
      await sleep(3000);
    }

    // ══════════════════════════════════════════════════════════════
    // 17 — MULTI-TENANCY (14s)
    // ══════════════════════════════════════════════════════════════
    console.log('>>> [17] Multi-Tenant Healthcare Ecosystem...');
    await page.goto(`${BASE}/hospitals`, { waitUntil: 'networkidle' });
    await sleep(4000);
    await page.evaluate(() => window.scrollBy({ top: 350, behavior: 'smooth' }));
    await sleep(3500);
    await page.evaluate(() => window.scrollBy({ top: -350, behavior: 'smooth' }));
    await sleep(2500);

    // ══════════════════════════════════════════════════════════════
    // 18 — FINAL CONNECTED ECOSYSTEM SHOT (6s)
    // ══════════════════════════════════════════════════════════════
    console.log('>>> [18] Final Connected Ecosystem Hero Shot...');
    await page.goto(`${BASE}/health-hub`, { waitUntil: 'networkidle' });
    await sleep(5000);

    console.log('>>> RECORDING COMPLETED SUCCESSFULLY! <<<');
  } catch (err) {
    console.error('Recording error occurred:', err);
    throw err;
  } finally {
    console.log('Finalizing video file...');
    await page.close();
    await context.close();
    await browser.close();

    // Locate the recorded video in VIDEO_DIR and rename to final name
    const files = fs.readdirSync(VIDEO_DIR).filter(f => f.endsWith('.webm'));
    if (files.length > 0) {
      // Find the newest webm file that is NOT already the target
      const candidateFiles = files.filter(f => f !== 'Healthcare-Plus-Final-Demo.webm');
      const sortList = candidateFiles.length > 0 ? candidateFiles : files;
      sortList.sort((a, b) => fs.statSync(path.join(VIDEO_DIR, b)).mtimeMs - fs.statSync(path.join(VIDEO_DIR, a)).mtimeMs);
      
      const latestVideo = path.join(VIDEO_DIR, sortList[0]);
      const finalWebm1 = path.join(VIDEO_DIR, 'Healthcare-Plus-Final-Demo.webm');
      const finalWebm2 = path.resolve('C:/Users/heart/Desktop/HealthCare+/healthcare-plus/Video/Healthcare-Plus-Final-Demo.webm');

      const videoDir2 = path.dirname(finalWebm2);
      if (!fs.existsSync(videoDir2)) {
        fs.mkdirSync(videoDir2, { recursive: true });
      }

      console.log(`Copying video ${latestVideo} -> ${finalWebm1}`);
      fs.copyFileSync(latestVideo, finalWebm1);
      console.log(`Copying video ${latestVideo} -> ${finalWebm2}`);
      fs.copyFileSync(latestVideo, finalWebm2);

      const stats = fs.statSync(finalWebm1);
      console.log(`FINAL VIDEO CREATED: ${finalWebm1} (${(stats.size / (1024 * 1024)).toFixed(2)} MB)`);
    } else {
      console.error('No webm video found in directory!');
    }
  }
}

main().catch(err => {
  console.error('Fatal error during demo recording:', err);
  process.exit(1);
});
