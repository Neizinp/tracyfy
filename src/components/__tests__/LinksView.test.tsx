/**
 * LinksView Component Tests
 *
 * Tests for the component that displays all Link entities.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithStore } from '../../test/renderWithStore';
import type { AppState } from '../../state';
import { LinksView } from '../LinksView';
import { diskLinkService } from '../../services/diskLinkService';
import type { Link } from '../../types';

// Mock the diskLinkService
vi.mock('../../services/diskLinkService', () => ({
  diskLinkService: {
    getAllLinks: vi.fn(),
    deleteLink: vi.fn(),
    updateLink: vi.fn(),
    subscribe: vi.fn(() => () => {}),
  },
}));

// What LinksView reads from the store
const storeState = (): Partial<AppState> => ({
  isReady: true,
  links: [
    {
      id: 'LINK-001',
      sourceId: 'REQ-001',
      targetId: 'UC-001',
      type: 'satisfies',
      dateCreated: 1700000000000,
      lastModified: 1700000100000,
      revision: '01',
    },
    {
      id: 'LINK-002',
      sourceId: 'REQ-002',
      targetId: 'TC-001',
      type: 'verifies',
      dateCreated: 1700000000000,
      lastModified: 1700000000000,
      revision: '01',
    },
    {
      id: 'LINK-003',
      sourceId: 'UC-001',
      targetId: 'INFO-001',
      type: 'related_to',
      dateCreated: 1700000000000,
      lastModified: 1700000000000,
      revision: '01',
    },
  ],
});

describe('LinksView', () => {
  const mockLinks: Link[] = [
    {
      id: 'LINK-001',
      sourceId: 'REQ-001',
      targetId: 'UC-001',
      type: 'satisfies',
      dateCreated: 1700000000000,
      lastModified: 1700000100000,
      revision: '01',
    },
    {
      id: 'LINK-002',
      sourceId: 'REQ-002',
      targetId: 'TC-001',
      type: 'verifies',
      dateCreated: 1700000000000,
      lastModified: 1700000000000,
      revision: '01',
    },
    {
      id: 'LINK-003',
      sourceId: 'UC-001',
      targetId: 'INFO-001',
      type: 'related_to',
      dateCreated: 1700000000000,
      lastModified: 1700000000000,
      revision: '01',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(diskLinkService.getAllLinks).mockResolvedValue(mockLinks);
    vi.mocked(diskLinkService.deleteLink).mockResolvedValue(undefined);
  });

  describe('Rendering', () => {
    it('should render the component', async () => {
      renderWithStore(<LinksView />, { state: storeState() });

      // Component reads its data from the store - just check it renders
      await waitFor(() => {
        expect(screen.getByText('Source')).toBeInTheDocument();
      });
    });

    it('should display links table after loading', async () => {
      renderWithStore(<LinksView />, { state: storeState() });

      await waitFor(() => {
        expect(screen.getByText('Source')).toBeInTheDocument();
        expect(screen.getByText('Target')).toBeInTheDocument();
      });
    });

    it('should show link IDs in the table', async () => {
      renderWithStore(<LinksView />, { state: storeState() });

      await waitFor(() => {
        expect(screen.getByText('LINK-001')).toBeInTheDocument();
      });
    });

    it('should show empty state when no links exist', async () => {
      renderWithStore(<LinksView />, { state: { ...storeState(), links: [] } });

      await waitFor(() => {
        expect(screen.getByText(/No links/i)).toBeInTheDocument();
      });
    });
  });

  describe('Table headers', () => {
    it('should display Source and Target columns', async () => {
      renderWithStore(<LinksView />, { state: storeState() });

      await waitFor(() => {
        expect(screen.getByText('Source')).toBeInTheDocument();
        expect(screen.getByText('Target')).toBeInTheDocument();
      });
    });

    it('should display Type column', async () => {
      renderWithStore(<LinksView />, { state: storeState() });

      await waitFor(() => {
        // Type might be in header
        const typeElements = screen.getAllByText(/Type/i);
        expect(typeElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Data display', () => {
    it('should display link IDs in the table', async () => {
      renderWithStore(<LinksView />, { state: storeState() });

      await waitFor(() => {
        expect(screen.getByText('LINK-001')).toBeInTheDocument();
        expect(screen.getByText('LINK-002')).toBeInTheDocument();
      });
    });
  });

  describe('Refresh functionality', () => {
    it('should have a refresh button', async () => {
      renderWithStore(<LinksView />, { state: storeState() });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
      });
    });
  });
});
