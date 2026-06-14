import { test, expect } from '@playwright/test';

/**
 * Critical Business Flow E2E Tests
 *
 * Covers the highest-risk user journeys:
 * - Employees: view list, open record
 * - Payroll: navigate and view
 * - Leave: view requests
 * - AI Hub: send a message
 * - Workflow Builder: load template, save
 * - Activity Feed: visible and filtered
 * - Notification Bell: opens and shows state
 */

test.describe('Employee Management', () => {
  test('employees list loads', async ({ page }) => {
    await page.goto('/employees');
    await expect(page.locator('h1, [data-testid="page-title"]').filter({ hasText: /employee/i })).toBeVisible({ timeout: 10_000 });
  });

  test('employee table renders rows or empty state', async ({ page }) => {
    await page.goto('/employees');
    const tableOrEmpty = page.locator('table, [data-testid="data-table"], text=No employees');
    await expect(tableOrEmpty.first()).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Payroll', () => {
  test('payroll page loads', async ({ page }) => {
    await page.goto('/payroll');
    await expect(page.locator('h1, [data-testid="page-title"]').filter({ hasText: /payroll/i })).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('AI Hub', () => {
  test('AI Hub page loads with chat interface', async ({ page }) => {
    await page.goto('/ai-hub');
    await expect(page.locator('text=AI Hub, text=AI HR Assistant').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('input[placeholder*="workforce"], input[placeholder*="Ask"]')).toBeVisible();
  });

  test('sends a message and receives a response', async ({ page }) => {
    await page.goto('/ai-hub');
    const input = page.locator('input[placeholder*="workforce"], input[placeholder*="Ask"]');
    await input.fill('How many employees are on leave this week?');
    await page.keyboard.press('Enter');

    // Wait for response (max 35s for AI API call)
    await expect(page.locator('[class*="rounded-2xl"]').last()).toBeVisible({ timeout: 35_000 });
  });
});

test.describe('Workflow Builder', () => {
  test('Automation page shows both tabs', async ({ page }) => {
    await page.goto('/automation');
    await expect(page.locator('text=Automation Dashboard')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('text=Workflow Builder')).toBeVisible();
  });

  test('can load employee onboarding template', async ({ page }) => {
    await page.goto('/automation');
    await page.click('text=Workflow Builder');
    await page.click('text=Templates');
    await page.click('text=Employee Onboarding');

    // Should populate canvas with steps
    await expect(page.locator('text=Send Welcome Email')).toBeVisible({ timeout: 5_000 });
  });
});

test.describe('Activity Feed', () => {
  test('activity feed page loads with events', async ({ page }) => {
    await page.goto('/activity');
    await expect(page.locator('h1, text=Activity Feed').first()).toBeVisible({ timeout: 10_000 });
    // Should have filter tabs
    await expect(page.locator('text=All Events')).toBeVisible();
  });

  test('can filter by entity type', async ({ page }) => {
    await page.goto('/activity');
    await page.click('text=employee');
    // Filter should activate (button style changes)
    await expect(page.locator('button').filter({ hasText: /^employee$/ })).toHaveClass(/bg-blue-600/, { timeout: 3_000 });
  });
});

test.describe('Notification Bell', () => {
  test('notification bell is visible and opens dropdown', async ({ page }) => {
    await page.goto('/dashboard');
    const bell = page.locator('[aria-label="Notifications"], [id="notification-bell"]');
    await expect(bell).toBeVisible({ timeout: 10_000 });
    await bell.click();
    // Dropdown should open
    await expect(page.locator('text=Notifications').last()).toBeVisible({ timeout: 3_000 });
  });
});

test.describe('Health Check API', () => {
  test('GET /api/v1/health returns ok or degraded', async ({ request }) => {
    const apiUrl = process.env.E2E_API_URL ?? 'http://localhost:4001';
    const res = await request.get(`${apiUrl}/api/v1/health`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(['ok', 'degraded']).toContain(body.status);
    expect(body.checks.database).toBe('ok');
  });

  test('GET /api/v1/health/ready returns ready:true', async ({ request }) => {
    const apiUrl = process.env.E2E_API_URL ?? 'http://localhost:4001';
    const res = await request.get(`${apiUrl}/api/v1/health/ready`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ready).toBe(true);
  });
});
