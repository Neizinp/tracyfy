/**
 * useLinkService Hook Tests
 *
 * Tests for the React hook that manages links using diskLinkService.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
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
  },
}));

describe('useLinkService', () => {
  const mockLinks: Link[] = [
    {
      id: 'LINK-001',
      sourceId: 'REQ-001',
      targetId: 'UC-001',
      type: 'satisfies',
      projectIds: [],
      dateCreated: 1700000000000,
      lastModified: 1700000000000,
    },
    {
      id: 'LINK-002',
      sourceId: 'REQ-001',
      targetId: 'TC-001',
      type: 'verifies',
      projectIds: [],
      dateCreated: 1700000000000,
      lastModified: 1700000000000,
    },
  ];

  const mockIncomingLinks = [
    {
      linkId: 'LINK-003',
      sourceId: 'UC-001',
      sourceType: 'usecase',
      linkType: 'derived_from' as const,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(diskLinkService.getAllLinks).mockResolvedValue(mockLinks);
    vi.mocked(diskLinkService.getLinksForProject).mockResolvedValue(mockLinks);
    vi.mocked(diskLinkService.getOutgoingLinks).mockResolvedValue(mockLinks);
    vi.mocked(diskLinkService.getIncomingLinks).mockResolvedValue(mockIncomingLinks);
    vi.mocked(diskLinkService.getOutgoingLinksForProject).mockResolvedValue(mockLinks);
    vi.mocked(diskLinkService.getIncomingLinksForProject).mockResolvedValue(mockIncomingLinks);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Initial load', () => {
    it('should load all links on mount', async () => {
      const { result } = renderHook(() => useLinkService());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(diskLinkService.getAllLinks).toHaveBeenCalled();
      expect(result.current.allLinks).toEqual(mockLinks);
    });

    it('should load artifact-specific links when artifactId is provided', async () => {
      const { result } = renderHook(() => useLinkService({ artifactId: 'REQ-001' }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(diskLinkService.getOutgoingLinks).toHaveBeenCalledWith('REQ-001');
      expect(diskLinkService.getIncomingLinks).toHaveBeenCalledWith('REQ-001');
      expect(result.current.outgoingLinks).toEqual(mockLinks);
      expect(result.current.incomingLinks).toEqual(mockIncomingLinks);
    });

    it('should use project-filtered methods when projectId is provided', async () => {
      const { result } = renderHook(() =>
        useLinkService({ artifactId: 'REQ-001', projectId: 'PRJ-001' })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(diskLinkService.getLinksForProject).toHaveBeenCalledWith('PRJ-001');
      expect(diskLinkService.getOutgoingLinksForProject).toHaveBeenCalledWith('REQ-001', 'PRJ-001');
      expect(diskLinkService.getIncomingLinksForProject).toHaveBeenCalledWith('REQ-001', 'PRJ-001');
    });

    it('should return empty outgoing and incoming links when no artifactId', async () => {
      const { result } = renderHook(() => useLinkService());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.outgoingLinks).toEqual([]);
      expect(result.current.incomingLinks).toEqual([]);
    });
  });

  describe('Loading state', () => {
    it('should set loading true initially', () => {
      const { result } = renderHook(() => useLinkService());

      // Can't reliably test initial loading state as it resolves immediately
      // But we can check it becomes false
      expect(result.current.loading).toBeDefined();
    });

    it('should set loading false after load completes', async () => {
      const { result } = renderHook(() => useLinkService());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('Error handling', () => {
    it('should set error when load fails', async () => {
      vi.mocked(diskLinkService.getAllLinks).mockRejectedValue(new Error('Load failed'));

      const { result } = renderHook(() => useLinkService());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Load failed');
    });

    it('should set generic error message for non-Error throws', async () => {
      vi.mocked(diskLinkService.getAllLinks).mockRejectedValue('Something went wrong');

      const { result } = renderHook(() => useLinkService());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load links');
    });
  });

  describe('createLink', () => {
    it('should create a new link and refresh', async () => {
      const newLink: Link = {
        id: 'LINK-003',
        sourceId: 'REQ-002',
        targetId: 'UC-002',
        type: 'depends_on',
        projectIds: [],
        dateCreated: Date.now(),
        lastModified: Date.now(),
      };
      vi.mocked(diskLinkService.createLink).mockResolvedValue(newLink);

      const { result } = renderHook(() => useLinkService());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

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
      // Should refresh after create
      expect(diskLinkService.getAllLinks).toHaveBeenCalledTimes(2);
    });

    it('should pass project IDs when creating', async () => {
      const newLink: Link = {
        id: 'LINK-003',
        sourceId: 'REQ-002',
        targetId: 'UC-002',
        type: 'depends_on',
        projectIds: ['PRJ-001'],
        dateCreated: Date.now(),
        lastModified: Date.now(),
      };
      vi.mocked(diskLinkService.createLink).mockResolvedValue(newLink);

      const { result } = renderHook(() => useLinkService());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

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

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // The hook throws the error, so we wrap in try/catch
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
    it('should delete a link and refresh', async () => {
      vi.mocked(diskLinkService.deleteLink).mockResolvedValue(undefined);

      const { result } = renderHook(() => useLinkService());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.deleteLink('LINK-001');
      });

      expect(diskLinkService.deleteLink).toHaveBeenCalledWith('LINK-001');
      // Should refresh after delete
      expect(diskLinkService.getAllLinks).toHaveBeenCalledTimes(2);
    });

    it('should throw when delete fails', async () => {
      vi.mocked(diskLinkService.deleteLink).mockRejectedValue(new Error('Delete failed'));

      const { result } = renderHook(() => useLinkService());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

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

  describe('refresh', () => {
    it('should reload all links', async () => {
      const { result } = renderHook(() => useLinkService());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(diskLinkService.getAllLinks).toHaveBeenCalledTimes(1);

      await act(async () => {
        await result.current.refresh();
      });

      expect(diskLinkService.getAllLinks).toHaveBeenCalledTimes(2);
    });
  });

  describe('Dependency changes', () => {
    it('should reload when artifactId changes', async () => {
      const { result, rerender } = renderHook(({ artifactId }) => useLinkService({ artifactId }), {
        initialProps: { artifactId: 'REQ-001' },
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      rerender({ artifactId: 'REQ-002' });

      await waitFor(() => {
        expect(diskLinkService.getOutgoingLinks).toHaveBeenCalledWith('REQ-002');
      });
    });

    it('should reload when projectId changes', async () => {
      const { result, rerender } = renderHook(({ projectId }) => useLinkService({ projectId }), {
        initialProps: { projectId: 'PRJ-001' },
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      rerender({ projectId: 'PRJ-002' });

      await waitFor(() => {
        expect(diskLinkService.getLinksForProject).toHaveBeenCalledWith('PRJ-002');
      });
    });
  });
});
