import { test, expect } from '@playwright/test';
import { loginAsRole } from './auth-helper';

test.describe('Admin End-to-End Browser Flow', () => {
  test('Admin login, platform telemetry inspection, user management & audit logs', async ({ page, context }) => {
    // 1. Authenticate as Admin with verified session
    await loginAsRole(context, 'ADMIN');

    // 2. Verify Admin Dashboard
    await page.goto('/admin/dashboard');
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
