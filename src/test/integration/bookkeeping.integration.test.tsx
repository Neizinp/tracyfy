/**
 * Workflows, custom attributes and saved searches through the real UI.
 *
 * Core invariant: after any user action, every uncommitted file must be
 * visible in the Pending Changes panel (or already be committed). Files the
 * panel hides must be committed by the app itself.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { startApp, type Harness } from './appHarness';

describe('integration: no invisible uncommitted files', () => {
  let h: Harness;
  afterEach(() => h?.cleanup());

  it('right after onboarding', async () => {
    h = await startApp();
    expect(await h.invisibleDirtyPaths()).toEqual([]);
  }, 60_000);

  it('saving an advanced search', async () => {
    h = await startApp();

    fireEvent.click(screen.getByTitle('Advanced Search (Ctrl+Shift+F)'));
    fireEvent.click(await screen.findByRole('button', { name: /save search/i }));
    const name = await screen.findByPlaceholderText('Enter search name...');
    fireEvent.change(name, { target: { value: 'Drafts' } });
    fireEvent.keyDown(name, { key: 'Enter' });
    await h.settle();

    await waitFor(() => expect(h.exists('saved-filters')).toBe(true));
    expect(await h.invisibleDirtyPaths()).toEqual([]);
  }, 60_000);
});
