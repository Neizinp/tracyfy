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
    pullCounters: vi.fn(() => Promise.resolve(true)),
    pushCounters: vi.fn(() => Promise.resolve(true)),
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

  describe('getCurrentUserId', () => {
    it('should read current user ID from file', async () => {
      vi.mocked(fileSystemService.readFile).mockResolvedValue('USER-001');

      const userId = await diskProjectService.getCurrentUserId();

      expect(fileSystemService.readFile).toHaveBeenCalledWith('current-user.md');
      expect(userId).toBe('USER-001');
    });

    it('should return empty string when file does not exist', async () => {
      vi.mocked(fileSystemService.readFile).mockResolvedValue(null);

      const userId = await diskProjectService.getCurrentUserId();

      expect(userId).toBe('');
    });
  });

  describe('setCurrentUserId', () => {
    it('should write user ID to file', async () => {
      await diskProjectService.setCurrentUserId('USER-001');

      expect(fileSystemService.writeFile).toHaveBeenCalledWith('current-user.md', 'USER-001');
    });
  });

  describe('loadAll', () => {
    it('should load everything from disk', async () => {
      // Mock all the loadAll calls
      vi.mocked(fileSystemService.listFiles).mockResolvedValue([]);
      vi.mocked(fileSystemService.readFile).mockResolvedValue('proj-123');

      const data = await diskProjectService.loadAll();

      expect(data).toHaveProperty('projects');
      expect(data).toHaveProperty('requirements');
      expect(data.currentProjectId).toBe('proj-123');
    });
  });

  describe('recalculateCounters', () => {
    it('should find the maximum ID from existing files and update counters', async () => {
      // Mock listFiles for all types
      vi.mocked(fileSystemService.listFiles).mockImplementation(async (folder) => {
        if (folder === 'requirements') return ['REQ-001.md', 'REQ-010.md', 'REQ-005.md'];
        if (folder === 'usecases') return ['UC-001.md', 'UC-002.md'];
        if (folder === 'testcases') return ['TC-005.md'];
        if (folder === 'information') return ['INFO-001.md', 'INFO-020.md'];
        if (folder === 'risks') return ['RISK-003.md'];
        return [];
      });

      // Mock readFile for all files to returns serialized artifact with ID
      vi.mocked(fileSystemService.readFile).mockImplementation(async (path) => {
        const id = path.split('/').pop()?.replace('.md', '');
        if (id) {
          return `---
id: "${id}"
---`;
        }
        return null;
      });

      await diskProjectService.recalculateCounters();

      // Verify counters were updated with max IDs
      expect(fileSystemService.writeFile).toHaveBeenCalledWith('counters/requirements.md', '10');
      expect(fileSystemService.writeFile).toHaveBeenCalledWith('counters/usecases.md', '2');
      expect(fileSystemService.writeFile).toHaveBeenCalledWith('counters/testcases.md', '5');
      expect(fileSystemService.writeFile).toHaveBeenCalledWith('counters/information.md', '20');
      expect(fileSystemService.writeFile).toHaveBeenCalledWith('counters/risks.md', '3');
    });
  });
});
