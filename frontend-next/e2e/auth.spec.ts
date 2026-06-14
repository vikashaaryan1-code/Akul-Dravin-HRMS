import { test, expect } from '@playwright/test';

/**
 * e2e/auth.spec.ts — Authentication flows
 * @smoke
 *
 * Covers:
 *   - Login with valid credentials
 *   - Login with invalid credentials (error state)
 *   - Logout flow
 *   - Protected route redirect when unauthenticated
 *   - Session persistence on page reload
 */

test.describe('Authentication', () => {

  test.describe('Login flow', () => {
    // Use no auth state for login tests
    test.use({ storageState: { cookies: [], origins: [] } });

    test('redirects unauthenticated user from /dashboard to /login @smoke', async ({ page }) => {
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/\/login/);
    });

    test('shows validation error for empty form submit', async ({ page }) => {
      await page.goto('/login');
      await page.click('[data-testid="login-submit"]');
      await expect(page.getByRole('alert')).toBeVisible();
    });

    test('shows error message on invalid credentials', async ({ page }) => {
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]',    'wrong@email.com');
      await page.fill('[data-testid="password-input"]', 'wrongpassword');
      await page.click('[data-testid="login-submit"]');

      await expect(
        page.getByText(/invalid credentials|incorrect password|unauthorized/i),
      ).toBeVisible({ timeout: 8_000 });
    });

    test('successful login redirects to /dashboard @smoke', async ({ page }) => {
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]',    process.env.E2E_EMAIL    ?? 'admin@akuldravin.com');
      await page.fill('[data-testid="password-input"]', process.env.E2E_PASSWORD ?? 'test-password-e2e');
      await page.click('[data-testid="login-submit"]');

      await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
      await expect(page.getByRole('heading', { level: 2 })).toBeVisible();
    });
  });

  test.describe('Authenticated session', () => {
    // Uses shared auth state from globalSetup

    test('persists session on hard reload @smoke', async ({ page }) => {
      await page.goto('/dashboard');
      await page.reload();
      await expect(page).toHaveURL(/\/dashboard/);
      // Should not redirect to login
      await expect(page).not.toHaveURL(/\/login/);
    });

    test('logout clears session and redirects to /login @smoke', async ({ page }) => {
      await page.goto('/dashboard');

      // Open user dropdown and click logout
      await page.click('[data-testid="user-menu-trigger"]');
      await page.click('[data-testid="logout-button"]');

      await expect(page).toHaveURL(/\/login/, { timeout: 8_000 });

      // Verify session cleared — navigating to /dashboard should redirect
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/\/login/);
    });
  });
});
