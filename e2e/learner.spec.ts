import { test, expect } from '@playwright/test';

test.describe('Learner End-to-End Browser Flow', () => {
  test('Learner login, legacy redirect, skill exploration, roadmap, pagination & role isolation', async ({ page }) => {
    // 1. Navigate to login
    await page.goto('/login');
    await expect(page.locator('h1, h2, h3').first()).toBeVisible();

    // 2. Perform Login as Learner
    await page.fill('input[type="email"], input[name="email"]', 'student@example.com');
    await page.fill('input[type="password"], input[name="password"]', 'Demo1234!');
    await page.click('button[type="submit"]');

    // 3. Verify landing on learner dashboard
    await page.waitForURL('**/learner/dashboard', { timeout: 15000 });
    await expect(page.locator('h1')).toContainText('What do you want to learn today?');

    // 4. Test legacy /student/dashboard redirect to /learner/dashboard
    await page.goto('/student/dashboard');
    await page.waitForURL('**/learner/dashboard', { timeout: 15000 });
    expect(page.url()).toContain('/learner/dashboard');

    // 5. Verify role isolation: sidebar must NOT contain company or job posting tools
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();
    await expect(sidebar.locator('text=Post a Job')).toHaveCount(0);
    await expect(sidebar.locator('text=ATS Candidate Hub')).toHaveCount(0);

    // 6. Search Java and verify roadmap generation
    const javaPill = page.locator('button:has-text("Java")').first();
    await expect(javaPill).toBeVisible({ timeout: 10000 });
    await javaPill.click();

    // 7. Verify structured learning roadmap title & phases
    await expect(page.locator('text=Structured Learning Roadmap').first()).toBeVisible({ timeout: 20000 });
    await expect(page.locator('text=Phase 1').first()).toBeVisible({ timeout: 15000 });

    // 8. Verify verified curriculum courses section displayed
    await expect(page.locator('text=Verified Curriculum Courses').first()).toBeVisible({ timeout: 20000 });
    const firstCourseLink = page.locator('a[href*="/courses/"]').first();
    await expect(firstCourseLink).toBeVisible({ timeout: 20000 });

    // 9. Verify industry expert mentors section displayed
    await expect(page.locator('text=Industry Mentors').first()).toBeVisible({ timeout: 20000 });
    const firstMentorLink = page.locator('a[href*="/mentors/"]').first();
    await expect(firstMentorLink).toBeVisible({ timeout: 20000 });

    // 10. Pagination: Click Show Next 5 Courses
    const loadCoursesBtn = page.locator('button:has-text("Show Next 5 Courses")').first();
    await expect(loadCoursesBtn).toBeVisible({ timeout: 10000 });
    await loadCoursesBtn.click();
    await page.waitForTimeout(600);

    // 11. Pagination: Click Show Next 5 Mentors
    const loadMentorsBtn = page.locator('button:has-text("Show Next 5 Mentors")').first();
    await expect(loadMentorsBtn).toBeVisible({ timeout: 10000 });
    await loadMentorsBtn.click();
    await page.waitForTimeout(600);

    // 12. Refresh page and verify dashboard state persists
    await page.reload();
    await expect(page.locator('h1')).toContainText('What do you want to learn today?', { timeout: 20000 });
    await expect(page.locator('text=Structured Learning Roadmap').first()).toBeVisible({ timeout: 20000 });
  });
});
