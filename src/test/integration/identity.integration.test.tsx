/**
 * The git author is the user (P5 in docs/DESIGN.md): who you are is
 * user.name / user.email in the repository's .git/config, and every commit the
 * app makes is authored by you. There are no user files.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import git from 'isomorphic-git';
import fs from 'node:fs';
import { startApp, type Harness } from './appHarness';

async function addRequirement(h: Harness, title: string) {
  const created = await act(() =>
    h.app().addArtifact('requirement', {
      title,
      description: '',
      text: '',
      rationale: '',
      status: 'draft',
      priority: 'medium',
      dateCreated: Date.now(),
    } as never)
  );
  if (!created) throw new Error(`Could not create ${title}`);
  await h.settle();
  return created;
}

/** Commit one pending change through the Pending Changes panel */
async function commitInPanel(h: Harness, message: string) {
  const input = await screen.findByPlaceholderText('Commit message (required)');
  fireEvent.change(input, { target: { value: message } });
  fireEvent.keyDown(input, { key: 'Enter' });
  await waitFor(async () => expect((await h.commitMessages())[0]).toBe(message));
}

async function headAuthor(h: Harness) {
  const [head] = await git.log({ fs, dir: h.dir, depth: 1 });
  return head.commit.author;
}

describe('integration: the git author is the user', () => {
  let h: Harness;
  afterEach(() => h?.cleanup());

  it('onboarding sets user.name and user.email in the repository, and commits are authored by them', async () => {
    h = await startApp({ userName: 'Ada Lovelace' });

    expect(await git.getConfig({ fs, dir: h.dir, path: 'user.name' })).toBe('Ada Lovelace');
    expect(await git.getConfig({ fs, dir: h.dir, path: 'user.email' })).toBe('test@example.com');
    expect(h.exists('users')).toBe(false);

    await addRequirement(h, 'Login');
    await commitInPanel(h, 'Add login');
    expect(await headAuthor(h)).toMatchObject({ name: 'Ada Lovelace', email: 'test@example.com' });
  }, 60_000);

  it('a repository that already has user.name opens without asking who you are', async () => {
    h = await startApp({ userName: 'Ada Lovelace' });
    await h.restart();

    expect(screen.queryByPlaceholderText('Enter your name')).toBeNull();
    expect(h.app().currentUser).toEqual({ name: 'Ada Lovelace', email: 'test@example.com' });
  }, 60_000);

  it('changing your name in User Settings changes the author of the next commit', async () => {
    h = await startApp({ userName: 'Ada' });
    await act(async () => h.app().openModal('user-settings'));
    const dialog = await screen.findByRole('dialog', { name: /user settings/i });
    fireEvent.change(within(dialog).getByPlaceholderText('Enter your name'), {
      target: { value: 'Ada Lovelace' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: /^save$/i }));
    await waitFor(() => expect(h.app().currentUser?.name).toBe('Ada Lovelace'));
    fireEvent.click(within(dialog).getByRole('button', { name: /close/i }));

    await addRequirement(h, 'Login');
    await commitInPanel(h, 'Add login');
    expect((await headAuthor(h)).name).toBe('Ada Lovelace');
    expect(await git.getConfig({ fs, dir: h.dir, path: 'user.name' })).toBe('Ada Lovelace');
  }, 60_000);

  it('people who committed to the repository are known by name', async () => {
    h = await startApp({ userName: 'Ada' });
    await h.colleagueCommits('Grace');

    expect(h.app().people.map((p) => p.name)).toEqual(['Ada', 'Grace']);
  }, 60_000);
});
