import { test, expect } from '@playwright/test';

test.describe('Company End-to-End Browser Flow', () => {
  test('Company login, legacy redirect, dashboard access, job creation & candidate discovery', async ({ page }) => {
    // 1. Login as Company
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', 'careers@novatech-solutions.io');
    await page.fill('input[type="password"], input[name="password"]', 'Demo1234!');
    await page.click('button[type="submit"]');

    // 2. Verify landing on canonical Company Dashboard
    await page.waitForURL('**/company/dashboard', { timeout: 15000 });
    await expect(page.locator('h1').first()).toContainText('Company ATS & Hiring Workspace');

    // 3. Test legacy /employer/dashboard route redirect to canonical /company/dashboard
    await page.goto('/employer/dashboard');
    await page.waitForURL('**/company/dashboard', { timeout: 15000 });
    expect(page.url()).toContain('/company/dashboard');

    // 4. Post a new Job via Company Job Studio
    await page.goto('/company/jobs/new');
    await expect(page.locator('h1').first()).toContainText('Post a New Technical Job Opportunity', { timeout: 10000 });

    const jobTitle = `Staff Cloud Architect ${Date.now()}`;
    await page.fill('input[placeholder*="Senior Java"]', jobTitle);
    await page.fill('textarea[required]', 'Lead scalable microservices on AWS with Kubernetes, TypeScript, and Go.');
    await page.fill('input[placeholder*="Java, Spring Boot"]', 'AWS, Kubernetes, TypeScript, Go');

    // Submit Job Creation Form
    await page.click('button[type="submit"]');

    // 5. Land back on Company Dashboard and verify the new job listing appears
    await page.waitForURL('**/company/dashboard', { timeout: 25000 });
    await expect(page.locator(`text=${jobTitle}`).first()).toBeVisible({ timeout: 25000 });

    // 6. Verify Candidate Discovery & Applicant Tracking
    await expect(page.locator('text=Active Postings & Candidates').first()).toBeVisible({ timeout: 10000 });
  });
});
