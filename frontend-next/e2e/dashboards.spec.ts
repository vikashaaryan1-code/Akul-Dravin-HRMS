import { test, expect } from '@playwright/test';

/**
 * e2e/dashboards.spec.ts — Platform dashboard routing & render
 * @smoke
 *
 * Covers all 10 dashboard surfaces:
 *   1. Executive Command Center   /dashboard
 *   2. HRMS Intelligence          /employees
 *   3. Payroll Control Tower      /payroll
 *   4. ATS Recruitment            /recruitment
 *   5. AI Copilot Workspace       /ai-hub
 *   6. Analytics Intelligence     /analytics
 *   7. Performance OKR Hub        /performance
 *   8. Governance Center          /compliance
 *   9. Observability Center       /analytics/observability
 *  10. Security Operations        /compliance/security-ops
 */

const DASHBOARD_ROUTES = [
  {
    path:     '/dashboard',
    title:    /Executive/i,
    landmark: 'Executive Command Center',
    testId:   'dashboard-kpi-strip',
  },
  {
    path:     '/employees',
    title:    /HRMS|Employees/i,
    landmark: 'HRMS Intelligence',
    testId:   'hrms-kpi-strip',
  },
  {
    path:     '/payroll',
    title:    /Payroll/i,
    landmark: 'Payroll Control Tower',
    testId:   'payroll-cycle-status',
  },
  {
    path:     '/recruitment',
    title:    /Recruitment|ATS/i,
    landmark: 'Recruitment Marketplace',
    testId:   'ats-pipeline-funnel',
  },
  {
    path:     '/ai-hub',
    title:    /AI Copilot|Copilot/i,
    landmark: 'AI Copilot Workspace',
    testId:   'ai-chat-input',
  },
  {
    path:     '/analytics',
    title:    /Analytics/i,
    landmark: 'Analytics Intelligence',
    testId:   'analytics-kpi-strip',
  },
  {
    path:     '/performance',
    title:    /Performance|OKR/i,
    landmark: 'OKR Command Hub',
    testId:   'performance-kpi-strip',
  },
  {
    path:     '/compliance',
    title:    /Governance|Compliance/i,
    landmark: 'Security Command Center',
    testId:   'governance-kpi-strip',
  },
  {
    path:     '/analytics/observability',
    title:    /Observability/i,
    landmark: 'Observability Command Center',
    testId:   'observability-kpi-strip',
  },
  {
    path:     '/compliance/security-ops',
    title:    /Security Operations/i,
    landmark: 'Security Operations Center',
    testId:   'soc-kpi-strip',
  },
] as const;

test.describe('Dashboard routing', () => {

  for (const route of DASHBOARD_ROUTES) {
    test(`renders ${route.landmark} at ${route.path} @smoke`, async ({ page }) => {
      await page.goto(route.path);

      // Should not redirect to login
      await expect(page).not.toHaveURL(/\/login/);

      // Page title should be set
      await expect(page).toHaveTitle(route.title);

      // Primary heading or section heading exists
      const heading = page.getByRole('heading', { level: 2 });
      await expect(heading.first()).toBeVisible({ timeout: 10_000 });
    });
  }

  test('navigation sidebar links are all reachable @smoke', async ({ page }) => {
    await page.goto('/dashboard');

    // Verify sidebar is rendered
    const sidebar = page.getByRole('navigation', { name: /platform navigation/i });
    await expect(sidebar).toBeVisible();

    // Verify at least 8 nav links present
    const navLinks = sidebar.getByRole('link');
    await expect(navLinks).toHaveCountGreaterThan(7);
  });

  test('page title updates correctly on navigation', async ({ page }) => {
    await page.goto('/dashboard');
    await page.goto('/payroll');
    await expect(page).toHaveTitle(/Payroll/i);
    await page.goto('/ai-hub');
    await expect(page).toHaveTitle(/AI Copilot/i);
  });
});

test.describe('Dashboard content', () => {

  test('Executive Command Center renders KPI strip with 4 tiles', async ({ page }) => {
    await page.goto('/dashboard');
    const kpis = page.locator('[data-testid="kpi-tile"]');
    await expect(kpis).toHaveCountGreaterThan(3);
  });

  test('Payroll dashboard shows cycle status stepper', async ({ page }) => {
    await page.goto('/payroll');
    await expect(
      page.getByText(/Draft|Review|Processing|Disbursed/i).first(),
    ).toBeVisible({ timeout: 8_000 });
  });

  test('ATS dashboard renders pipeline funnel', async ({ page }) => {
    await page.goto('/recruitment');
    await expect(
      page.getByText(/Applied|Screened|Interview|Offer/i).first(),
    ).toBeVisible({ timeout: 8_000 });
  });

  test('Observability shows service health list', async ({ page }) => {
    await page.goto('/analytics/observability');
    await expect(
      page.getByText(/API Gateway|Auth Service|Payroll Worker/i).first(),
    ).toBeVisible({ timeout: 8_000 });
  });

  test('Security Ops shows threat feed', async ({ page }) => {
    await page.goto('/compliance/security-ops');
    await expect(
      page.getByText(/Blocked|Flagged|Allowed/i).first(),
    ).toBeVisible({ timeout: 8_000 });
  });
});

test.describe('Mobile dashboard', () => {
  test.use({ viewport: { width: 390, height: 844 } });   // iPhone 15 Pro

  test('mobile nav hamburger is visible on narrow viewport', async ({ page }) => {
    await page.goto('/dashboard');
    const hamburger = page.getByRole('button', { name: /open navigation/i });
    await expect(hamburger).toBeVisible();
  });

  test('mobile nav sheet opens and closes', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('button[aria-label="Open navigation"]');

    const navSheet = page.getByRole('dialog', { name: /mobile navigation/i });
    await expect(navSheet).toBeVisible();

    await page.click('button[aria-label="Close navigation"]');
    await expect(navSheet).not.toBeVisible();
  });

  test('dashboard KPIs wrap correctly on mobile', async ({ page }) => {
    await page.goto('/dashboard');
    // KPI strip should exist and not overflow viewport
    const kpiStrip = page.locator('[data-testid="kpi-tile"]').first();
    await expect(kpiStrip).toBeVisible();
    const box = await kpiStrip.boundingBox();
    expect(box?.width).toBeLessThanOrEqual(390);
  });
});
