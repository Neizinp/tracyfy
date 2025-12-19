/**
 * User Service Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { userService } from '../artifactServices';
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

describe('UserService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('save', () => {
    it('should save a user to the correct path', async () => {
      const user = {
        id: 'USER-001',
        name: 'John Doe',
        dateCreated: 1700000000000,
        lastModified: 1700000100000,
      };

      await userService.save(user);

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

  describe('loadAll', () => {
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

      const users = await userService.loadAll();

      expect(fileSystemService.listFiles).toHaveBeenCalledWith('users');
      expect(users).toHaveLength(1);
      expect(users[0].id).toBe('USER-001');
      expect(users[0].name).toBe('Test User');
    });
  });

  describe('delete', () => {
    it('should delete user file', async () => {
      await userService.delete('USER-001');

      expect(fileSystemService.deleteFile).toHaveBeenCalledWith('users/USER-001.md');
    });
  });
});
