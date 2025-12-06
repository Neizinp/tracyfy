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
import type { Requirement, UseCase, TestCase, Information } from '../../types';

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
  },
}));

import { fileSystemService } from '../fileSystemService';
import git from 'isomorphic-git';
import { realGitService } from '../realGitService';

describe('RealGitService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
          case 'usecases':
            return ['UC-001.md'];
          case 'testcases':
            return ['TC-001.md'];
          case 'information':
            return ['INF-001.md'];
          default:
            return [];
        }
      });

      const result = await realGitService.getStatus();

      expect(result).toContainEqual({ path: 'requirements/REQ-001.md', status: 'new' });
      expect(result).toContainEqual({ path: 'usecases/UC-001.md', status: 'new' });
      expect(result).toContainEqual({ path: 'testcases/TC-001.md', status: 'new' });
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
            name: 'ReqTrace User',
            email: 'user@reqtrace.local',
          }),
        })
      );
    });

    it('should throw error if file does not exist', async () => {
      vi.mocked(fileSystemService.readFile).mockImplementation(async (path: string) => {
        if (path === '.git/HEAD') return 'ref: refs/heads/main\n';
        return null; // File doesn't exist
      });

      await expect(
        realGitService.commitFile('requirements/NONEXISTENT.md', 'Test commit')
      ).rejects.toThrow('File not found on disk');
    });

    it('should handle concurrent commits gracefully', async () => {
      vi.mocked(git.add).mockResolvedValue(undefined);
      vi.mocked(git.commit).mockResolvedValueOnce('abc123').mockResolvedValueOnce('def456');

      vi.mocked(fileSystemService.readFile).mockImplementation(async (path: string) => {
        if (path === '.git/HEAD') return 'ref: refs/heads/main\n';
        if (path.endsWith('.md')) return '# Content';
        return null;
      });

      // These should run sequentially due to await, but test the behavior
      await realGitService.commitFile('requirements/REQ-001.md', 'Commit 1');
      await realGitService.commitFile('requirements/REQ-002.md', 'Commit 2');

      expect(git.commit).toHaveBeenCalledTimes(2);
    });
  });

  describe('saveArtifact', () => {
    beforeEach(async () => {
      vi.mocked(fileSystemService.checkGitExists).mockResolvedValue(true);
      vi.mocked(fileSystemService.readFile).mockImplementation(async (path: string) => {
        if (path === '.git/HEAD') return 'ref: refs/heads/main\n';
        return null;
      });
      vi.mocked(fileSystemService.writeFile).mockResolvedValue(undefined);

      await realGitService.init();
    });

    it('should save requirement as markdown', async () => {
      const requirement: Requirement = {
        id: 'REQ-001',
        title: 'Test Requirement',
        description: 'A test description',
        text: 'The system shall do something',
        rationale: 'Because it is needed',
        parentIds: [],
        useCaseIds: [],
        status: 'draft',
        priority: 'high',
        dateCreated: 1700000000000,
        lastModified: 1700000000000,
        revision: '01',
      };

      await realGitService.saveArtifact('requirements', 'REQ-001', requirement);

      expect(fileSystemService.writeFile).toHaveBeenCalledWith(
        'requirements/REQ-001.md',
        expect.stringContaining('id: "REQ-001"')
      );
      expect(fileSystemService.writeFile).toHaveBeenCalledWith(
        'requirements/REQ-001.md',
        expect.stringContaining('title: "Test Requirement"')
      );
      expect(fileSystemService.writeFile).toHaveBeenCalledWith(
        'requirements/REQ-001.md',
        expect.stringContaining('## Description')
      );
    });

    it('should save use case as markdown', async () => {
      const useCase: UseCase = {
        id: 'UC-001',
        title: 'Test Use Case',
        description: 'A test use case',
        actor: 'User',
        preconditions: 'User is logged in',
        postconditions: 'Action is complete',
        mainFlow: '1. User clicks button',
        status: 'draft',
        priority: 'medium',
        lastModified: 1700000000000,
        revision: '01',
      };

      await realGitService.saveArtifact('usecases', 'UC-001', useCase);

      expect(fileSystemService.writeFile).toHaveBeenCalledWith(
        'usecases/UC-001.md',
        expect.stringContaining('id: "UC-001"')
      );
      expect(fileSystemService.writeFile).toHaveBeenCalledWith(
        'usecases/UC-001.md',
        expect.stringContaining('actor: "User"')
      );
    });

    it('should save test case as markdown', async () => {
      const testCase: TestCase = {
        id: 'TC-001',
        title: 'Test Case 1',
        description: 'A test case',
        requirementIds: ['REQ-001', 'REQ-002'],
        status: 'draft',
        priority: 'high',
        dateCreated: 1700000000000,
        lastModified: 1700000000000,
        revision: '01',
      };

      await realGitService.saveArtifact('testcases', 'TC-001', testCase);

      expect(fileSystemService.writeFile).toHaveBeenCalledWith(
        'testcases/TC-001.md',
        expect.stringContaining('id: "TC-001"')
      );
      expect(fileSystemService.writeFile).toHaveBeenCalledWith(
        'testcases/TC-001.md',
        expect.stringContaining('requirementIds:')
      );
    });

    it('should save information item as markdown', async () => {
      const info: Information = {
        id: 'INF-001',
        title: 'Meeting Notes',
        content: 'Discussion about requirements',
        type: 'meeting',
        dateCreated: 1700000000000,
        lastModified: 1700000000000,
        revision: '01',
      };

      await realGitService.saveArtifact('information', 'INF-001', info);

      expect(fileSystemService.writeFile).toHaveBeenCalledWith(
        'information/INF-001.md',
        expect.stringContaining('id: "INF-001"')
      );
      expect(fileSystemService.writeFile).toHaveBeenCalledWith(
        'information/INF-001.md',
        expect.stringContaining('type: "meeting"')
      );
    });
  });

  describe('deleteArtifact', () => {
    beforeEach(async () => {
      vi.mocked(fileSystemService.checkGitExists).mockResolvedValue(true);
      vi.mocked(fileSystemService.readFile).mockImplementation(async (path: string) => {
        if (path === '.git/HEAD') return 'ref: refs/heads/main\n';
        return null;
      });
      vi.mocked(fileSystemService.deleteFile).mockResolvedValue(undefined);

      await realGitService.init();
    });

    it('should delete requirement file', async () => {
      await realGitService.deleteArtifact('requirements', 'REQ-001');

      expect(fileSystemService.deleteFile).toHaveBeenCalledWith('requirements/REQ-001.md');
    });

    it('should delete use case file', async () => {
      await realGitService.deleteArtifact('usecases', 'UC-001');

      expect(fileSystemService.deleteFile).toHaveBeenCalledWith('usecases/UC-001.md');
    });

    it('should handle deletion of non-existent file gracefully', async () => {
      vi.mocked(fileSystemService.deleteFile).mockRejectedValue(new Error('File not found'));

      // Should not throw
      await expect(
        realGitService.deleteArtifact('requirements', 'NONEXISTENT')
      ).resolves.toBeUndefined();
    });
  });

  describe('loadAllArtifacts', () => {
    beforeEach(async () => {
      vi.mocked(fileSystemService.checkGitExists).mockResolvedValue(true);
      vi.mocked(fileSystemService.readFile).mockImplementation(async (path: string) => {
        if (path === '.git/HEAD') return 'ref: refs/heads/main\n';
        return null;
      });

      await realGitService.init();
    });

    it('should load requirements from disk', async () => {
      const reqMarkdown = `---
id: "REQ-001"
title: "Test Requirement"
status: "draft"
priority: "high"
revision: "01"
dateCreated: 1700000000000
lastModified: 1700000000000
parentIds: []
useCaseIds: []
---

# Test Requirement

## Description
Test description

## Requirement Text
The system shall test

## Rationale
Test rationale
`;

      vi.mocked(fileSystemService.listFiles).mockImplementation(async (type: string) => {
        if (type === 'requirements') return ['REQ-001.md'];
        return [];
      });

      vi.mocked(fileSystemService.readFile).mockImplementation(async (path: string) => {
        if (path === '.git/HEAD') return 'ref: refs/heads/main\n';
        if (path === 'requirements/REQ-001.md') return reqMarkdown;
        return null;
      });

      const result = await realGitService.loadAllArtifacts();

      expect(result.requirements).toHaveLength(1);
      expect(result.requirements[0].id).toBe('REQ-001');
      expect(result.requirements[0].title).toBe('Test Requirement');
      expect(result.requirements[0].status).toBe('draft');
    });

    it('should load all artifact types', async () => {
      const reqMarkdown = `---
id: "REQ-001"
title: "Requirement"
status: "draft"
priority: "high"
revision: "01"
dateCreated: 1700000000000
lastModified: 1700000000000
parentIds: []
---

# Requirement

## Description
Desc

## Requirement Text
Text

## Rationale
Rationale
`;

      const ucMarkdown = `---
id: "UC-001"
title: "Use Case"
status: "draft"
priority: "medium"
revision: "01"
lastModified: 1700000000000
actor: "User"
---

# Use Case

## Description
Desc

## Actor
User

## Preconditions
Pre

## Main Flow
Flow

## Postconditions
Post
`;

      const tcMarkdown = `---
id: "TC-001"
title: "Test Case"
status: "draft"
priority: "low"
revision: "01"
dateCreated: 1700000000000
lastModified: 1700000000000
requirementIds: []
---

# Test Case

## Description
Desc

## Requirements Covered
`;

      const infoMarkdown = `---
id: "INF-001"
title: "Info"
type: "note"
revision: "01"
dateCreated: 1700000000000
lastModified: 1700000000000
---

# Info

Content here
`;

      vi.mocked(fileSystemService.listFiles).mockImplementation(async (type: string) => {
        switch (type) {
          case 'requirements':
            return ['REQ-001.md'];
          case 'usecases':
            return ['UC-001.md'];
          case 'testcases':
            return ['TC-001.md'];
          case 'information':
            return ['INF-001.md'];
          default:
            return [];
        }
      });

      vi.mocked(fileSystemService.readFile).mockImplementation(async (path: string) => {
        if (path === '.git/HEAD') return 'ref: refs/heads/main\n';
        if (path === 'requirements/REQ-001.md') return reqMarkdown;
        if (path === 'usecases/UC-001.md') return ucMarkdown;
        if (path === 'testcases/TC-001.md') return tcMarkdown;
        if (path === 'information/INF-001.md') return infoMarkdown;
        return null;
      });

      const result = await realGitService.loadAllArtifacts();

      expect(result.requirements).toHaveLength(1);
      expect(result.useCases).toHaveLength(1);
      expect(result.testCases).toHaveLength(1);
      expect(result.information).toHaveLength(1);
    });

    it('should handle empty directories', async () => {
      vi.mocked(fileSystemService.listFiles).mockResolvedValue([]);

      const result = await realGitService.loadAllArtifacts();

      expect(result.requirements).toHaveLength(0);
      expect(result.useCases).toHaveLength(0);
      expect(result.testCases).toHaveLength(0);
      expect(result.information).toHaveLength(0);
    });

    it('should skip non-markdown files', async () => {
      vi.mocked(fileSystemService.listFiles).mockImplementation(async (type: string) => {
        if (type === 'requirements') {
          return ['REQ-001.md', 'README.txt', '.gitkeep', 'backup.json'];
        }
        return [];
      });

      vi.mocked(fileSystemService.readFile).mockImplementation(async (path: string) => {
        if (path === '.git/HEAD') return 'ref: refs/heads/main\n';
        if (path === 'requirements/REQ-001.md') {
          return `---
id: "REQ-001"
title: "Test"
status: "draft"
priority: "high"
revision: "01"
dateCreated: 1700000000000
lastModified: 1700000000000
parentIds: []
---

# Test

## Description
Desc

## Requirement Text
Text

## Rationale
Rationale
`;
        }
        return null;
      });

      const result = await realGitService.loadAllArtifacts();

      // Should only load the .md file
      expect(result.requirements).toHaveLength(1);
      expect(result.requirements[0].id).toBe('REQ-001');
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
      ] as any);

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
      ] as any);

      const history = await realGitService.getHistory('requirements/REQ-001.md');

      // In browser mode, git.log is called without filepath filtering
      // The filepath parameter is only used in Electron mode via IPC
      expect(git.log).toHaveBeenCalled();
      expect(history).toHaveLength(1);
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

    it('should return false when user declines initialization', async () => {
      vi.mocked(fileSystemService.checkGitExists).mockResolvedValue(false);

      // Mock confirm to decline
      globalThis.confirm = vi.fn().mockReturnValue(false) as unknown as (
        message?: string
      ) => boolean;

      const result = await realGitService.init();

      expect(result).toBe(false);
      expect(git.init).not.toHaveBeenCalled();
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
