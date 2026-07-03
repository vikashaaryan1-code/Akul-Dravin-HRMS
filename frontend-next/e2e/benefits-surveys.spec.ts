import { test, expect } from '@playwright/test';

test.describe('Benefits & Surveys Widgets', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept API calls to mock data
    await page.route('**/mock-api/benefits/coverage', async route => {
      const json = [
        { type: 'Medical', provider: 'BlueCross BlueShield', plan: 'PPO Gold', tier: 'Employee + Spouse', cost: 185.00 },
        { type: 'Dental', provider: 'Delta Dental', plan: 'Premium', tier: 'Employee + Spouse', cost: 24.50 },
      ];
      await route.fulfill({ json });
    });

    await page.route('**/mock-api/benefits/retirement', async route => {
      const json = { provider: 'Fidelity Investments', balance: 84250, contribution: 8.0, match: 4.0, status: 'Maximizing match' };
      await route.fulfill({ json });
    });

    await page.route('**/mock-api/surveys/enps', async route => {
      const json = { score: 55, promoters: 65, passives: 25, detractors: 10 };
      await route.fulfill({ json });
    });

    await page.route('**/mock-api/surveys/polls', async route => {
      const json = [
        { id: '1', title: 'Q3 Remote Work Satisfaction', sent: 1450, completed: 1102, deadline: 'Oct 20, 2026', status: 'Active' },
      ];
      await route.fulfill({ json });
    });

    // Navigate to a page where these widgets are rendered
    await page.goto('/'); 
  });

  test('Active Coverage Widget renders mocked data', async ({ page }) => {
    await expect(page.locator('text=Active Coverage')).toBeVisible();
    await expect(page.locator('text=BlueCross BlueShield')).toBeVisible();
    await expect(page.locator('text=$185.00')).toBeVisible();
    await expect(page.locator('text=Delta Dental')).toBeVisible();
  });

  test('Retirement Widget renders mocked data', async ({ page }) => {
    await expect(page.locator('text=Retirement & 401(k)')).toBeVisible();
    await expect(page.locator('text=Fidelity Investments')).toBeVisible();
    await expect(page.locator('text=$84,250')).toBeVisible();
  });

  test('eNPS Score Widget renders mocked data', async ({ page }) => {
    await expect(page.locator('text=Company eNPS')).toBeVisible();
    await expect(page.locator('text=+55')).toBeVisible();
    await expect(page.locator('text=65%')).toBeVisible(); // promoters
  });

  test('Active Polls Widget renders mocked data', async ({ page }) => {
    await expect(page.locator('text=Active Polls & Surveys')).toBeVisible();
    await expect(page.locator('text=Q3 Remote Work Satisfaction')).toBeVisible();
    await expect(page.locator('text=1102 / 1450 Responses')).toBeVisible();
  });
});
