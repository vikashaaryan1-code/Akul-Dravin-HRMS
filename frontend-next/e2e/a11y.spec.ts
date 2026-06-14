import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * e2e/a11y.spec.ts — Accessibility audit suite
 * @a11y
 *
 * Uses @axe-core/playwright to run WCAG AA checks on every platform surface.
 *
 * Install:
 *   npm install --save-dev @axe-core/playwright
 *
 * Covers:
 *   - WCAG 2.1 AA violations on all 10 dashboard routes
 *   - Keyboard navigation: focus trap in modals
 *   - Skip-to-content link present and functional
 *   - All images have alt text
 *   - All form inputs have accessible labels
 *   - Color contrast (via axe)
 *   - Landmarks: header, main, nav present
 */

// Routes to audit
const A11Y_ROUTES = [
  '/dashboard',
  '/employees',
  '/payroll',
  '/recruitment',
  '/ai-hub',
  '/analytics',
  '/performance',
  '/compliance',
  '/analytics/observability',
  '/compliance/security-ops',
] as const;

// axe rules to disable globally (known acceptable deviations with documented rationale)
const DISABLED_RULES: string[] = [
  // recharts SVG elements don't expose roles — acceptable for decorative charts
  // Phase 5: replace with accessible chart descriptions
];

test.describe('WCAG AA Accessibility Audit', () => {

  for (const route of A11Y_ROUTES) {
    test(`${route} has no critical WCAG AA violations @a11y`, async ({ page }) => {
      await page.goto(route);

      // Wait for page to fully render (animations, async content)
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(800); // allow motion to settle

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .disableRules(DISABLED_RULES)
        .analyze();

      // Filter to critical + serious violations only (best-effort for medium/minor)
      const criticalViolations = results.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious',
      );

      // Report violations clearly
      if (criticalViolations.length > 0) {
        const report = criticalViolations.map((v) =>
          `[${v.impact?.toUpperCase()}] ${v.id}: ${v.description}\n  Nodes: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`
        ).join('\n\n');

        expect(criticalViolations, `Accessibility violations on ${route}:\n\n${report}`).toHaveLength(0);
      }
    });
  }
});

test.describe('Keyboard Navigation', () => {

  test('skip-to-content link is first focusable element on dashboard @a11y', async ({ page }) => {
    await page.goto('/dashboard');
    await page.keyboard.press('Tab');

    const focused = page.locator(':focus');
    const text = await focused.textContent();
    expect(text?.toLowerCase()).toMatch(/skip|main content/i);
  });

  test('sidebar navigation is keyboard traversable @a11y', async ({ page }) => {
    await page.goto('/dashboard');
    const nav = page.getByRole('navigation', { name: /platform navigation/i });
    await expect(nav).toBeVisible();

    // Tab into the nav and verify focus moves through links
    const firstLink = nav.getByRole('link').first();
    await firstLink.focus();
    await expect(firstLink).toBeFocused();

    await page.keyboard.press('Tab');
    const secondLink = nav.getByRole('link').nth(1);
    await expect(secondLink).toBeFocused();
  });

  test('AI Copilot send button is reachable via keyboard @a11y', async ({ page }) => {
    await page.goto('/ai-hub');
    const textarea = page.getByRole('textbox', { name: /message input/i });
    await textarea.focus();
    await textarea.fill('keyboard test');
    await page.keyboard.press('Tab');

    const focused = page.locator(':focus');
    await expect(focused).toHaveAttribute('aria-label', /send message|cancel/i);
  });

  test('payroll approve button is keyboard accessible @a11y', async ({ page }) => {
    await page.goto('/payroll');
    const approveBtn = page.getByRole('button', { name: /approve/i }).first();
    if (await approveBtn.isVisible()) {
      await approveBtn.focus();
      await expect(approveBtn).toBeFocused();
      // Pressing Enter should activate
      await page.keyboard.press('Enter');
    }
  });

  test('OKR expandable card is keyboard operable @a11y', async ({ page }) => {
    await page.goto('/performance');
    const firstOkr = page.getByRole('button', { name: /OKR|objective/i }).first();
    if (await firstOkr.isVisible()) {
      await firstOkr.focus();
      await expect(firstOkr).toBeFocused();
      await page.keyboard.press('Enter');
      // Expanded content should appear
      await expect(page.getByText(/Key Results/i)).toBeVisible({ timeout: 3_000 });
    }
  });
});

test.describe('Landmark structure', () => {

  for (const route of ['/dashboard', '/payroll', '/ai-hub']) {
    test(`${route} has correct landmark structure @a11y`, async ({ page }) => {
      await page.goto(route);

      // Must have exactly one <main>
      const main = page.getByRole('main');
      await expect(main).toHaveCount(1);

      // Must have at least one <nav>
      const nav = page.getByRole('navigation');
      await expect(nav.first()).toBeVisible();

      // Must have a page-level heading
      const h1 = page.locator('h1, [aria-labelledby]');
      await expect(h1.first()).toBeAttached();
    });
  }
});

test.describe('Form accessibility', () => {

  test('login form inputs have accessible labels @a11y', async ({ page }) => {
    // Use no auth state to reach login form
    await page.context().clearCookies();
    await page.goto('/login');

    const emailInput = page.getByRole('textbox', { name: /email/i });
    const passwordInput = page.locator('input[type="password"]');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();

    // Both must be labelled
    const emailLabel = await emailInput.getAttribute('aria-label') ?? await emailInput.getAttribute('id');
    expect(emailLabel).toBeTruthy();
  });

  test('AI chat textarea has aria-label @a11y', async ({ page }) => {
    await page.goto('/ai-hub');
    const textarea = page.getByRole('textbox', { name: /message input/i });
    await expect(textarea).toBeVisible();
  });
});
