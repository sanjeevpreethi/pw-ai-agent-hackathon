const { chromium } = require('playwright');

(async () => {
  const leadIds = ['10339', '11164', '11346', '11345', '11344', '11343', '11342'];
  const browser = await chromium.launch({ headless: true });

  for (const id of leadIds) {
    const page = await browser.newPage();
    try {
      await page.goto('https://leaftaps.com/crmsfa/control/main', { waitUntil: 'domcontentloaded' });
      await page.locator('input[name="USERNAME"], input[name="j_username"], input[type="text"]').first().fill('demosalesmanager');
      await page.locator('input[name="PASSWORD"], input[name="j_password"], input[type="password"]').first().fill('crmsfa');
      await page.getByRole('button', { name: /login/i }).click();
      await page.goto('https://leaftaps.com/crmsfa/control/createOpportunityForm', { waitUntil: 'domcontentloaded' });

      const uniqueName = `Probe Deal ${id} ${Date.now()}`;
      await page.locator('#createOpportunityForm_opportunityName').fill(uniqueName);
      await page.locator('#createOpportunityForm_accountPartyId').fill('');
      await page.locator('#createOpportunityForm_leadPartyId').fill(id);
      await page.locator('#createOpportunityForm_estimatedAmount').fill('50000');
      await page.locator('#createOpportunityForm_estimatedCloseDate').fill('12/31/2026');
      await page.locator('input[name="submitButton"]').click();

      await page.waitForLoadState('domcontentloaded');
      const url = page.url();
      if (/viewOpportunity/i.test(url)) {
        console.log(`SUCCESS leadPartyId=${id} url=${url}`);
        await page.close();
        break;
      }

      const bodyText = await page.locator('body').innerText();
      const errorLine = bodyText.split('\n').find((line) => /error|failed|qualified|specify/i.test(line));
      console.log(`FAIL leadPartyId=${id} url=${url} message=${errorLine || 'n/a'}`);
    } catch (error) {
      console.log(`FAIL leadPartyId=${id} exception=${error.message}`);
    } finally {
      await page.close();
    }
  }

  await browser.close();
})();
