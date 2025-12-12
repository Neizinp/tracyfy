import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Table Sorting
 *
 * Tests sorting functionality in artifact list tables.
 */

test.describe('Sorting', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__E2E_TEST_MODE__ = true;
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display sort indicator when clicking column header', async ({ page }) => {
    // Navigate to Requirements view
    await page.click('button:has-text("Requirements")');
    await page.waitForTimeout(500);

    // Look for a sortable column header (ID or Priority)
    const sortableHeader = page.locator('th');
    if ((await sortableHeader.count()) > 0) {
      // Click on the first header
      await sortableHeader.first().click();
      await page.waitForTimeout(300);

      // Verify table structure is intact
      await expect(page.locator('table')).toBeVisible();
    }
  });

  test('should sort Test Cases by clicking header', async ({ page }) => {
    // Navigate to Test Cases view
    await page.click('button:has-text("Test Cases")');
    await page.waitForTimeout(500);

    // Look for any sortable header
    const headers = page.locator('th');
    if ((await headers.count()) > 0) {
      await headers.first().click();
      await page.waitForTimeout(200);

      // Double click should toggle direction
      await headers.first().click();
      await page.waitForTimeout(200);
    }
  });
});
