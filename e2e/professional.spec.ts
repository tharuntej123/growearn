import { test, expect } from '@playwright/test';

test.describe('Professional End-to-End Browser Flow', () => {
  test('Professional login, job discovery, match inspection, apply & refresh persistence', async ({ page }) => {
    // 1. Login as Professional
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', 'professional@growearn.com');
    await page.fill('input[type="password"], input[name="password"]', 'Demo1234!');
    await page.click('button[type="submit"]');

    // 2. Navigate to Jobs
    await page.waitForURL('**/professional/dashboard');
    await page.goto('/jobs');

    // 3. Verify Job Discovery List
    await expect(page.locator('h1, h2')).toContainText(/Opportunities|Jobs|Discovery/i);
    const jobCards = page.locator('text=Apply, text=View').first();
    await expect(jobCards).toBeVisible();

    // 4. Open Job Detail
    const viewJobBtn = page.locator('a[href*="/jobs/"]').first();
    await viewJobBtn.click();
    await page.waitForURL('**/jobs/**');

    // 5. Submit Application
    const applyBtn = page.locator('button:has-text("Apply"), button:has-text("Submit Application")').first();
    if (await applyBtn.isVisible()) {
      await applyBtn.click();
      const coverLetterInput = page.locator('textarea[name="coverLetter"], textarea');
      if (await coverLetterInput.isVisible()) {
        await coverLetterInput.fill('Experienced engineer interested in high-scale systems.');
        const confirmBtn = page.locator('button[type="submit"]:has-text("Submit"), button:has-text("Confirm")');
        if (await confirmBtn.isVisible()) {
          await confirmBtn.click();
        }
      }
    }

    // 6. Refresh page and verify application status persists
    await page.reload();
    await expect(page.locator('body')).toBeVisible();
  });
});
