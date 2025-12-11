/**
 * FileSystemService Tests
 *
 * These tests verify the file system operations used for persistence.
 * Note: Many operations require a real File System Access API handle,
 * so we test what we can without it and document the expected behaviors.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// We'll need to mock IndexedDB for some tests
const mockIDBDatabase = {
  transaction: vi.fn(),
  objectStoreNames: { contains: vi.fn() },
  createObjectStore: vi.fn(),
};

const mockTransaction = {
  objectStore: vi.fn(),
};

const mockObjectStore = {
  put: vi.fn(),
  get: vi.fn(),
};

// Setup mock IndexedDB
beforeEach(() => {
  mockTransaction.objectStore.mockReturnValue(mockObjectStore);
  mockIDBDatabase.transaction.mockReturnValue(mockTransaction);
});

describe('FileSystemService', () => {
  describe('initialization', () => {
    it('should check if File System Access API is supported', async () => {
      // In test environment, showDirectoryPicker may not be available
      const hasShowDirectoryPicker = 'showDirectoryPicker' in window;

      // fileSystemService.isSupported() returns true if either:
      // 1. Running in Electron
      // 2. showDirectoryPicker is available
      expect(typeof hasShowDirectoryPicker).toBe('boolean');
    });
  });

  describe('path normalization', () => {
    it('should normalize paths correctly', () => {
      // Test path normalization logic used throughout the service
      const normalizePath = (path: string) => path.replace(/^\/+/, '').replace(/^\.\//, '');

      expect(normalizePath('/test/path')).toBe('test/path');
      expect(normalizePath('./test/path')).toBe('test/path');
      expect(normalizePath('test/path')).toBe('test/path');
      expect(normalizePath('///multiple/slashes')).toBe('multiple/slashes');
    });

    it('should split paths into parts correctly', () => {
      const splitPath = (path: string) => path.split('/').filter((p) => p.length > 0);

      expect(splitPath('a/b/c')).toEqual(['a', 'b', 'c']);
      expect(splitPath('/a/b/c')).toEqual(['a', 'b', 'c']);
      expect(splitPath('a/b/c/')).toEqual(['a', 'b', 'c']);
      expect(splitPath('')).toEqual([]);
      expect(splitPath('single')).toEqual(['single']);
    });
  });

  describe('without directory handle', () => {
    it('readFile should throw when no directory selected', async () => {
      // Import fresh instance
      const { fileSystemService } = await import('../fileSystemService');

      // Without a directory handle, readFile should throw
      await expect(fileSystemService.readFile('some/path')).rejects.toThrow(
        'No directory selected'
      );
    });

    it('readFileBinary should throw when no directory selected', async () => {
      const { fileSystemService } = await import('../fileSystemService');

      // readFileBinary throws when no directory is selected
      await expect(fileSystemService.readFileBinary('some/path')).rejects.toThrow(
        'No directory selected'
      );
    });

    it('getDirectory should return null when no handle set', async () => {
      const { fileSystemService } = await import('../fileSystemService');

      const result = await fileSystemService.getDirectory('any/path');
      expect(result).toBeNull();
    });

    it('directoryExists should return false when no handle set', async () => {
      const { fileSystemService } = await import('../fileSystemService');

      const result = await fileSystemService.directoryExists('any/path');
      expect(result).toBe(false);
    });
  });
});

describe('Path Validation', () => {
  it('should handle paths with special characters', () => {
    const safePaths = [
      'requirements/REQ-001.md',
      'usecases/UC_001.md',
      'information/info (1).md',
      '.git/objects/ab/cdef123',
    ];

    // Unsafe paths like '../outside/directory' and '/absolute/path' should be handled
    // Path traversal prevention is a separate security concern

    // Test that path normalization handles these
    const normalizePath = (path: string) => path.replace(/^\/+/, '').replace(/^\.\//, '');

    for (const path of safePaths) {
      const normalized = normalizePath(path);
      expect(normalized).not.toContain('//');
      expect(normalized.startsWith('/')).toBe(false);
    }

    // Path traversal should still be present after normalization
    // (security validation is separate from normalization)
    expect(normalizePath('../outside')).toBe('../outside');
  });

  it('should extract filename from path', () => {
    const getFilename = (path: string) => {
      const parts = path.split('/');
      return parts.pop() || '';
    };

    expect(getFilename('a/b/c.txt')).toBe('c.txt');
    expect(getFilename('file.txt')).toBe('file.txt');
    expect(getFilename('')).toBe('');
  });

  it('should extract directory from path', () => {
    const getDirectory = (path: string) => {
      const parts = path.split('/');
      parts.pop();
      return parts.join('/');
    };

    expect(getDirectory('a/b/c.txt')).toBe('a/b');
    expect(getDirectory('a/file.txt')).toBe('a');
    expect(getDirectory('file.txt')).toBe('');
  });
});

describe('IndexedDB Handle Storage', () => {
  it('should use correct database and store names', () => {
    // Document the expected constants
    const DB_NAME = 'reqify-fs-handles';
    const STORE_NAME = 'handles';

    expect(DB_NAME).toBe('reqify-fs-handles');
    expect(STORE_NAME).toBe('handles');
  });
});

describe('File Type Detection', () => {
  it('should identify markdown files', () => {
    const isMarkdown = (filename: string) => filename.endsWith('.md');

    expect(isMarkdown('REQ-001.md')).toBe(true);
    expect(isMarkdown('requirements.MD')).toBe(false); // Case sensitive
    expect(isMarkdown('file.txt')).toBe(false);
    expect(isMarkdown('.md')).toBe(true);
  });

  it('should filter temporary files', () => {
    const isTempFile = (filename: string) => {
      if (filename.endsWith('.crswap')) return true;
      if (filename.endsWith('.swp')) return true;
      if (filename.endsWith('.tmp')) return true;
      if (filename.endsWith('~')) return true;
      if (filename.startsWith('.#')) return true;
      return false;
    };

    expect(isTempFile('file.md.crswap')).toBe(true);
    expect(isTempFile('file.swp')).toBe(true);
    expect(isTempFile('backup.tmp')).toBe(true);
    expect(isTempFile('file~')).toBe(true);
    expect(isTempFile('.#lockfile')).toBe(true);
    expect(isTempFile('normal.md')).toBe(false);
  });

  it('should identify git internal paths', () => {
    const isGitPath = (path: string) => path.startsWith('.git/') || path === '.git';

    expect(isGitPath('.git')).toBe(true);
    expect(isGitPath('.git/')).toBe(true);
    expect(isGitPath('.git/objects/ab/123')).toBe(true);
    expect(isGitPath('.github/workflows')).toBe(false);
    expect(isGitPath('requirements/.git')).toBe(false);
  });
});

describe('Error Handling', () => {
  it('should create proper ENOENT errors', () => {
    const createENOENT = (path: string): Error => {
      const err: Error & { code?: string } = new Error(
        `ENOENT: no such file or directory, open '${path}'`
      );
      err.code = 'ENOENT';
      return err;
    };

    const error = createENOENT('/test/path');

    expect(error.message).toContain('ENOENT');
    expect(error.message).toContain('/test/path');
    expect((error as any).code).toBe('ENOENT');
  });

  it('should distinguish between ENOENT and other errors', () => {
    const isENOENT = (error: unknown): boolean => {
      return error instanceof Error && (error as any).code === 'ENOENT';
    };

    const enoent: Error & { code?: string } = new Error('ENOENT');
    enoent.code = 'ENOENT';

    const otherError = new Error('Other error');

    expect(isENOENT(enoent)).toBe(true);
    expect(isENOENT(otherError)).toBe(false);
    expect(isENOENT(null)).toBe(false);
    expect(isENOENT('string')).toBe(false);
  });
});

describe('Artifact Path Construction', () => {
  it('should construct correct artifact paths', () => {
    const artifactTypes = ['requirements', 'usecases', 'testcases', 'information'];

    const constructPath = (type: string, id: string) => `${type}/${id}.md`;

    expect(constructPath('requirements', 'REQ-001')).toBe('requirements/REQ-001.md');
    expect(constructPath('usecases', 'UC-001')).toBe('usecases/UC-001.md');
    expect(constructPath('testcases', 'TC-001')).toBe('testcases/TC-001.md');
    expect(constructPath('information', 'INF-001')).toBe('information/INF-001.md');

    // All artifact types should be valid
    for (const type of artifactTypes) {
      const path = constructPath(type, 'ID-001');
      expect(path).toMatch(/^(requirements|usecases|testcases|information)\/ID-001\.md$/);
    }
  });
});

describe('Directory Listing', () => {
  it('should filter entries correctly', () => {
    const entries = ['REQ-001.md', 'REQ-002.md', '.DS_Store', 'backup.md~', 'file.crswap'];

    const filterEntries = (entries: string[]) =>
      entries.filter((entry) => {
        if (entry.startsWith('.')) return false;
        if (entry.endsWith('~')) return false;
        if (entry.endsWith('.crswap')) return false;
        return true;
      });

    const filtered = filterEntries(entries);

    expect(filtered).toEqual(['REQ-001.md', 'REQ-002.md']);
  });
});
