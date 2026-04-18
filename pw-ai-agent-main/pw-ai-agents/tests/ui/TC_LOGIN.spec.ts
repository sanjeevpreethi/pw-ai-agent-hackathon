import { test, expect } from '@playwright/test';

test.describe('User Login Test', () => {
  test('should Test user login functionality', async ({ page }) => {
    await page.goto("http://leaftaps.com/opentaps/control/main", { waitUntil: 'networkidle' });
    await page.locator("input[name='USERNAME']").fill("demosalesmanager", { timeout: 5000 });
    await page.locator("input[name='PASSWORD']").fill("crmsfa", { timeout: 5000 });
    await page.locator("input[type='submit']").click({ timeout: 5000 });

    await expect(page.locator(".dashboard")).toBeVisible();
  });
});