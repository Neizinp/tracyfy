/**
 * Failures must be visible to the user instead of looking like success.
 */
import { describe, it, expect, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { act, screen } from '@testing-library/react';
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
});
