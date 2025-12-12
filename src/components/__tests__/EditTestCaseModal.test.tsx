import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EditTestCaseModal } from '../EditTestCaseModal';
import { UIProvider } from '../../app/providers';
import type { TestCase } from '../../types';

// Mock dependencies
vi.mock('../RevisionHistoryTab', () => ({
  RevisionHistoryTab: () => <div data-testid="revision-history">Revision History</div>,
}));

vi.mock('../../utils/dateUtils', () => ({
  formatDateTime: (timestamp: number) => new Date(timestamp).toISOString(),
}));

const renderWithProvider = (ui: React.ReactElement) => {
  return render(<UIProvider>{ui}</UIProvider>);
};

describe('EditTestCaseModal', () => {
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
    testCase: mockTestCase,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
    onDelete: vi.fn(),
  };

  it('should render when isOpen is true and testCase is provided', () => {
    renderWithProvider(<EditTestCaseModal {...defaultProps} />);
    expect(screen.getByText(/Edit Test Case - TC-001/i)).toBeInTheDocument();
  });

  it('should not render when isOpen is false', () => {
    renderWithProvider(<EditTestCaseModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText(/Edit Test Case/i)).not.toBeInTheDocument();
  });

  it('should not render when testCase is null', () => {
    renderWithProvider(<EditTestCaseModal {...defaultProps} testCase={null} />);
    expect(screen.queryByText(/Edit Test Case/i)).not.toBeInTheDocument();
  });

  it('should display tabs', () => {
    renderWithProvider(<EditTestCaseModal {...defaultProps} />);
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Relationships')).toBeInTheDocument();
    expect(screen.getByText('Revision History')).toBeInTheDocument();
  });

  it('should switch between tabs', () => {
    renderWithProvider(<EditTestCaseModal {...defaultProps} />);

    const historyTab = screen.getByText('Revision History');
    fireEvent.click(historyTab);

    expect(screen.getByTestId('revision-history')).toBeInTheDocument();
  });

  it('should populate form fields with test case data', () => {
    renderWithProvider(<EditTestCaseModal {...defaultProps} />);

    expect(screen.getByDisplayValue('Login Test')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test user login functionality')).toBeInTheDocument();
    // Author is displayed as read-only text, not an input
    expect(screen.getByText('Test Author')).toBeInTheDocument();
  });

  it('should update title field', () => {
    renderWithProvider(<EditTestCaseModal {...defaultProps} />);

    const titleInput = screen.getByLabelText(/Title/i);
    fireEvent.change(titleInput, { target: { value: 'Updated Test' } });

    expect(screen.getByDisplayValue('Updated Test')).toBeInTheDocument();
  });

  it('should call onSubmit with correct data when saved', () => {
    renderWithProvider(<EditTestCaseModal {...defaultProps} />);

    const titleInput = screen.getByLabelText(/Title/i);
    fireEvent.change(titleInput, { target: { value: 'Updated Test' } });

    const submitButton = screen.getByText('Save Changes');
    fireEvent.click(submitButton);

    expect(defaultProps.onSubmit).toHaveBeenCalledWith(
      'TC-001',
      expect.objectContaining({
        title: 'Updated Test',
        lastModified: expect.any(Number),
      })
    );
  });

  it('should call onClose when cancel is clicked', () => {
    renderWithProvider(<EditTestCaseModal {...defaultProps} />);

    const cancelButton = screen.getAllByText('Cancel')[0]; // First cancel button (not in delete confirm)
    fireEvent.click(cancelButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should show delete confirmation when delete is clicked', () => {
    renderWithProvider(<EditTestCaseModal {...defaultProps} />);

    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    expect(screen.getByText(/Are you sure/i)).toBeInTheDocument();
    expect(screen.getByText('Move to Trash')).toBeInTheDocument();
  });

  it('should call onDelete when delete is confirmed', () => {
    renderWithProvider(<EditTestCaseModal {...defaultProps} />);

    // Click delete button
    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    // Confirm deletion
    const confirmButtons = screen.getAllByText('Move to Trash');
    const confirmButton = confirmButtons.find(
      (el) => el.tagName === 'BUTTON' && !el.textContent?.includes('⚠️')
    );
    fireEvent.click(confirmButton!);

    expect(defaultProps.onDelete).toHaveBeenCalledWith('TC-001');
  });

  it('should update status and set lastRun when changing to passed', () => {
    renderWithProvider(<EditTestCaseModal {...defaultProps} />);

    const statusSelect = screen.getByLabelText(/Status/i);
    fireEvent.change(statusSelect, { target: { value: 'passed' } });

    const submitButton = screen.getByText('Save Changes');
    fireEvent.click(submitButton);

    expect(defaultProps.onSubmit).toHaveBeenCalledWith(
      'TC-001',
      expect.objectContaining({
        status: 'passed',
        lastRun: expect.any(Number),
      })
    );
  });

  it('should validate required title field', () => {
    renderWithProvider(<EditTestCaseModal {...defaultProps} />);

    const titleInput = screen.getByLabelText(/Title/i);
    expect(titleInput).toHaveAttribute('required');
  });

  it('should handle priority changes', () => {
    renderWithProvider(<EditTestCaseModal {...defaultProps} />);

    const prioritySelect = screen.getByLabelText(/Priority/i) as HTMLSelectElement;
    expect(prioritySelect.value).toBe('high');

    fireEvent.change(prioritySelect, { target: { value: 'low' } });
    expect(prioritySelect.value).toBe('low');
  });

  it('should show Relationships tab content', () => {
    renderWithProvider(<EditTestCaseModal {...defaultProps} />);

    const relationshipsTab = screen.getByText('Relationships');
    fireEvent.click(relationshipsTab);

    expect(screen.getByText('Linked Items')).toBeInTheDocument();
  });
});
