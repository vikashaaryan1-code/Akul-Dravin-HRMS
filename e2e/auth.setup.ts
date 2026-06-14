import { test as setup, expect } from '@playwright/test';
import path from 'path';

/**
 * Global setup: log in once and persist auth state.
 * All subsequent tests reuse this state.
 */
const AUTH_STATE_FILE = path.join(__dirname, 'fixtures', 'auth-state.json');

setup('authenticate as admin', async ({ page }) => {
  const baseUrl = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

  await page.goto(`${baseUrl}/login`);

  // Wait for login form to render
  await page.waitForSelector('input[type="email"], input[id*="email"]', { timeout: 15_000 });

  await page.fill('input[type="email"], input[id*="email"]', process.env.E2E_ADMIN_EMAIL ?? 'admin@akuldravin.com');
  await page.fill('input[type="password"]', process.env.E2E_ADMIN_PASSWORD ?? 'Admin@123!');

  await page.click('button[type="submit"]');

  // Wait for successful redirect to dashboard
  await page.waitForURL('**/dashboard**', { timeout: 15_000 });
  await expect(page).toHaveURL(/dashboard/);

  // Save auth state (cookies + localStorage)
  await page.context().storageState({ path: AUTH_STATE_FILE });
  console.log(`✅ Auth state saved to ${AUTH_STATE_FILE}`);
});
