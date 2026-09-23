/**
 * Workflow 1 - Landing Page Test (CommonJS)
 */
const { chromium } = require('playwright');
const fs = require('fs');

const SCREENSHOTS_DIR = 'C:/Users/heart/.gemini/antigravity-ide/brain/8b1a318e-0f09-4ad4-a019-cf3d47055c1f/scratch/screenshots';
fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

async function testWorkflow1() {
  let browser;
  try {
    browser = await chromium.launch({ 
      headless: true,
      executablePath: 'C:/Users/heart/AppData/Local/ms-playwright/chromium-1234/chrome-win/chrome.exe'
    });
  } catch(e) {
    // Try without explicit path
    browser = await chromium.launch({ headless: true });
  }
  
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  
  const consoleErrors = [];
  const consoleWarnings = [];
  page.on('console', msg => {
    const txt = msg.text();
    if (msg.type() === 'error') consoleErrors.push(txt);
    if (msg.type() === 'warning') consoleWarnings.push(txt);
  });
  
  const networkErrors = [];
  page.on('requestfailed', req => {
    networkErrors.push(`${req.method()} ${req.url()} - ${req.failure()?.errorText}`);
  });
  
  const results = { workflow: 'Workflow 1 - Landing Page', timestamp: new Date().toISOString(), steps: [] };

  try {
    console.log('Step 1: Opening http://localhost:5173...');
    const response = await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 30000 });
    results.steps.push({ step: 'Open landing page', status: 'OK', httpStatus: response?.status() });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/01_landing_initial.png`, fullPage: true });
    console.log('Screenshot 1 saved');
    
    const title = await page.title();
    console.log('Page title:', title);
    results.steps.push({ step: 'Page title', value: title });
    
    // Check key elements
    const bodyText = await page.locator('body').innerText().catch(() => '');
    console.log('Body text (first 800 chars):', bodyText.substring(0, 800));
    results.steps.push({ step: 'Body text preview', value: bodyText.substring(0, 800) });
    
    const elements = {
      header_count: await page.locator('header').count(),
      nav_count: await page.locator('nav').count(),
      login_links: await page.locator('a[href*="login"], button:has-text("Login"), a:has-text("Login")').count(),
      get_started: await page.locator(':has-text("Get Started")').count(),
      hospital_care: await page.locator(':has-text("Hospital Care")').count(),
      mental_wellness: await page.locator(':has-text("Mental Wellness")').count(),
      physical_health: await page.locator(':has-text("Physical")').count(),
      emergency: await page.locator(':has-text("Emergency"), :has-text("SOS")').count(),
      footer: await page.locator('footer').count(),
    };
    console.log('Elements:', JSON.stringify(elements, null, 2));
    results.steps.push({ step: 'Elements found', elements });
    
    // Try clicking Login
    const loginBtn = page.locator('a[href*="login"], button:has-text("Login"), a:has-text("Login")').first();
    const loginCount = await loginBtn.count();
    if (loginCount > 0) {
      await loginBtn.click();
      await page.waitForTimeout(2000);
      const afterClickUrl = page.url();
      await page.screenshot({ path: `${SCREENSHOTS_DIR}/02_after_login_click.png`, fullPage: true });
      console.log('After login click URL:', afterClickUrl);
      results.steps.push({ step: 'Login button click', status: 'OK', url: afterClickUrl });
      await page.goBack();
      await page.waitForTimeout(1000);
    } else {
      results.steps.push({ step: 'Login button', status: 'NOT FOUND' });
    }
    
    // Get all visible links
    const links = await page.locator('a[href]').all();
    const linkData = [];
    for (const link of links.slice(0, 15)) {
      try {
        const href = await link.getAttribute('href');
        const text = (await link.innerText().catch(() => '')).trim().substring(0, 40);
        linkData.push({ href, text });
      } catch(e) {}
    }
    console.log('Links found:', JSON.stringify(linkData, null, 2));
    results.steps.push({ step: 'Links found', links: linkData });
    
    results.consoleErrors = consoleErrors;
    results.consoleWarnings = consoleWarnings.slice(0, 10);
    results.networkErrors = networkErrors.filter(e => !e.includes('favicon'));
    results.finalStatus = (consoleErrors.length === 0 && results.networkErrors.length === 0) ? 'PASS' : 'REVIEW';
    
  } catch (err) {
    results.error = err.message;
    results.finalStatus = 'FAIL';
    console.error('Test error:', err.message);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/01_error.png` }).catch(() => {});
  }
  
  await browser.close();
  
  const reportPath = 'C:/Users/heart/.gemini/antigravity-ide/brain/8b1a318e-0f09-4ad4-a019-cf3d47055c1f/scratch/workflow1_report.json';
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log('\n=== FINAL STATUS:', results.finalStatus, '===');
  console.log('Console errors:', consoleErrors.length);
  if (consoleErrors.length > 0) console.log('Errors:', consoleErrors.slice(0, 5));
  console.log('Network errors:', results.networkErrors.length);
}

testWorkflow1().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
