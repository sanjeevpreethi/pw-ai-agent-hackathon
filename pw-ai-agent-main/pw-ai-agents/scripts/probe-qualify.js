const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('https://leaftaps.com/crmsfa/control/main', { waitUntil: 'domcontentloaded' });
  await page.locator('input[name="USERNAME"], input[name="j_username"], input[type="text"]').first().fill('demosalesmanager');
  await page.locator('input[name="PASSWORD"], input[name="j_password"], input[type="password"]').first().fill('crmsfa');
  await page.getByRole('button', { name: /login/i }).click();

  // Try qualifying a lead and then creating opportunity for it
  // First navigate to a lead view and try to qualify it
  await page.goto('https://leaftaps.com/crmsfa/control/viewLead?partyId=11346', { waitUntil: 'domcontentloaded' });
  const pageContent = await page.content();

  // Look for qualify lead button/link
  const qualifyLink = await page.locator('a:has-text("Qualify"), input[value*="Qualify"], button:has-text("Qualify")').count();
  console.log('Qualify links found:', qualifyLink);

  // Get page URL and check if already on viewContact
  console.log('Current URL:', page.url());

  // Get all links on page for debugging
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a'))
      .filter(a => /qualify|opportunity|contact|account/i.test(a.textContent || a.href))
      .slice(0, 15)
      .map(a => ({ text: (a.textContent || '').trim(), href: a.getAttribute('href') }));
  });
  console.log('Relevant links:', JSON.stringify(links, null, 2));

  await browser.close();
})();
