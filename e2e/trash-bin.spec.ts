import { test, expect } from '@playwright/test';

test.skip('trash bin operations', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // 1. Create Project
    await page.click('button[title="New Project"]');
    await page.getByPlaceholder('e.g., Mars Rover 2030').fill('Trash Test Project');
    await page.getByPlaceholder('Brief description of the project...').fill('Testing trash bin');
    await page.click('button:has-text("Create Project")');

    await expect(page.getByText('Trash Test Project').first()).toBeVisible();

    // 2. Create Requirement to Delete
    await page.click('button:has-text("Create New")');
    await page.click('button:has-text("New Requirement")');

    await page.locator('form#new-requirement-form input').first().fill('Req to Delete');
    await page.getByPlaceholder('Enter detailed requirement text with Markdown...').fill('This will be deleted');
    await page.click('button:has-text("Create Requirement")');

    await expect(page.getByText('Req to Delete').first()).toBeVisible();

    // 3. Delete Requirement
    // Open edit modal
    await page.getByText('Req to Delete').first().click();
    // Click delete button in modal (initial delete)
    await page.click('button:has-text("Delete")');
    // Confirm delete (soft delete - "Move to Trash")
    await page.click('button:has-text("Move to Trash")');

    // 4. Verify Requirement Gone from Tree
    await expect(page.getByText('Req to Delete')).not.toBeVisible();

    // 5. Open Trash Bin
    await page.waitForTimeout(500);
    await page.click('button:has-text("Trash")');

    // Verify Trash Modal Open
    await expect(page.getByText('Trash Bin')).toBeVisible();

    // Verify Requirement in Trash
    await expect(page.getByText('Req to Delete')).toBeVisible();

    // 6. Restore Requirement
    await page.click('button[title="Restore"]');

    // Verify Trash Empty (or at least item gone)
    await expect(page.getByText('Req to Delete')).not.toBeVisible();

    // Close Trash Modal
    await page.locator('button:has(svg.lucide-x)').last().click();

    // 7. Verify Requirement Back in Tree
    await expect(page.getByText('Req to Delete')).toBeVisible();

    // 8. Delete Again for Permanent Delete
    await page.getByText('Req to Delete').first().click();
    await page.click('button:has-text("Delete")');
    await page.click('button:has-text("Move to Trash")');

    // 9. Open Trash Bin Again
    await page.click('button:has-text("Trash")');

    // 10. Permanently Delete
    // Setup dialog handler for window.confirm
    page.on('dialog', dialog => dialog.accept());

    await page.click('button[title="Delete Forever"]');

    // 11. Verify Item Gone from Trash
    await expect(page.getByText('Req to Delete')).not.toBeVisible();
});
