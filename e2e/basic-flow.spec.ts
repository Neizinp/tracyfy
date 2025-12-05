import { test, expect } from '@playwright/test';

test('basic project and requirement flow', async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).__E2E_TEST_MODE__ = true;
  });

  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Create a new project
  await page.click('button[title="New Project"]');
  await page.getByPlaceholder('e.g., Mars Rover 2030').fill('E2E Test Project');
  await page.getByPlaceholder('Brief description of the project...').fill('Created by Playwright');
  await page.click('button:has-text("Create Project")');

  // Verify project is created and active
  await expect(page.getByText('E2E Test Project').first()).toBeVisible();

  // Create a new requirement (goes to global repository)
  await page.click('button:has-text("Create New")');
  await page.click('button:has-text("New Requirement")');

  await page.locator('form#new-requirement-form input').first().fill('E2E Requirement');
  await page
    .getByPlaceholder('Enter detailed requirement text with Markdown...')
    .fill('This is a test requirement');
  await page.click('button:has-text("Create Requirement")');

  // Open the global repository to see the requirement
  await page.click('button:has-text("Requirements")'); // In the Repository section

  // Verify requirement is in the global repository
  await expect(page.locator('text=E2E Requirement')).toBeVisible();
});
