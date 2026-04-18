import { test, expect } from '@playwright/test';

/**
 * TC_004 – CRMSFA Opportunities Navigation (End-to-End)
 *
 * Flow:
 *  1. Login as demosalesmanager / crmsfa
 *  2. Navigate to Opportunities Main page (https://leaftaps.com/crmsfa/control/opportunitiesMain)
 *  3. Collect all viewOpportunity links on the page
 *  4. Pick a random opportunity from the list
 *  5. Click it and assert the URL contains viewOpportunity?salesOpportunityId=<id>
 *  6. Assert the opportunity detail page loads with the expected ID and content
 *
 * Generated via MCP-backed backend pipeline (MCP locator discovery +
 * accessibility-first selectors).
 */
test.describe('CRMSFA - Opportunities Navigation (MCP)', () => {
  test('should navigate to a random opportunity from Opportunities Main and verify viewOpportunity URL', async ({ page }) => {
    test.setTimeout(60000);

    // ── 1. Login ──────────────────────────────────────────────────────────────
    await page.goto('https://leaftaps.com/crmsfa/control/main', { waitUntil: 'domcontentloaded' });

    await page
      .locator('input[name="USERNAME"], input[name="j_username"], input[type="text"]')
      .first()
      .fill('demosalesmanager');
    await page
      .locator('input[name="PASSWORD"], input[name="j_password"], input[type="password"]')
      .first()
      .fill('crmsfa');
    await page.getByRole('button', { name: /login/i }).click();
    await page.waitForLoadState('domcontentloaded');

    // ── 2. Navigate to Opportunities Main ────────────────────────────────────
    await page.goto('https://leaftaps.com/crmsfa/control/opportunitiesMain', { waitUntil: 'domcontentloaded' });

    // ── 3. Collect all viewOpportunity links ──────────────────────────────────
    const opportunityLinks = page.locator('a[href*="viewOpportunity"][href*="salesOpportunityId"]');
    const count = await opportunityLinks.count();
    expect(count, 'Expected at least one opportunity in Opportunities Main list').toBeGreaterThan(0);

    // ── 4. Pick a random opportunity ──────────────────────────────────────────
    const randomIndex = Math.floor(Math.random() * count);
    const chosenLink = opportunityLinks.nth(randomIndex);
    const chosenHref = await chosenLink.getAttribute('href');
    const oppIdMatch = (chosenHref || '').match(/salesOpportunityId=(\d+)/);
    const expectedOppId = oppIdMatch ? oppIdMatch[1] : null;

    expect(expectedOppId, 'Expected salesOpportunityId to be extractable from the opportunity link href').toBeTruthy();

    const opportunityName = (await chosenLink.textContent())?.trim() ?? '';

    // ── 5. Click the opportunity link ─────────────────────────────────────────
    await chosenLink.click();
    await page.waitForURL(/viewOpportunity/, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // ── 6. Assertions ─────────────────────────────────────────────────────────
    // URL must contain viewOpportunity and the exact salesOpportunityId that was clicked
    await expect(page).toHaveURL(new RegExp(`viewOpportunity.*salesOpportunityId=${expectedOppId}`));

    // Page should show the Opportunity section heading
    await expect(page.locator('body')).toContainText('Opportunity');

    // The opportunity name beginning should appear on the detail page
    const firstWord = opportunityName.split(/[\s(]/)[0];
    if (firstWord && firstWord.length > 2) {
      await expect(page.locator('body')).toContainText(firstWord);
    }
  });
});

