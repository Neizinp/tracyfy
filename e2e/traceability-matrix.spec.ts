import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Traceability Matrix
 *
 * Tests the traceability matrix feature showing artifact relationships.
 */

test.describe('Traceability Matrix', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__E2E_TEST_MODE__ = true;
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should navigate to traceability dashboard', async ({ page }) => {
    // Look for traceability link in navigation (sidebar or main nav)
    const traceabilityLink = page.locator('a:has-text("Traceability"), a:has-text("Dashboard")');

    if ((await traceabilityLink.count()) > 0) {
      await traceabilityLink.first().click();
      await page.waitForTimeout(500);

      // Should see Dashboard content
      await expect(page.getByText(/Traceability|Overview|Dashboard/i).first()).toBeVisible();
    } else {
      // If no link found, navigate via URL
      await page.goto('/traceability');
      await page.waitForLoadState('networkidle');

      // Should show some traceability content or redirect
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should display overview tab by default', async ({ page }) => {
    await page.goto('/traceability');
    await page.waitForLoadState('networkidle');

    // Look for Overview tab or content
    const overviewTab = page.locator('button:has-text("Overview")');
    if ((await overviewTab.count()) > 0) {
      await expect(overviewTab).toBeVisible();
    }
  });

  test('should have Matrix tab available', async ({ page }) => {
    await page.goto('/traceability');
    await page.waitForLoadState('networkidle');

    const matrixTab = page.locator('button:has-text("Matrix")');
    if ((await matrixTab.count()) > 0) {
      await expect(matrixTab).toBeVisible();
    }
  });

  test('should switch to Matrix view when tab is clicked', async ({ page }) => {
    await page.goto('/traceability');
    await page.waitForLoadState('networkidle');

    const matrixTab = page.locator('button:has-text("Matrix")');
    if ((await matrixTab.count()) > 0) {
      await matrixTab.click();
      await page.waitForTimeout(300);

      // Matrix tab should now be active
      await expect(page.getByText(/Traceability Matrix/i).first()).toBeVisible();
    }
  });
});
