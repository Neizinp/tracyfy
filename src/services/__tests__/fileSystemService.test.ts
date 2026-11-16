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
