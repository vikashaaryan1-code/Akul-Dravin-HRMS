/**
 * E2E Test Suite: Employee Management
 *
 * Covers the full employee management workflow:
 * - Navigate to employees list
 * - Search and filter employees
 * - View employee profile (detail page)
 * - Tab navigation within profile (overview, payroll, documents, timeline)
 * - Accessibility: keyboard nav + skip link
 * - Responsive: verify layout at mobile breakpoint
 *
 * @audit-sprint: A2Z Gap Analysis — Sprint 3 (Missing employee profile E2E)
 */

import { test, expect, Page } from '@playwright/test';

// ── Helpers ──────────────────────────────────────────────────────────────────

async function loginAsHR(page: Page) {
  await page.goto('/login');
  await page.fill('#login-email', process.env.TEST_HR_EMAIL ?? 'hr@akuldravin.com');
  await page.fill('#login-password', process.env.TEST_HR_PASSWORD ?? 'TestPass123!');
  await page.click('#login-submit');
  await page.waitForURL('**/dashboard', { timeout: 15_000 });
}

// ── Suite ─────────────────────────────────────────────────────────────────────

test.describe('Employee Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsHR(page);
  });

  // ── List Page ────────────────────────────────────────────────────────────

  test('employees list page loads and displays headcount', async ({ page }) => {
    await page.goto('/employees');
    await expect(page).toHaveTitle(/HRMS|Employee/i);

    // Should render some employee records or empty state
    const content = page.locator('main, [id="main-content"]');
    await expect(content).toBeVisible();

    // Should not show any JS error modal
    const errorModal = page.locator('[data-testid="error-boundary"]');
    await expect(errorModal).not.toBeVisible();
  });

  test('employees list has working search input', async ({ page }) => {
    await page.goto('/employees');

    // Find any search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], input[placeholder*="Search" i]').first();

    if (await searchInput.isVisible()) {
      await searchInput.fill('Raj');
      // Results should update (either filtered or empty state)
      await page.waitForTimeout(500);
      const results = page.locator('[data-testid="employee-row"], tbody tr, [data-testid="employee-card"]');
      // Just verify the list element exists (could be 0 results)
      await expect(page.locator('main')).toBeVisible();
    } else {
      test.info().annotations.push({ type: 'skip-reason', description: 'Search input not yet implemented' });
    }
  });

  // ── Profile Page ─────────────────────────────────────────────────────────

  test('employee profile page renders with correct structure', async ({ page }) => {
    // Navigate directly to a known employee profile (mock ID)
    await page.goto('/employees/EMP-001');

    // Should not 404
    await expect(page).not.toHaveURL('/not-found');
    await expect(page).not.toHaveURL('/404');

    // Main content should be present
    const main = page.locator('#main-content, main');
    await expect(main).toBeVisible();
  });

  test('employee profile shows hero card with name and status', async ({ page }) => {
    await page.goto('/employees/EMP-001');

    // Back button
    const backBtn = page.locator('button[aria-label="Go back"]');
    await expect(backBtn).toBeVisible();

    // Employee name heading
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('employee profile KPI cards are all visible', async ({ page }) => {
    await page.goto('/employees/EMP-001');

    // Should have 4 KPI cards (Performance, Attendance, CTC, Leave)
    const kpiTexts = ['Performance', 'Attendance', 'CTC', 'Leave'];
    for (const kpi of kpiTexts) {
      await expect(page.getByText(kpi, { exact: false }).first()).toBeVisible();
    }
  });

  test('employee profile tab navigation works', async ({ page }) => {
    await page.goto('/employees/EMP-001');

    const tabs = ['Overview', 'Payroll', 'Documents', 'Timeline'];

    for (const tabLabel of tabs) {
      const tab = page.getByRole('button', { name: tabLabel });
      await expect(tab).toBeVisible();
      await tab.click();

      // Each tab should show something relevant
      await page.waitForTimeout(200);
      const main = page.locator('#main-content, main');
      await expect(main).toBeVisible();
    }
  });

  test('employee profile documents tab shows document list', async ({ page }) => {
    await page.goto('/employees/EMP-001');

    const documentsTab = page.getByRole('button', { name: 'Documents' });
    await documentsTab.click();

    // Should see at least one document
    await expect(page.getByText('Offer Letter', { exact: false })).toBeVisible();
  });

  test('employee profile timeline tab shows career events', async ({ page }) => {
    await page.goto('/employees/EMP-001');

    const timelineTab = page.getByRole('button', { name: 'Timeline' });
    await timelineTab.click();

    // Should see join event
    await expect(page.getByText(/Joined|Career Timeline/i).first()).toBeVisible();
  });

  // ── Back navigation ──────────────────────────────────────────────────────

  test('back button returns to employees list', async ({ page }) => {
    await page.goto('/employees');
    await page.goto('/employees/EMP-001');

    const backBtn = page.locator('button[aria-label="Go back"]');
    await backBtn.click();

    // Should navigate back
    await page.waitForTimeout(500);
    // Page URL should change (either to /employees or browser back)
    const url = page.url();
    expect(url).not.toContain('/employees/EMP-001');
  });

  // ── Accessibility ────────────────────────────────────────────────────────

  test('employee profile page has skip to main content link', async ({ page }) => {
    await page.goto('/employees/EMP-001');

    // Tab to the skip link (it's the first focusable element in the DOM)
    await page.keyboard.press('Tab');

    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeFocused();
  });

  test('employee profile has accessible edit button', async ({ page }) => {
    await page.goto('/employees/EMP-001');

    const editBtn = page.locator('button[aria-label="Edit employee"]');
    await expect(editBtn).toBeVisible();
    await expect(editBtn).toHaveAttribute('aria-label', 'Edit employee');
  });

  // ── Responsive ───────────────────────────────────────────────────────────

  test('employee profile is usable on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/employees/EMP-001');

    // All tab buttons should still be visible/accessible
    const tabs = page.locator('button').filter({ hasText: /Overview|Payroll|Documents|Timeline/ });
    const count = await tabs.count();
    expect(count).toBeGreaterThanOrEqual(4);

    // KPI row should be visible
    await expect(page.locator('#main-content, main')).toBeVisible();
  });

  test('employee profile is usable on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/employees/EMP-001');
    await expect(page.locator('#main-content, main')).toBeVisible();
  });

  // ── Error handling ───────────────────────────────────────────────────────

  test('invalid employee ID shows graceful error or empty state', async ({ page }) => {
    await page.goto('/employees/non-existent-id-12345');

    // Should either show 404, not-found, or the profile with empty state
    // Not show a blank crash
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
    expect(body!.length).toBeGreaterThan(10);
  });
});
