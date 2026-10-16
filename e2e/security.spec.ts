import { test, expect } from '@playwright/test';
import { loginAsRole } from './auth-helper';

test.describe('Security & Access Control Browser Tests', () => {
  test('Unauthenticated user redirected away from protected routes', async ({ page }) => {
    // Attempt accessing learner dashboard without auth
    await page.goto('/learner/dashboard');
    await page.waitForURL('**/login**', { timeout: 15000 });
    await expect(page).toHaveURL(/login/);

    // Attempt accessing admin dashboard without auth
    await page.goto('/admin/dashboard');
    await page.waitForURL('**/login**', { timeout: 15000 });
    await expect(page).toHaveURL(/login/);
  });

  test('Retired legacy password registration returns HTTP 410 Gone', async ({ request }) => {
    const res = await request.post('/api/auth/register', {
      data: {
        name: 'Attacker Admin',
        email: 'attacker-sec@evil.com',
        password: 'AdminPassword123!',
        confirmPassword: 'AdminPassword123!',
        role: 'ADMIN',
      },
    });

    expect(res.status()).toBe(410);
    const json = await res.json();
    expect(json.success).toBe(false);
  });

  test('Login screen exclusively uses Google OAuth without password inputs', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('text=Continue with Google').first()).toBeVisible({ timeout: 10000 });
    const passwordInputs = page.locator('input[type="password"]');
    await expect(passwordInputs).toHaveCount(0);
  });

  test('Cross-role access enforcement redirects or isolates unauthorized resources', async ({ page, context }) => {
    // 1. Authenticate as Learner
    await loginAsRole(context, 'LEARNER');

    await page.goto('/learner/dashboard');
    await page.waitForURL('**/learner/dashboard', { timeout: 15000 });

    // 2. Learner attempts to access Company dashboard
    await page.goto('/company/dashboard');
    // Middleware should redirect learner to their canonical dashboard
    await page.waitForTimeout(1000);
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/company/dashboard');
    expect(currentUrl).toContain('/learner/dashboard');
  });
});
