import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BaseArtifactService } from '../baseArtifactService';
import type { ArtifactSerializer } from '../baseArtifactService';
import { fileSystemService } from '../fileSystemService';
import { realGitService } from '../realGitService';

// Mock the services
vi.mock('../fileSystemService', () => ({
  fileSystemService: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    deleteFile: vi.fn(),
    listFiles: vi.fn(),
  },
}));

vi.mock('../realGitService', () => ({
  realGitService: {
    commitFile: vi.fn(),
  },
}));

// No need to mock ARTIFACT_CONFIG, we use the real one for fidelity

interface TestItem {
  id: string;
  name: string;
}

describe('BaseArtifactService', () => {
  const mockSerializer: ArtifactSerializer<TestItem> = {
    serialize: vi.fn((item) => JSON.stringify(item)),
    deserialize: vi.fn((content) => JSON.parse(content)),
  };

  let service: BaseArtifactService<TestItem>;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new BaseArtifactService<TestItem>('requirements', mockSerializer);
  });

  describe('save', () => {
    it('should save to the correct path with serialization', async () => {
      const item = { id: 'REQ-001', name: 'Test' };
      await service.save(item);

      expect(mockSerializer.serialize).toHaveBeenCalledWith(item);
      expect(fileSystemService.writeFile).toHaveBeenCalledWith(
        'requirements/REQ-001.md',
        JSON.stringify(item)
      );
      expect(realGitService.commitFile).not.toHaveBeenCalled();
    });

    it('should commit to git if message is provided', async () => {
      const item = { id: 'REQ-002', name: 'Commit Test' };
      await service.save(item, 'feat: add test requirement');

      expect(fileSystemService.writeFile).toHaveBeenCalled();
      expect(realGitService.commitFile).toHaveBeenCalledWith(
        'requirements/REQ-002.md',
        'feat: add test requirement'
      );
    });
  });

  describe('delete', () => {
    it('should delete from disk and optionally commit', async () => {
      await service.delete('REQ-001');
      expect(fileSystemService.deleteFile).toHaveBeenCalledWith('requirements/REQ-001.md');
      expect(realGitService.commitFile).not.toHaveBeenCalled();

      await service.delete('REQ-002', 'fix: delete repo');
      expect(realGitService.commitFile).toHaveBeenCalledWith(
        'requirements/REQ-002.md',
        'fix: delete repo'
      );
    });
  });

  describe('load', () => {
    it('should load and deserialize artifact', async () => {
      const item = { id: 'REQ-001', name: 'Loaded' };
      vi.mocked(fileSystemService.readFile).mockResolvedValue(JSON.stringify(item));

      const result = await service.load('REQ-001');

      expect(fileSystemService.readFile).toHaveBeenCalledWith('requirements/REQ-001.md');
      expect(mockSerializer.deserialize).toHaveBeenCalledWith(JSON.stringify(item));
      expect(result).toEqual(item);
    });

    it('should return null if file not found', async () => {
      vi.mocked(fileSystemService.readFile).mockRejectedValue(new Error('not found'));
      const result = await service.load('REQ-NONEXISTENT');
      expect(result).toBeNull();
    });
  });

  describe('loadAll', () => {
    it('should load and deserialize all artifacts in folder', async () => {
      const item1 = { id: 'REQ-001', name: 'Item 1' };
      const item2 = { id: 'REQ-002', name: 'Item 2' };

      vi.mocked(fileSystemService.listFiles).mockResolvedValue([
        'REQ-001.md',
        'REQ-002.md',
        'other.txt',
      ]);
      vi.mocked(fileSystemService.readFile).mockImplementation(async (path) => {
        if (path.includes('REQ-001.md')) return JSON.stringify(item1);
        if (path.includes('REQ-002.md')) return JSON.stringify(item2);
        return null;
      });

      const results = await service.loadAll();

      expect(fileSystemService.listFiles).toHaveBeenCalledWith('requirements');
      expect(results).toHaveLength(2);
      expect(results).toContainEqual(item1);
      expect(results).toContainEqual(item2);
    });

    it('should handle empty directory gracefully', async () => {
      vi.mocked(fileSystemService.listFiles).mockRejectedValue(new Error('ENOENT'));
      const results = await service.loadAll();
      expect(results).toEqual([]);
    });
  });
});
