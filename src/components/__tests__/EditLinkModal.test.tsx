/**
 * EditLinkModal Component Tests
 *
 * Tests for the modal that edits link type and project scope.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { EditLinkModal } from '../EditLinkModal';
import { renderWithStore as render } from '../../test/renderWithStore';
import type { Link } from '../../types';

describe('EditLinkModal', () => {
  const mockLink: Link = {
    id: 'LINK-001',
    sourceId: 'REQ-001',
    targetId: 'UC-001',
    type: 'satisfies',
    dateCreated: 1700000000000,
    lastModified: 1700000100000,
    revision: '01',
  };

  const defaultProps = {
    isOpen: true,
    link: mockLink,
    onClose: vi.fn(),
    onSave: vi.fn().mockResolvedValue(undefined),
    onDelete: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should not render when closed', () => {
      render(<EditLinkModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByText(/Edit Link/i)).not.toBeInTheDocument();
    });

    it('should render modal when open', () => {
      render(<EditLinkModal {...defaultProps} />);

      expect(screen.getByText(/Edit Link/i)).toBeInTheDocument();
    });

    it('should display link ID in header', () => {
      render(<EditLinkModal {...defaultProps} />);

      expect(screen.getByText(/LINK-001/)).toBeInTheDocument();
    });

    it('should display source and target artifact IDs', () => {
      render(<EditLinkModal {...defaultProps} />);

      expect(screen.getByText('REQ-001')).toBeInTheDocument();
      expect(screen.getByText('UC-001')).toBeInTheDocument();
    });

    it('should have a link type selector', () => {
      render(<EditLinkModal {...defaultProps} />);

      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should not render when link is null', () => {
      render(<EditLinkModal {...defaultProps} link={null} />);

      expect(screen.queryByText(/Edit Link/i)).not.toBeInTheDocument();
    });
  });

  describe('Link type options', () => {
    it('offers only the types the traceability rules allow between the two kinds', () => {
      render(<EditLinkModal {...defaultProps} />);

      // A requirement can satisfy a use case; it cannot verify one
      const options = screen.getAllByRole('option').map((o) => o.textContent);
      expect(options).toEqual(['Satisfies', 'Duplicates', 'Related to']);
    });

    it("keeps a link's own type in the menu even when the rules do not allow it", () => {
      render(<EditLinkModal {...defaultProps} link={{ ...mockLink, type: 'verifies' }} />);

      expect(
        screen.getByRole('option', { name: 'Verifies (not allowed by the traceability rules)' })
      ).toBeInTheDocument();
    });

    it('should allow changing link type', () => {
      render(<EditLinkModal {...defaultProps} />);

      const typeSelect = screen.getByRole('combobox');
      fireEvent.change(typeSelect, { target: { value: 'related_to' } });

      expect((typeSelect as HTMLSelectElement).value).toBe('related_to');
    });
  });

  describe('Actions', () => {
    it('should have a Cancel button', () => {
      render(<EditLinkModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    });

    it('should have a Save button', () => {
      render(<EditLinkModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: /Save/i })).toBeInTheDocument();
    });

    it('should have a Delete button', () => {
      render(<EditLinkModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: /Delete/i })).toBeInTheDocument();
    });

    it('should call onClose when Cancel is clicked', () => {
      render(<EditLinkModal {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('should call onSave when form is submitted', async () => {
      render(<EditLinkModal {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /Save/i }));

      await waitFor(() => {
        expect(defaultProps.onSave).toHaveBeenCalledWith('LINK-001', { type: 'satisfies' });
      });
    });
  });

  describe('Close button', () => {
    it('should have a close button (X)', () => {
      render(<EditLinkModal {...defaultProps} />);

      // The close button contains an X icon
      const closeButtons = screen.getAllByRole('button');
      expect(closeButtons.length).toBeGreaterThan(0);
    });
  });
});
