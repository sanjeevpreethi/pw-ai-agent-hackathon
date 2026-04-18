import { test, expect } from '@playwright/test';

test.describe('User Login', () => {
  test('should Test user login functionality', async ({ page }) => {
await page.goto("https://example.com/login", { waitUntil: 'networkidle' });
await page.locator("[data-testid='username']").fill("user@example.com", { timeout: 5000 });
await page.locator("[data-testid='password']").fill("password123", { timeout: 5000 });
await page.locator("[data-testid='login-btn']").click({ timeout: 5000 });

    await expect(page).toHaveURL(/.*dashboard.*/);
    await expect(page.locator('body')).toHaveText("Welcome");
  });
});