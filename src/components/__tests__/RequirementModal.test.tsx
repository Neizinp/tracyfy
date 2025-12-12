import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RequirementModal } from '../RequirementModal';
import { UIProvider } from '../../app/providers';
import type { Requirement } from '../../types';

// Mock dependencies
vi.mock('../RevisionHistoryTab', () => ({
  RevisionHistoryTab: () => <div data-testid="revision-history">Revision History</div>,
}));

vi.mock('../../utils/dateUtils', () => ({
  formatDateTime: (timestamp: number) => new Date(timestamp).toISOString(),
}));

vi.mock('../../hooks/useIncomingLinks', () => ({
  useIncomingLinks: () => [],
}));

vi.mock('../../app/providers', async () => {
  const actual = await vi.importActual('../../app/providers');
  return {
    ...(actual as object),
    useGlobalState: () => ({
      requirements: [],
      useCases: [],
      testCases: [],
      information: [],
      globalRequirements: [],
      globalUseCases: [],
      globalTestCases: [],
      globalInformation: [],
    }),
    useUser: () => ({
      currentUser: { id: 'USER-001', name: 'Test User' },
      users: [{ id: 'USER-001', name: 'Test User' }],
    }),
  };
});

const renderWithProviders = (ui: React.ReactElement) => {
  return render(<UIProvider>{ui}</UIProvider>);
};

describe('RequirementModal', () => {
  const mockRequirement: Requirement = {
    id: 'REQ-001',
    title: 'Test Requirement',
    description: 'Test description',
    text: 'Requirement text',
    rationale: 'Rationale',
    priority: 'high',
    status: 'draft',
    dateCreated: Date.now(),
    lastModified: Date.now(),
    revision: '01',
    author: 'Test Author',
  };

  const defaultProps = {
    isOpen: true,
    requirement: null as Requirement | null,
    onClose: vi.fn(),
    onCreate: vi.fn(),
    onUpdate: vi.fn(),
    onDelete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Create Mode', () => {
    it('should render in create mode when requirement is null', () => {
      renderWithProviders(<RequirementModal {...defaultProps} />);
      expect(screen.getByText('New Requirement')).toBeInTheDocument();
    });

    it('should show tabs in create mode except History', () => {
      renderWithProviders(<RequirementModal {...defaultProps} />);
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Details')).toBeInTheDocument();
      expect(screen.getByText('Relationships')).toBeInTheDocument();
      expect(screen.getByText('Comments')).toBeInTheDocument();
      // History tab not shown in create mode
      expect(screen.queryByText('Revision History')).not.toBeInTheDocument();
    });

    it('should show message in Relationships tab for new items', () => {
      renderWithProviders(<RequirementModal {...defaultProps} />);
      fireEvent.click(screen.getByText('Relationships'));
      expect(screen.getByText(/Save the requirement first/)).toBeInTheDocument();
    });

    it('should call onCreate when form is submitted', () => {
      renderWithProviders(<RequirementModal {...defaultProps} />);

      // Find title input (first text input in form)
      const inputs = screen.getAllByRole('textbox');
      const titleInput = inputs[0];
      fireEvent.change(titleInput, { target: { value: 'New Requirement' } });

      const submitButton = screen.getByText('Create Requirement');
      fireEvent.click(submitButton);

      expect(defaultProps.onCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Requirement',
          status: 'draft',
        })
      );
    });

    it('should not show delete button in create mode', () => {
      renderWithProviders(<RequirementModal {...defaultProps} />);
      expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    });
  });

  describe('Edit Mode', () => {
    const editProps = { ...defaultProps, requirement: mockRequirement };

    it('should render in edit mode when requirement is provided', () => {
      renderWithProviders(<RequirementModal {...editProps} />);
      expect(screen.getByText(/Edit Requirement - REQ-001/)).toBeInTheDocument();
    });

    it('should show all tabs in edit mode', () => {
      renderWithProviders(<RequirementModal {...editProps} />);
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Details')).toBeInTheDocument();
      expect(screen.getByText('Relationships')).toBeInTheDocument();
      expect(screen.getByText('Comments')).toBeInTheDocument();
      expect(screen.getByText('Revision History')).toBeInTheDocument();
    });

    it('should populate form with requirement data', () => {
      renderWithProviders(<RequirementModal {...editProps} />);
      expect(screen.getByDisplayValue('Test Requirement')).toBeInTheDocument();
    });

    it('should call onUpdate when form is saved', () => {
      renderWithProviders(<RequirementModal {...editProps} />);

      // Find title input (first text input in form)
      const inputs = screen.getAllByRole('textbox');
      const titleInput = inputs[0];
      fireEvent.change(titleInput, { target: { value: 'Updated Requirement' } });

      const submitButton = screen.getByText('Save Changes');
      fireEvent.click(submitButton);

      expect(defaultProps.onUpdate).toHaveBeenCalledWith(
        'REQ-001',
        expect.objectContaining({
          title: 'Updated Requirement',
        })
      );
    });

    it('should show delete button in edit mode', () => {
      renderWithProviders(<RequirementModal {...editProps} />);
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('should show delete confirmation when clicking delete', () => {
      renderWithProviders(<RequirementModal {...editProps} />);
      fireEvent.click(screen.getByText('Delete'));
      expect(screen.getByText(/Are you sure/)).toBeInTheDocument();
    });
  });

  describe('Common Behavior', () => {
    it('should not render when isOpen is false', () => {
      renderWithProviders(<RequirementModal {...defaultProps} isOpen={false} />);
      expect(screen.queryByText('New Requirement')).not.toBeInTheDocument();
    });

    it('should call onClose when cancel is clicked', () => {
      renderWithProviders(<RequirementModal {...defaultProps} />);
      fireEvent.click(screen.getByText('Cancel'));
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });
});
