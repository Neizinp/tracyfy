import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Modal Interactions
 *
 * Tests keyboard shortcuts and common modal behaviors:
 * - Escape to close
 * - Cancel button to close
 */

test.describe('Modal Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__E2E_TEST_MODE__ = true;
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Keyboard Shortcuts', () => {
    test('should close Requirement modal with Escape key', async ({ page }) => {
      await page.click('button:has-text("Create New")');
      await page.click('button:has-text("New Requirement")');

      // Wait for modal
      await expect(page.locator('h3:has-text("New Requirement")')).toBeVisible({ timeout: 5000 });

      // Press Escape
      await page.keyboard.press('Escape');

      // Modal should be closed
      await expect(page.locator('h3:has-text("New Requirement")')).toBeHidden();
    });

    test('should close Use Case modal with Escape key', async ({ page }) => {
      await page.click('button:has-text("Use Cases")');
      await page.waitForTimeout(300);

      await page.click('button:has-text("Create New")');
      await page.click('button:has-text("New Use Case")');

      await expect(page.locator('h3:has-text("New Use Case")')).toBeVisible({ timeout: 5000 });

      await page.keyboard.press('Escape');

      await expect(page.locator('h3:has-text("New Use Case")')).toBeHidden();
    });

    test('should save project with Ctrl+S', async ({ page }) => {
      // Open create project modal
      await page.click('button[title="New Project"]');
      await page.waitForTimeout(300);

      // Fill in project name
      await page.getByPlaceholder('e.g., Mars Rover 2030').fill('Keyboard Save Project');
      await page.getByPlaceholder('Brief description of the project...').fill('Test');

      // Press Ctrl+S to save
      await page.keyboard.press('Control+s');

      // Project should be created
      await expect(page.getByText('Keyboard Save Project').first()).toBeVisible();
    });
  });

  test.describe('Modal Close Button', () => {
    test('should close modal with Cancel button', async ({ page }) => {
      await page.click('button:has-text("Create New")');
      await page.click('button:has-text("New Requirement")');

      await expect(page.locator('h3:has-text("New Requirement")')).toBeVisible({ timeout: 5000 });

      // Click Cancel
      await page.click('button:has-text("Cancel")');

      // Modal should be closed
      await expect(page.locator('h3:has-text("New Requirement")')).toBeHidden();
    });

    test('should close Test Case modal with Cancel', async ({ page }) => {
      await page.click('button:has-text("Test Cases")');
      await page.waitForTimeout(300);

      await page.click('button:has-text("Create New")');
      await page.click('button:has-text("New Test Case")');

      await expect(page.locator('h3:has-text("New Test Case")')).toBeVisible({ timeout: 5000 });

      await page.click('button:has-text("Cancel")');

      await expect(page.locator('h3:has-text("New Test Case")')).toBeHidden();
    });
  });

  test.describe('Delete Confirmation', () => {
    // FIXME: Timing issues with project settings modal detection
    test.fixme('should show delete confirmation in project settings', async ({ page }) => {
      // Create a project first
      await page.click('button[title="New Project"]');
      await page.getByPlaceholder('e.g., Mars Rover 2030').fill('Delete Test Project');
      await page.getByPlaceholder('Brief description of the project...').fill('Test');
      await page.click('button:has-text("Create Project")');
      await expect(page.getByText('Delete Test Project').first()).toBeVisible();

      // Click on the project to open settings
      await page.click('text=Delete Test Project');
      await page.waitForTimeout(500);

      // Look for Delete button in settings
      const deleteBtn = page.locator(
        'button:has-text("Delete Project"), button:has-text("Delete")'
      );
      if ((await deleteBtn.count()) > 0) {
        await deleteBtn.first().click();

        // Should show confirmation dialog
        await expect(page.getByText(/confirm|are you sure|permanently/i).first()).toBeVisible({
          timeout: 3000,
        });
      }
    });
  });
});
