/**
 * useLinkService Integration Tests
 *
 * Tests for the link service hook integration with providers.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import type { Link } from '../../types';

// Mock the providers
const mockLinks: Link[] = [
  {
    id: 'LINK-001',
    sourceId: 'REQ-001',
    targetId: 'TC-001',
    type: 'verifies',
    projectIds: [],
    dateCreated: 1700000000000,
    lastModified: 1700000000000,
    revision: '01',
  },
  {
    id: 'LINK-002',
    sourceId: 'UC-001',
    targetId: 'REQ-002',
    type: 'satisfies',
    projectIds: [],
    dateCreated: 1700000000000,
    lastModified: 1700000000000,
    revision: '01',
  },
];

const mockFileSystemContext = {
  isReady: true,
  links: mockLinks,
  setLinks: vi.fn(),
  saveLink: vi.fn(),
  deleteLink: vi.fn(),
  reloadData: vi.fn(),
  refreshStatus: vi.fn(),
  requirements: [],
  useCases: [],
  testCases: [],
  information: [],
  documents: [],
  projects: [],
  setRequirements: vi.fn(),
  setUseCases: vi.fn(),
  setTestCases: vi.fn(),
  setInformation: vi.fn(),
  setDocuments: vi.fn(),
  setProjects: vi.fn(),
  saveRequirement: vi.fn(),
  saveUseCase: vi.fn(),
  saveTestCase: vi.fn(),
  saveInformation: vi.fn(),
  saveDocument: vi.fn(),
  deleteRequirement: vi.fn(),
  deleteUseCase: vi.fn(),
  deleteTestCase: vi.fn(),
  deleteInformation: vi.fn(),
  deleteDocument: vi.fn(),
};

vi.mock('../../app/providers/FileSystemProvider', () => ({
  useFileSystem: () => mockFileSystemContext,
}));

vi.mock('../../services/diskLinkService', () => ({
  diskLinkService: {
    getAllLinks: vi.fn().mockResolvedValue([]),
    createLink: vi.fn(),
    updateLink: vi.fn(),
    deleteLink: vi.fn(),
    subscribe: vi.fn(() => () => {}),
  },
}));

// Import after mocks
import { useLinkService } from '../useLinkService';

describe('useLinkService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Data loading', () => {
    it('should return links from FileSystemProvider', () => {
      const { result } = renderHook(() => useLinkService());

      expect(result.current.allLinks).toEqual(mockLinks);
      expect(result.current.allLinks.length).toBe(2);
    });

    it('should not be loading when isReady is true', () => {
      const { result } = renderHook(() => useLinkService());

      expect(result.current.loading).toBe(false);
    });

    it('should filter by artifactId when provided', () => {
      const { result } = renderHook(() => useLinkService({ artifactId: 'REQ-001' }));

      expect(result.current.outgoingLinks.length).toBe(1);
      expect(result.current.outgoingLinks[0].id).toBe('LINK-001');
    });
  });

  describe('Outgoing links', () => {
    it('should return outgoing links for specified artifact', () => {
      const { result } = renderHook(() => useLinkService({ artifactId: 'REQ-001' }));

      expect(result.current.outgoingLinks.length).toBe(1);
      expect(result.current.outgoingLinks[0].sourceId).toBe('REQ-001');
    });

    it('should return empty array when artifact has no outgoing links', () => {
      const { result } = renderHook(() => useLinkService({ artifactId: 'TC-001' }));

      expect(result.current.outgoingLinks.length).toBe(0);
    });
  });

  describe('Incoming links', () => {
    it('should return incoming links for specified artifact', () => {
      const { result } = renderHook(() => useLinkService({ artifactId: 'TC-001' }));

      expect(result.current.incomingLinks.length).toBe(1);
      expect(result.current.incomingLinks[0].sourceId).toBe('REQ-001');
    });

    it('should return empty array when artifact has no incoming links', () => {
      const { result } = renderHook(() => useLinkService({ artifactId: 'REQ-001' }));

      // REQ-001 has no incoming links in our mock data
      expect(result.current.incomingLinks.length).toBe(0);
    });
  });

  describe('Project filtering', () => {
    it('should return all links when no projectId filter', () => {
      const { result } = renderHook(() => useLinkService());

      expect(result.current.allLinks.length).toBe(2);
    });

    it('should filter by projectId when provided', () => {
      // Add a link with projectIds for this test
      const linksWithProjects = [
        ...mockLinks,
        {
          id: 'LINK-003',
          sourceId: 'REQ-003',
          targetId: 'TC-003',
          type: 'verifies' as const,
          projectIds: ['PRJ-001'],
          dateCreated: 1700000000000,
          lastModified: 1700000000000,
          revision: '01',
        },
      ];

      mockFileSystemContext.links = linksWithProjects;

      const { result } = renderHook(() => useLinkService({ projectId: 'PRJ-001' }));

      // Should include global links (projectIds: []) and project-specific links
      expect(result.current.allLinks.length).toBe(3);
    });
  });
});
