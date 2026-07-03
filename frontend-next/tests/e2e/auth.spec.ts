import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should navigate to login page', async ({ page }) => {
    // If the user visits the root, they should be on the login page or redirected to it
    // depending on the auth state. We'll start at a known path.
    await page.goto('/login');
    await expect(page).toHaveTitle(/Login/i);
    await expect(page.locator('form')).toBeVisible();
  });

  test('should perform mock login and reach dashboard', async ({ page }) => {
    await page.goto('/login');
    // Assuming simple mock inputs based on the Cinematic UI
    await page.fill('input[type="email"]', 'test@akuldravin.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for the redirect to the dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toContainText(/Dashboard/i);
  });
});
