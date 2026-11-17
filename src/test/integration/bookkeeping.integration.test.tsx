/**
 * Workflows, custom attributes and saved searches through the real UI.
 *
 * Core invariant: after any user action, every uncommitted file must be
 * visible in the Pending Changes panel (or already be committed). Files the
 * panel hides must be committed by the app itself.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { startApp, type Harness } from './appHarness';

describe('integration: no invisible uncommitted files', () => {
  let h: Harness;
  afterEach(() => h?.cleanup());

  it('right after onboarding', async () => {
    h = await startApp();
    expect(await h.invisibleDirtyPaths()).toEqual([]);
  }, 60_000);

  it('creating a custom attribute', async () => {
    h = await startApp({ initialRoute: '/custom-attributes' });

    fireEvent.click(screen.getByRole('button', { name: /create new/i }));
    fireEvent.click(await screen.findByText('New Custom Attribute'));
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByPlaceholderText('e.g., Component, Release Version'), {
      target: { value: 'Component' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: /create attribute/i }));
    await h.settle();

    expect(await screen.findByText('Component')).toBeInTheDocument();
    expect(await h.invisibleDirtyPaths()).toEqual([]);
    // Part of the project settings, committed by the user like any other change
    expect(await h.dirtyPaths()).toEqual(['tracyfy.yaml']);
    expect(h.readFile('tracyfy.yaml')).toContain('name: Component');
    expect(h.exists('custom-attributes')).toBe(false);
    expect(await h.commitMessages()).toEqual([]);
  }, 60_000);

  it('creating a workflow', async () => {
    h = await startApp({ initialRoute: '/workflows' });
    await h.colleagueCommits('Reviewer');
    await act(() =>
      h.app().addArtifact('requirement', {
        title: 'Login',
        description: '',
        text: '',
        rationale: '',
        status: 'draft',
        priority: 'medium',
        dateCreated: Date.now(),
      } as never)
    );
    await h.settle();

    fireEvent.click(screen.getByRole('button', { name: /create new/i }));
    fireEvent.click(await screen.findByText('New Workflow'));
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getAllByRole('textbox')[0], {
      target: { value: 'Approve login' },
    });
    fireEvent.change(within(dialog).getByRole('combobox'), { target: { value: 'Reviewer' } });
    fireEvent.change(within(dialog).getByPlaceholderText('Search artifacts by ID or title...'), {
      target: { value: 'Login' },
    });
    fireEvent.click(await within(dialog).findByText('Login'));
    fireEvent.click(within(dialog).getByRole('button', { name: /create workflow/i }));
    await h.settle();

    await waitFor(() => expect(h.exists('workflows')).toBe(true));
    expect(await screen.findByText('Approve login')).toBeInTheDocument();
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
