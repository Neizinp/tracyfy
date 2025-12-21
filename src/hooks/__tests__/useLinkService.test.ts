/**
 * useLinkService Hook Tests
 *
 * Tests for the React hook that manages links using FileSystemProvider.
 * The hook now derives links from useFileSystem() and only calls diskLinkService for mutations.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLinkService } from '../useLinkService';
import { diskLinkService } from '../../services/diskLinkService';
import type { Link } from '../../types';

// Mock the diskLinkService
vi.mock('../../services/diskLinkService', () => ({
  diskLinkService: {
    getAllLinks: vi.fn(),
    getLinksForProject: vi.fn(),
    getOutgoingLinks: vi.fn(),
    getIncomingLinks: vi.fn(),
    getOutgoingLinksForProject: vi.fn(),
    getIncomingLinksForProject: vi.fn(),
    createLink: vi.fn(),
    deleteLink: vi.fn(),
    subscribe: vi.fn(() => () => {}),
  },
}));

// Mock links data
const mockLinks: Link[] = [
  {
    id: 'LINK-001',
    sourceId: 'REQ-001',
    targetId: 'UC-001',
    type: 'satisfies',
    projectIds: [],
    dateCreated: 1700000000000,
    lastModified: 1700000000000,
    revision: '01',
  },
  {
    id: 'LINK-002',
    sourceId: 'REQ-001',
    targetId: 'TC-001',
    type: 'verifies',
    projectIds: [],
    dateCreated: 1700000000000,
    lastModified: 1700000000000,
    revision: '01',
  },
  {
    id: 'LINK-003',
    sourceId: 'UC-001',
    targetId: 'REQ-001',
    type: 'derived_from',
    projectIds: ['PRJ-001'],
    dateCreated: 1700000000000,
    lastModified: 1700000000000,
    revision: '01',
  },
];

// Mock the FileSystemProvider - the hook now uses this for link data
vi.mock('../../app/providers/FileSystemProvider', () => ({
  useFileSystem: vi.fn(() => ({
    isReady: true,
    links: mockLinks,
    setLinks: vi.fn(),
    saveLink: vi.fn(),
    deleteLink: vi.fn(),
    reloadData: vi.fn(),
  })),
}));

describe('useLinkService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Link data from provider', () => {
    it('should return all links from provider', () => {
      const { result } = renderHook(() => useLinkService());

      expect(result.current.allLinks).toHaveLength(3);
      expect(result.current.allLinks).toEqual(mockLinks);
    });

    it('should return empty outgoing/incoming when no artifactId', () => {
      const { result } = renderHook(() => useLinkService());

      expect(result.current.outgoingLinks).toEqual([]);
      expect(result.current.incomingLinks).toEqual([]);
    });

    it('should filter outgoing links by artifactId', () => {
      const { result } = renderHook(() => useLinkService({ artifactId: 'REQ-001' }));

      expect(result.current.outgoingLinks).toHaveLength(2);
      expect(result.current.outgoingLinks.every((l) => l.sourceId === 'REQ-001')).toBe(true);
    });

    it('should filter incoming links by artifactId', () => {
      const { result } = renderHook(() => useLinkService({ artifactId: 'REQ-001' }));

      expect(result.current.incomingLinks).toHaveLength(1);
      expect(result.current.incomingLinks[0].sourceId).toBe('UC-001');
    });
  });

  describe('Project filtering', () => {
    it('should include links with no projectIds (global links)', () => {
      const { result } = renderHook(() => useLinkService({ projectId: 'PRJ-001' }));

      // Should include global links (empty projectIds) and project-specific links
      expect(result.current.allLinks.length).toBeGreaterThan(0);
    });

    it('should include links for the specified project', () => {
      const { result } = renderHook(() => useLinkService({ projectId: 'PRJ-001' }));

      const projectLink = result.current.allLinks.find((l) => l.id === 'LINK-003');
      expect(projectLink).toBeDefined();
    });
  });

  describe('createLink', () => {
    it('should call diskLinkService.createLink', async () => {
      const newLink: Link = {
        id: 'LINK-004',
        sourceId: 'REQ-002',
        targetId: 'UC-002',
        type: 'depends_on',
        projectIds: [],
        dateCreated: Date.now(),
        lastModified: Date.now(),
        revision: '01',
      };
      vi.mocked(diskLinkService.createLink).mockResolvedValue(newLink);

      const { result } = renderHook(() => useLinkService());

      let created: Link | undefined;
      await act(async () => {
        created = await result.current.createLink('REQ-002', 'UC-002', 'depends_on');
      });

      expect(created).toEqual(newLink);
      expect(diskLinkService.createLink).toHaveBeenCalledWith(
        'REQ-002',
        'UC-002',
        'depends_on',
        []
      );
    });

    it('should pass project IDs when creating', async () => {
      const newLink: Link = {
        id: 'LINK-004',
        sourceId: 'REQ-002',
        targetId: 'UC-002',
        type: 'depends_on',
        projectIds: ['PRJ-001'],
        dateCreated: Date.now(),
        lastModified: Date.now(),
        revision: '01',
      };
      vi.mocked(diskLinkService.createLink).mockResolvedValue(newLink);

      const { result } = renderHook(() => useLinkService());

      await act(async () => {
        await result.current.createLink('REQ-002', 'UC-002', 'depends_on', ['PRJ-001']);
      });

      expect(diskLinkService.createLink).toHaveBeenCalledWith('REQ-002', 'UC-002', 'depends_on', [
        'PRJ-001',
      ]);
    });

    it('should throw when create fails', async () => {
      vi.mocked(diskLinkService.createLink).mockRejectedValue(new Error('Create failed'));

      const { result } = renderHook(() => useLinkService());

      let thrownError: Error | null = null;
      await act(async () => {
        try {
          await result.current.createLink('REQ-002', 'UC-002', 'depends_on');
        } catch (e) {
          thrownError = e as Error;
        }
      });

      expect(thrownError).not.toBeNull();
      expect(thrownError!.message).toBe('Create failed');
    });
  });

  describe('deleteLink', () => {
    it('should call diskLinkService.deleteLink', async () => {
      vi.mocked(diskLinkService.deleteLink).mockResolvedValue(undefined);

      const { result } = renderHook(() => useLinkService());

      await act(async () => {
        await result.current.deleteLink('LINK-001');
      });

      expect(diskLinkService.deleteLink).toHaveBeenCalledWith('LINK-001');
    });

    it('should throw when delete fails', async () => {
      vi.mocked(diskLinkService.deleteLink).mockRejectedValue(new Error('Delete failed'));

      const { result } = renderHook(() => useLinkService());

      let thrownError: Error | null = null;
      await act(async () => {
        try {
          await result.current.deleteLink('LINK-001');
        } catch (e) {
          thrownError = e as Error;
        }
      });

      expect(thrownError).not.toBeNull();
      expect(thrownError!.message).toBe('Delete failed');
    });
  });

  describe('Loading state', () => {
    it('should not be loading when provider is ready', () => {
      const { result } = renderHook(() => useLinkService());

      expect(result.current.loading).toBeDefined();
    });
  });

  describe('Error state', () => {
    it('should have null error on success', () => {
      const { result } = renderHook(() => useLinkService());

      expect(result.current.error).toBeNull();
    });
  });
});
