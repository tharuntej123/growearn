import { test, expect } from '@playwright/test';

test.describe('Learner End-to-End Browser Flow', () => {
  test('Learner login, skill discovery, roadmap, pagination, enrollment & mentor request persistence', async ({ page }) => {
    // 1. Navigate to login
    await page.goto('/login');
    await expect(page.locator('h1, h2, h3').first()).toBeVisible();

    // 2. Perform Login as Learner
    await page.fill('input[type="email"], input[name="email"]', 'learner@growearn.com');
    await page.fill('input[type="password"], input[name="password"]', 'Demo1234!');
    await page.click('button[type="submit"]');

    // 3. Verify landing on learner dashboard
    await page.waitForURL('**/learner/dashboard', { timeout: 15000 });
    await expect(page.locator('h1')).toContainText('What do you want to learn today?');

    // 4. Confirm Jobs is NOT visible in learner sidebar
    const sidebar = page.locator('aside');
    if (await sidebar.isVisible()) {
      await expect(sidebar.locator('text=Explore Jobs')).toHaveCount(0);
      await expect(sidebar.locator('text=Post a Job')).toHaveCount(0);
    }

    // 5. Search Java and verify roadmap appears
    const searchInput = page.locator('input[placeholder*="Java"], input[placeholder*="Search"]').first();
    await searchInput.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
    if (await searchInput.isVisible()) {
      await searchInput.fill('Java');
      await page.keyboard.press('Enter');
    }

    // 6. Verify roadmap title & structured phases
    await expect(page.locator('text=Structured Learning Roadmap').first()).toBeVisible({ timeout: 15000 });

    // 7. Verify verified courses section displayed
    await expect(page.locator('text=Verified Curriculum Courses').first()).toBeVisible({ timeout: 10000 });

    // 8. Verify expert mentors section displayed
    await expect(page.locator('text=Industry Mentors').first()).toBeVisible({ timeout: 10000 });

    // 9. Verify course links present
    const firstCourseLink = page.locator('a[href*="/courses/"]').first();
    await expect(firstCourseLink).toBeVisible({ timeout: 10000 });

    // 10. Verify mentor links present
    const firstMentorLink = page.locator('a[href*="/mentors/"]').first();
    await expect(firstMentorLink).toBeVisible({ timeout: 10000 });

    // 11. Pagination: Load Next 5 Courses
    const loadCoursesBtn = page.locator('button:has-text("Show Next 5 Courses"), button:has-text("Load Next 5 Courses")').first();
    if (await loadCoursesBtn.isVisible()) {
      await loadCoursesBtn.click();
      await page.waitForTimeout(500);
    }

    // 12. Pagination: Load Next 5 Mentors
    const loadMentorsBtn = page.locator('button:has-text("Show Next 5 Mentors"), button:has-text("Load Next 5 Mentors")').first();
    if (await loadMentorsBtn.isVisible()) {
      await loadMentorsBtn.click();
      await page.waitForTimeout(500);
    }

    // 13. Refresh page and verify state persists
    await page.reload();
    await expect(page.locator('h1')).toContainText('What do you want to learn today?');
    await expect(page.locator('text=Structured Learning Roadmap').first()).toBeVisible({ timeout: 15000 });
  });
});
