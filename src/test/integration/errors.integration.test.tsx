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

    await act(async () => h.app().refreshStatus());
    await h.settle();

    expect(screen.queryByText('No pending changes')).toBeNull();
    expect(await screen.findByText(/could not read git status/i)).toBeInTheDocument();
  }, 60_000);

  it('one unreadable artifact file does not prevent the rest of the project from loading', async () => {
    h = await startApp();
    for (const title of ['Login', 'Logout']) {
      await act(() =>
        h.app().addArtifact('requirement', {
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
      expect(h.app().artifacts.requirement.map((r) => r.title)).toContain('Logout');
    } finally {
      fs.chmodSync(broken, 0o644);
    }
  }, 90_000);

  it('a failed save does not show the unsaved edit as if it were saved', async () => {
    h = await startApp();
    const req = (await act(() =>
      h.app().addArtifact('requirement', {
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
      expect(h.app().artifacts.requirement.find((r) => r.id === req.id)?.title).toBe('Login');
    } finally {
      fs.chmodSync(file, 0o644);
    }
  }, 60_000);
});
