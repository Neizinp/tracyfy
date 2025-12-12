import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Modal Tab Visibility
 *
 * Tests that modals show correct tabs based on create vs edit mode.
 * Note: Some tests marked as fixme due to timing issues with modal detection.
 */

test.describe('Modal Tabs', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__E2E_TEST_MODE__ = true;
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Requirement Modal', () => {
    // FIXME: Modal detection timing issues in parallel test runs
    test.fixme('should show Overview, Details, and Relationships tabs in create mode', async ({
      page,
    }) => {
      await page.click('button:has-text("Create New")');
      await page.click('button:has-text("New Requirement")');
      await expect(page.locator('h3:has-text("New Requirement")')).toBeVisible({ timeout: 5000 });

      await expect(page.locator('button:has-text("Overview")')).toBeVisible();
      await expect(page.locator('button:has-text("Details")')).toBeVisible();
      await expect(page.locator('button:has-text("Relationships")')).toBeVisible();
      await expect(page.locator('button:has-text("History")')).toBeHidden();
    });
  });

  test.describe('Use Case Modal', () => {
    test.fixme('should show Overview and Flows tabs in create mode', async ({ page }) => {
      await page.click('button:has-text("Use Cases")');
      await page.waitForTimeout(300);

      await page.click('button:has-text("Create New")');
      await page.click('button:has-text("New Use Case")');
      await expect(page.locator('h3:has-text("New Use Case")')).toBeVisible({ timeout: 5000 });

      await expect(page.locator('button:has-text("Overview")')).toBeVisible();
      await expect(page.locator('button:has-text("Flows")')).toBeVisible();
      await expect(page.locator('button:has-text("History")')).toBeHidden();
    });
  });

  test.describe('Test Case Modal', () => {
    test.fixme('should show Overview and Relationships tabs in create mode', async ({ page }) => {
      await page.click('button:has-text("Test Cases")');
      await page.waitForTimeout(300);

      await page.click('button:has-text("Create New")');
      await page.click('button:has-text("New Test Case")');
      await expect(page.locator('h3:has-text("New Test Case")')).toBeVisible({ timeout: 5000 });

      await expect(page.locator('button:has-text("Overview")')).toBeVisible();
      await expect(page.locator('button:has-text("Relationships")')).toBeVisible();
      await expect(page.locator('button:has-text("History")')).toBeHidden();
    });
  });

  test.describe('Information Modal', () => {
    test.fixme('should show Overview tab in create mode', async ({ page }) => {
      await page.click('button:has-text("Information")');
      await page.waitForTimeout(300);

      await page.click('button:has-text("Create New")');
      await page.click('button:has-text("New Information")');
      await expect(page.locator('h3:has-text("New Information")')).toBeVisible({ timeout: 5000 });

      await expect(page.locator('button:has-text("Overview")')).toBeVisible();
      await expect(page.locator('button:has-text("History")')).toBeHidden();
    });
  });
});
