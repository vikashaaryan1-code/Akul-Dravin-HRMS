import { defineConfig, devices } from '@playwright/test';

/**
 * playwright.config.ts — Akul Dravin HRMS E2E Suite
 *
 * Covers:
 *   - Auth flows (login, logout, session timeout)
 *   - Platform dashboard routes (10 surfaces)
 *   - Payroll approval workflow
 *   - ATS candidate advancement
 *   - AI Copilot streaming UI
 *   - WebSocket reconnection behaviour
 *   - Tenant switching (multi-tenant paths)
 *   - Accessibility (axe-core via @axe-core/playwright)
 *
 * Run:
 *   npx playwright test                   # full suite
 *   npx playwright test --project=chrome  # single browser
 *   npx playwright test --grep "@smoke"   # smoke tests only
 *   npx playwright show-report            # HTML report
 */

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,

  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
    ...(process.env.CI ? [['github'] as [string]] : []),
  ],

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    trace:   'on-first-retry',
    video:   'on-first-retry',
    screenshot: 'only-on-failure',

    // Emulate enterprise dark-mode preference
    colorScheme: 'dark',

    // Standard viewport — desktop executive
    viewport: { width: 1440, height: 900 },

    // Auth state file — shared across tests to avoid repeated login
    storageState: './e2e/.auth/session.json',
  },

  // Global setup — perform login once
  globalSetup:    './e2e/setup/global-setup.ts',
  globalTeardown: './e2e/setup/global-teardown.ts',

  projects: [
    // ── Setup project (no auth) ──────────────────────────────────────────────
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      use: { storageState: undefined },
    },

    // ── Desktop browsers ─────────────────────────────────────────────────────
    {
      name: 'chrome',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      dependencies: ['setup'],
    },
    {
      name: 'safari',
      use: { ...devices['Desktop Safari'] },
      dependencies: ['setup'],
    },

    // ── Mobile executive viewports ────────────────────────────────────────────
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
      dependencies: ['setup'],
      testMatch: /.*mobile.*/,
    },
    {
      name: 'iphone',
      use: { ...devices['iPhone 15 Pro'] },
      dependencies: ['setup'],
      testMatch: /.*mobile.*/,
    },

    // ── Accessibility audit ───────────────────────────────────────────────────
    {
      name: 'a11y',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
      testMatch: /.*a11y.*/,
    },
  ],
});
