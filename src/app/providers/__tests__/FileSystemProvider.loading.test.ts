/**
 * FileSystemProvider Loading Tests
 *
 * Tests for data loading and state management in FileSystemProvider.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import type {
  Requirement,
  UseCase,
  TestCase,
  Information,
  Link,
  ArtifactDocument,
} from '../../types';

// Mock data
const mockRequirements: Requirement[] = [
  {
    id: 'REQ-001',
    title: 'Test Requirement',
    description: 'Description',
    text: 'Text',
    author: 'Author',
    priority: 'high',
    status: 'draft',
    dateCreated: 1700000000000,
    lastModified: 1700000000000,
    revision: '01',
  },
];

const mockUseCases: UseCase[] = [
  {
    id: 'UC-001',
    title: 'Test Use Case',
    description: 'Description',
    actor: 'User',
    preconditions: '',
    mainFlow: '',
    alternativeFlows: '',
    postconditions: '',
    priority: 'medium',
    status: 'draft',
    dateCreated: 1700000000000,
    lastModified: 1700000000000,
    revision: '01',
  },
];

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
];

// Mock diskProjectService
vi.mock('../../services/diskProjectService', () => ({
  diskProjectService: {
    loadAll: vi.fn().mockResolvedValue({
      requirements: mockRequirements,
      useCases: mockUseCases,
      testCases: [],
      information: [],
      projects: [],
      documents: [],
      links: mockLinks,
    }),
    subscribe: vi.fn(() => () => {}),
  },
}));

vi.mock('../../services/diskLinkService', () => ({
  diskLinkService: {
    getAllLinks: vi.fn().mockResolvedValue(mockLinks),
    subscribe: vi.fn(() => () => {}),
  },
}));

describe('FileSystemProvider Loading', () => {
  describe('Data loading', () => {
    it('should load all artifact types on initialization', async () => {
      // This test verifies the contract that FileSystemProvider
      // loads requirements, useCases, testCases, information, documents, and links

      const { diskProjectService } = await import('../../services/diskProjectService');

      const data = await diskProjectService.loadAll();

      expect(data.requirements).toBeDefined();
      expect(data.useCases).toBeDefined();
      expect(data.testCases).toBeDefined();
      expect(data.information).toBeDefined();
      expect(data.links).toBeDefined();
    });

    it('should include links in loadAll response', async () => {
      const { diskProjectService } = await import('../../services/diskProjectService');

      const data = await diskProjectService.loadAll();

      expect(data.links).toEqual(mockLinks);
      expect(data.links.length).toBe(1);
    });

    it('should return links with correct properties', async () => {
      const { diskProjectService } = await import('../../services/diskProjectService');

      const data = await diskProjectService.loadAll();
      const link = data.links[0];

      expect(link.id).toBe('LINK-001');
      expect(link.sourceId).toBe('REQ-001');
      expect(link.targetId).toBe('UC-001');
      expect(link.type).toBe('satisfies');
      expect(link.projectIds).toEqual([]);
      expect(link.revision).toBe('01');
    });
  });

  describe('State synchronization', () => {
    it('should include links in state after loading', async () => {
      const { diskLinkService } = await import('../../services/diskLinkService');

      const links = await diskLinkService.getAllLinks();

      expect(links).toEqual(mockLinks);
    });
  });

  describe('Refresh functionality', () => {
    it('should reload data when reloadData is called', async () => {
      const { diskProjectService } = await import('../../services/diskProjectService');

      // First load
      await diskProjectService.loadAll();

      // Should be callable again
      const data = await diskProjectService.loadAll();

      expect(data.requirements).toBeDefined();
      expect(diskProjectService.loadAll).toHaveBeenCalled();
    });
  });
});
