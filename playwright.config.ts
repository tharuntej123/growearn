import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for GroEarn End-to-End Browser Tests
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npx next start -H 0.0.0.0 -p 3000',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: true,
    timeout: 120000,
    env: {
      CI: 'true',
      NODE_ENV: 'production',
      PORT: '3000',
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgrespassword@127.0.0.1:5432/groearn_test?sslmode=disable',
      DIRECT_URL: process.env.DIRECT_URL || 'postgresql://postgres:postgrespassword@127.0.0.1:5432/groearn_test?sslmode=disable',
      JWT_SECRET: process.env.JWT_SECRET || 'ci-test-jwt-secret-key-2026-production-testing-random-grade',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://127.0.0.1:3000',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
