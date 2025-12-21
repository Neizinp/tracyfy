/**
 * Empty State Tests
 *
 * Tests for empty state rendering across all artifact list components.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BaseArtifactTable } from '../BaseArtifactTable';

// Mock providers
vi.mock('../../app/providers', () => ({
  useUI: () => ({
    columnVisibility: {},
    setColumnVisibility: vi.fn(),
  }),
}));

describe('Empty State Rendering', () => {
  describe('BaseArtifactTable empty states', () => {
    it('should render default empty message when no data', () => {
      render(
        <BaseArtifactTable
          data={[]}
          columns={[]}
          sortConfig={{ key: 'id', direction: 'asc' }}
          onSortChange={vi.fn()}
          onRowClick={vi.fn()}
        />
      );

      expect(screen.getByText(/No artifacts found/)).toBeInTheDocument();
    });

    it('should render custom empty message when provided', () => {
      render(
        <BaseArtifactTable
          data={[]}
          columns={[]}
          sortConfig={{ key: 'id', direction: 'asc' }}
          onSortChange={vi.fn()}
          onRowClick={vi.fn()}
          emptyMessage="No requirements found. Create your first requirement."
        />
      );

      expect(screen.getByText(/No requirements found/)).toBeInTheDocument();
    });

    it('should render links-specific empty message', () => {
      render(
        <BaseArtifactTable
          data={[]}
          columns={[]}
          sortConfig={{ key: 'id', direction: 'asc' }}
          onSortChange={vi.fn()}
          onRowClick={vi.fn()}
          emptyMessage="No links found. Create links from artifact Relationships tabs."
        />
      );

      expect(screen.getByText(/No links found/)).toBeInTheDocument();
    });
  });

  describe('Empty state styling', () => {
    it('should have centered text in empty state', () => {
      const { container } = render(
        <BaseArtifactTable
          data={[]}
          columns={[]}
          sortConfig={{ key: 'id', direction: 'asc' }}
          onSortChange={vi.fn()}
          onRowClick={vi.fn()}
        />
      );

      const emptyDiv = container.querySelector('[style*="text-align"]');
      expect(emptyDiv).toBeInTheDocument();
    });
  });
});
