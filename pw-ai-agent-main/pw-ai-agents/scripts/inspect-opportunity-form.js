const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('https://leaftaps.com/crmsfa/control/main', { waitUntil: 'domcontentloaded' });
  await page.locator('input[name="USERNAME"], input[name="j_username"], input[type="text"]').first().fill('demosalesmanager');
  await page.locator('input[name="PASSWORD"], input[name="j_password"], input[type="password"]').first().fill('crmsfa');
  await page.getByRole('button', { name: /login/i }).click();
  await page.goto('https://leaftaps.com/crmsfa/control/createOpportunityForm', { waitUntil: 'domcontentloaded' });

  const labels = await page.locator('label').allTextContents();
  const controls = await page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll('input, select, textarea'));
    return nodes.map((el) => ({
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      name: el.getAttribute('name'),
      type: el.getAttribute('type') || null,
      ariaLabel: el.getAttribute('aria-label') || null,
      placeholder: el.getAttribute('placeholder') || null,
    }));
  });

  console.log('LABELS_START');
  console.log(JSON.stringify(labels, null, 2));
  console.log('LABELS_END');
  console.log('CONTROLS_START');
  console.log(JSON.stringify(controls, null, 2));
  console.log('CONTROLS_END');

  await browser.close();
})();
