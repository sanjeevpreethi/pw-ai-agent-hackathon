const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('https://leaftaps.com/crmsfa/control/main', { waitUntil: 'domcontentloaded' });
  await page.locator('input[name="USERNAME"], input[name="j_username"], input[type="text"]').first().fill('demosalesmanager');
  await page.locator('input[name="PASSWORD"], input[name="j_password"], input[type="password"]').first().fill('crmsfa');
  await page.getByRole('button', { name: /login/i }).click();

  // Navigate to accounts main
  await page.goto('https://leaftaps.com/crmsfa/control/accountsMain', { waitUntil: 'domcontentloaded' });
  const html = await page.content();

  // extract all links containing partyId
  const matches = [...html.matchAll(/viewAccount[^"']*partyId=(\d+)/g)];
  const ids = [...new Set(matches.map((m) => m[1]))].slice(0, 10);
  console.log('Account partyIds:', ids);

  // Also probe leads - get qualified leads from opportunitiesMain
  await page.goto('https://leaftaps.com/crmsfa/control/myOpportunities', { waitUntil: 'domcontentloaded' });
  const oppHtml = await page.content();
  const oppLinks = [...oppHtml.matchAll(/viewOpportunity[^"']*salesOpportunityId=(\d+)/g)];
  const oppIds = [...new Set(oppLinks.map((m) => m[1]))].slice(0, 5);
  console.log('Existing opportunity IDs:', oppIds);

  // navigate to myTeams Opportunities and look for account link
  const accountLinks = [...oppHtml.matchAll(/viewAccount[^"']*partyId=(\d+)/g)];
  const accountIdsFromOpps = [...new Set(accountLinks.map((m) => m[1]))].slice(0, 5);
  console.log('Account partyIds from opps page:', accountIdsFromOpps);

  await browser.close();
})();
