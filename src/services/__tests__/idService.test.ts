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

  describe('concurrency', () => {
    function useSlowInMemoryFs() {
      const files = new Map<string, string>();
      const delay = () => new Promise((r) => setTimeout(r, Math.random() * 5));
      vi.mocked(fileSystemService.readFile).mockImplementation(async (path: string) => {
        await delay();
        return files.get(path) ?? null;
      });
      vi.mocked(fileSystemService.writeFile).mockImplementation(
        async (path: string, content: string | Uint8Array) => {
          await delay();
          files.set(path, String(content));
        }
      );
    }

    it('never hands out duplicate IDs for concurrent getNextId calls', async () => {
      useSlowInMemoryFs();
      const ids = await Promise.all(
        Array.from({ length: 10 }, () => idService.getNextId('requirements'))
      );
      expect(new Set(ids).size).toBe(10);
      expect([...ids].sort()).toEqual(
        Array.from({ length: 10 }, (_, i) => `REQ-${String(i + 1).padStart(3, '0')}`)
      );
    });

    it('does not overlap between getNextIds batches and single allocations', async () => {
      useSlowInMemoryFs();
      const [batch, single, sync] = await Promise.all([
        idService.getNextIds('testcases', 3),
        idService.getNextId('testcases'),
        idService.getNextIdWithSync('testcases'),
      ]);
      const all = [...batch, single, sync];
      expect(new Set(all).size).toBe(5);
    });
  });
});
