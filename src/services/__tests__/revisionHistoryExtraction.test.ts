import { describe, it, expect, beforeAll } from 'vitest';
import { realGitService } from '../realGitService';
import { fileSystemService } from '../fileSystemService';
import { extractRevisionFromMarkdown } from '../../utils/markdownUtils';

const REQUIREMENTS_REPO_PATH = '/home/jonathan/Documents/ReqTrace';
const ARTIFACT_PATH = 'requirements/REQ-002.md';

describe('Revision History Extraction', () => {
  beforeAll(() => {
    fileSystemService.rootPath = REQUIREMENTS_REPO_PATH;
  });

  it('should extract valid revision numbers for each commit of the artifact', async () => {
    await realGitService.init();
    const history = await realGitService.getHistory(ARTIFACT_PATH);
    // Debug log
     
    console.log('[TEST] history:', history);
    console.log('[TEST] history length:', history.length);
    expect(history.length).toBeGreaterThan(0);
    for (const commit of history) {
      const content = await realGitService.readFileAtCommit(ARTIFACT_PATH, commit.hash);
      const revision = extractRevisionFromMarkdown(content || '');
      // Log for debug
       
      console.log('[TEST] commit:', commit.hash, 'revision:', revision);
      expect(revision).not.toBe(null);
      expect(revision).not.toBe('—');
      expect(typeof revision).toBe('string');
      expect(revision.length).toBeGreaterThan(0);
    }
  });
});
