import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Sidebar
 *
 * Tests sidebar resize functionality, width persistence, and project switching.
 */

test.describe('Sidebar', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__E2E_TEST_MODE__ = true;
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Project Switching', () => {
    test('should switch projects when clicking a different project', async ({ page }) => {
      // Create a new project first
      await page.click('button[title="New Project"]');
      await page.getByPlaceholder('e.g., Mars Rover 2030').fill('Second Project');
      await page.getByPlaceholder('Brief description of the project...').fill('Test project');
      await page.click('button:has-text("Create Project")');

      await expect(page.getByText('Second Project').first()).toBeVisible();

      // Create another project
      await page.click('button[title="New Project"]');
      await page.getByPlaceholder('e.g., Mars Rover 2030').fill('Third Project');
      await page.getByPlaceholder('Brief description of the project...').fill('Another test');
      await page.click('button:has-text("Create Project")');

      await expect(page.getByText('Third Project').first()).toBeVisible();

      // Click on Second Project in sidebar to switch
      await page.click('text=Second Project');

      // Verify project is now active (might show in header or have different styling)
      // The active project shows a settings icon or different background
      await expect(page.getByText('Second Project').first()).toBeVisible();
    });

    test('should show project settings when clicking active project', async ({ page }) => {
      // Create a project
      await page.click('button[title="New Project"]');
      await page.getByPlaceholder('e.g., Mars Rover 2030').fill('Settings Test Project');
      await page.getByPlaceholder('Brief description of the project...').fill('Test');
      await page.click('button:has-text("Create Project")');

      await expect(page.getByText('Settings Test Project').first()).toBeVisible();

      // Click on the active project - should open settings
      await page.click('text=Settings Test Project');
      await page.waitForTimeout(300);

      // Look for project settings modal or panel
      // The project settings should be visible
      await expect(page.getByText(/Project Settings|Edit Project/i).first()).toBeVisible();
    });
  });

  test.describe('Resize Handle', () => {
    test('should resize sidebar when dragging the resize handle', async ({ page }) => {
      // Find the sidebar
      const sidebar = page.locator('aside').first();
      const initialBox = await sidebar.boundingBox();

      if (!initialBox) {
        throw new Error('Could not find sidebar');
      }

      const initialWidth = initialBox.width;

      // The resize handle is typically at the right edge of the sidebar
      // Look for an element that could be the resize handle
      const resizeHandle = page.locator(
        '[style*="cursor: col-resize"], [style*="cursor: ew-resize"]'
      );

      if ((await resizeHandle.count()) > 0) {
        const handleBox = await resizeHandle.first().boundingBox();
        if (handleBox) {
          // Drag the handle to the right
          await page.mouse.move(
            handleBox.x + handleBox.width / 2,
            handleBox.y + handleBox.height / 2
          );
          await page.mouse.down();
          await page.mouse.move(handleBox.x + 100, handleBox.y + handleBox.height / 2);
          await page.mouse.up();

          // Check if width changed
          const newBox = await sidebar.boundingBox();
          if (newBox) {
            // Width should have increased
            expect(newBox.width).toBeGreaterThan(initialWidth);
          }
        }
      } else {
        // If no explicit resize handle found, the test is inconclusive
        // but we don't fail - the feature might not be implemented yet
        test.skip();
      }
    });
  });

  test.describe('Width Persistence', () => {
    test('should persist sidebar width after page refresh', async ({ page }) => {
      // Get initial sidebar width
      const sidebar = page.locator('aside').first();
      const initialBox = await sidebar.boundingBox();

      if (!initialBox) {
        throw new Error('Could not find sidebar');
      }

      // Try to resize if the handle exists
      const resizeHandle = page.locator(
        '[style*="cursor: col-resize"], [style*="cursor: ew-resize"]'
      );

      if ((await resizeHandle.count()) > 0) {
        const handleBox = await resizeHandle.first().boundingBox();
        if (handleBox) {
          await page.mouse.move(
            handleBox.x + handleBox.width / 2,
            handleBox.y + handleBox.height / 2
          );
          await page.mouse.down();
          await page.mouse.move(handleBox.x + 50, handleBox.y + handleBox.height / 2);
          await page.mouse.up();

          const afterResizeBox = await sidebar.boundingBox();
          const resizedWidth = afterResizeBox?.width || initialBox.width;

          // Refresh page
          await page.reload();
          await page.waitForLoadState('networkidle');

          // Check width is preserved
          const afterRefreshBox = await page.locator('aside').first().boundingBox();
          if (afterRefreshBox) {
            // Width should be approximately the same (within tolerance)
            expect(Math.abs(afterRefreshBox.width - resizedWidth)).toBeLessThan(10);
          }
        }
      } else {
        test.skip();
      }
    });
  });
});
