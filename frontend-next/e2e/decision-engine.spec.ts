import { test, expect } from '@playwright/test';

test.describe('Decision Engine Widgets', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept API calls to mock data, preventing dependency on the backend
    await page.route('**/mock-api/decision/compensation', async route => {
      const json = { currentComp: 155000, recommendedComp: 165000, marketP50: 160000, equity: 25000, confidence: 94 };
      await route.fulfill({ json });
    });

    await page.route('**/mock-api/decision/promotion', async route => {
      const json = { readiness: 88, nextLevel: 'L5 Senior Engineer', criteria: [{ name: 'Technical Execution', met: true }, { name: 'Leadership', met: true }, { name: 'Impact', met: false }] };
      await route.fulfill({ json });
    });

    // Navigate to a page where these widgets are rendered (assuming a dashboard or direct mount if component testing)
    // For this stub, we navigate to the home page or a specific test page if available.
    await page.goto('/'); 
  });

  test('Compensation Optimizer Widget renders mocked data', async ({ page }) => {
    // Check if the widget title is present
    await expect(page.locator('text=Compensation Optimizer')).toBeVisible();

    // The data we mocked should be displayed
    await expect(page.locator('text=$155,000')).toBeVisible(); // current
    await expect(page.locator('text=$165,000')).toBeVisible(); // recommended
    await expect(page.locator('text=94% Confidence')).toBeVisible();
  });

  test('Promotion Readiness Widget renders mocked data', async ({ page }) => {
    // Check if the widget title is present
    await expect(page.locator('text=Promotion Readiness')).toBeVisible();

    // The data we mocked should be displayed
    await expect(page.locator('text=88%')).toBeVisible(); // readiness score
    await expect(page.locator('text=Target: L5 Senior Engineer')).toBeVisible();
  });
});
