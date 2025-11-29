import { test, expect } from '@playwright/test';

test.skip('link creation and traceability', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // 1. Create Project
    await page.click('button[title="New Project"]');
    await page.getByPlaceholder('e.g., Mars Rover 2030').fill('Link Test Project');
    await page.getByPlaceholder('Brief description of the project...').fill('Testing link functionality');
    await page.click('button:has-text("Create Project")');

    // Wait for project to appear
    await expect(page.getByText('Link Test Project').first()).toBeVisible();

    // 2. Create First Requirement
    await page.click('button:has-text("Create New")');
    await page.click('button:has-text("New Requirement")');

    await page.locator('form#new-requirement-form input').first().fill('Source Requirement');
    await page.getByPlaceholder('Enter detailed requirement text with Markdown...').fill('This is the source requirement');
    await page.click('button:has-text("Create Requirement")');

    // Wait for requirement to appear in tree
    await expect(page.getByText('Source Requirement').first()).toBeVisible();

    // 3. Create Second Requirement
    await page.click('button:has-text("Create New")');
    await page.click('button:has-text("New Requirement")');

    await page.locator('form#new-requirement-form input').first().fill('Target Requirement');
    await page.getByPlaceholder('Enter detailed requirement text with Markdown...').fill('This is the target requirement');
    await page.click('button:has-text("Create Requirement")');

    await expect(page.getByText('Target Requirement').first()).toBeVisible();

    // Make sure we're on the Requirements Tree view
    await page.click('button:has-text("Requirements Tree")');

    // Wait a bit for the tree to fully render with link buttons
    await page.waitForTimeout(1000);

    // 4. Click Link Button -first make sure button exists
    const linkButton = page.locator('button[title="Create Link"]').first();
    await expect(linkButton).toBeVisible({ timeout: 5000 });
    await linkButton.click();

    // 5. Wait for Link Modal
    await expect(page.getByText('Create Link')).toBeVisible();

    // 6. Select Target Requirement
    // Click on the target requirement in the list (it should be clickable)
    await page.locator('div').filter({ hasText: /^Target Requirement$/ }).click();

    // 7. Select Link Type
    await page.locator('select').selectOption('depends_on');

    // 8. Create Link
    await page.click('button:has-text("Create Link")');

    // 9. Verify Link Modal Closed
    await expect(page.getByText('Create Link')).not.toBeVisible({ timeout: 2000 });

    // 10. Verify Link Badge Appears on Source Requirement
    // The requirement tree shows a badge with link count
    await expect(page.locator('text=/→.*1/')).toBeVisible();

    // 11. Navigate to Traceability Matrix
    await page.click('button:has-text("Traceability Matrix")');

    // 12. Verify Link in Matrix
    // The matrix should show the relationship
    // Look for target requirement ID or depends_on indicator
    await expect(page.locator('text=/depends.*on/i')).toBeVisible();
});
