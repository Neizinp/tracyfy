import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NewTestCaseModal } from '../NewTestCaseModal';

// Mock UserProvider
vi.mock('../../app/providers', () => ({
  useUser: () => ({
    currentUser: { id: 'USER-001', name: 'Test User' },
    users: [{ id: 'USER-001', name: 'Test User' }],
  }),
}));

describe('NewTestCaseModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
  };

  it('should render when isOpen is true', () => {
    render(<NewTestCaseModal {...defaultProps} />);
    expect(screen.getByText('New Test Case')).toBeInTheDocument();
  });

  it('should not render when isOpen is false', () => {
    render(<NewTestCaseModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('New Test Case')).not.toBeInTheDocument();
  });

  it('should display form fields', () => {
    render(<NewTestCaseModal {...defaultProps} />);

    expect(screen.getByLabelText(/Title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Priority/i)).toBeInTheDocument();
    // Author is now read-only, just check the label exists
    expect(screen.getByText('Author')).toBeInTheDocument();
  });

  it('should validate required title field', () => {
    render(<NewTestCaseModal {...defaultProps} />);

    const titleInput = screen.getByLabelText(/Title/i);
    expect(titleInput).toHaveAttribute('required');
  });

  it('should have correct default values', () => {
    render(<NewTestCaseModal {...defaultProps} />);

    const prioritySelect = screen.getByLabelText(/Priority/i) as HTMLSelectElement;
    expect(prioritySelect.value).toBe('medium');
  });

  it('should update form fields', () => {
    render(<NewTestCaseModal {...defaultProps} />);

    const titleInput = screen.getByLabelText(/Title/i) as HTMLInputElement;
    const descriptionInput = screen.getByLabelText(/Description/i) as HTMLTextAreaElement;
    const prioritySelect = screen.getByLabelText(/Priority/i) as HTMLSelectElement;

    fireEvent.change(titleInput, { target: { value: 'Test Login Flow' } });
    fireEvent.change(descriptionInput, { target: { value: 'Verify login functionality' } });
    fireEvent.change(prioritySelect, { target: { value: 'high' } });

    expect(titleInput.value).toBe('Test Login Flow');
    expect(descriptionInput.value).toBe('Verify login functionality');
    expect(prioritySelect.value).toBe('high');
    // Author is read-only and shows current user
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('should call onSubmit with correct data when form is submitted', () => {
    render(<NewTestCaseModal {...defaultProps} />);

    const titleInput = screen.getByLabelText(/Title/i);
    const descriptionInput = screen.getByLabelText(/Description/i);
    const prioritySelect = screen.getByLabelText(/Priority/i);

    fireEvent.change(titleInput, { target: { value: 'Login Test' } });
    fireEvent.change(descriptionInput, { target: { value: 'Test description' } });
    fireEvent.change(prioritySelect, { target: { value: 'high' } });

    const submitButton = screen.getByText('Create Test Case');
    fireEvent.click(submitButton);

    expect(defaultProps.onSubmit).toHaveBeenCalledWith({
      title: 'Login Test',
      description: 'Test description',
      priority: 'high',
      author: 'Test User',
      requirementIds: [], // Now always empty, use Relationships tab after creation
      status: 'draft',
      revision: '01',
    });
  });

  it('should call onClose when cancel button is clicked', () => {
    render(<NewTestCaseModal {...defaultProps} />);

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should call onClose when X button is clicked', () => {
    render(<NewTestCaseModal {...defaultProps} />);

    // Find the button with X icon using getByRole and filtering
    const buttons = screen.getAllByRole('button');
    const closeButton = buttons.find((btn) => btn.querySelector('svg'));
    fireEvent.click(closeButton!);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should reset form after successful submission', () => {
    render(<NewTestCaseModal {...defaultProps} />);

    const titleInput = screen.getByLabelText(/Title/i) as HTMLInputElement;
    const descriptionInput = screen.getByLabelText(/Description/i) as HTMLTextAreaElement;

    fireEvent.change(titleInput, { target: { value: 'Test Case' } });
    fireEvent.change(descriptionInput, { target: { value: 'Description' } });

    const submitButton = screen.getByText('Create Test Case');
    fireEvent.click(submitButton);

    expect(defaultProps.onSubmit).toHaveBeenCalled();
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
