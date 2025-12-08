import { describe, it, expect } from 'vitest';
import { realGitService } from '../realGitService';

// This test assumes the repo is initialized and requirements/REQ-002.md exists with history

describe('readFileAtCommit', () => {
  it('should read file content at each commit for REQ-002', async () => {
    await realGitService.init();
    const history = await realGitService.getHistory('requirements/REQ-002.md');
    expect(history.length).toBeGreaterThan(0);
    for (const commit of history) {
      const content = await realGitService.readFileAtCommit('requirements/REQ-002.md', commit.hash);
      // Log for debug
      // eslint-disable-next-line no-console
      console.log('[TEST] commit:', commit.hash, 'content:', content ? content.slice(0, 100) : null);
      // Should not throw, should return string or null
      expect(typeof content === 'string' || content === null).toBe(true);
    }
  });
});
