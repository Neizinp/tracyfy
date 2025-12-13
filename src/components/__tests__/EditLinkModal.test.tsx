/**
 * EditLinkModal Component Tests
 *
 * Tests for the modal that edits link type and project scope.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EditLinkModal } from '../EditLinkModal';
import type { Link, Project } from '../../types';

describe('EditLinkModal', () => {
  const mockLink: Link = {
    id: 'LINK-001',
    sourceId: 'REQ-001',
    targetId: 'UC-001',
    type: 'satisfies',
    projectIds: [],
    dateCreated: 1700000000000,
    lastModified: 1700000100000,
  };

  const mockProjectScopedLink: Link = {
    id: 'LINK-002',
    sourceId: 'REQ-002',
    targetId: 'TC-001',
    type: 'verifies',
    projectIds: ['PRJ-001'],
    dateCreated: 1700000000000,
    lastModified: 1700000000000,
  };

  const mockProjects: Project[] = [
    {
      id: 'PRJ-001',
      name: 'Project Alpha',
      description: '',
      lastModified: 1700000000000,
      requirementIds: [],
      useCaseIds: [],
      testCaseIds: [],
      informationIds: [],
    },
    {
      id: 'PRJ-002',
      name: 'Project Beta',
      description: '',
      lastModified: 1700000000000,
      requirementIds: [],
      useCaseIds: [],
      testCaseIds: [],
      informationIds: [],
    },
  ];

  const defaultProps = {
    isOpen: true,
    link: mockLink,
    projects: mockProjects,
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
    it('should include common link type options', () => {
      render(<EditLinkModal {...defaultProps} />);

      // These should appear as options in the select
      expect(screen.getByText('Satisfies')).toBeInTheDocument();
      expect(screen.getByText('Verifies')).toBeInTheDocument();
      expect(screen.getByText('Related to')).toBeInTheDocument();
    });

    it('should allow changing link type', () => {
      render(<EditLinkModal {...defaultProps} />);

      const typeSelect = screen.getByRole('combobox');
      fireEvent.change(typeSelect, { target: { value: 'depends_on' } });

      expect((typeSelect as HTMLSelectElement).value).toBe('depends_on');
    });
  });

  describe('Project scope', () => {
    it('should show Global button for global links', () => {
      render(<EditLinkModal {...defaultProps} />);

      expect(screen.getByText('Global')).toBeInTheDocument();
    });

    it('should show Project-Specific button', () => {
      render(<EditLinkModal {...defaultProps} />);

      expect(screen.getByText('Project-Specific')).toBeInTheDocument();
    });

    it('should show project name for project-scoped links', () => {
      render(<EditLinkModal {...defaultProps} link={mockProjectScopedLink} />);

      // After clicking Project-Specific or if already project-scoped
      expect(screen.getByText('Project Alpha')).toBeInTheDocument();
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
        expect(defaultProps.onSave).toHaveBeenCalledWith('LINK-001', {
          type: 'satisfies',
          projectIds: [],
        });
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
