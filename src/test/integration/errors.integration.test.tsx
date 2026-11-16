/**
 * Failures must be visible to the user instead of looking like success.
 */
import { describe, it, expect, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { act, fireEvent, screen, within } from '@testing-library/react';
import { startApp, type Harness } from './appHarness';

describe('integration: errors are shown, not swallowed', () => {
  let h: Harness;
  afterEach(() => h?.cleanup());

  it('a broken git status is reported in the Pending Changes panel, not "No pending changes"', async () => {
    h = await startApp();
    // Something the user should be told about: git can't read the repository
    fs.writeFileSync(path.join(h.dir, '.git', 'index'), 'not a git index');

    await act(async () => h.app().fileSystem.refreshStatus());
    await h.settle();

    expect(screen.queryByText('No pending changes')).toBeNull();
    expect(await screen.findByText(/could not read git status/i)).toBeInTheDocument();
  }, 60_000);

  it('a workflow that cannot be saved shows an error instead of silently doing nothing', async () => {
    h = await startApp({ initialRoute: '/workflows' });
    await act(() => h.app().user.createUser('Reviewer'));
    await act(() =>
      h.app().requirements.handleAddRequirement({
        title: 'Login',
        description: '',
        text: '',
        status: 'draft',
        priority: 'medium',
        dateCreated: Date.now(),
      } as never)
    );
    await h.settle();
    // A real write failure: the workflows folder is read-only
    const wfDir = path.join(h.dir, 'workflows');
    fs.mkdirSync(wfDir, { recursive: true });
    fs.chmodSync(wfDir, 0o555);
    try {
      fireEvent.click(screen.getByRole('button', { name: /create new/i }));
      fireEvent.click(await screen.findByText('New Workflow'));
      const dialog = await screen.findByRole('dialog');
      fireEvent.change(within(dialog).getAllByRole('textbox')[0], { target: { value: 'Approve' } });
      const reviewer = h.app().user.users.find((u) => u.name === 'Reviewer')!;
      fireEvent.change(within(dialog).getByRole('combobox'), { target: { value: reviewer.id } });
      fireEvent.change(within(dialog).getByPlaceholderText('Search artifacts by ID or title...'), {
        target: { value: 'Login' },
      });
      fireEvent.click(await within(dialog).findByText('Login'));
      fireEvent.click(within(dialog).getByRole('button', { name: /create workflow/i }));

      expect(await screen.findByText(/could not save workflow/i)).toBeInTheDocument();
    } finally {
      fs.chmodSync(wfDir, 0o755);
    }
  }, 60_000);

  it('one unreadable artifact file does not prevent the rest of the project from loading', async () => {
    h = await startApp();
    for (const title of ['Login', 'Logout']) {
      await act(() =>
        h.app().requirements.handleAddRequirement({
          title,
          description: '',
          text: '',
          status: 'draft',
          priority: 'medium',
          dateCreated: Date.now(),
        } as never)
      );
    }
    await h.settle();
    const broken = path.join(h.dir, 'requirements', 'REQ-001.md');
    fs.chmodSync(broken, 0o000);
    try {
      const outcome = await h.restart().then(
        () => 'ready',
        (e: Error) => e.message
      );
      expect(outcome).toBe('ready');
      expect(h.app().globalState.globalRequirements.map((r) => r.title)).toContain('Logout');
    } finally {
      fs.chmodSync(broken, 0o644);
    }
  }, 90_000);

  it('a failed save does not show the unsaved edit as if it were saved', async () => {
    h = await startApp();
    const req = (await act(() =>
      h.app().requirements.handleAddRequirement({
        title: 'Login',
        description: '',
        text: '',
        status: 'draft',
        priority: 'medium',
        dateCreated: Date.now(),
      } as never)
    ))!;
    await h.settle();
    const file = path.join(h.dir, 'requirements', `${req.id}.md`);
    fs.chmodSync(file, 0o444); // the save will really fail
    try {
      fireEvent.click(await screen.findByText('Login'));
      const dialog = await screen.findByRole('dialog');
      fireEvent.change(within(dialog).getByDisplayValue('Login'), {
        target: { value: 'Login v2' },
      });
      fireEvent.click(within(dialog).getByRole('button', { name: /save changes/i }));
      await h.settle();

      expect(await screen.findByText(/failed to update/i)).toBeInTheDocument();
      // What the app shows must match what is on disk
      expect(h.readFile(`requirements/${req.id}.md`)).not.toContain('Login v2');
      expect(h.app().requirements.requirements.find((r) => r.id === req.id)?.title).toBe('Login');
    } finally {
      fs.chmodSync(file, 0o644);
    }
  }, 60_000);
});
