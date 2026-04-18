import { test, expect } from '@playwright/test';

test.describe('Login with Discovered Locators', () => {
  test('should Login using dynamically discovered locators', async ({ page }) => {
await page.goto("https://leaftaps.com/opentaps/control/main", { waitUntil: 'networkidle' });
await page.locator("getByTestId('username-input-field')").fill("demosalesmanager", { timeout: 5000 });
await page.locator("getByTestId('password-field')").fill("crmsfa", { timeout: 5000 });
await page.locator("getByTestId('login-button')").click({ timeout: 5000 });

    await expect(page).toHaveURL(/.*dashboard.*/);
  });
});