import { test, expect } from '@playwright/test';

test('basic project and requirement flow', async ({ page }) => {
    await page.goto('/');

    // Create a new project
    await page.click('button[title="New Project"]');
    await page.getByPlaceholder('e.g., Mars Rover 2030').fill('E2E Test Project');
    await page.getByPlaceholder('Brief description of the project...').fill('Created by Playwright');
    await page.click('button:has-text("Create Project")');

    // Verify project is created and active
    await expect(page.getByText('E2E Test Project').first()).toBeVisible();

    // Close project manager
    // The project manager closes automatically on create, or we might need to close it if we just switched?
    // In ProjectManager.tsx: onCreateProject calls setIsCreating(false) but doesn't close the modal?
    // Wait, ProjectManager is a modal. 
    // In App.tsx: handleCreateProjectSubmit calls setIsCreateProjectModalOpen(false).
    // So it should close automatically.

    // Create a new requirement
    await page.click('button:has-text("Create New")');
    await page.click('button:has-text("New Requirement")');

    await page.locator('form#new-requirement-form input').first().fill('E2E Requirement');
    await page.getByPlaceholder('Enter detailed requirement text with Markdown...').fill('This is a test requirement');
    await page.click('button:has-text("Create Requirement")');

    // Verify requirement is in the list
    await expect(page.locator('text=E2E Requirement')).toBeVisible();
});
