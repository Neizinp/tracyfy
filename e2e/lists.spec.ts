/**
 * Real-browser checks for things jsdom cannot see (layout).
 * Uses the app's in-memory E2E mode, so no folder picker is needed.
 */
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { __E2E_TEST_MODE__: boolean }).__E2E_TEST_MODE__ = true;
  });
});

test('a created requirement is visible as a row in the list (virtualized table has height)', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/requirements');
  await page.getByRole('button', { name: /create new/i }).click();
  await page.getByText('New Requirement').click();
  const dialog = page.getByRole('dialog');
  await dialog.getByPlaceholder('e.g., System shall authenticate users').fill('Visible row');
  await dialog.getByRole('button', { name: /create requirement/i }).click();

  const row = page.getByText('Visible row').first();
  await expect(row).toBeVisible();
  const box = await row.boundingBox();
  expect(box?.height ?? 0).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});
