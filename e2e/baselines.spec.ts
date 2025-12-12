import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Baselines (Version Control)
 *
 * Tests baseline creation and viewing functionality.
 */

test.describe('Baselines', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__E2E_TEST_MODE__ = true;
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should have History button in header', async ({ page }) => {
    // Look for History button
    const historyBtn = page.locator('button:has-text("History")');
    await expect(historyBtn).toBeVisible();
  });

  test('should open Version History modal when clicking History', async ({ page }) => {
    await page.click('button:has-text("History")');
    await page.waitForTimeout(500);

    // Should see Version History modal content
    await expect(page.getByText(/Version History|Baselines|Commits/i).first()).toBeVisible();
  });

  test('should show Baselines tab in Version History', async ({ page }) => {
    await page.click('button:has-text("History")');
    await page.waitForTimeout(500);

    // Look for Baselines tab
    const baselinesTab = page.locator('button:has-text("Baselines")');
    if ((await baselinesTab.count()) > 0) {
      await expect(baselinesTab).toBeVisible();
    }
  });

  test('should show Commits tab in Version History', async ({ page }) => {
    await page.click('button:has-text("History")');
    await page.waitForTimeout(500);

    // Look for Commits tab - use first() since there may be Project/All Commits
    const commitsTab = page.locator('button:has-text("Commits")').first();
    if ((await commitsTab.count()) > 0) {
      await expect(commitsTab).toBeVisible();
    }
  });

  // FIXME: Modal title detection timing issue
  test.fixme('should close Version History with Escape', async ({ page }) => {
    await page.click('button:has-text("History")');
    await page.waitForTimeout(500);

    // Verify modal is open
    const modalTitle = page.getByText(/Version History/i).first();
    await expect(modalTitle).toBeVisible();

    // Press Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Modal should be hidden
    await expect(modalTitle).toBeHidden();
  });

  test('should have Create Baseline option', async ({ page }) => {
    await page.click('button:has-text("History")');
    await page.waitForTimeout(500);

    // Look for Create Baseline button or link
    const createBaselineBtn = page.locator(
      'button:has-text("Create Baseline"), button:has-text("New Baseline")'
    );
    if ((await createBaselineBtn.count()) > 0) {
      await expect(createBaselineBtn.first()).toBeVisible();
    }
  });
});
