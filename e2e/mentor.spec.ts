import { test, expect } from '@playwright/test';

test.describe('Mentor End-to-End Browser Flow', () => {
  test('Mentor login, dashboard access, request management, and course creation flow', async ({ page }) => {
    // 1. Login as Mentor
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', 'priya.sharma@example.com');
    await page.fill('input[type="password"], input[name="password"]', 'Demo1234!');
    await page.click('button[type="submit"]');

    // 2. Verify Mentor Dashboard
    await page.waitForURL('**/mentor/dashboard', { timeout: 15000 });
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });

    // 3. Navigate to Mentor Requests
    await page.goto('/mentor/requests');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });

    // 4. Navigate to Course Creation Studio
    await page.goto('/mentor/courses/new');
    await expect(page.locator('h1').first()).toContainText('Publish New Engineering Course', { timeout: 10000 });

    // 5. Fill required course fields
    const courseTitle = `Enterprise Cloud Architecture ${Date.now()}`;
    await page.fill('input[placeholder*="Spring Boot"], input[required]', courseTitle);
    await page.fill('textarea[required]', 'Comprehensive guide to building resilient, distributed systems in production.');
    await page.fill('input[placeholder*="Java, Spring"]', 'Java, Distributed Systems, Cloud');

    // 6. Submit course publishing form
    await page.click('button[type="submit"]');

    // 7. Verify redirect to the published course syllabus page
    await page.waitForURL('**/courses/**', { timeout: 20000 });
    await expect(page.locator('h1').first()).toContainText(courseTitle, { timeout: 15000 });
  });
});
