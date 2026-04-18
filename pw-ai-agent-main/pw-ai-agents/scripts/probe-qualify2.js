const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('https://leaftaps.com/crmsfa/control/main', { waitUntil: 'domcontentloaded' });
  await page.locator('input[name="USERNAME"], input[name="j_username"], input[type="text"]').first().fill('demosalesmanager');
  await page.locator('input[name="PASSWORD"], input[name="j_password"], input[type="password"]').first().fill('crmsfa');
  await page.getByRole('button', { name: /login/i }).click();

  // Navigate to a known lead
  await page.goto('https://leaftaps.com/crmsfa/control/viewLead?partyId=11346', { waitUntil: 'domcontentloaded' });

  // Check qualifyLeadForm details
  const formDetails = await page.evaluate(() => {
    const form = document.querySelector('form[name="qualifyLeadForm"]');
    if (!form) return null;
    return {
      action: form.action,
      method: form.method,
      inputs: Array.from(form.querySelectorAll('input')).map(i => ({
        name: i.name,
        value: i.value,
        type: i.type
      }))
    };
  });
  console.log('qualifyLeadForm:', JSON.stringify(formDetails, null, 2));

  // Click Qualify Lead
  await page.click('a:has-text("Qualify Lead")');
  await page.waitForLoadState('domcontentloaded');
  console.log('After qualify URL:', page.url());

  // Check if it's now showing as contact/person
  const bodyText = (await page.locator('body').innerText()).substring(0, 500);
  console.log('Body snippet:', bodyText);

  await browser.close();
})();
