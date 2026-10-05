import { test, expect } from '@playwright/test';

test.describe('Freelancer End-to-End Browser Flow', () => {
  test('Freelancer login, legacy redirect, dashboard, job discovery, AI proposal generator & applications flow', async ({ page }) => {
    // 1. Login as Freelancer
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', 'professional@example.com');
    await page.fill('input[type="password"], input[name="password"]', 'Demo1234!');
    await page.click('button[type="submit"]');

    // 2. Verify landing on canonical Freelancer Dashboard
    await page.waitForURL('**/freelancer/dashboard', { timeout: 15000 });
    await expect(page.locator('h1').first()).toContainText('Freelancer Workspace');

    // 3. Test legacy /professional/dashboard route redirect to canonical /freelancer/dashboard
    await page.goto('/professional/dashboard');
    await page.waitForURL('**/freelancer/dashboard', { timeout: 15000 });
    expect(page.url()).toContain('/freelancer/dashboard');

    // 4. Verify metrics & skills cards
    await expect(page.locator('text=Verified Skills').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Active Applications').first()).toBeVisible({ timeout: 10000 });

    // 5. Navigate to Jobs Discovery
    await page.goto('/jobs');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });

    // 6. Return to Freelancer Dashboard & Open Proposal Generator Modal
    await page.goto('/freelancer/dashboard');
    const generateProposalBtn = page.locator('button:has-text("Generate AI Proposal")').first();
    await expect(generateProposalBtn).toBeVisible({ timeout: 15000 });
    await generateProposalBtn.click();

    // 7. Verify Proposal Modal opens
    await expect(page.locator('text=AI Proposal Generator').first()).toBeVisible({ timeout: 15000 });
    const submitProposalBtn = page.locator('button:has-text("Submit Proposal")').first();
    await expect(submitProposalBtn).toBeVisible({ timeout: 15000 });
    await submitProposalBtn.click();

    // 8. Verify Applications page access
    await page.goto('/freelancer/applications');
    await expect(page.locator('h1').first()).toContainText('My Job & Contract Applications', { timeout: 15000 });
  });
});
