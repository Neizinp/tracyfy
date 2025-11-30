import { test, expect } from '@playwright/test';

test.describe('Revision History Tab - Debug', () => {
    test('debug workflow for requirement', async ({ page }) => {
        await page.goto('/');

        // Reset to demo data
        await page.getByRole('button', { name: 'Import' }).click();
        await page.getByRole('button', { name: 'Reset to Demo Data' }).click();
        await page.waitForTimeout(2000);

        // Create a new Requirement
        await page.getByRole('button', { name: 'Create New' }).click();
        await page.getByRole('button', { name: 'New Requirement' }).click();

        await page.locator('#req-title').fill('Debug Test Req');
        await page.getByRole('button', { name: 'Create Requirement' }).click();

        // Wait for modal to close
        await page.waitForTimeout(2000);

        // Take a screenshot to see what's on the page
        await page.screenshot({ path: 'test-results/debug-after-create.png', fullPage: true });

        // Check if we can find the pending changes
        const pendingChangesVisible = await page.getByText('Pending Changes').isVisible();
        console.log('Pending Changes visible:', pendingChangesVisible);

        // Look for commit button
        const commitButtons = await page.getByRole('button', { name: 'Commit' }).all();
        console.log('Found commit buttons:', commitButtons.length);

        if (commitButtons.length > 0) {
            await commitButtons[0].click();
            await page.waitForTimeout(3000);
            await page.screenshot({ path: 'test-results/debug-after-commit.png', fullPage: true });
        }

        // Try to find and open the requirement
        await page.getByRole('button', { name: 'Requirements Tree' }).click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'test-results/debug-tree-view.png', fullPage: true });

        // Look for the requirement text
        const reqText = page.getByText('Debug Test Req');
        const reqVisible = await reqText.isVisible();
        console.log('Requirement visible in tree:', reqVisible);

        if (reqVisible) {
            await reqText.click();
            await page.waitForTimeout(1000);
            await page.screenshot({ path: 'test-results/debug-modal-open.png', fullPage: true });

            // Check if modal is open
            const modalVisible = await page.getByRole('heading', { name: /Edit Requirement/i }).isVisible();
            console.log('Modal open:', modalVisible);

            if (modalVisible) {
                // Try to find Revision History tab
                const historyTab = page.getByRole('button', { name: 'Revision History' });
                const historyTabVisible = await historyTab.isVisible();
                console.log('History tab visible:', historyTabVisible);

                if (historyTabVisible) {
                    await historyTab.click();
                    await page.waitForTimeout(1000);
                    await page.screenshot({ path: 'test-results/debug-history-tab.png', fullPage: true });

                    // Check for history content
                    const hasFirstCommit = await page.getByText('First commit').isVisible();
                    console.log('First commit visible:', hasFirstCommit);
                }
            }
        }

        // This test is just for debugging, so we don't assert anything
        expect(true).toBe(true);
    });
});
