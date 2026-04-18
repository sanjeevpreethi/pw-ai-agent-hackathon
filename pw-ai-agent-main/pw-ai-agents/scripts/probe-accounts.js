const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('https://leaftaps.com/crmsfa/control/main', { waitUntil: 'domcontentloaded' });
  await page.locator('input[name="USERNAME"], input[name="j_username"], input[type="text"]').first().fill('demosalesmanager');
  await page.locator('input[name="PASSWORD"], input[name="j_password"], input[type="password"]').first().fill('crmsfa');
  await page.getByRole('button', { name: /login/i }).click();

  // Search for accounts using performFind query param
  await page.goto('https://leaftaps.com/crmsfa/control/findAccounts?VIEW_SIZE=10&VIEW_INDEX=0&performFind=Y', { waitUntil: 'domcontentloaded' });

  // Extract account links
  const accounts = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a[href*="viewAccount"]'));
    return links.slice(0, 10).map((a) => ({
      text: (a.textContent || '').trim(),
      href: a.getAttribute('href'),
      partyId: (a.getAttribute('href') || '').match(/partyId=(\d+)/)?.[1] || null,
    }));
  });

  console.log('ACCOUNTS:', JSON.stringify(accounts, null, 2));
  await browser.close();
})();
