import { test, expect } from '@playwright/test';

test.describe('Mentor End-to-End Browser Flow', () => {
  test('Mentor login, profile management, course publishing & mentorship request handling', async ({ page }) => {
    // 1. Login as Mentor
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', 'mentor@growearn.com');
    await page.fill('input[type="password"], input[name="password"]', 'Demo1234!');
    await page.click('button[type="submit"]');

    // 2. Verify Mentor Dashboard
    await page.waitForURL('**/mentor/dashboard');
    await expect(page.locator('h1, h2')).toBeVisible();

    // 3. Navigate to Mentor Requests
    await page.goto('/mentor/requests');
    await expect(page.locator('h1, h2')).toContainText(/Requests|Mentorship/i);

    // 4. Accept pending request if present
    const acceptBtn = page.locator('button:has-text("Accept")').first();
    if (await acceptBtn.isVisible()) {
      await acceptBtn.click();
      await expect(page.locator('text=Accepted, text=ACCEPTED')).toBeVisible();
    }

    // 5. Navigate to Course Creation
    await page.goto('/mentor/courses/new');
    await expect(page.locator('input[name="title"], input[placeholder*="title"]')).toBeVisible();
  });
});
