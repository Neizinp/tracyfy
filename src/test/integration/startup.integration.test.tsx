import { describe, it, expect, afterEach } from 'vitest';
import { startApp, type Harness } from './appHarness';

describe('integration: app startup', () => {
  let h: Harness;
  afterEach(() => h?.cleanup());

  it('initializes a git repo with user and project in an empty folder', async () => {
    h = await startApp();
    expect(h.exists('.git')).toBe(true);
    expect(h.app().user.currentUser?.name).toBe('Test User');
    expect(h.app().project.currentProject?.name).toBe('Test Project');
  }, 30_000);
});
