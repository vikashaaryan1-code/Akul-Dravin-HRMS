/**
 * e2e/setup/global-setup.ts
 * Authenticates once and saves storage state for all tests.
 * All test projects depend on this — login cost paid once per run.
 */

import { chromium, type FullConfig } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

export default async function globalSetup(_config: FullConfig) {
  const authDir = path.join(__dirname, '../.auth');
  if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage();

  const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

  await page.goto(`${baseUrl}/login`);
  await page.fill('[data-testid="email-input"]',    process.env.E2E_EMAIL    ?? 'admin@akuldravin.com');
  await page.fill('[data-testid="password-input"]', process.env.E2E_PASSWORD ?? 'test-password-e2e');
  await page.click('[data-testid="login-submit"]');

  // Wait for dashboard redirect
  await page.waitForURL('**/dashboard', { timeout: 15_000 });

  // Persist auth cookies and localStorage
  await page.context().storageState({ path: path.join(authDir, 'session.json') });

  await browser.close();
}
