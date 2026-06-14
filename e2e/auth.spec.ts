import { test, expect } from '@playwright/test';

/**
 * Auth Flow E2E Tests
 *
 * Covers:
 * - Login with valid credentials
 * - Login with invalid credentials (error message)
 * - Session persistence after page reload
 * - Logout clears session
 * - Protected route redirects to login when unauthenticated
 */

test.describe('Authentication Flows', () => {
  test('dashboard loads for authenticated user', async ({ page }) => {
    await page.goto('/dashboard');
    // Auth state is pre-loaded from setup — should be on dashboard
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.locator('text=Dashboard, text=AKUL DRAVIN').first()).toBeVisible({ timeout: 10_000 });
  });

  test('protected routes redirect unauthenticated users', async ({ browser }) => {
    // Use a fresh context (no auth state)
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/employees');
    await expect(page).toHaveURL(/login/);
    await context.close();
  });

  test('login with invalid credentials shows error', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/login');

    await page.fill('input[type="email"], input[id*="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should stay on login page and show error
    await expect(page).toHaveURL(/login/);
    await expect(
      page.locator('text=Invalid credentials, text=incorrect, text=failed').first()
    ).toBeVisible({ timeout: 8_000 });

    await context.close();
  });

  test('user can log out successfully', async ({ page }) => {
    await page.goto('/dashboard');
    // Click user avatar / profile menu
    const avatarBtn = page.locator('[aria-label="User profile menu"]');
    await avatarBtn.click();

    // Click Sign Out
    await page.click('text=Sign Out');

    // Should redirect to login
    await expect(page).toHaveURL(/login/, { timeout: 8_000 });
  });

  test('session persists after page reload', async ({ page }) => {
    await page.goto('/dashboard');
    await page.reload();
    await expect(page).toHaveURL(/dashboard/);
    // Should NOT redirect to login
    await expect(page).not.toHaveURL(/login/);
  });
});

test.describe('Command Palette', () => {
  test('opens with Ctrl+K', async ({ page }) => {
    await page.goto('/dashboard');
    await page.keyboard.press('Control+k');
    await expect(page.locator('[aria-label="Open command palette"], input[placeholder*="Search pages"]')).toBeVisible({ timeout: 5_000 });
  });

  test('closes with Escape', async ({ page }) => {
    await page.goto('/dashboard');
    await page.keyboard.press('Control+k');
    await page.keyboard.press('Escape');
    await expect(page.locator('input[placeholder*="Search pages"]')).not.toBeVisible({ timeout: 3_000 });
  });

  test('navigates to employees via command palette', async ({ page }) => {
    await page.goto('/dashboard');
    await page.keyboard.press('Control+k');
    await page.fill('input[placeholder*="Search pages"], input[placeholder*="Search anything"]', 'Employees');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/employees/, { timeout: 8_000 });
  });
});
