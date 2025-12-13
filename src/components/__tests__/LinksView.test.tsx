/**
 * LinksView Component Tests
 *
 * Tests for the component that displays all Link entities.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { LinksView } from '../LinksView';
import { diskLinkService } from '../../services/diskLinkService';
import type { Link, Project } from '../../types';

// Mock the diskLinkService
vi.mock('../../services/diskLinkService', () => ({
  diskLinkService: {
    getAllLinks: vi.fn(),
    deleteLink: vi.fn(),
    updateLink: vi.fn(),
  },
}));

describe('LinksView', () => {
  const mockLinks: Link[] = [
    {
      id: 'LINK-001',
      sourceId: 'REQ-001',
      targetId: 'UC-001',
      type: 'satisfies',
      projectIds: [],
      dateCreated: 1700000000000,
      lastModified: 1700000100000,
    },
    {
      id: 'LINK-002',
      sourceId: 'REQ-002',
      targetId: 'TC-001',
      type: 'verifies',
      projectIds: ['PRJ-001'],
      dateCreated: 1700000000000,
      lastModified: 1700000000000,
    },
    {
      id: 'LINK-003',
      sourceId: 'UC-001',
      targetId: 'INFO-001',
      type: 'related_to',
      projectIds: [],
      dateCreated: 1700000000000,
      lastModified: 1700000000000,
    },
  ];

  const mockProjects: Project[] = [
    {
      id: 'PRJ-001',
      name: 'Test Project',
      description: '',
      lastModified: 1700000000000,
      requirementIds: [],
      useCaseIds: [],
      testCaseIds: [],
      informationIds: [],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(diskLinkService.getAllLinks).mockResolvedValue(mockLinks);
    vi.mocked(diskLinkService.deleteLink).mockResolvedValue(undefined);
  });

  describe('Rendering', () => {
    it('should render the component', async () => {
      render(<LinksView projects={mockProjects} />);

      // Wait for async load to complete
      await waitFor(() => {
        expect(diskLinkService.getAllLinks).toHaveBeenCalled();
      });
    });

    it('should display links table after loading', async () => {
      render(<LinksView projects={mockProjects} />);

      await waitFor(() => {
        expect(screen.getByText('Source')).toBeInTheDocument();
        expect(screen.getByText('Target')).toBeInTheDocument();
      });
    });

    it('should show link IDs in the table', async () => {
      render(<LinksView projects={mockProjects} />);

      await waitFor(() => {
        expect(screen.getByText('LINK-001')).toBeInTheDocument();
      });
    });

    it('should show empty state when no links exist', async () => {
      vi.mocked(diskLinkService.getAllLinks).mockResolvedValue([]);

      render(<LinksView projects={mockProjects} />);

      await waitFor(() => {
        expect(screen.getByText(/No links/i)).toBeInTheDocument();
      });
    });
  });

  describe('Table headers', () => {
    it('should display Source and Target columns', async () => {
      render(<LinksView projects={mockProjects} />);

      await waitFor(() => {
        expect(screen.getByText('Source')).toBeInTheDocument();
        expect(screen.getByText('Target')).toBeInTheDocument();
      });
    });

    it('should display Type column', async () => {
      render(<LinksView projects={mockProjects} />);

      await waitFor(() => {
        // Type might be in header
        const typeElements = screen.getAllByText(/Type/i);
        expect(typeElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Data display', () => {
    it('should display link IDs in the table', async () => {
      render(<LinksView projects={mockProjects} />);

      await waitFor(() => {
        expect(screen.getByText('LINK-001')).toBeInTheDocument();
        expect(screen.getByText('LINK-002')).toBeInTheDocument();
      });
    });
  });

  describe('Refresh functionality', () => {
    it('should have a refresh button', async () => {
      render(<LinksView projects={mockProjects} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
      });
    });
  });
});
