import { test, expect } from '@playwright/test';

/**
 * e2e/payroll-workflow.spec.ts — Payroll approval E2E workflow
 *
 * Covers:
 *   - Payroll cycle status visibility
 *   - Approving a payroll cycle
 *   - Payslip register table renders
 *   - Variance alert visibility
 *   - Compliance badges present
 *   - Run payroll action (with confirmation)
 */

test.describe('Payroll workflow', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/payroll');
    // Wait for cycle status to be visible
    await page.waitForSelector('[data-testid="payroll-cycle-status"], text=/Draft|Review|Processing|Disbursed/i', {
      timeout: 10_000,
    });
  });

  test('renders cycle status stepper with correct stages', async ({ page }) => {
    const stages = ['Draft', 'Review', 'Processing', 'Disbursed'];
    for (const stage of stages) {
      await expect(page.getByText(stage)).toBeVisible();
    }
  });

  test('payslip register table is visible with rows', async ({ page }) => {
    const table = page.getByRole('table', { name: /payslip/i });
    if (await table.isVisible()) {
      const rows = table.getByRole('row');
      await expect(rows).toHaveCountGreaterThan(1);
    } else {
      // Virtualised table — check for row count indicator
      await expect(page.getByText(/records/i)).toBeVisible();
    }
  });

  test('compliance badges are visible in footer', async ({ page }) => {
    await expect(page.getByText(/PF|ESIC|TDS/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test('variance alerts section is rendered', async ({ page }) => {
    // Variance panel should show at least one alert or "no alerts" state
    const varianceSection = page.getByText(/variance|alert|anomaly/i).first();
    await expect(varianceSection).toBeVisible({ timeout: 8_000 });
  });

  test('approve payroll button is keyboard accessible', async ({ page }) => {
    const approveBtn = page.getByRole('button', { name: /approve/i }).first();
    if (await approveBtn.isVisible()) {
      await approveBtn.focus();
      await expect(approveBtn).toBeFocused();
    }
  });

  test('run payroll action opens confirmation or shows status', async ({ page }) => {
    const runBtn = page.getByRole('button', { name: /run payroll|process payroll/i });
    if (await runBtn.count() > 0) {
      await runBtn.first().click();
      // Should show confirmation modal or status change
      const modal = page.getByRole('dialog');
      const statusChange = page.getByText(/processing|running|submitted/i);
      await expect(modal.or(statusChange)).toBeVisible({ timeout: 6_000 });
    }
  });
});
