/**
 * ID Service Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { idService } from '../idService';
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

describe('IdService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getNextId', () => {
    it('should generate REQ-001 for first requirement', async () => {
      vi.mocked(fileSystemService.readFile).mockResolvedValue(null);
      vi.mocked(fileSystemService.writeFile).mockResolvedValue(undefined);

      const id = await idService.getNextId('requirements');

      expect(id).toBe('REQ-001');
    });

    it('should increment counter for subsequent artifacts', async () => {
      vi.mocked(fileSystemService.readFile).mockResolvedValue('5');
      vi.mocked(fileSystemService.writeFile).mockResolvedValue(undefined);

      const id = await idService.getNextId('requirements');

      expect(id).toBe('REQ-006');
      expect(fileSystemService.writeFile).toHaveBeenCalledWith('counters/requirements.md', '6');
    });
  });

  describe('getNextIds (batch allocation)', () => {
    it('should allocate multiple IDs at once', async () => {
      vi.mocked(fileSystemService.readFile).mockResolvedValue('0');
      vi.mocked(fileSystemService.writeFile).mockResolvedValue(undefined);

      const ids = await idService.getNextIds('requirements', 3);

      expect(ids).toEqual(['REQ-001', 'REQ-002', 'REQ-003']);
      expect(fileSystemService.writeFile).toHaveBeenCalledWith('counters/requirements.md', '3');
    });
  });

  describe('getNextIdWithSync', () => {
    it('should return a valid ID even when pull fails', async () => {
      vi.mocked(fileSystemService.readFile).mockResolvedValue('5');
      vi.mocked(fileSystemService.writeFile).mockResolvedValue(undefined);

      const id = await idService.getNextIdWithSync('requirements');

      expect(id).toBe('REQ-006');
    });
  });
});
