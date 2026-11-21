/**
 * Baselines are git tags (docs/DESIGN.md §3.5), end to end through the UI.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import git from 'isomorphic-git';
import fs from 'node:fs';
import { startApp, type Harness } from './appHarness';
import { realGitService } from '../../services/realGitService';

async function addAndCommitRequirement(h: Harness, title: string) {
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
  await h.settle();
  for (const p of await h.dirtyPaths()) {
    await act(() => h.app().commitFile(p, `Commit ${p}`));
  }
}

/** Version History → Create Baseline → name → Save */
async function createBaselineInUi(h: Harness, name: string, description: string) {
  await act(async () => h.app().openModal('history'));
  fireEvent.click(await screen.findByRole('button', { name: /create baseline/i }));
  fireEvent.change(screen.getByPlaceholderText('Name (e.g. 1.0)'), { target: { value: name } });
  fireEvent.change(screen.getByPlaceholderText('Description (optional)'), {
    target: { value: description },
  });
  fireEvent.click(screen.getByRole('button', { name: /^save$/i }));
  await h.settle();
}

describe('integration: baselines', () => {
  let h: Harness;
  afterEach(() => h?.cleanup());

  it('a baseline created in the app is a git tag on the current commit, and nothing else', async () => {
    h = await startApp();
    await addAndCommitRequirement(h, 'Login');
    const head = await git.resolveRef({ fs, dir: h.dir, ref: 'HEAD' });
    const commitsBefore = await h.commitMessages();

    const before = Date.now();
    await createBaselineInUi(h, '1.0', 'First release');

    await waitFor(() => expect(h.app().baselines.map((b) => b.name)).toEqual(['1.0']));
    expect(await git.listTags({ fs, dir: h.dir })).toEqual(['1.0']);
    const [tag] = await realGitService.getTagsWithDetails();
    expect(tag).toMatchObject({ name: '1.0', commit: head });
    expect(tag.message.trim()).toBe('First release');
    // Within a minute of now - not 1000x in the future
    expect(Math.abs(tag.timestamp - before)).toBeLessThan(60_000);
    // No files and no commits of its own
    expect(h.exists('baselines')).toBe(false);
    expect(await h.dirtyPaths()).toEqual([]);
    expect(await h.commitMessages()).toEqual(commitsBefore);
  }, 60_000);

  it('a name git cannot use as a tag is refused with a message', async () => {
    h = await startApp();
    await addAndCommitRequirement(h, 'Login');

    await createBaselineInUi(h, 'Release 1', '');

    expect(await screen.findByText('A baseline name cannot contain spaces.')).toBeInTheDocument();
    expect(await git.listTags({ fs, dir: h.dir })).toEqual([]);
  }, 60_000);

  it('baselines are read from the tags, so one made outside the app shows up', async () => {
    h = await startApp();
    await addAndCommitRequirement(h, 'Login');
    await git.annotatedTag({
      fs,
      dir: h.dir,
      ref: 'v2.0',
      message: 'Tagged in a terminal',
      tagger: { name: 'Colleague', email: 'c@example.com' },
    });
    await h.restart();

    expect(h.app().baselines).toEqual([
      expect.objectContaining({ name: 'v2.0', description: 'Tagged in a terminal' }),
    ]);
    await act(async () => h.app().openModal('history'));
    expect(await screen.findByText('v2.0')).toBeInTheDocument();
  }, 60_000);

  it("a baseline's snapshot shows every kind, risks and documents included", async () => {
    h = await startApp();
    await act(() =>
      h.app().addArtifact('risk', { title: 'Outage', description: 'Power cut' } as never)
    );
    await act(() =>
      h.app().addArtifact('document', { title: 'Spec', description: 'All of it' } as never)
    );
    await h.settle();
    for (const p of await h.dirtyPaths()) {
      await act(() => h.app().commitFile(p, `Commit ${p}`));
    }
    await createBaselineInUi(h, '1.0', '');
    await waitFor(() => expect(h.app().baselines).toHaveLength(1));

    fireEvent.click(await screen.findByRole('button', { name: /^view$/i }));
    const risks = await screen.findByRole('button', { name: /^Risks/ });
    await waitFor(() => expect(risks).toHaveTextContent('1'));
    fireEvent.click(risks);
    expect(await screen.findByText('Outage')).toBeInTheDocument();
    expect(screen.getByText('Power cut')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^Documents/ }));
    expect(await screen.findByText('Spec')).toBeInTheDocument();
  }, 60_000);
});
