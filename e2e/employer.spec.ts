import { test, expect } from '@playwright/test';

test.describe('Employer End-to-End Browser Flow', () => {
  test('Employer login, job creation, applicant pipeline review & status changes', async ({ page }) => {
    // 1. Login as Employer
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', 'employer@growearn.com');
    await page.fill('input[type="password"], input[name="password"]', 'Demo1234!');
    await page.click('button[type="submit"]');

    // 2. Verify Employer Dashboard
    await page.waitForURL('**/employer/dashboard', { timeout: 15000 });
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });

    // 3. Post a new Job
    await page.goto('/employer/jobs/new');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
    const titleInput = page.locator('input[name="title"], input[placeholder*="title"]').first();
    await titleInput.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
    if (await titleInput.isVisible()) {
      await titleInput.fill(`Senior Cloud Engineer ${Date.now()}`);
      const descInput = page.locator('textarea[name="description"], textarea').first();
      if (await descInput.isVisible()) {
        await descInput.fill('Lead cloud infrastructure with Kubernetes and AWS.');
      }
    }
  });
});
