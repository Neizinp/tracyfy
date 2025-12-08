import { describe, it, expect, beforeAll } from 'vitest';
import { realGitService } from '../realGitService';
import { fileSystemService } from '../fileSystemService';

// Set the requirements repo path before running tests
const REQUIREMENTS_REPO_PATH = '/home/jonathan/Documents/ReqTrace';

describe('Repo Path Selection', () => {
  beforeAll(() => {
    // Simulate selecting the requirements repo in the app
    fileSystemService.rootPath = REQUIREMENTS_REPO_PATH;
  });

  it('should use the correct repo path for git history', async () => {
    await realGitService.init();
    const history = await realGitService.getHistory('requirements/REQ-002.md');
    expect(history.length).toBeGreaterThan(0);
    for (const commit of history) {
      const content = await realGitService.readFileAtCommit('requirements/REQ-002.md', commit.hash);
      expect(typeof content === 'string' || content === null).toBe(true);
    }
  });
});
