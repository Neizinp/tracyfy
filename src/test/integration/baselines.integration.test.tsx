/**
 * Baselines (git tags) created in the app, end to end.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { act } from '@testing-library/react';
import { startApp, type Harness } from './appHarness';
import { realGitService } from '../../services/realGitService';

describe('integration: baselines', () => {
  let h: Harness;
  afterEach(() => h?.cleanup());

  it('a created baseline has the right date and points at HEAD', async () => {
    h = await startApp();
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
    for (const p of await h.dirtyPaths()) {
      await act(() => h.app().fileSystem.commitFile(p, `Commit ${p}`));
    }

    const before = Date.now();
    await act(() => realGitService.createTag('baseline-1', 'First baseline'));
    const tags = await realGitService.getTagsWithDetails();
    const head = (await realGitService.getHistory(undefined, 1))[0].hash;

    expect(tags).toHaveLength(1);
    expect(tags[0]).toMatchObject({ name: 'baseline-1', commit: head });
    // Within a minute of now - not 1000x in the future
    expect(Math.abs(tags[0].timestamp - before)).toBeLessThan(60_000);
  }, 60_000);
});
