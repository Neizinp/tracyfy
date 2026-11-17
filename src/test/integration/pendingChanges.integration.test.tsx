/**
 * Every saved change shows up in Pending Changes, however soon after the
 * previous save or commit it happens.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { act } from '@testing-library/react';
import { startApp, type Harness } from './appHarness';
import type { Requirement } from '../../types';

async function addRequirement(h: Harness, title: string): Promise<Requirement> {
  const created = await act(() =>
    h.app().requirements.handleAddRequirement({
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
  return created;
}

const isRequirement = (p: string) => p.startsWith('requirements/');

const pendingPaths = (h: Harness) =>
  h
    .app()
    .fileSystem.pendingChanges.map((c) => c.path)
    .filter(isRequirement)
    .sort();

describe('integration: pending changes are never stale', () => {
  let h: Harness;
  afterEach(() => h?.cleanup());

  it('a save right after the previous status refresh is shown', async () => {
    h = await startApp();
    const first = await addRequirement(h, 'First');
    // Let the (debounced) status refresh for the first save run, then save again at once
    await act(() => new Promise((r) => setTimeout(r, 350)));
    const second = await addRequirement(h, 'Second');
    await h.settle();

    expect(pendingPaths(h)).toEqual([
      `requirements/${first.id}.md`,
      `requirements/${second.id}.md`,
    ]);
  }, 60_000);

  it('editing a file right after committing it is shown', async () => {
    h = await startApp();
    const req = await addRequirement(h, 'Login');
    await h.settle();
    await act(() => h.app().fileSystem.commitFile(`requirements/${req.id}.md`, 'Add login'));
    await act(() => h.app().requirements.handleUpdateRequirement(req.id, { title: 'Log in' }));
    await h.settle();

    expect((await h.dirtyPaths()).filter(isRequirement)).toEqual([`requirements/${req.id}.md`]);
    expect(pendingPaths(h)).toEqual([`requirements/${req.id}.md`]);
  }, 60_000);
});
