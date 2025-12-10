import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NewTestCaseModal } from '../NewTestCaseModal';
import type { Requirement } from '../../types';

// Mock UserProvider
vi.mock('../../app/providers', () => ({
  useUser: () => ({
    currentUser: { id: 'USER-001', name: 'Test User' },
    users: [{ id: 'USER-001', name: 'Test User' }],
  }),
}));

describe('NewTestCaseModal', () => {
  const mockRequirements: Requirement[] = [
    {
      id: 'REQ-001',
      title: 'User Authentication',
      description: 'Test auth',
      text: 'Auth requirement',
      rationale: 'Security',
      status: 'approved',
      priority: 'high',

      lastModified: Date.now(),
      revision: '01',
      dateCreated: Date.now(),
    },
    {
      id: 'REQ-002',
      title: 'User Profile',
      description: 'Profile management',
      text: 'Profile requirement',
      rationale: 'User needs',
      status: 'draft',
      priority: 'medium',

      lastModified: Date.now(),
      revision: '01',
      dateCreated: Date.now(),
    },
  ];

  const defaultProps = {
    isOpen: true,
    requirements: mockRequirements,
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

  it('should display available requirements for selection', () => {
    render(<NewTestCaseModal {...defaultProps} />);

    expect(screen.getByText('REQ-001')).toBeInTheDocument();
    expect(screen.getByText('User Authentication')).toBeInTheDocument();
    expect(screen.getByText('REQ-002')).toBeInTheDocument();
    expect(screen.getByText('User Profile')).toBeInTheDocument();
  });

  it('should toggle requirement selection', () => {
    render(<NewTestCaseModal {...defaultProps} />);

    const checkboxes = screen.getAllByRole('checkbox');
    const firstCheckbox = checkboxes[0] as HTMLInputElement;

    expect(firstCheckbox.checked).toBe(false);
    fireEvent.click(firstCheckbox);
    expect(firstCheckbox.checked).toBe(true);
    fireEvent.click(firstCheckbox);
    expect(firstCheckbox.checked).toBe(false);
  });

  it('should call onSubmit with correct data when form is submitted', () => {
    render(<NewTestCaseModal {...defaultProps} />);

    const titleInput = screen.getByLabelText(/Title/i);
    const descriptionInput = screen.getByLabelText(/Description/i);
    const prioritySelect = screen.getByLabelText(/Priority/i);

    fireEvent.change(titleInput, { target: { value: 'Login Test' } });
    fireEvent.change(descriptionInput, { target: { value: 'Test description' } });
    fireEvent.change(prioritySelect, { target: { value: 'high' } });

    // Select a requirement
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    const submitButton = screen.getByText('Create Test Case');
    fireEvent.click(submitButton);

    expect(defaultProps.onSubmit).toHaveBeenCalledWith({
      title: 'Login Test',
      description: 'Test description',
      priority: 'high',
      author: 'Test User', // Now auto-populated from current user
      requirementIds: ['REQ-001'],
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

  it('should filter out deleted requirements', () => {
    const requirementsWithDeleted: Requirement[] = [
      ...mockRequirements,
      {
        id: 'REQ-003',
        title: 'Deleted Requirement',
        description: 'This is deleted',
        text: '',
        rationale: '',
        status: 'draft',
        priority: 'low',

        lastModified: Date.now(),
        revision: '01',
        dateCreated: Date.now(),
        isDeleted: true,
      },
    ];

    render(<NewTestCaseModal {...defaultProps} requirements={requirementsWithDeleted} />);

    expect(screen.queryByText('REQ-003')).not.toBeInTheDocument();
    expect(screen.queryByText('Deleted Requirement')).not.toBeInTheDocument();
  });
});
