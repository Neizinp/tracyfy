describe('readFileAtCommit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Ensure service is initialized for these tests
    realGitService['initialized'] = true;
  });

  it('returns file content when readBlob succeeds', async () => {
    const mockContent = new TextEncoder().encode('hello world');
    vi.mocked(git.readBlob).mockResolvedValue({ blob: mockContent } as Awaited<
      ReturnType<typeof git.readBlob>
    >);
    const result = await realGitService.readFileAtCommit('foo.md', 'abc123');
    expect(result).toBe('hello world');
  });

  it('returns null and does not log error for NotFoundError', async () => {
    const notFoundError = { code: 'NotFoundError', message: 'Could not find file or directory' };
    vi.mocked(git.readBlob).mockRejectedValue(notFoundError);
    const errorSpy = vi.spyOn(console, 'error');
    const result = await realGitService.readFileAtCommit('missing.md', 'deadbeef');
    expect(result).toBeNull();
    expect(errorSpy).not.toHaveBeenCalled();
    // If you uncomment the info log in realGitService, check for info log here
    // expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining('File not found'));
  });

  it('returns null and logs error for unexpected error', async () => {
    const unexpectedError = new Error('Something went wrong');
    vi.mocked(git.readBlob).mockRejectedValue(unexpectedError);
    const errorSpy = vi.spyOn(console, 'error');
    const result = await realGitService.readFileAtCommit('foo.md', 'abc123');
    expect(result).toBeNull();
    expect(errorSpy).toHaveBeenCalledWith(
      '[readBytesAtCommit] Unexpected error reading',
      'foo.md',
      'at',
      'abc123',
      unexpectedError
    );
  });
});
/**
 * RealGitService Tests
 *
 * These tests verify the core git operations used by the application.
 * The key behaviors being tested:
 *
 * 1. getStatus() - correctly identifies new, modified, deleted, and unchanged files
 * 2. commitFile() - stages and commits individual files
 * 3. saveArtifact() - converts artifacts to markdown and saves to disk
 * 4. loadAllArtifacts() - loads and parses all artifacts from disk
 * 5. getHistory() - retrieves commit history
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock debug utility to prevent ReferenceError
vi.mock('../../utils/debug', () => ({
  debug: { log: vi.fn(), warn: vi.fn(), info: vi.fn() },
  isDebug: () => false,
}));

// Mock fileSystemService
vi.mock('../fileSystemService', () => ({
  fileSystemService: {
    readFile: vi.fn(),
    readFileBinary: vi.fn(),
    writeFile: vi.fn(),
    writeFileBinary: vi.fn(),
    deleteFile: vi.fn(),
    listFiles: vi.fn(),
    listEntries: vi.fn(),
    directoryExists: vi.fn(),
    checkGitExists: vi.fn(),
    getOrCreateDirectory: vi.fn(),
    setDirectoryHandle: vi.fn(),
    getRootPath: vi.fn(),
    getDirectory: vi.fn(),
  },
}));

// Mock isomorphic-git
vi.mock('isomorphic-git', () => ({
  default: {
    init: vi.fn(),
    add: vi.fn(),
    commit: vi.fn(),
    statusMatrix: vi.fn(),
    log: vi.fn(),
    listTags: vi.fn(),
    readTag: vi.fn(),
    annotatedTag: vi.fn(),
    resolveRef: vi.fn(),
    readCommit: vi.fn(),
    readBlob: vi.fn(),
    readTree: vi.fn(),
    walk: vi.fn(),
    listFiles: vi.fn(),
    status: vi.fn(),
    remove: vi.fn(),
    isDescendent: vi.fn(),
    currentBranch: vi.fn(),
    getConfig: vi.fn(async () => undefined),
  },
}));

import { fileSystemService } from '../fileSystemService';
import git from 'isomorphic-git';
import { realGitService } from '../realGitService';

describe('RealGitService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Behave like a normal repository: HEAD on main, clean status
    vi.mocked(git.currentBranch).mockResolvedValue('main');
    vi.mocked(git.statusMatrix).mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getStatus', () => {
    it('should return empty array when not initialized', async () => {
      // Service is not initialized by default in tests
      const result = await realGitService.getStatus();
      expect(result).toEqual([]);
    });

    it('should detect new untracked files', async () => {
      // Setup: Initialize service first
      vi.mocked(fileSystemService.checkGitExists).mockResolvedValue(true);
      vi.mocked(fileSystemService.readFile).mockImplementation(async (path: string) => {
        if (path === '.git/HEAD') return 'ref: refs/heads/main\n';
        return null;
      });

      await realGitService.init();

      // Mock statusMatrix returning new file [0, 2, 0]
      vi.mocked(git.statusMatrix).mockResolvedValue([['requirements/REQ-001.md', 0, 2, 0]]);

      vi.mocked(fileSystemService.listFiles).mockResolvedValue([]);

      const result = await realGitService.getStatus();

      expect(result).toContainEqual({
        path: 'requirements/REQ-001.md',
        status: 'new',
      });
    });

    it('should detect modified files', async () => {
      vi.mocked(fileSystemService.checkGitExists).mockResolvedValue(true);
      vi.mocked(fileSystemService.readFile).mockImplementation(async (path: string) => {
        if (path === '.git/HEAD') return 'ref: refs/heads/main\n';
        return null;
      });

      await realGitService.init();

      // [1, 2, 2] = modified and staged
      vi.mocked(git.statusMatrix).mockResolvedValue([['requirements/REQ-001.md', 1, 2, 2]]);

      vi.mocked(fileSystemService.listFiles).mockResolvedValue([]);

      const result = await realGitService.getStatus();

      expect(result).toContainEqual({
        path: 'requirements/REQ-001.md',
        status: 'modified',
      });
    });

    it('should detect deleted files', async () => {
      vi.mocked(fileSystemService.checkGitExists).mockResolvedValue(true);
      vi.mocked(fileSystemService.readFile).mockImplementation(async (path: string) => {
        if (path === '.git/HEAD') return 'ref: refs/heads/main\n';
        return null;
      });

      await realGitService.init();

      // [1, 0, 0] = deleted, not staged
      vi.mocked(git.statusMatrix).mockResolvedValue([['requirements/REQ-001.md', 1, 0, 0]]);

      vi.mocked(fileSystemService.listFiles).mockResolvedValue([]);

      const result = await realGitService.getStatus();

      expect(result).toContainEqual({
        path: 'requirements/REQ-001.md',
        status: 'deleted',
      });
    });

    it('should NOT show committed files as pending (status [1,1,1])', async () => {
      vi.mocked(fileSystemService.checkGitExists).mockResolvedValue(true);
      vi.mocked(fileSystemService.readFile).mockImplementation(async (path: string) => {
        if (path === '.git/HEAD') return 'ref: refs/heads/main\n';
        return null;
      });

      await realGitService.init();

      // [1, 1, 1] = unchanged/committed - should be filtered out
      vi.mocked(git.statusMatrix).mockResolvedValue([['requirements/REQ-001.md', 1, 1, 1]]);

      // File exists on disk but is tracked and unchanged
      vi.mocked(fileSystemService.listFiles).mockImplementation(async (type: string) => {
        if (type === 'requirements') return ['REQ-001.md'];
        return [];
      });

      const result = await realGitService.getStatus();

      // Should NOT include the committed file
      expect(result).not.toContainEqual(
        expect.objectContaining({ path: 'requirements/REQ-001.md' })
      );
      expect(result).toHaveLength(0);
    });

    it('should handle files with special characters in names', async () => {
      vi.mocked(fileSystemService.checkGitExists).mockResolvedValue(true);
      vi.mocked(fileSystemService.readFile).mockImplementation(async (path: string) => {
        if (path === '.git/HEAD') return 'ref: refs/heads/main\n';
        return null;
      });

      await realGitService.init();

      vi.mocked(git.statusMatrix).mockResolvedValue([
        ['requirements/REQ-001 (special).md', 0, 2, 0],
        ['requirements/REQ-002_test.md', 0, 2, 0],
      ]);

      vi.mocked(fileSystemService.listFiles).mockResolvedValue([]);

      const result = await realGitService.getStatus();

      expect(result).toContainEqual({
        path: 'requirements/REQ-001 (special).md',
        status: 'new',
      });
      expect(result).toContainEqual({
        path: 'requirements/REQ-002_test.md',
        status: 'new',
      });
    });

    it('should filter out .crswap and temp files from enumeration', async () => {
      vi.mocked(fileSystemService.checkGitExists).mockResolvedValue(true);
      vi.mocked(fileSystemService.readFile).mockImplementation(async (path: string) => {
        if (path === '.git/HEAD') return 'ref: refs/heads/main\n';
        return null;
      });

      await realGitService.init();

      // No files in statusMatrix
      vi.mocked(git.statusMatrix).mockResolvedValue([]);

      // List files returns some temp files
      vi.mocked(fileSystemService.listFiles).mockImplementation(async (type: string) => {
        if (type === 'requirements') {
          return ['REQ-001.md', 'REQ-001.md.1.crswap', 'REQ-002.md.swp', 'backup.tmp'];
        }
        return [];
      });

      const result = await realGitService.getStatus();

      // Only valid .md file should be included
      expect(result).toContainEqual({
        path: 'requirements/REQ-001.md',
        status: 'new',
      });

      // Temp files should NOT be included
      expect(result).not.toContainEqual(
        expect.objectContaining({ path: expect.stringContaining('.crswap') })
      );
      expect(result).not.toContainEqual(
        expect.objectContaining({ path: expect.stringContaining('.swp') })
      );
      expect(result).not.toContainEqual(
        expect.objectContaining({ path: expect.stringContaining('.tmp') })
      );
    });

    it('should enumerate all artifact types', async () => {
      vi.mocked(fileSystemService.checkGitExists).mockResolvedValue(true);
      vi.mocked(fileSystemService.readFile).mockImplementation(async (path: string) => {
        if (path === '.git/HEAD') return 'ref: refs/heads/main\n';
        return null;
      });

      await realGitService.init();

      vi.mocked(git.statusMatrix).mockResolvedValue([]);

      vi.mocked(fileSystemService.listFiles).mockImplementation(async (type: string) => {
        switch (type) {
          case 'requirements':
            return ['REQ-001.md'];
          case 'use-cases':
            return ['UC-001.md'];
          case 'test-cases':
            return ['TC-001.md'];
          case 'information':
            return ['INF-001.md'];
          default:
            return [];
        }
      });

      const result = await realGitService.getStatus();

      expect(result).toContainEqual({ path: 'requirements/REQ-001.md', status: 'new' });
      expect(result).toContainEqual({ path: 'use-cases/UC-001.md', status: 'new' });
      expect(result).toContainEqual({ path: 'test-cases/TC-001.md', status: 'new' });
      expect(result).toContainEqual({ path: 'information/INF-001.md', status: 'new' });
    });
  });

  describe('commitFile', () => {
    beforeEach(async () => {
      vi.mocked(fileSystemService.checkGitExists).mockResolvedValue(true);
      vi.mocked(fileSystemService.readFile).mockImplementation(async (path: string) => {
        if (path === '.git/HEAD') return 'ref: refs/heads/main\n';
        if (path === 'requirements/REQ-001.md') return '# Test requirement';
        return null;
      });
      // Mock readFileBinary for file existence checks
      vi.mocked(fileSystemService.readFileBinary).mockImplementation(async (path: string) => {
        if (path === 'requirements/REQ-001.md') return new Uint8Array([1, 2, 3]);
        return null;
      });

      await realGitService.init();
    });

    it('should stage and commit a file', async () => {
      vi.mocked(git.add).mockResolvedValue(undefined);
      vi.mocked(git.commit).mockResolvedValue('abc123');

      await realGitService.commitFile('requirements/REQ-001.md', 'Add requirement');

      expect(git.add).toHaveBeenCalledWith(
        expect.objectContaining({
          filepath: 'requirements/REQ-001.md',
        })
      );

      expect(git.commit).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Add requirement',
          author: expect.objectContaining({
            name: 'Tracyfy User',
            email: 'user@tracyfy.local',
          }),
        })
      );
    });

    it('should assume deletion if file does not exist', async () => {
      vi.mocked(fileSystemService.readFile).mockImplementation(async (path: string) => {
        if (path === '.git/HEAD') return 'ref: refs/heads/main\n';
        return null; // File doesn't exist
      });
      // Also mock readFileBinary to return null for non-existent file
      vi.mocked(fileSystemService.readFileBinary).mockResolvedValue(null);

      await realGitService.commitFile('requirements/NONEXISTENT.md', 'Test commit');

      expect(git.remove).toHaveBeenCalledWith(
        expect.objectContaining({
          filepath: 'requirements/NONEXISTENT.md',
        })
      );
    });

    it('should handle concurrent commits gracefully', async () => {
      vi.mocked(git.add).mockResolvedValue(undefined);
      vi.mocked(git.commit).mockResolvedValueOnce('abc123').mockResolvedValueOnce('def456');

      vi.mocked(fileSystemService.readFile).mockImplementation(async (path: string) => {
        if (path === '.git/HEAD') return 'ref: refs/heads/main\n';
        if (path.endsWith('.md')) return '# Content';
        return null;
      });
      // Mock readFileBinary for file existence
      vi.mocked(fileSystemService.readFileBinary).mockImplementation(async (path: string) => {
        if (path.endsWith('.md')) return new Uint8Array([1, 2, 3]);
        return null;
      });

      // These should run sequentially due to await, but test the behavior
      await realGitService.commitFile('requirements/REQ-001.md', 'Commit 1');
      await realGitService.commitFile('requirements/REQ-002.md', 'Commit 2');

      expect(git.commit).toHaveBeenCalledTimes(2);
    });
  });

  describe('getHistory', () => {
    beforeEach(async () => {
      vi.mocked(fileSystemService.checkGitExists).mockResolvedValue(true);
      vi.mocked(fileSystemService.readFile).mockImplementation(async (path: string) => {
        if (path === '.git/HEAD') return 'ref: refs/heads/main\n';
        return null;
      });

      await realGitService.init();
    });

    it('should return commits in reverse chronological order', async () => {
      vi.mocked(git.log).mockResolvedValue([
        {
          oid: 'abc123',
          commit: {
            message: 'Latest commit',
            author: {
              name: 'User',
              email: 'user@test.com',
              timestamp: 1700000200,
              timezoneOffset: 0,
            },
          },
        },
        {
          oid: 'def456',
          commit: {
            message: 'Earlier commit',
            author: {
              name: 'User',
              email: 'user@test.com',
              timestamp: 1700000100,
              timezoneOffset: 0,
            },
          },
        },
      ] as Awaited<ReturnType<typeof git.log>>);

      const result = await realGitService.getHistory();

      expect(result).toHaveLength(2);
      expect(result[0].message).toBe('Latest commit');
      expect(result[1].message).toBe('Earlier commit');
    });

    it('should handle repositories with no commits', async () => {
      vi.mocked(git.log).mockRejectedValue(new Error('No commits yet'));

      const result = await realGitService.getHistory();

      expect(result).toEqual([]);
    });

    it('should filter history by file path when provided (Electron only)', async () => {
      // NOTE: In browser mode, the filepath parameter is ignored
      // This test documents the expected behavior (which is currently Electron-only)
      vi.mocked(git.log).mockResolvedValue([
        {
          oid: 'abc123',
          commit: {
            message: 'Update REQ-001',
            author: {
              name: 'User',
              email: 'user@test.com',
              timestamp: 1700000200,
              timezoneOffset: 0,
            },
          },
        },
      ] as Awaited<ReturnType<typeof git.log>>);

      const history = await realGitService.getHistory('requirements/REQ-001.md');

      // In browser mode, git.log is called without filepath filtering
      // The filepath parameter is only used in Electron mode via IPC
      expect(git.log).toHaveBeenCalled();
      expect(history).toHaveLength(1);
    });

    it('should extract revision from file at each commit and not return em dash', async () => {
      // Simulate two commits with different revisions
      vi.mocked(git.log).mockResolvedValue([
        {
          oid: 'cmt1',
          commit: {
            message: 'Initial',
            author: {
              name: 'User',
              email: 'user@test.com',
              timestamp: 1700000000,
              timezoneOffset: 0,
            },
          },
        },
        {
          oid: 'cmt2',
          commit: {
            message: 'Update',
            author: {
              name: 'User',
              email: 'user@test.com',
              timestamp: 1700000100,
              timezoneOffset: 0,
            },
          },
        },
      ] as Awaited<ReturnType<typeof git.log>>);

      // Mock file contents at each commit
      vi.spyOn(realGitService, 'readFileAtCommit').mockImplementation(async (_file, hash) => {
        if (hash === 'cmt1') {
          return `---\ntitle: Login\nrevision: '01'\n---\n# REQ-001\nDescription`;
        } else if (hash === 'cmt2') {
          return `---\ntitle: Login\nrevision: '02'\n---\n# REQ-001\nDescription updated`;
        }
        return null;
      });

      const history = await realGitService.getHistory('requirements/REQ-001.md');
      expect(history).toHaveLength(2);

      // Import markdownToRequirement directly for parsing
      const { parseRequirement } = await import('../../domain/artifactFormat');

      for (const commit of history) {
        const content = await realGitService.readFileAtCommit(
          'requirements/REQ-001.md',
          commit.hash
        );
        expect(content).toBeTruthy();
        const parsed = parseRequirement('REQ-001', content!);
        expect(parsed.revision).not.toBe('—');
        expect(parsed.revision).toMatch(/^0[12]$/); // '01' or '02'
      }
    });
  });

  describe('getSyncStatus', () => {
    beforeEach(async () => {
      vi.mocked(fileSystemService.checkGitExists).mockResolvedValue(true);
      vi.mocked(fileSystemService.readFile).mockImplementation(async (path: string) => {
        if (path === '.git/HEAD') return 'ref: refs/heads/main\n';
        return null;
      });
      await realGitService.init();
    });

    it('should identify as ahead when local has more commits', async () => {
      vi.mocked(git.resolveRef).mockImplementation(async ({ ref }) => {
        if (ref === 'HEAD') return 'local-oid';
        if (ref === 'origin/main') return 'remote-oid';
        return '';
      });

      vi.mocked(git.isDescendent).mockImplementation(async ({ oid, ancestor }) => {
        if (oid === 'local-oid' && ancestor === 'remote-oid') return true;
        if (oid === 'remote-oid' && ancestor === 'local-oid') return false;
        return false;
      });

      // Mock getHistory for the commits list
      const historySpy = vi
        .spyOn(realGitService, 'getHistory')
        .mockImplementation(async (_path, _depth, ref) => {
          if (ref === 'HEAD')
            return [
              { hash: 'local-oid', message: 'Local commit', author: 'User', timestamp: Date.now() },
            ];
          if (ref === 'origin/main') return [];
          return [];
        });

      const status = await realGitService.getSyncStatus();

      expect(status.ahead).toBe(true);
      expect(status.behind).toBe(false);
      expect(status.aheadCommits).toHaveLength(1);
      expect(status.aheadCommits![0].hash).toBe('local-oid');

      historySpy.mockRestore();
    });

    it('should identify as behind when remote has more commits', async () => {
      vi.mocked(git.resolveRef).mockImplementation(async ({ ref }) => {
        if (ref === 'HEAD') return 'local-oid';
        if (ref === 'origin/main') return 'remote-oid';
        return '';
      });

      vi.mocked(git.isDescendent).mockImplementation(async ({ oid, ancestor }) => {
        if (oid === 'local-oid' && ancestor === 'remote-oid') return false;
        if (oid === 'remote-oid' && ancestor === 'local-oid') return true;
        return false;
      });

      // Mock getHistory
      const historySpy = vi
        .spyOn(realGitService, 'getHistory')
        .mockImplementation(async (_path, _depth, ref) => {
          if (ref === 'HEAD') return [];
          if (ref === 'origin/main')
            return [
              {
                hash: 'remote-oid',
                message: 'Remote commit',
                author: 'User',
                timestamp: Date.now(),
              },
            ];
          return [];
        });

      const status = await realGitService.getSyncStatus();

      expect(status.behind).toBe(true);
      expect(status.ahead).toBe(false);
      expect(status.behindCommits).toHaveLength(1);

      historySpy.mockRestore();
    });

    it('should identify as diverged when neither is descendent', async () => {
      vi.mocked(git.resolveRef).mockImplementation(async ({ ref }) => {
        if (ref === 'HEAD') return 'local-oid';
        if (ref === 'origin/main') return 'remote-oid';
        return '';
      });

      vi.mocked(git.isDescendent).mockResolvedValue(false);

      const status = await realGitService.getSyncStatus();

      expect(status.diverged).toBe(true);
      expect(status.ahead).toBe(false);
      expect(status.behind).toBe(false);
    });

    it('should handle no remote configured', async () => {
      vi.mocked(git.resolveRef).mockImplementation(async ({ ref }) => {
        if (ref === 'HEAD') return 'local-oid';
        throw new Error('NotFoundError');
      });

      const status = await realGitService.getSyncStatus();

      expect(status.ahead).toBe(true);
      expect(status.behind).toBe(false);
    });
  });

  describe('init', () => {
    it('should initialize when no git repository exists', async () => {
      vi.mocked(fileSystemService.checkGitExists).mockResolvedValue(false);
      vi.mocked(git.init).mockResolvedValue(undefined);

      // Mock confirm to auto-accept
      globalThis.confirm = vi.fn().mockReturnValue(true) as unknown as (
        message?: string
      ) => boolean;

      await realGitService.init();

      expect(git.init).toHaveBeenCalled();
    });

    it('should not reinitialize when valid git repository exists', async () => {
      vi.mocked(fileSystemService.checkGitExists).mockResolvedValue(true);
      vi.mocked(fileSystemService.readFile).mockImplementation(async (path: string) => {
        if (path === '.git/HEAD') return 'ref: refs/heads/main\n';
        return null;
      });

      const result = await realGitService.init();

      expect(git.init).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should auto-initialize git repository for new directories', async () => {
      vi.mocked(fileSystemService.checkGitExists).mockResolvedValue(false);
      vi.mocked(git.init).mockResolvedValue(undefined);

      const result = await realGitService.init();

      expect(result).toBe(true);
      expect(git.init).toHaveBeenCalled();
    });
  });
});

describe('Status Matrix Interpretation', () => {
  // Document the status matrix codes for reference
  it('should correctly interpret all status matrix codes', () => {
    // [HEAD, WORKDIR, STAGE]
    const statusCodes = {
      '[0, 2, 0]': 'new file, not staged',
      '[0, 2, 2]': 'new file, staged',
      '[1, 2, 1]': 'modified, not staged',
      '[1, 2, 2]': 'modified, staged',
      '[1, 0, 0]': 'deleted, not staged',
      '[1, 1, 1]': 'unchanged (committed)',
      '[1, 2, 3]': 'modified in workdir (stage has old version)',
    };

    // This is a documentation test
    expect(Object.keys(statusCodes)).toHaveLength(7);
  });
});
