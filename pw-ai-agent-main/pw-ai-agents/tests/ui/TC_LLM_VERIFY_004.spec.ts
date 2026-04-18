import { test, expect } from '@playwright/test';

test.describe('LLM Verification Test 4', () => {
  test('should Verify generation source', async ({ page }) => {
await page.goto("https://example.com", { waitUntil: 'networkidle' });

    await expect(page.locator("body")).toBeVisible();
  });
});