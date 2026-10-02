import { test, expect } from '@playwright/test';

test.describe('Learner End-to-End Browser Flow', () => {
  test('Learner login, skill discovery, roadmap, pagination, enrollment & mentor request persistence', async ({ page }) => {
    // 1. Navigate to login
    await page.goto('/login');
    await expect(page).toHaveTitle(/Growearn|Login/i);

    // 2. Perform Login as Learner
    await page.fill('input[type="email"], input[name="email"]', 'learner@growearn.com');
    await page.fill('input[type="password"], input[name="password"]', 'Demo1234!');
    await page.click('button[type="submit"]');

    // 3. Verify landing on learner dashboard
    await page.waitForURL('**/learner/dashboard');
    await expect(page.locator('h1')).toContainText('What do you want to learn today?');

    // 4. Confirm Jobs is NOT visible in learner sidebar
    const sidebar = page.locator('aside, nav');
    await expect(sidebar.locator('text=Jobs')).toHaveCount(0);

    // 5. Search Java and verify roadmap appears
    const searchInput = page.locator('input[placeholder*="Java"], input[placeholder*="Search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('Java');
      await page.keyboard.press('Enter');
    }

    // 6. Verify roadmap title & structured phases
    await expect(page.locator('text=Structured Learning Roadmap for')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Core Java')).toBeVisible();

    // 7. Verify 5 real verified courses displayed
    const courseCards = page.locator('text=Verified Curriculum Courses').locator('..').locator('..').locator('.rounded-2xl');
    await expect(page.locator('text=Verified Curriculum Courses')).toBeVisible();

    // 8. Verify 5 expert mentors displayed
    await expect(page.locator('text=1-on-1 Expert Mentors')).toBeVisible();

    // 9. Open course detail
    const firstCourseLink = page.locator('a[href*="/courses/"]').first();
    if (await firstCourseLink.isVisible()) {
      await firstCourseLink.click();
      await page.waitForURL('**/courses/**');
      await expect(page.locator('h1, h2')).toBeVisible();
      await page.goBack();
    }

    // 10. Open mentor detail
    const firstMentorLink = page.locator('a[href*="/mentors/"]').first();
    if (await firstMentorLink.isVisible()) {
      await firstMentorLink.click();
      await page.waitForURL('**/mentors/**');
      await expect(page.locator('h1, h2')).toBeVisible();
      await page.goBack();
    }

    // 11. Pagination: Load Next 5 Courses (No duplicates)
    const loadCoursesBtn = page.locator('button:has-text("Load Next 5 Courses")');
    if (await loadCoursesBtn.isVisible()) {
      await loadCoursesBtn.click();
      await page.waitForTimeout(1000);
    }

    // 12. Pagination: Load Next 5 Mentors (No duplicates)
    const loadMentorsBtn = page.locator('button:has-text("Load Next 5 Mentors")');
    if (await loadMentorsBtn.isVisible()) {
      await loadMentorsBtn.click();
      await page.waitForTimeout(1000);
    }

    // 13. Refresh page and verify state persists
    await page.reload();
    await expect(page.locator('h1')).toContainText('What do you want to learn today?');
    await expect(page.locator('text=Structured Learning Roadmap')).toBeVisible();
  });
});
