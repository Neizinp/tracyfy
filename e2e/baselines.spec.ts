import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Baselines (Version Control)
 */

test.describe('Baselines', () => {
  test.beforeEach(async ({ page }) => {
    // Set E2E mode BEFORE navigation
    await page.addInitScript(() => {
      (window as Window & { __E2E_TEST_MODE__?: boolean }).__E2E_TEST_MODE__ = true;
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Wait for history button to be visible
    await page.waitForSelector('header button:has-text("History")', {
      state: 'visible',
      timeout: 10000,
    });
  });

  test('should have History button in header', async ({ page }) => {
    const historyBtn = page.locator('header button:has-text("History")');
    await expect(historyBtn).toBeVisible();
  });

  test('should open Version History modal when clicking History', async ({ page }) => {
    // Use JavaScript click to bypass any pointer event interception
    await page
      .locator('header button:has-text("History")')
      .evaluate((el) => (el as HTMLButtonElement).click());
    await expect(page.locator('h3:has-text("History")').first()).toBeVisible({ timeout: 5000 });
  });

  test('should show Baselines tab in Version History', async ({ page }) => {
    await page
      .locator('header button:has-text("History")')
      .evaluate((el) => (el as HTMLButtonElement).click());
    await expect(page.locator('button:has-text("Baselines")').first()).toBeVisible({
      timeout: 5000,
    });
  });

  test('should show Commits tab in Version History', async ({ page }) => {
    await page
      .locator('header button:has-text("History")')
      .evaluate((el) => (el as HTMLButtonElement).click());
    await expect(page.locator('button:has-text("Commits")').first()).toBeVisible({ timeout: 5000 });
  });

  test('should have Create Baseline option', async ({ page }) => {
    await page
      .locator('header button:has-text("History")')
      .evaluate((el) => (el as HTMLButtonElement).click());
    await expect(page.locator('button:has-text("Create Baseline")').first()).toBeVisible({
      timeout: 5000,
    });
  });
});
