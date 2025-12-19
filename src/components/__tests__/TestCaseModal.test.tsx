import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TestCaseModal } from '../TestCaseModal';
import { UIProvider } from '../../app/providers';
import type { TestCase } from '../../types';

// Mock dependencies
vi.mock('../RevisionHistoryTab', () => ({
  RevisionHistoryTab: () => <div data-testid="revision-history">Revision History</div>,
}));

vi.mock('../../utils/dateUtils', () => ({
  formatDateTime: (timestamp: number) => new Date(timestamp).toISOString(),
}));

vi.mock('../../hooks/useCustomAttributes', () => ({
  useCustomAttributes: () => ({
    definitions: [],
    isLoading: false,
    getApplicableDefinitions: () => [],
    getDefinitionById: () => null,
    createDefinition: vi.fn(),
    updateDefinition: vi.fn(),
    deleteDefinition: vi.fn(),
  }),
}));

vi.mock('../../app/providers', async () => {
  const actual = await vi.importActual('../../app/providers');
  return {
    ...(actual as object),
    useUser: () => ({
      currentUser: { id: 'USER-001', name: 'Test User' },
      users: [{ id: 'USER-001', name: 'Test User' }],
      isLoading: false,
      createUser: vi.fn(),
      updateUser: vi.fn(),
      deleteUser: vi.fn(),
      switchUser: vi.fn(),
    }),
  };
});

const renderWithProvider = (ui: React.ReactElement) => {
  return render(<UIProvider>{ui}</UIProvider>);
};

describe('TestCaseModal', () => {
  const mockTestCase: TestCase = {
    id: 'TC-001',
    title: 'Login Test',
    description: 'Test user login functionality',
    status: 'draft',
    priority: 'high',
    requirementIds: ['REQ-001'],
    dateCreated: Date.now(),
    lastModified: Date.now(),
    revision: '01',
    author: 'Test Author',
  };

  const defaultProps = {
    isOpen: true,
    testCase: null as TestCase | null,
    onClose: vi.fn(),
    onCreate: vi.fn(),
    onUpdate: vi.fn(),
    onDelete: vi.fn(),
  };

  describe('Create Mode', () => {
    it('should render in create mode when testCase is null', () => {
      renderWithProvider(<TestCaseModal {...defaultProps} />);
      expect(screen.getByText('New Test Case')).toBeInTheDocument();
    });

    it('should show tabs in create mode', () => {
      renderWithProvider(<TestCaseModal {...defaultProps} />);
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Relationships')).toBeInTheDocument();
      // History tab not shown in create mode
      expect(screen.queryByText('Revision History')).not.toBeInTheDocument();
    });

    it('should show message in Relationships tab for new items', () => {
      renderWithProvider(<TestCaseModal {...defaultProps} />);
      fireEvent.click(screen.getByText('Relationships'));
      expect(screen.getByText(/Save the test case first/)).toBeInTheDocument();
    });

    it('should call onCreate when form is submitted', () => {
      renderWithProvider(<TestCaseModal {...defaultProps} />);

      const titleInput = screen.getByRole('textbox', { name: /Title/i });
      fireEvent.change(titleInput, { target: { value: 'New Test' } });

      const submitButton = screen.getByText('Create Test Case');
      fireEvent.click(submitButton);

      expect(defaultProps.onCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Test',
          status: 'draft',
        })
      );
    });

    it('should not show delete button in create mode', () => {
      renderWithProvider(<TestCaseModal {...defaultProps} />);
      expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    });
  });

  describe('Edit Mode', () => {
    const editProps = { ...defaultProps, testCase: mockTestCase };

    it('should render in edit mode when testCase is provided', () => {
      renderWithProvider(<TestCaseModal {...editProps} />);
      expect(screen.getByText(/Edit Test Case - TC-001/)).toBeInTheDocument();
    });

    it('should show all tabs in edit mode', () => {
      renderWithProvider(<TestCaseModal {...editProps} />);
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Relationships')).toBeInTheDocument();
      expect(screen.getByText('Revision History')).toBeInTheDocument();
    });

    it('should populate form with testCase data', () => {
      renderWithProvider(<TestCaseModal {...editProps} />);
      expect(screen.getByDisplayValue('Login Test')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test user login functionality')).toBeInTheDocument();
    });

    it('should call onUpdate when form is saved', () => {
      renderWithProvider(<TestCaseModal {...editProps} />);

      const titleInput = screen.getByRole('textbox', { name: /Title/i });
      fireEvent.change(titleInput, { target: { value: 'Updated Test' } });

      const submitButton = screen.getByText('Save Changes');
      fireEvent.click(submitButton);

      expect(defaultProps.onUpdate).toHaveBeenCalledWith(
        'TC-001',
        expect.objectContaining({
          title: 'Updated Test',
        })
      );
    });

    it('should show delete button in edit mode', () => {
      renderWithProvider(<TestCaseModal {...editProps} />);
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('should show delete confirmation when clicking delete', () => {
      renderWithProvider(<TestCaseModal {...editProps} />);
      fireEvent.click(screen.getByText('Delete'));
      expect(screen.getByText(/Are you sure/)).toBeInTheDocument();
    });

    it('should call onDelete when confirmed', () => {
      renderWithProvider(<TestCaseModal {...editProps} />);
      fireEvent.click(screen.getByText('Delete'));

      const confirmButtons = screen.getAllByText('Move to Trash');
      const confirmButton = confirmButtons.find(
        (el) => el.tagName === 'BUTTON' && !el.textContent?.includes('⚠️')
      );
      fireEvent.click(confirmButton!);

      expect(defaultProps.onDelete).toHaveBeenCalledWith('TC-001');
    });
  });

  describe('Common Behavior', () => {
    it('should not render when isOpen is false', () => {
      renderWithProvider(<TestCaseModal {...defaultProps} isOpen={false} />);
      expect(screen.queryByText('New Test Case')).not.toBeInTheDocument();
    });

    it('should call onClose when cancel is clicked', () => {
      renderWithProvider(<TestCaseModal {...defaultProps} />);
      fireEvent.click(screen.getByText('Cancel'));
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('should call onClose when X button is clicked', () => {
      renderWithProvider(<TestCaseModal {...defaultProps} />);
      const buttons = screen.getAllByRole('button');
      const closeButton = buttons.find((btn) => btn.querySelector('svg'));
      fireEvent.click(closeButton!);
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });
});
