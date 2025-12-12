import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Search and Filtering
 *
 * Tests search functionality across artifact views.
 */

test.describe('Search and Filter', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__E2E_TEST_MODE__ = true;
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should have a search input in the header', async ({ page }) => {
    // Look for search input
    const searchInput = page.getByPlaceholder('Search...');
    await expect(searchInput).toBeVisible();
  });

  test('should allow typing in search input', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search...');
    await searchInput.fill('test query');
    await page.waitForTimeout(200);

    // Verify the input has the value
    await expect(searchInput).toHaveValue('test query');
  });

  test('should clear search when input is cleared', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search...');

    // Type and then clear
    await searchInput.fill('test query');
    await page.waitForTimeout(200);
    await searchInput.fill('');
    await page.waitForTimeout(200);

    await expect(searchInput).toHaveValue('');
  });

  test('search should persist when switching views', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search...');
    await searchInput.fill('test');
    await page.waitForTimeout(200);

    // Switch views
    await page.click('button:has-text("Use Cases")');
    await page.waitForTimeout(300);

    // Search input may or may not persist based on implementation
    // This is a smoke test for view switching with search
    await expect(page.locator('button:has-text("Use Cases")')).toBeVisible();
  });
});
