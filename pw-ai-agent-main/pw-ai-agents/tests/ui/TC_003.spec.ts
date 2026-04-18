import { test, expect } from '@playwright/test';

/**
 * TC_003 – CRMSFA Create Lead Flow (End-to-End)
 *
 * Flow:
 *  1. Login as demosalesmanager / crmsfa
 *  2. Navigate directly to the Create Lead form
 *  3. Fill all required fields (company, first name, last name, email, etc.)
 *  4. Submit and assert the URL transitions to viewLead with the created lead's data
 *
 * Generated via MCP-backed backend pipeline; selectors confirmed against
 * real leaftaps.com DOM.
 */
test.describe('CRMSFA - Create Lead Flow (MCP)', () => {
  test('should create a new lead and navigate to viewLead page', async ({ page }) => {
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

    // ── 2. Navigate to Create Lead form ───────────────────────────────────────
    await page.goto('https://leaftaps.com/crmsfa/control/createLeadForm', { waitUntil: 'domcontentloaded' });

    // ── 3. Fill required fields ───────────────────────────────────────────────
    const uniqueSuffix = Date.now();
    const companyName  = `TechVision Solutions ${uniqueSuffix}`;
    const firstName    = 'Michael';
    const lastName     = `Johnson${uniqueSuffix}`;
    const email        = `michael.${uniqueSuffix}@techvision.com`;

    await page.locator('#createLeadForm_companyName').fill(companyName);
    await page.locator('#createLeadForm_firstName').fill(firstName);
    await page.locator('#createLeadForm_lastName').fill(lastName);
    await page.locator('#createLeadForm_primaryEmail').fill(email);

    // Optional but valid fields
    await page.locator('#createLeadForm_departmentName').fill('Business Development').catch(() => { /* optional */ });
    await page.locator('#createLeadForm_description, textarea[name="description"]').fill('Created by TC_003 automation').catch(() => { /* optional */ });

    // ── 4. Submit ─────────────────────────────────────────────────────────────
    await page.locator('input[type="submit"], button[type="submit"]').first().click();
    await page.waitForURL(/viewLead/, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // ── 5. Assertions ─────────────────────────────────────────────────────────
    await expect(page).toHaveURL(/.*viewLead.*/);
    await expect(page.locator('body')).toContainText(firstName);
    await expect(page.locator('body')).toContainText(lastName);
    await expect(page.locator('body')).toContainText(email);
  });
});
