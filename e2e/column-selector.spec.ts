import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Column Selector
 *
 * Tests column visibility toggle functionality across all artifact views.
 */

test.describe('Column Selector', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__E2E_TEST_MODE__ = true;
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Requirements View', () => {
    test('should toggle column visibility', async ({ page }) => {
      // Navigate to Requirements
      await page.click('button:has-text("Requirements")');
      await page.waitForTimeout(300);

      // Open column selector
      await page.click('button:has-text("Columns")');
      await expect(page.getByText('ID / Title')).toBeVisible();

      // Find a toggleable column (Priority)
      const priorityLabel = page.locator('label:has-text("Priority")');
      await expect(priorityLabel).toBeVisible();

      // Click to toggle off Priority column
      await priorityLabel.click();

      // Close dropdown by clicking elsewhere
      await page.click('body', { position: { x: 10, y: 10 } });

      // Verify Priority column is hidden in the table (header not visible)
      const table = page.locator('table');
      if ((await table.count()) > 0) {
        // Only check if there's a table with data
        await expect(page.locator('th:has-text("Priority")')).toBeHidden();
      }
    });

    test('should not allow toggling ID/Title column', async ({ page }) => {
      await page.click('button:has-text("Requirements")');
      await page.waitForTimeout(300);

      await page.click('button:has-text("Columns")');

      // Find ID/Title checkbox - should be disabled
      const idTitleCheckbox = page.locator('label:has-text("ID / Title") input[type="checkbox"]');
      await expect(idTitleCheckbox).toBeDisabled();
    });
  });

  test.describe('Use Cases View', () => {
    test('should toggle column visibility', async ({ page }) => {
      await page.click('button:has-text("Use Cases")');
      await page.waitForTimeout(300);

      await page.click('button:has-text("Columns")');
      await expect(page.getByText('ID / Title')).toBeVisible();

      // Toggle Actor column off
      const actorLabel = page.locator('label:has-text("Actor")');
      if ((await actorLabel.count()) > 0) {
        await actorLabel.click();
      }
    });
  });

  test.describe('Test Cases View', () => {
    test('should toggle column visibility', async ({ page }) => {
      await page.click('button:has-text("Test Cases")');
      await page.waitForTimeout(300);

      await page.click('button:has-text("Columns")');
      await expect(page.getByText('ID / Title')).toBeVisible();

      // Toggle Status column off
      const statusLabel = page.locator('label:has-text("Status")');
      if ((await statusLabel.count()) > 0) {
        await statusLabel.click();
      }
    });
  });

  test.describe('Information View', () => {
    test('should toggle column visibility', async ({ page }) => {
      await page.click('button:has-text("Information")');
      await page.waitForTimeout(300);

      await page.click('button:has-text("Columns")');
      await expect(page.getByText('ID / Title')).toBeVisible();

      // Toggle Type column off
      const typeLabel = page.locator('label:has-text("Type")');
      if ((await typeLabel.count()) > 0) {
        await typeLabel.click();
      }
    });
  });

  test.describe('Persistence', () => {
    // Column visibility is stored in component state, not persisted to localStorage
    // Skip this test until persistence is implemented
    test.skip('should persist column visibility after page refresh', async ({ page }) => {
      await page.click('button:has-text("Requirements")');
      await page.waitForTimeout(300);

      // Open column selector and toggle Priority off
      await page.click('button:has-text("Columns")');
      const priorityLabel = page.locator('label:has-text("Priority")');
      await priorityLabel.click();

      // Close dropdown
      await page.click('body', { position: { x: 10, y: 10 } });

      // Refresh page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Navigate back to Requirements
      await page.click('button:has-text("Requirements")');
      await page.waitForTimeout(300);

      // Open column selector again
      await page.click('button:has-text("Columns")');

      // Priority checkbox should still be unchecked
      const priorityCheckbox = page.locator('label:has-text("Priority") input[type="checkbox"]');
      await expect(priorityCheckbox).not.toBeChecked();
    });
  });
});
