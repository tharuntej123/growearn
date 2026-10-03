import { test, expect } from '@playwright/test';

test.describe('Admin End-to-End Browser Flow', () => {
  test('Admin login, platform telemetry inspection, user management & audit logs', async ({ page }) => {
    // 1. Login as Admin
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', 'admin@growearn.com');
    await page.fill('input[type="password"], input[name="password"]', 'Demo1234!');
    await page.click('button[type="submit"]');

    // 2. Verify Admin Dashboard
    await page.waitForURL('**/admin/dashboard', { timeout: 15000 });
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });

    // 3. Inspect User Management
    await page.goto('/admin/users');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });

    // 4. Inspect Audit Logs
    await page.goto('/admin/audit');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
  });
});
