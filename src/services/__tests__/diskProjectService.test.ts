/**
 * DiskProjectService User Operations Tests
 *
 * Tests for user CRUD operations including:
 * - saveUser, loadAllUsers, deleteUser
 * - getCurrentUserId, setCurrentUserId
 * - getNextId for users
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { diskProjectService } from '../diskProjectService';
import { fileSystemService } from '../fileSystemService';

// Mock the fileSystemService
vi.mock('../fileSystemService', () => ({
  fileSystemService: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    deleteFile: vi.fn(),
    listFiles: vi.fn(),
    getOrCreateDirectory: vi.fn(),
  },
}));

// Mock the realGitService
vi.mock('../realGitService', () => ({
  realGitService: {
    hasRemote: vi.fn(() => Promise.resolve(false)),
    isInitialized: vi.fn(() => true),
    commitFile: vi.fn(() => Promise.resolve()),
  },
}));

describe('DiskProjectService - User Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('loadAll', () => {
    it('should load everything from disk', async () => {
      // Mock all the loadAll calls
      vi.mocked(fileSystemService.listFiles).mockResolvedValue([]);
      vi.mocked(fileSystemService.readFile).mockImplementation(async (path) =>
        path === 'project.md'
          ? '---\nname: "Door Controller"\n---\n\n# Door Controller\n\nLobby'
          : null
      );

      const data = await diskProjectService.loadAll();

      expect(data.project).toEqual({ name: 'Door Controller', description: 'Lobby' });
      expect(data).toHaveProperty('requirements');
    });
  });
});
