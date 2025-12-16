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

describe('DiskProjectService - User Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('saveUser', () => {
    it('should save a user to the correct path', async () => {
      const user = {
        id: 'USER-001',
        name: 'John Doe',
        dateCreated: 1700000000000,
        lastModified: 1700000100000,
      };

      await diskProjectService.saveUser(user);

      expect(fileSystemService.writeFile).toHaveBeenCalledWith(
        'users/USER-001.md',
        expect.stringContaining('id: "USER-001"')
      );
      expect(fileSystemService.writeFile).toHaveBeenCalledWith(
        'users/USER-001.md',
        expect.stringContaining('name: "John Doe"')
      );
    });
  });

  describe('loadAllUsers', () => {
    it('should load all users from the users directory', async () => {
      const userMarkdown = `---
id: "USER-001"
name: "Test User"
dateCreated: 1700000000000
lastModified: 1700000000000
---

# Test User
`;
      vi.mocked(fileSystemService.listFiles).mockResolvedValue(['USER-001.md']);
      vi.mocked(fileSystemService.readFile).mockResolvedValue(userMarkdown);

      const users = await diskProjectService.loadAllUsers();

      expect(fileSystemService.listFiles).toHaveBeenCalledWith('users');
      expect(users).toHaveLength(1);
      expect(users[0].id).toBe('USER-001');
      expect(users[0].name).toBe('Test User');
    });

    it('should return empty array when directory is empty', async () => {
      vi.mocked(fileSystemService.listFiles).mockResolvedValue([]);

      const users = await diskProjectService.loadAllUsers();

      expect(users).toEqual([]);
    });

    it('should skip non-markdown files', async () => {
      vi.mocked(fileSystemService.listFiles).mockResolvedValue([
        'USER-001.md',
        'readme.txt',
        'config.json',
      ]);
      vi.mocked(fileSystemService.readFile).mockResolvedValue(`---
id: "USER-001"
name: "Test"
dateCreated: 1700000000000
lastModified: 1700000000000
---

# Test
`);

      const users = await diskProjectService.loadAllUsers();

      expect(users).toHaveLength(1);
      expect(fileSystemService.readFile).toHaveBeenCalledTimes(1);
    });

    it('should handle directory not existing', async () => {
      vi.mocked(fileSystemService.listFiles).mockRejectedValue(new Error('Directory not found'));

      const users = await diskProjectService.loadAllUsers();

      expect(users).toEqual([]);
    });
  });

  describe('deleteUser', () => {
    it('should delete user file', async () => {
      await diskProjectService.deleteUser('USER-001');

      expect(fileSystemService.deleteFile).toHaveBeenCalledWith('users/USER-001.md');
    });
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

    it('should trim whitespace from user ID', async () => {
      vi.mocked(fileSystemService.readFile).mockResolvedValue('  USER-001  \n');

      const userId = await diskProjectService.getCurrentUserId();

      expect(userId).toBe('USER-001');
    });
  });

  describe('setCurrentUserId', () => {
    it('should write user ID to file', async () => {
      await diskProjectService.setCurrentUserId('USER-001');

      expect(fileSystemService.writeFile).toHaveBeenCalledWith('current-user.md', 'USER-001');
    });

    it('should handle empty user ID', async () => {
      await diskProjectService.setCurrentUserId('');

      expect(fileSystemService.writeFile).toHaveBeenCalledWith('current-user.md', '');
    });
  });

  describe('getNextId for users', () => {
    it('should generate USER-001 for first user', async () => {
      vi.mocked(fileSystemService.readFile).mockResolvedValue(null);
      vi.mocked(fileSystemService.writeFile).mockResolvedValue(undefined);

      const id = await diskProjectService.getNextId('users');

      expect(id).toBe('USER-001');
    });

    it('should increment counter for subsequent users', async () => {
      vi.mocked(fileSystemService.readFile).mockResolvedValue('5');
      vi.mocked(fileSystemService.writeFile).mockResolvedValue(undefined);

      const id = await diskProjectService.getNextId('users');

      expect(id).toBe('USER-006');
      expect(fileSystemService.writeFile).toHaveBeenCalledWith('counters/users.md', '6');
    });
  });

  describe('getNextIds (batch allocation)', () => {
    it('should return empty array for count of 0', async () => {
      const ids = await diskProjectService.getNextIds('requirements', 0);
      expect(ids).toEqual([]);
    });

    it('should allocate multiple IDs at once', async () => {
      vi.mocked(fileSystemService.readFile).mockResolvedValue('0');
      vi.mocked(fileSystemService.writeFile).mockResolvedValue(undefined);

      const ids = await diskProjectService.getNextIds('requirements', 3);

      expect(ids).toEqual(['REQ-001', 'REQ-002', 'REQ-003']);
      expect(fileSystemService.writeFile).toHaveBeenCalledWith('counters/requirements.md', '3');
    });

    it('should continue from existing counter', async () => {
      vi.mocked(fileSystemService.readFile).mockResolvedValue('10');
      vi.mocked(fileSystemService.writeFile).mockResolvedValue(undefined);

      const ids = await diskProjectService.getNextIds('useCases', 2);

      expect(ids).toEqual(['UC-011', 'UC-012']);
      expect(fileSystemService.writeFile).toHaveBeenCalledWith('counters/useCases.md', '12');
    });

    it('should work with different artifact types', async () => {
      vi.mocked(fileSystemService.readFile).mockResolvedValue('5');
      vi.mocked(fileSystemService.writeFile).mockResolvedValue(undefined);

      const tcIds = await diskProjectService.getNextIds('testCases', 2);
      expect(tcIds).toEqual(['TC-006', 'TC-007']);

      vi.mocked(fileSystemService.readFile).mockResolvedValue('3');
      const infoIds = await diskProjectService.getNextIds('information', 2);
      expect(infoIds).toEqual(['INFO-004', 'INFO-005']);
    });
  });

  describe('getNextIdWithSync', () => {
    // Mock realGitService
    vi.mock('../realGitService', () => ({
      realGitService: {
        pullCounters: vi.fn().mockResolvedValue(true),
        pushCounters: vi.fn().mockResolvedValue(true),
        hasRemote: vi.fn().mockResolvedValue(false),
        isInitialized: vi.fn().mockReturnValue(true),
      },
    }));

    it('should return a valid ID even when pull fails', async () => {
      vi.mocked(fileSystemService.readFile).mockResolvedValue('5');
      vi.mocked(fileSystemService.writeFile).mockResolvedValue(undefined);

      const id = await diskProjectService.getNextIdWithSync('requirements');

      expect(id).toBe('REQ-006');
    });

    it('should return correct ID format for different types', async () => {
      vi.mocked(fileSystemService.readFile).mockResolvedValue('10');
      vi.mocked(fileSystemService.writeFile).mockResolvedValue(undefined);

      const reqId = await diskProjectService.getNextIdWithSync('requirements');
      expect(reqId).toBe('REQ-011');

      const ucId = await diskProjectService.getNextIdWithSync('useCases');
      expect(ucId).toBe('UC-011');

      const tcId = await diskProjectService.getNextIdWithSync('testCases');
      expect(tcId).toBe('TC-011');

      const infoId = await diskProjectService.getNextIdWithSync('information');
      expect(infoId).toBe('INFO-011');

      const riskId = await diskProjectService.getNextIdWithSync('risks');
      expect(riskId).toBe('RISK-011');
    });

    it('should increment counter correctly', async () => {
      vi.mocked(fileSystemService.readFile).mockResolvedValue('0');
      vi.mocked(fileSystemService.writeFile).mockResolvedValue(undefined);

      const id = await diskProjectService.getNextIdWithSync('requirements');

      expect(id).toBe('REQ-001');
      expect(fileSystemService.writeFile).toHaveBeenCalledWith('counters/requirements.md', '1');
    });
  });
});
