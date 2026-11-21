/**
 * DiskLinkService Tests
 *
 * Tests for CRUD operations on Link entities stored as Markdown files.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { diskLinkService } from '../diskLinkService';
import { fileSystemService } from '../fileSystemService';
import { idAllocator } from '../../storage/idAllocator';
import { realGitService } from '../realGitService';

vi.mock('../../storage/idAllocator', () => ({
  idAllocator: {
    next: vi.fn(),
  },
}));

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

vi.mock('../realGitService', () => ({
  realGitService: {
    commitFile: vi.fn(() => Promise.resolve()),
  },
}));

describe('DiskLinkService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const sampleLinkMarkdown = `---
source: REQ-001
type: satisfies
target: UC-001
dateCreated: 1700000000000
lastModified: 1700000100000
---

# LINK-001

Links **REQ-001** to **UC-001** (satisfies)
`;

  const projectScopedLinkMarkdown = `---
source: REQ-002
type: verifies
target: TC-001
dateCreated: 1700000000000
lastModified: 1700000000000
---

# LINK-002
`;

  describe('initialize', () => {
    it('should create the links directory', async () => {
      await diskLinkService.initialize();

      expect(fileSystemService.getOrCreateDirectory).toHaveBeenCalledWith('links');
    });
  });

  describe('getAllLinks', () => {
    it('should load all links from the links directory', async () => {
      vi.mocked(fileSystemService.listFiles).mockResolvedValue(['LINK-001.md', 'LINK-002.md']);
      vi.mocked(fileSystemService.readFile)
        .mockResolvedValueOnce(sampleLinkMarkdown)
        .mockResolvedValueOnce(projectScopedLinkMarkdown);

      const links = await diskLinkService.getAllLinks();

      expect(fileSystemService.listFiles).toHaveBeenCalledWith('links');
      expect(links).toHaveLength(2);
      expect(links[0].id).toBe('LINK-001');
      expect(links[1].id).toBe('LINK-002');
    });

    it('should return empty array when directory is empty', async () => {
      vi.mocked(fileSystemService.listFiles).mockResolvedValue([]);

      const links = await diskLinkService.getAllLinks();

      expect(links).toEqual([]);
    });

    it('should skip non-markdown files', async () => {
      vi.mocked(fileSystemService.listFiles).mockResolvedValue([
        'LINK-001.md',
        'readme.txt',
        '.gitkeep',
      ]);
      vi.mocked(fileSystemService.readFile).mockResolvedValue(sampleLinkMarkdown);

      const links = await diskLinkService.getAllLinks();

      expect(links).toHaveLength(1);
      expect(fileSystemService.readFile).toHaveBeenCalledTimes(1);
    });

    it('should handle directory not existing', async () => {
      vi.mocked(fileSystemService.listFiles).mockRejectedValue(new Error('Directory not found'));

      const links = await diskLinkService.getAllLinks();

      expect(links).toEqual([]);
    });
  });

  describe('createLink', () => {
    it('should create a new link file with generated ID', async () => {
      vi.mocked(idAllocator.next).mockResolvedValue('LINK-001');
      vi.mocked(fileSystemService.writeFile).mockResolvedValue(undefined);
      vi.mocked(fileSystemService.getOrCreateDirectory).mockResolvedValue(
        undefined as unknown as FileSystemDirectoryHandle
      );

      const link = await diskLinkService.createLink('REQ-001', 'UC-001', 'satisfies');

      expect(link.id).toBe('LINK-001');
      expect(link.sourceId).toBe('REQ-001');
      expect(link.targetId).toBe('UC-001');
      expect(link.type).toBe('satisfies');
      expect(fileSystemService.writeFile).toHaveBeenCalledWith(
        'links/LINK-001.md',
        expect.any(String)
      );
      // A pending change: the user commits it
      expect(realGitService.commitFile).not.toHaveBeenCalled();
    });

    it('should set dateCreated and lastModified', async () => {
      vi.mocked(idAllocator.next).mockResolvedValue('LINK-001');
      vi.mocked(fileSystemService.writeFile).mockResolvedValue(undefined);
      vi.mocked(fileSystemService.getOrCreateDirectory).mockResolvedValue(
        undefined as unknown as FileSystemDirectoryHandle
      );

      const before = Date.now();
      const link = await diskLinkService.createLink('REQ-001', 'UC-001', 'satisfies');
      const after = Date.now();

      expect(link.dateCreated).toBeGreaterThanOrEqual(before);
      expect(link.dateCreated).toBeLessThanOrEqual(after);
      expect(link.lastModified).toBe(link.dateCreated);
    });
  });

  describe('deleteLink', () => {
    it('should delete the file of a link that was never committed', async () => {
      vi.mocked(fileSystemService.deleteFile).mockResolvedValue(undefined);

      await diskLinkService.deleteLink('LINK-001', false);

      expect(fileSystemService.deleteFile).toHaveBeenCalledWith('links/LINK-001.md');
      expect(realGitService.commitFile).not.toHaveBeenCalled();
    });

    it('should throw error if deletion fails', async () => {
      vi.mocked(fileSystemService.deleteFile).mockRejectedValue(new Error('Delete failed'));

      await expect(diskLinkService.deleteLink('LINK-999', false)).rejects.toThrow('Delete failed');
    });
  });

  describe('getLinkById', () => {
    it('should return the link with the given ID', async () => {
      vi.mocked(fileSystemService.readFile).mockResolvedValue(sampleLinkMarkdown);

      const link = await diskLinkService.getLinkById('LINK-001');

      expect(link).not.toBeNull();
      expect(link!.id).toBe('LINK-001');
      expect(link!.sourceId).toBe('REQ-001');
    });

    it('should return null if link does not exist', async () => {
      vi.mocked(fileSystemService.readFile).mockResolvedValue(null);

      const link = await diskLinkService.getLinkById('LINK-999');

      expect(link).toBeNull();
    });
  });

  describe('updateLink', () => {
    it('should update link type', async () => {
      vi.mocked(fileSystemService.readFile).mockResolvedValue(sampleLinkMarkdown);
      vi.mocked(fileSystemService.writeFile).mockResolvedValue(undefined);

      const updated = await diskLinkService.updateLink('LINK-001', { type: 'depends_on' });

      expect(updated).not.toBeNull();
      expect(updated!.type).toBe('depends_on');
      expect(fileSystemService.writeFile).toHaveBeenCalledWith(
        'links/LINK-001.md',
        expect.stringContaining('type: depends_on')
      );
    });

    it('should update lastModified timestamp', async () => {
      vi.mocked(fileSystemService.readFile).mockResolvedValue(sampleLinkMarkdown);
      vi.mocked(fileSystemService.writeFile).mockResolvedValue(undefined);

      const before = Date.now();
      const updated = await diskLinkService.updateLink('LINK-001', { type: 'depends_on' });
      const after = Date.now();

      expect(updated!.lastModified).toBeGreaterThanOrEqual(before);
      expect(updated!.lastModified).toBeLessThanOrEqual(after);
    });

    it('should return null if link does not exist', async () => {
      vi.mocked(fileSystemService.readFile).mockResolvedValue(null);

      const updated = await diskLinkService.updateLink('LINK-999', { type: 'depends_on' });

      expect(updated).toBeNull();
    });
  });
});
