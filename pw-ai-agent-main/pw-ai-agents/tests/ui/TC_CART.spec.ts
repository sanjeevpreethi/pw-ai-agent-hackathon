import { test, expect } from '@playwright/test';

test.describe('Add Item to Cart', () => {
  test('should Test adding items to shopping cart', async ({ page }) => {
    await page.goto("http://example.com/shop", { waitUntil: 'networkidle' });
    await page.locator(".product-item").click({ timeout: 5000 });
    await page.locator("button.add-to-cart").click({ timeout: 5000 });

    await expect(page.locator(".cart-count")).toContainText("1");
  });
});