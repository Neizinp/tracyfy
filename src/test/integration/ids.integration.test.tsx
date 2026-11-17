/**
 * IDs come from the file names in the folder (P4 in docs/DESIGN.md):
 * the next ID is one more than the highest existing file. No counter files.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { act } from '@testing-library/react';
import fs from 'node:fs';
import path from 'node:path';
import { startApp, type Harness } from './appHarness';
import type { Requirement } from '../../types';

async function addRequirement(h: Harness, title: string): Promise<Requirement> {
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
  return created;
}

describe('integration: IDs from file names', () => {
  let h: Harness;
  afterEach(() => h?.cleanup());

  it('creating artifacts writes no counter files and makes no counter commits', async () => {
    h = await startApp();
    await addRequirement(h, 'First');
    await act(() => h.app().createLink('REQ-001', 'REQ-001', 'related_to'));
    await h.settle();

    expect(h.exists('counters')).toBe(false);
    expect((await h.commitMessages()).filter((m) => /counter/i.test(m))).toEqual([]);
  }, 60_000);

  it('a file that arrived while the app was running is not overwritten by the next new artifact', async () => {
    h = await startApp();
    const first = await addRequirement(h, 'Mine');
    expect(first.id).toBe('REQ-001');

    // e.g. a `git pull` in a terminal brings in a colleague's REQ-002
    const colleague = h
      .readFile('requirements/REQ-001.md')!
      .replaceAll('REQ-001', 'REQ-002')
      .replaceAll('Mine', 'Colleague');
    fs.writeFileSync(path.join(h.dir, 'requirements/REQ-002.md'), colleague);

    const next = await addRequirement(h, 'Mine too');
    expect(next.id).toBe('REQ-003');
    expect(h.readFile('requirements/REQ-002.md')).toContain('Colleague');
  }, 60_000);

  it('a deleted artifact keeps its file, so its ID is never handed out again', async () => {
    h = await startApp();
    await addRequirement(h, 'One');
    const two = await addRequirement(h, 'Two');
    await act(async () => h.app().deleteArtifact('requirement', two.id));
    await h.settle();
    await h.restart();

    expect(h.exists(`requirements/${two.id}.md`)).toBe(true);
    expect((await addRequirement(h, 'Three')).id).toBe('REQ-003');
  }, 60_000);
});
