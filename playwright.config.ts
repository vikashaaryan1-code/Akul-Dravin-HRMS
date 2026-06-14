import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E test configuration for Akul Dravin HRMS.
 *
 * Test strategy:
 * - Auth flows (login, 2FA, logout, session rotation)
 * - Critical business flows (payroll, leave, recruitment)
 * - Multi-tenant isolation
 * - AI Hub interaction
 * - Workflow Builder create + trigger
 * - Notification delivery
 *
 * Run: npx playwright test
 * Run (headed): npx playwright test --headed
 * Run specific: npx playwright test e2e/auth.spec.ts
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'e2e/reports/html' }],
    ['json', { outputFile: 'e2e/reports/results.json' }],
  ],

  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // All tests share the same auth state to avoid re-login on every test
    storageState: 'e2e/fixtures/auth-state.json',
    extraHTTPHeaders: {
      'X-Test-Run': 'playwright',
    },
  },

  projects: [
    // Setup project: perform login once and save auth state
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      use: { storageState: undefined },
    },

    // Chromium — primary test target
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },

    // Firefox — secondary
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      dependencies: ['setup'],
    },

    // Mobile — responsive validation
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
      dependencies: ['setup'],
    },
  ],

  // Start Next.js dev server automatically in CI
  webServer: process.env.CI ? {
    command: 'npm run dev --workspace=frontend-next',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  } : undefined,
});
