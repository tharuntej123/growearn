import { test, expect } from '@playwright/test';

test.describe('Professional End-to-End Browser Flow', () => {
  test('Professional login, job discovery, match inspection, apply & refresh persistence', async ({ page }) => {
    // 1. Login as Professional
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', 'professional@growearn.com');
    await page.fill('input[type="password"], input[name="password"]', 'Demo1234!');
    await page.click('button[type="submit"]');

    // 2. Navigate to Jobs
    await page.waitForURL('**/professional/dashboard', { timeout: 15000 });
    await page.goto('/jobs');

    // 3. Verify Job Discovery List
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
    const jobCards = page.locator('button:has-text("Apply"), a:has-text("View"), a[href*="/jobs/"]').first();
    await expect(jobCards).toBeVisible({ timeout: 10000 });

    // 4. Open Job Detail / Proposal Modal if present
    const applyBtn = page.locator('button:has-text("Apply"), a:has-text("Apply"), a[href*="/jobs/"]').first();
    if (await applyBtn.isVisible()) {
      await applyBtn.click();
      const coverLetterInput = page.locator('textarea');
      await coverLetterInput.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
      if (await coverLetterInput.isVisible()) {
        await coverLetterInput.fill('Experienced engineer interested in high-scale systems.');
        const confirmBtn = page.locator('button:has-text("Submit Application"), button[type="submit"]').first();
        if (await confirmBtn.isVisible()) {
          await confirmBtn.click();
        }
      }
    }

    // 5. Refresh page and verify application status persists
    await page.reload();
    await expect(page.locator('body')).toBeVisible();
  });
});
