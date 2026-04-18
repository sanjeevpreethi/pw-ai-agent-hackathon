import { test, expect } from '@playwright/test';

/**
 * TC_002 - CRMSFA User Login + Logout (End-to-End)
 *
 * Flow:
 *  1. Navigate to CRMSFA login page
 *  2. Fill username / password using accessibility-first selectors (MCP-discovered)
 *  3. Click Login and assert successful post-login state
 *  4. Click Logout and assert return to login page
 *
 * Generated via MCP-backed backend pipeline (MCP locator discovery +
 * accessibility-first selectors confirmed against real leaftaps.com DOM).
 */
test.describe('Leaftaps User Login', () => {
  test('should login and logout successfully on leaftaps.com', async ({ page }) => {
    test.setTimeout(60000);

    // 1. Navigate to login page
    await page.goto('https://leaftaps.com/crmsfa/control/main', { waitUntil: 'domcontentloaded' });

    // 2. Fill credentials (MCP accessibility-first selectors)
    await page
      .locator('input[name="USERNAME"], input[name="j_username"], input[type="text"]')
      .first()
      .fill('demosalesmanager');
    await page
      .locator('input[name="PASSWORD"], input[name="j_password"], input[type="password"]')
      .first()
      .fill('crmsfa');

    // 3. Click Login
    await page.getByRole('button', { name: /login/i }).click();
    await page.waitForLoadState('domcontentloaded');

    // 4. Assert logged-in state
    await expect(page).toHaveURL(/.*main.*/);
    const logoutLink = page.getByRole('link', { name: /logout/i });
    await expect(logoutLink).toBeVisible({ timeout: 10000 });

    // 5. Logout
    await logoutLink.click();
    await page.waitForLoadState('domcontentloaded');

    // 6. Assert returned to login/logout page
    await expect(page).toHaveURL(/control\/(main|logout)/);
    // Login button visible again confirms we are logged out
    const loginBtn = page.getByRole('button', { name: /login/i });
    if (await loginBtn.count() > 0) {
      await expect(loginBtn).toBeVisible({ timeout: 10000 });
    } else {
      // On the /logout page the session has been cleared — sufficient proof
      await expect(page.locator('body')).not.toContainText('Sales Manager');
    }
  });
});
