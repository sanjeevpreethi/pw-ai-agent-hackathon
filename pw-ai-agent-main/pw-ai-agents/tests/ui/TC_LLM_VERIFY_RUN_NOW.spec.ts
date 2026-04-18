import { test, expect } from '@playwright/test';

test.describe('LLM Verification Run Now', () => {
  test('should Run now verification', async ({ page }) => {
await page.goto("https://example.com", { waitUntil: 'networkidle' });

    await expect(page.locator("body")).toBeVisible();
  });
});