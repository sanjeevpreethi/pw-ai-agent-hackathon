import { test, expect } from '@playwright/test';

/**
 * TC_005 – CRMSFA My Leads Navigation (End-to-End)
 *
 * Flow:
 *  1. Login as demosalesmanager
 *  2. Navigate to My Leads page (https://leaftaps.com/crmsfa/control/myLeads)
 *  3. Collect all viewLead links on the page
 *  4. Pick a random lead from the list
 *  5. Click it and assert the URL contains viewLead?partyId=<id>
 *  6. Assert the lead detail page loads with the expected partyId and content
 *
 * Generated via backend /api/v1/scripts/generate (MCP-enabled pipeline)
 * and corrected for real runtime selectors.
 * Accessibility-first selectors; CSS fallbacks used where aria labels absent.
 */
test.describe('CRMSFA - My Leads Navigation (MCP)', () => {
  test('should navigate to a random lead from My Leads page and verify viewLead URL', async ({ page }) => {
    test.setTimeout(60000);

    // ── 1. Login ──────────────────────────────────────────────────────────────
    await page.goto('https://leaftaps.com/crmsfa/control/main', { waitUntil: 'domcontentloaded' });

    // Accessibility: table row labels "Username" and "Password"
    await page
      .locator('input[name="USERNAME"], input[name="j_username"], input[type="text"]')
      .first()
      .fill('demosalesmanager');
    await page
      .locator('input[name="PASSWORD"], input[name="j_password"], input[type="password"]')
      .first()
      .fill('crmsfa');
    await page.getByRole('button', { name: /login/i }).click();

    // ── 2. Navigate to My Leads ───────────────────────────────────────────────
    await page.goto('https://leaftaps.com/crmsfa/control/myLeads', { waitUntil: 'domcontentloaded' });

    // ── 3. Collect all viewLead links ─────────────────────────────────────────
    const leadLinks = page.locator('a[href*="viewLead"][href*="partyId"]');
    const count = await leadLinks.count();
    expect(count, 'Expected at least one lead in My Leads list').toBeGreaterThan(0);

    // ── 4. Pick a random lead ─────────────────────────────────────────────────
    const randomIndex = Math.floor(Math.random() * count);
    const chosenLink = leadLinks.nth(randomIndex);
    const chosenHref = await chosenLink.getAttribute('href');
    const partyIdMatch = (chosenHref || '').match(/partyId=(\d+)/);
    const expectedPartyId = partyIdMatch ? partyIdMatch[1] : null;

    expect(expectedPartyId, 'Expected partyId to be extractable from the lead link href').toBeTruthy();

    const leadName = (await chosenLink.textContent())?.trim() ?? '';

    // ── 5. Click the lead link ────────────────────────────────────────────────
    await chosenLink.click();
    await page.waitForURL(/viewLead/, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // ── 6. Assertions ─────────────────────────────────────────────────────────
    // URL must contain viewLead and the exact partyId that was clicked
    await expect(page).toHaveURL(new RegExp(`viewLead.*partyId=${expectedPartyId}`));

    // Page should show the Lead section heading
    await expect(page.locator('body')).toContainText('Lead');

    // The lead name (truncated in list) beginning should appear on the detail page
    // Extract first word of the lead name for a reliable partial match
    const firstWord = leadName.split(/[\s(]/)[0];
    if (firstWord && firstWord.length > 2) {
      await expect(page.locator('body')).toContainText(firstWord);
    }
  });
});