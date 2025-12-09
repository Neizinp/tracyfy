import { test, expect } from '@playwright/test';

/**
 * E2E Tests for User Settings Feature
 *
 * Tests the user management workflow including:
 * - Opening User Settings modal
 * - Creating a new user
 * - Switching between users
 * - Verifying user appears in header
 */

test.describe('User Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__E2E_TEST_MODE__ = true;
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should open User Settings modal from header', async ({ page }) => {
    // Click the User button in header
    await page.click('button:has-text("User")');

    // Verify modal is open
    await expect(page.getByText('User Settings')).toBeVisible();
  });

  test('should create a new user', async ({ page }) => {
    // Open User Settings modal
    await page.click('button:has-text("User")');
    await expect(page.getByText('User Settings')).toBeVisible();

    // Click Add User button
    await page.click('button:has-text("Add User")');

    // Fill in user name
    await page.locator('input[placeholder*="Enter user name"]').fill('E2E Test User');

    // Save the user
    await page.click('button:has-text("Save")');

    // Verify user appears in the list
    await expect(page.getByText('E2E Test User')).toBeVisible();
  });

  test('should switch between users', async ({ page }) => {
    // Open User Settings modal
    await page.click('button:has-text("User")');
    await expect(page.getByText('User Settings')).toBeVisible();

    // Create first user
    await page.click('button:has-text("Add User")');
    await page.locator('input[placeholder*="Enter user name"]').fill('User One');
    await page.click('button:has-text("Save")');

    // Create second user
    await page.click('button:has-text("Add User")');
    await page.locator('input[placeholder*="Enter user name"]').fill('User Two');
    await page.click('button:has-text("Save")');

    // Switch to User One (click on their name to select)
    await page.click('text=User One');

    // Close modal
    await page.click('button:has-text("Close")');

    // Verify header shows current user
    await expect(page.locator('header').getByText('User One')).toBeVisible();
  });

  test('should auto-populate author when creating requirement', async ({ page }) => {
    // First create a user
    await page.click('button:has-text("User")');
    await page.click('button:has-text("Add User")');
    await page.locator('input[placeholder*="Enter user name"]').fill('Test Author');
    await page.click('button:has-text("Save")');
    await page.click('button:has-text("Close")');

    // Create a new requirement
    await page.click('button:has-text("Create New")');
    await page.click('button:has-text("New Requirement")');

    // Verify author is auto-populated (shown as read-only)
    await expect(page.getByText('Test Author')).toBeVisible();
  });
});
