import { test, expect } from '@playwright/test';

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

  test('Public registration rejects ADMIN role', async ({ request }) => {
    const res = await request.post('/api/auth/register', {
      data: {
        name: 'Attacker Admin',
        email: 'attacker-sec@evil.com',
        password: 'AdminPassword123!',
        confirmPassword: 'AdminPassword123!',
        role: 'ADMIN',
      },
    });

    expect(res.status()).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
  });

  test('Cross-role access enforcement redirects or isolates unauthorized resources', async ({ page }) => {
    // 1. Login as Learner
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', 'student@example.com');
    await page.fill('input[type="password"], input[name="password"]', 'Demo1234!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/learner/dashboard', { timeout: 15000 });

    // 2. Learner attempts to access Company dashboard
    await page.goto('/company/dashboard');
    // Middleware should redirect learner to their canonical dashboard or login
    await page.waitForTimeout(1000);
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/company/dashboard');
  });
});
