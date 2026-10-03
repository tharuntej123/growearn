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
});
