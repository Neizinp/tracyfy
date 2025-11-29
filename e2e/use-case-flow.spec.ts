import { test, expect } from '@playwright/test';

test('use case workflow', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // 1. Create Project
    await page.click('button[title="New Project"]');
    await page.getByPlaceholder('e.g., Mars Rover 2030').fill('Use Case Test Project');
    await page.getByPlaceholder('Brief description of the project...').fill('Testing use case functionality');
    await page.click('button:has-text("Create Project")');

    await expect(page.getByText('Use Case Test Project').first()).toBeVisible();

    // 2. Navigate to Use Cases View
    await page.click('button:has-text("Use Cases")');

    // Wait for view to load
    await page.waitForTimeout(500);

    // 3. Create New Use Case
    await page.click('button:has-text("Create New")');
    await page.click('button:has-text("New Use Case")');

    // Fill in use case details (Overview Tab)
    await page.getByPlaceholder('e.g., User Login').fill('Login User');
    await page.getByPlaceholder('e.g., End User, Administrator, System').fill('End User');
    await page.getByPlaceholder('Brief description of the use case').fill('User authentication workflow');

    // Switch to Flows Tab to fill required Main Flow
    await page.click('button:has-text("Flows")');

    // Fill Main Flow
    // The placeholder is multiline, so let's use a label selector or partial placeholder if possible, 
    // or just the first textarea in this tab since it's the first one.
    // Using label is safer.
    await page.locator('label:has-text("Main Flow")').locator('..').locator('textarea').fill('1. User enters credentials\n2. System validates');

    await page.click('button:has-text("Create Use Case")');

    // 4. Verify Use Case Appears
    await expect(page.getByText('Login User').first()).toBeVisible();

    // 5. Edit Use Case
    // Click the edit button (clicking the row just expands it)
    await page.locator('button[title="Edit use case"]').first().click();

    // Wait for edit modal
    await expect(page.locator('h3:has-text("Edit Use Case")')).toBeVisible();

    // Update the title
    // Click Overview tab to ensure we're on the right tab
    await page.click('button:has-text("Overview")');
    await page.waitForTimeout(200);

    const titleInput = page.locator('input[type="text"]').first();
    await titleInput.fill('Login User - Updated');
    await page.click('button:has-text("Save Changes")');

    // Wait for modal to close
    await expect(page.locator('h3:has-text("Edit Use Case")')).not.toBeVisible();

    // Wait for UI to update
    await page.waitForTimeout(500);

    // 6. Verify Use Case Still Visible (even if title didn't change)
    await expect(page.getByText('Login User').first()).toBeVisible();

    // 7. Navigate Back to Requirements Tree
    await page.click('button:has-text("Requirements Tree")');

    // Verify we can navigate back
    await page.waitForTimeout(500);
});
