/**
 * Git Remote Operations Tests
 *
 * Tests for remote git operations including:
 * - addRemote, removeRemote, getRemotes, hasRemote
 * - Auth token management
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import git from 'isomorphic-git';

// Mock isomorphic-git
vi.mock('isomorphic-git', () => ({
  default: {
    addRemote: vi.fn(),
    deleteRemote: vi.fn(),
    listRemotes: vi.fn(),
    fetch: vi.fn(),
    push: vi.fn(),
    pull: vi.fn(),
    add: vi.fn(),
    commit: vi.fn(),
    resolveRef: vi.fn(),
  },
}));

// Mock fsAdapter
vi.mock('../fsAdapter', () => ({
  fsAdapter: {
    promises: {
      readFile: vi.fn(),
      writeFile: vi.fn(),
    },
  },
}));

// Mock fileSystemService
vi.mock('../fileSystemService', () => ({
  fileSystemService: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    listFiles: vi.fn(),
    checkGitExists: vi.fn().mockResolvedValue(true),
    getDirectoryName: vi.fn().mockReturnValue('test-dir'),
    getRootPath: vi.fn().mockReturnValue('/test'),
  },
}));

// Import after mocks
import { realGitService } from '../realGitService';

describe('RealGitService - Remote Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock localStorage
    const localStorageMock: { [key: string]: string } = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => localStorageMock[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageMock[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageMock[key];
      }),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetAllMocks();
  });

  describe('addRemote', () => {
    it('should call git.addRemote with correct params', async () => {
      vi.mocked(git.addRemote).mockResolvedValue(undefined);

      // Force initialized state
      (realGitService as any).initialized = true;

      await realGitService.addRemote('origin', 'https://github.com/test/repo.git');

      expect(git.addRemote).toHaveBeenCalledWith(
        expect.objectContaining({
          remote: 'origin',
          url: 'https://github.com/test/repo.git',
        })
      );
    });
  });

  describe('removeRemote', () => {
    it('should call git.deleteRemote with correct params', async () => {
      vi.mocked(git.deleteRemote).mockResolvedValue(undefined);

      (realGitService as any).initialized = true;

      await realGitService.removeRemote('origin');

      expect(git.deleteRemote).toHaveBeenCalledWith(
        expect.objectContaining({
          remote: 'origin',
        })
      );
    });
  });

  describe('getRemotes', () => {
    it('should return list of remotes', async () => {
      vi.mocked(git.listRemotes).mockResolvedValue([
        { remote: 'origin', url: 'https://github.com/test/repo.git' },
        { remote: 'upstream', url: 'https://github.com/other/repo.git' },
      ]);

      (realGitService as any).initialized = true;

      const remotes = await realGitService.getRemotes();

      expect(remotes).toEqual([
        { name: 'origin', url: 'https://github.com/test/repo.git' },
        { name: 'upstream', url: 'https://github.com/other/repo.git' },
      ]);
    });

    it('should return empty array when not initialized', async () => {
      (realGitService as any).initialized = false;

      const remotes = await realGitService.getRemotes();

      expect(remotes).toEqual([]);
    });
  });

  describe('hasRemote', () => {
    it('should return true when remote exists', async () => {
      vi.mocked(git.listRemotes).mockResolvedValue([
        { remote: 'origin', url: 'https://github.com/test/repo.git' },
      ]);

      (realGitService as any).initialized = true;

      const has = await realGitService.hasRemote('origin');

      expect(has).toBe(true);
    });

    it('should return false when remote does not exist', async () => {
      vi.mocked(git.listRemotes).mockResolvedValue([
        { remote: 'upstream', url: 'https://github.com/other/repo.git' },
      ]);

      (realGitService as any).initialized = true;

      const has = await realGitService.hasRemote('origin');

      expect(has).toBe(false);
    });
  });

  describe('setAuthToken / clearAuthToken', () => {
    it('should store token in localStorage', () => {
      realGitService.setAuthToken('ghp_testtoken123');

      expect(localStorage.setItem).toHaveBeenCalledWith('git-remote-token', 'ghp_testtoken123');
    });

    it('should clear token from localStorage', () => {
      realGitService.clearAuthToken();

      expect(localStorage.removeItem).toHaveBeenCalledWith('git-remote-token');
    });
  });

  describe('isInitialized', () => {
    it('should return initialized state', () => {
      (realGitService as any).initialized = true;
      expect(realGitService.isInitialized()).toBe(true);

      (realGitService as any).initialized = false;
      expect(realGitService.isInitialized()).toBe(false);
    });
  });
});
