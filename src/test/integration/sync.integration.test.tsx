/**
 * Remote sync through the sidebar's "Remote Sync" section.
 *
 * isomorphic-git only speaks http(s), so the network boundary is simulated:
 * the git:pull / git:push IPC handlers are replaced. A "pull" really commits
 * a collaborator's change into the repo, exactly what a merged pull leaves
 * on disk. Everything else (app, providers, disk, git) is real.
 */
import { describe, it, expect, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import git from 'isomorphic-git';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { startApp, type Harness } from './appHarness';
import { requirementToMarkdown } from '../../utils/markdownUtils';

/** Configure a remote the way a user does: Remote Settings → URL + token → Add Remote → close */
async function connectRemote(h: Harness) {
  // Never touch the real network
  h.stubGitOp('fetch', async () => undefined);
  fireEvent.click(screen.getByTitle('Remote Settings'));
  fireEvent.change(await screen.findByPlaceholderText('https://github.com/username/repo.git'), {
    target: { value: 'https://example.invalid/team/repo.git' },
  });
  fireEvent.change(document.querySelector('input[type="password"]')!, {
    target: { value: 'test-token' },
  });
  fireEvent.click(screen.getByRole('button', { name: /add remote/i }));
  await screen.findByText(/remote added successfully/i);
  fireEvent.click(screen.getByRole('button', { name: /^close$/i }));
  await screen.findByRole('button', { name: /^pull$/i });
}

describe('integration: remote sync', () => {
  let h: Harness;
  afterEach(() => h?.cleanup());

  it('after Pull, a collaborator’s new requirement shows up in the app', async () => {
    h = await startApp();
    await connectRemote(h);

    // The "remote" merges a collaborator's commit into the working tree
    h.stubGitOp('pull', async () => {
      const file = path.join(h.dir, 'requirements', 'REQ-050.md');
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(
        file,
        requirementToMarkdown({
          id: 'REQ-050',
          title: 'From a colleague',
          text: 'Pulled text',
          revision: '01',
          dateCreated: 1,
          lastModified: 1,
        })
      );
      await git.add({ fs, dir: h.dir, filepath: '.' });
      await git.commit({
        fs,
        dir: h.dir,
        message: 'Colleague adds REQ-050',
        author: { name: 'Colleague', email: 'c@example.com' },
      });
      return { ok: true, conflicts: [] };
    });

    fireEvent.click(screen.getByRole('button', { name: /^pull$/i }));
    await h.settle();

    await waitFor(() =>
      expect(h.app().globalState.requirements.map((r) => r.id)).toContain('REQ-050')
    );
    expect(h.app().requirements.requirements.map((r) => r.title)).toContain('From a colleague');
  }, 60_000);

  it('merge conflicts on Pull are shown to the user', async () => {
    h = await startApp();
    await connectRemote(h);
    h.stubGitOp('pull', async () => ({
      ok: false,
      conflicts: ['requirements/REQ-001.md'],
    }));

    fireEvent.click(screen.getByRole('button', { name: /^pull$/i }));

    expect(
      await screen.findByText(/merge conflicts in: requirements\/REQ-001\.md/i)
    ).toBeInTheDocument();
  }, 60_000);

  it('a failing automatic push is shown to the user', async () => {
    h = await startApp();
    await connectRemote(h);
    localStorage.setItem('tracyfy-auto-sync', 'true');
    window.dispatchEvent(new CustomEvent('auto-sync-changed', { detail: { enabled: true } }));
    h.stubGitOp('push', async () => {
      throw new Error('remote rejected: permission denied');
    });

    // Commit something → auto-sync pushes
    await act(() =>
      h.app().requirements.handleAddRequirement({
        title: 'Login',
        text: '',
        description: '',
        status: 'draft',
        priority: 'medium',
        dateCreated: Date.now(),
      } as never)
    );
    await h.settle();
    for (const p of await h.dirtyPaths()) {
      await act(() => h.app().fileSystem.commitFile(p, `Commit ${p}`));
    }
    await h.settle();

    expect(await screen.findByText(/permission denied/i)).toBeInTheDocument();
  }, 60_000);
});
