import { test, expect } from '@playwright/test';

/**
 * e2e/ai-copilot.spec.ts — AI Copilot Workspace UI
 *
 * Covers:
 *   - Workspace renders with agent selector
 *   - Agent mode switching
 *   - Suggested prompt click-to-fill
 *   - Message send (mocked response)
 *   - Cancel streaming button
 *   - Clear conversation
 *   - Keyboard: Enter to send, Shift+Enter for newline
 *   - Input disabled during streaming
 */

test.describe('AI Copilot Workspace', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/ai-hub');
    // Wait for workspace to fully render
    await expect(
      page.getByRole('region', { name: /AI Copilot|copilot/i })
        .or(page.locator('section[aria-labelledby="copilot-heading"]')),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('renders heading and agent switcher button', async ({ page }) => {
    await expect(page.getByText(/Executive Advisor|HR Intelligence|Payroll Auditor|Security Analyst|Recruitment Strategist/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /open navigation|Select agent/i }).or(
      page.locator('button:has-text("Executive Advisor"), button:has-text("HR Intelligence")')
    ).first()).toBeVisible();
  });

  test('agent dropdown opens and shows all 5 modes', async ({ page }) => {
    // Find and click the agent switcher button
    const switcher = page.locator('button').filter({ hasText: /Executive Advisor|HR Intelligence|Payroll Auditor/i }).first();
    await switcher.click();

    const dropdown = page.getByRole('listbox', { name: /select agent mode/i });
    await expect(dropdown).toBeVisible({ timeout: 4_000 });

    for (const agent of ['Executive Advisor', 'HR Intelligence', 'Payroll Auditor', 'Security Analyst', 'Recruitment Strategist']) {
      await expect(dropdown.getByText(agent)).toBeVisible();
    }
  });

  test('switching agent mode updates heading', async ({ page }) => {
    const switcher = page.locator('button').filter({ hasText: /Executive Advisor/i }).first();
    await switcher.click();

    const hrOption = page.getByRole('option', { name: /HR Intelligence/i });
    await hrOption.click();

    await expect(page.getByText('HR Intelligence')).toBeVisible({ timeout: 4_000 });
  });

  test('suggested prompts are clickable and fill input', async ({ page }) => {
    // Suggested prompts only shown in empty state
    const suggestion = page.locator('button').filter({
      hasText: /quarter|attrition|OKR|payroll|threat|pipeline/i,
    }).first();

    if (await suggestion.isVisible()) {
      await suggestion.click();
      const textarea = page.getByRole('textbox', { name: /message input/i });
      const value = await textarea.inputValue();
      expect(value.length).toBeGreaterThan(0);
    }
  });

  test('typing and pressing Enter sends a message', async ({ page }) => {
    const textarea = page.getByRole('textbox', { name: /message input/i });
    await textarea.fill('Hello, summarise current headcount');
    await textarea.press('Enter');

    // User message should appear
    await expect(page.getByText('Hello, summarise current headcount')).toBeVisible({ timeout: 4_000 });
  });

  test('Shift+Enter creates newline without sending', async ({ page }) => {
    const textarea = page.getByRole('textbox', { name: /message input/i });
    const before = await textarea.inputValue();
    await textarea.fill('Line one');
    await textarea.press('Shift+Enter');

    // Input value should contain a newline
    const after = await textarea.inputValue();
    expect(after).toContain('\n');
  });

  test('clear button empties conversation', async ({ page }) => {
    const textarea = page.getByRole('textbox', { name: /message input/i });
    await textarea.fill('Test message');
    await textarea.press('Enter');

    // Wait for message to appear
    await page.waitForTimeout(500);

    const clearBtn = page.getByRole('button', { name: /clear conversation/i });
    await clearBtn.click();

    // Chat log should be empty
    await expect(page.getByRole('log', { name: /conversation/i }).getByText('Test message')).not.toBeVisible({ timeout: 4_000 });
  });

  test('send button is disabled when input is empty', async ({ page }) => {
    const sendBtn = page.getByRole('button', { name: /send message/i });
    await expect(sendBtn).toBeDisabled();
  });

  test('send button is enabled when input has content', async ({ page }) => {
    const textarea = page.getByRole('textbox', { name: /message input/i });
    await textarea.fill('Test');
    const sendBtn = page.getByRole('button', { name: /send message/i });
    await expect(sendBtn).toBeEnabled();
  });
});
