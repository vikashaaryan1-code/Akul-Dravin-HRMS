import { test, expect } from '@playwright/test';

test.describe('Platform Navigation Flow', () => {
  // Pre-condition: User should be logged in or bypass it for testing routes
  // For these tests, we assume routes are accessible or mocked for the E2E env.

  test('should navigate to Employees module', async ({ page }) => {
    await page.goto('/employees');
    await expect(page.locator('h1')).toContainText(/Employees/i);
    // Ensure the new ThreeDGlassCard or standard UI components are rendering
    await expect(page.locator('.animate-rise')).toBeVisible();
  });

  test('should navigate to Timesheets module', async ({ page }) => {
    await page.goto('/timesheets');
    await expect(page.locator('h1')).toContainText(/Timesheets/i);
    await expect(page.locator('table')).toBeVisible();
  });

  test('should navigate to Benefits module', async ({ page }) => {
    await page.goto('/benefits');
    await expect(page.locator('h1')).toContainText(/Benefits/i);
  });

  test('should navigate to Surveys module', async ({ page }) => {
    await page.goto('/surveys');
    await expect(page.locator('h1')).toContainText(/Surveys/i);
  });
});
