const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('https://leaftaps.com/crmsfa/control/main', { waitUntil: 'domcontentloaded' });
  await page.locator('input[name="USERNAME"], input[name="j_username"], input[type="text"]').first().fill('demosalesmanager');
  await page.locator('input[name="PASSWORD"], input[name="j_password"], input[type="password"]').first().fill('crmsfa');
  await page.getByRole('button', { name: /login/i }).click();

  await page.goto('https://leaftaps.com/crmsfa/control/myLeads', { waitUntil: 'domcontentloaded' });

  // Get page title / heading
  const heading = await page.locator('h1, .screenlet-title, .tableheadtext').first().textContent().catch(() => '');
  console.log('Heading:', heading);

  // Discover all viewLead links
  const leadLinks = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a[href*="viewLead"]'));
    return links.map((a) => ({
      text: (a.textContent || '').trim(),
      href: a.getAttribute('href'),
      partyId: (a.getAttribute('href') || '').match(/partyId=(\d+)/)?.[1] || null,
    }));
  });
  console.log('Lead links count:', leadLinks.length);
  console.log('Sample links:', JSON.stringify(leadLinks.slice(0, 5), null, 2));

  // Get table structure
  const tableInfo = await page.evaluate(() => {
    const table = document.querySelector('table');
    if (!table) return 'no table';
    const rows = Array.from(table.querySelectorAll('tr'));
    return rows.slice(0, 3).map((r) => ({
      cells: Array.from(r.querySelectorAll('td, th')).map((c) => (c.textContent || '').trim().substring(0, 40)),
    }));
  });
  console.log('Table rows:', JSON.stringify(tableInfo, null, 2));

  await browser.close();
})();
