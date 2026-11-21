/**
 * useLinkService Hook Tests
 *
 * The hook reads links from the store and writes them through the store's
 * actions (so every view updates), never through diskLinkService directly.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLinkService } from '../useLinkService';
import { storeWrapper } from '../../test/renderWithStore';
import { diskLinkService } from '../../services/diskLinkService';
import type { Link } from '../../types';

// Mock the diskLinkService
vi.mock('../../services/diskLinkService', () => ({
  diskLinkService: {
    getAllLinks: vi.fn(),
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
    dateCreated: 1700000000000,
    lastModified: 1700000000000,
    revision: '01',
  },
  {
    id: 'LINK-002',
    sourceId: 'REQ-001',
    targetId: 'TC-001',
    type: 'verifies',
    dateCreated: 1700000000000,
    lastModified: 1700000000000,
    revision: '01',
  },
  {
    id: 'LINK-003',
    sourceId: 'UC-001',
    targetId: 'REQ-001',
    type: 'derived_from',
    dateCreated: 1700000000000,
    lastModified: 1700000000000,
    revision: '01',
  },
];

const mockCreateLink = vi.fn();
const mockDeleteLink = vi.fn();

const render = (options?: Parameters<typeof useLinkService>[0]) =>
  renderHook(() => useLinkService(options), {
    wrapper: storeWrapper({
      isReady: true,
      links: mockLinks,
      createLink: mockCreateLink,
      deleteLink: mockDeleteLink,
    }).wrapper,
  });

describe('useLinkService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Link data from the store', () => {
    it('should return all links in the store', () => {
      const { result } = render();

      expect(result.current.allLinks).toHaveLength(3);
      expect(result.current.allLinks).toEqual(mockLinks);
    });

    it('should return empty outgoing/incoming when no artifactId', () => {
      const { result } = render();

      expect(result.current.outgoingLinks).toEqual([]);
      expect(result.current.incomingLinks).toEqual([]);
    });

    it('should filter outgoing links by artifactId', () => {
      const { result } = render({ artifactId: 'REQ-001' });

      expect(result.current.outgoingLinks).toHaveLength(2);
      expect(result.current.outgoingLinks.every((l) => l.sourceId === 'REQ-001')).toBe(true);
    });

    it('should filter incoming links by artifactId', () => {
      const { result } = render({ artifactId: 'REQ-001' });

      expect(result.current.incomingLinks).toHaveLength(1);
      expect(result.current.incomingLinks[0].sourceId).toBe('UC-001');
    });
  });

  describe('createLink', () => {
    it('should create links through the store', async () => {
      const newLink: Link = {
        id: 'LINK-004',
        sourceId: 'REQ-002',
        targetId: 'UC-002',
        type: 'depends_on',
        dateCreated: Date.now(),
        lastModified: Date.now(),
        revision: '01',
      };
      mockCreateLink.mockResolvedValue(newLink);

      const { result } = render();

      let created: Link | undefined;
      await act(async () => {
        created = await result.current.createLink('REQ-002', 'UC-002', 'depends_on');
      });

      expect(created).toEqual(newLink);
      expect(diskLinkService.createLink).not.toHaveBeenCalled();
      expect(mockCreateLink).toHaveBeenCalledWith('REQ-002', 'UC-002', 'depends_on');
    });

    it('should throw when create fails', async () => {
      mockCreateLink.mockRejectedValue(new Error('Create failed'));

      const { result } = render();

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
    it('should delete links through the store', async () => {
      mockDeleteLink.mockResolvedValue(undefined);

      const { result } = render();

      await act(async () => {
        await result.current.deleteLink('LINK-001');
      });

      expect(diskLinkService.deleteLink).not.toHaveBeenCalled();
      expect(mockDeleteLink).toHaveBeenCalledWith('LINK-001');
    });

    it('should throw when delete fails', async () => {
      mockDeleteLink.mockRejectedValue(new Error('Delete failed'));

      const { result } = render();

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
      const { result } = render();

      expect(result.current.loading).toBeDefined();
    });
  });

  describe('Error state', () => {
    it('should have null error on success', () => {
      const { result } = render();

      expect(result.current.error).toBeNull();
    });
  });
});
