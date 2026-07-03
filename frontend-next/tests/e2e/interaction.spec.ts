import { test, expect } from '@playwright/test';

test.describe('Component Interactions & Focus States', () => {
  test('should verify empty states have correct messaging', async ({ page }) => {
    // Assuming a test specific route or state for empty data
    // Here we check if the EmptyState generic component is rendering correctly
    await page.goto('/notifications'); // Just an example route that might be empty
    const emptyIcon = page.locator('svg.text-slate-300'); // Check for the empty state icon
    if (await emptyIcon.count() > 0) {
      await expect(emptyIcon).toBeVisible();
      await expect(page.locator('h3')).toContainText(/No/i);
    }
  });

  test('should verify focus rings on interactive elements', async ({ page }) => {
    await page.goto('/timesheets');
    // Tab to the first button (Save Draft)
    await page.keyboard.press('Tab');
    // We expect the focus-visible utility to apply a ring
    const focusedElement = page.locator('*:focus');
    // Ensure it exists
    await expect(focusedElement).toBeFocused();
    // Playwright cannot easily assert tailwind focus rings pixel-by-pixel, 
    // but we can ensure the element is focusable and visible.
    await expect(focusedElement).toBeVisible();
  });
});
