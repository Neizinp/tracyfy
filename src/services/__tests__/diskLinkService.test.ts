/**
 * DiskLinkService Tests
 *
 * Tests for CRUD operations on Link entities stored as Markdown files.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { diskLinkService } from '../diskLinkService';
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

describe('DiskLinkService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const sampleLinkMarkdown = `---
id: LINK-001
sourceId: REQ-001
targetId: UC-001
type: satisfies
projectIds: 
dateCreated: 1700000000000
lastModified: 1700000100000
---

# LINK-001

Links **REQ-001** to **UC-001** (satisfies)

**Scope:** Global (all projects)
`;

  const projectScopedLinkMarkdown = `---
id: LINK-002
sourceId: REQ-002
targetId: TC-001
type: verifies
projectIds: PRJ-001, PRJ-002
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

  describe('getOutgoingLinks', () => {
    it('should return links where artifact is the source', async () => {
      vi.mocked(fileSystemService.listFiles).mockResolvedValue(['LINK-001.md', 'LINK-002.md']);
      vi.mocked(fileSystemService.readFile)
        .mockResolvedValueOnce(sampleLinkMarkdown)
        .mockResolvedValueOnce(projectScopedLinkMarkdown);

      const links = await diskLinkService.getOutgoingLinks('REQ-001');

      expect(links).toHaveLength(1);
      expect(links[0].sourceId).toBe('REQ-001');
    });

    it('should return empty array when no outgoing links exist', async () => {
      vi.mocked(fileSystemService.listFiles).mockResolvedValue(['LINK-001.md']);
      vi.mocked(fileSystemService.readFile).mockResolvedValue(sampleLinkMarkdown);

      const links = await diskLinkService.getOutgoingLinks('UC-999');

      expect(links).toEqual([]);
    });
  });

  describe('getIncomingLinks', () => {
    it('should return links where artifact is the target with inverse types', async () => {
      vi.mocked(fileSystemService.listFiles).mockResolvedValue(['LINK-001.md']);
      vi.mocked(fileSystemService.readFile).mockResolvedValue(sampleLinkMarkdown);

      const links = await diskLinkService.getIncomingLinks('UC-001');

      expect(links).toHaveLength(1);
      expect(links[0].sourceId).toBe('REQ-001');
      expect(links[0].linkType).toBeDefined(); // Inverse type of 'satisfies'
    });

    it('should return empty array when no incoming links exist', async () => {
      vi.mocked(fileSystemService.listFiles).mockResolvedValue(['LINK-001.md']);
      vi.mocked(fileSystemService.readFile).mockResolvedValue(sampleLinkMarkdown);

      const links = await diskLinkService.getIncomingLinks('REQ-999');

      expect(links).toEqual([]);
    });
  });

  describe('createLink', () => {
    it('should create a new link file with generated ID', async () => {
      vi.mocked(fileSystemService.readFile).mockResolvedValue(null); // Counter doesn't exist
      vi.mocked(fileSystemService.writeFile).mockResolvedValue(undefined);
      vi.mocked(fileSystemService.getOrCreateDirectory).mockResolvedValue(undefined);

      const link = await diskLinkService.createLink('REQ-001', 'UC-001', 'satisfies');

      expect(link.id).toBe('LINK-001');
      expect(link.sourceId).toBe('REQ-001');
      expect(link.targetId).toBe('UC-001');
      expect(link.type).toBe('satisfies');
      expect(link.projectIds).toEqual([]);
      expect(fileSystemService.writeFile).toHaveBeenCalledWith(
        'links/LINK-001.md',
        expect.any(String)
      );
    });

    it('should increment counter for subsequent links', async () => {
      vi.mocked(fileSystemService.readFile).mockResolvedValue('5'); // Counter at 5
      vi.mocked(fileSystemService.writeFile).mockResolvedValue(undefined);
      vi.mocked(fileSystemService.getOrCreateDirectory).mockResolvedValue(undefined);

      const link = await diskLinkService.createLink('REQ-001', 'TC-001', 'verifies');

      expect(link.id).toBe('LINK-006');
      expect(fileSystemService.writeFile).toHaveBeenCalledWith('counters/links.md', '6');
    });

    it('should create project-scoped links', async () => {
      vi.mocked(fileSystemService.readFile).mockResolvedValue(null);
      vi.mocked(fileSystemService.writeFile).mockResolvedValue(undefined);
      vi.mocked(fileSystemService.getOrCreateDirectory).mockResolvedValue(undefined);

      const link = await diskLinkService.createLink('REQ-001', 'UC-001', 'satisfies', [
        'PRJ-001',
        'PRJ-002',
      ]);

      expect(link.projectIds).toEqual(['PRJ-001', 'PRJ-002']);
    });

    it('should set dateCreated and lastModified', async () => {
      vi.mocked(fileSystemService.readFile).mockResolvedValue(null);
      vi.mocked(fileSystemService.writeFile).mockResolvedValue(undefined);
      vi.mocked(fileSystemService.getOrCreateDirectory).mockResolvedValue(undefined);

      const before = Date.now();
      const link = await diskLinkService.createLink('REQ-001', 'UC-001', 'satisfies');
      const after = Date.now();

      expect(link.dateCreated).toBeGreaterThanOrEqual(before);
      expect(link.dateCreated).toBeLessThanOrEqual(after);
      expect(link.lastModified).toBe(link.dateCreated);
    });
  });

  describe('deleteLink', () => {
    it('should delete the link file', async () => {
      vi.mocked(fileSystemService.deleteFile).mockResolvedValue(undefined);

      await diskLinkService.deleteLink('LINK-001');

      expect(fileSystemService.deleteFile).toHaveBeenCalledWith('links/LINK-001.md');
    });

    it('should throw error if deletion fails', async () => {
      vi.mocked(fileSystemService.deleteFile).mockRejectedValue(new Error('Delete failed'));

      await expect(diskLinkService.deleteLink('LINK-999')).rejects.toThrow('Delete failed');
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

    it('should update project IDs', async () => {
      vi.mocked(fileSystemService.readFile).mockResolvedValue(sampleLinkMarkdown);
      vi.mocked(fileSystemService.writeFile).mockResolvedValue(undefined);

      const updated = await diskLinkService.updateLink('LINK-001', {
        projectIds: ['PRJ-001'],
      });

      expect(updated!.projectIds).toEqual(['PRJ-001']);
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

  describe('linkExists', () => {
    it('should return true if link exists between artifacts', async () => {
      vi.mocked(fileSystemService.listFiles).mockResolvedValue(['LINK-001.md']);
      vi.mocked(fileSystemService.readFile).mockResolvedValue(sampleLinkMarkdown);

      const exists = await diskLinkService.linkExists('REQ-001', 'UC-001');

      expect(exists).toBe(true);
    });

    it('should return false if no link exists', async () => {
      vi.mocked(fileSystemService.listFiles).mockResolvedValue(['LINK-001.md']);
      vi.mocked(fileSystemService.readFile).mockResolvedValue(sampleLinkMarkdown);

      const exists = await diskLinkService.linkExists('REQ-999', 'UC-999');

      expect(exists).toBe(false);
    });

    it('should check specific link type when provided', async () => {
      vi.mocked(fileSystemService.listFiles).mockResolvedValue(['LINK-001.md']);
      vi.mocked(fileSystemService.readFile).mockResolvedValue(sampleLinkMarkdown);

      const existsSatisfies = await diskLinkService.linkExists('REQ-001', 'UC-001', 'satisfies');
      const existsDependsOn = await diskLinkService.linkExists('REQ-001', 'UC-001', 'depends_on');

      expect(existsSatisfies).toBe(true);
      expect(existsDependsOn).toBe(false);
    });
  });

  describe('getLinksForProject', () => {
    it('should return global links and project-specific links', async () => {
      vi.mocked(fileSystemService.listFiles).mockResolvedValue(['LINK-001.md', 'LINK-002.md']);
      vi.mocked(fileSystemService.readFile)
        .mockResolvedValueOnce(sampleLinkMarkdown) // Global link
        .mockResolvedValueOnce(projectScopedLinkMarkdown); // PRJ-001, PRJ-002

      const links = await diskLinkService.getLinksForProject('PRJ-001');

      expect(links).toHaveLength(2);
    });

    it('should filter out links for other projects', async () => {
      vi.mocked(fileSystemService.listFiles).mockResolvedValue(['LINK-002.md']);
      vi.mocked(fileSystemService.readFile).mockResolvedValue(projectScopedLinkMarkdown);

      const links = await diskLinkService.getLinksForProject('PRJ-999');

      expect(links).toHaveLength(0);
    });
  });

  describe('getGlobalLinks', () => {
    it('should return only links with empty projectIds', async () => {
      vi.mocked(fileSystemService.listFiles).mockResolvedValue(['LINK-001.md', 'LINK-002.md']);
      vi.mocked(fileSystemService.readFile)
        .mockResolvedValueOnce(sampleLinkMarkdown) // Global link
        .mockResolvedValueOnce(projectScopedLinkMarkdown); // Project-scoped

      const links = await diskLinkService.getGlobalLinks();

      expect(links).toHaveLength(1);
      expect(links[0].id).toBe('LINK-001');
    });
  });

  describe('recalculateCounter', () => {
    it('should set counter to highest existing link number', async () => {
      vi.mocked(fileSystemService.listFiles).mockResolvedValue([
        'LINK-001.md',
        'LINK-005.md',
        'LINK-003.md',
      ]);
      vi.mocked(fileSystemService.readFile).mockImplementation(async (path) => {
        if (path.endsWith('LINK-001.md')) return sampleLinkMarkdown.replace('LINK-001', 'LINK-001');
        if (path.endsWith('LINK-005.md'))
          return sampleLinkMarkdown.replace(/LINK-001/g, 'LINK-005');
        if (path.endsWith('LINK-003.md'))
          return sampleLinkMarkdown.replace(/LINK-001/g, 'LINK-003');
        return null;
      });
      vi.mocked(fileSystemService.writeFile).mockResolvedValue(undefined);

      await diskLinkService.recalculateCounter();

      expect(fileSystemService.writeFile).toHaveBeenCalledWith('counters/links.md', '5');
    });
  });
});
