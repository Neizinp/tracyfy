import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CreateProjectModal } from '../CreateProjectModal';

describe('CreateProjectModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onSubmit: mockOnSubmit,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render when open', () => {
    render(<CreateProjectModal {...defaultProps} />);

    expect(screen.getByText('Create New Project')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Mars Rover/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Brief/i)).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(<CreateProjectModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByText('Create New Project')).not.toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    render(<CreateProjectModal {...defaultProps} />);

    const buttons = screen.getAllByRole('button');
    const closeButton = buttons.find((btn) => btn.querySelector('svg'));
    fireEvent.click(closeButton!);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should call onClose when Cancel button is clicked', () => {
    render(<CreateProjectModal {...defaultProps} />);

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should update name input', () => {
    render(<CreateProjectModal {...defaultProps} />);

    const nameInput = screen.getByPlaceholderText(/Mars Rover/i) as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'New Project' } });

    expect(nameInput.value).toBe('New Project');
  });

  it('should update description input', () => {
    render(<CreateProjectModal {...defaultProps} />);

    const descInput = screen.getByPlaceholderText(/Brief/i) as HTMLTextAreaElement;
    fireEvent.change(descInput, { target: { value: 'Project description' } });

    expect(descInput.value).toBe('Project description');
  });

  it('should submit with name and description', () => {
    render(<CreateProjectModal {...defaultProps} />);

    const nameInput = screen.getByPlaceholderText(/Mars Rover/i);
    const descInput = screen.getByPlaceholderText(/Brief/i);

    fireEvent.change(nameInput, { target: { value: 'Test Project' } });
    fireEvent.change(descInput, { target: { value: 'Test Description' } });

    // Click the Create Project button
    const submitButton = screen.getByText('Create Project');
    fireEvent.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith('Test Project', 'Test Description');
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should not submit with empty name', () => {
    render(<CreateProjectModal {...defaultProps} />);

    // Try to submit without entering name - button should be disabled or form validation prevents it
    const submitButton = screen.getByText('Create Project');
    fireEvent.click(submitButton);

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should reset form after successful submit', () => {
    const { rerender } = render(<CreateProjectModal {...defaultProps} />);

    const nameInput = screen.getByPlaceholderText(/Mars Rover/i) as HTMLInputElement;
    const descInput = screen.getByPlaceholderText(/Brief/i) as HTMLTextAreaElement;

    fireEvent.change(nameInput, { target: { value: 'Test Project' } });
    fireEvent.change(descInput, { target: { value: 'Test Description' } });

    const submitButton = screen.getByText('Create Project');
    fireEvent.click(submitButton);

    // Re-render to check reset happens on next open
    rerender(<CreateProjectModal {...defaultProps} isOpen={false} />);
    rerender(<CreateProjectModal {...defaultProps} isOpen={true} />);

    const nameInputAfter = screen.getByPlaceholderText(/Mars Rover/i) as HTMLInputElement;
    const descInputAfter = screen.getByPlaceholderText(/Brief/i) as HTMLTextAreaElement;
    expect(nameInputAfter.value).toBe('');
    expect(descInputAfter.value).toBe('');
  });

  it('should mark name field as required', () => {
    render(<CreateProjectModal {...defaultProps} />);

    const nameInput = screen.getByPlaceholderText(/Mars Rover/i);
    expect(nameInput).toHaveAttribute('required');
  });

  it('should display placeholder text', () => {
    render(<CreateProjectModal {...defaultProps} />);

    const nameInput = screen.getByPlaceholderText(/e.g., Mars Rover 2030/i);
    expect(nameInput).toBeInTheDocument();
  });
});
