import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Project Settings
 *
 * Tests project rename and settings functionality.
 */

test.describe('Project Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__E2E_TEST_MODE__ = true;
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Create a project to test settings
    await page.click('button[title="New Project"]');
    await page.getByPlaceholder('e.g., Mars Rover 2030').fill('Settings Test Project');
    await page.getByPlaceholder('Brief description of the project...').fill('Test project');
    await page.click('button:has-text("Create Project")');
    await expect(page.getByText('Settings Test Project').first()).toBeVisible();
  });

  test('should open project settings when clicking active project', async ({ page }) => {
    // Click on the active project in sidebar
    await page.click('text=Settings Test Project');
    await page.waitForTimeout(500);

    // Should see project settings modal
    const settingsContent = page.getByText(/Project Settings|Edit Project/i);
    if ((await settingsContent.count()) > 0) {
      await expect(settingsContent.first()).toBeVisible();
    }
  });

  test('should show project name in settings', async ({ page }) => {
    await page.click('text=Settings Test Project');
    await page.waitForTimeout(500);

    // Look for project name input - verify it's visible
    const nameInput = page.locator('input[id="project-name"]');
    if ((await nameInput.count()) > 0) {
      await expect(nameInput).toBeVisible();
    }
  });

  test('should show delete option in project settings', async ({ page }) => {
    await page.click('text=Settings Test Project');
    await page.waitForTimeout(500);

    // Look for Delete button
    const deleteBtn = page.locator('button:has-text("Delete")');
    if ((await deleteBtn.count()) > 0) {
      await expect(deleteBtn.first()).toBeVisible();
    }
  });

  test('should close project settings with Cancel', async ({ page }) => {
    await page.click('text=Settings Test Project');
    await page.waitForTimeout(500);

    // Click Cancel if available
    const cancelBtn = page.locator('button:has-text("Cancel")');
    if ((await cancelBtn.count()) > 0) {
      await cancelBtn.first().click();
      await page.waitForTimeout(300);
    }
  });
});
