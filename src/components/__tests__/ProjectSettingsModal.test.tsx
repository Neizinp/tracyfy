import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProjectSettingsModal } from '../ProjectSettingsModal';
import type { Project } from '../../types';

describe('ProjectSettingsModal', () => {
  const mockOnClose = vi.fn();
  const mockOnUpdate = vi.fn();
  const mockOnDelete = vi.fn();

  const mockProject: Project = {
    id: 'PROJ-001',
    name: 'Test Project',
    description: 'Test Description',
    requirementIds: [],
    useCaseIds: [],
    testCaseIds: [],
    informationIds: [],
    lastModified: 1000000,
  };

  const defaultProps = {
    project: mockProject,
    isOpen: true,
    onClose: mockOnClose,
    onUpdate: mockOnUpdate,
    onDelete: mockOnDelete,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render when open', () => {
    render(<ProjectSettingsModal {...defaultProps} />);

    expect(screen.getByText('Project Settings')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Project')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(<ProjectSettingsModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByText('Project Settings')).not.toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    render(<ProjectSettingsModal {...defaultProps} />);

    const buttons = screen.getAllByRole('button');
    const closeButton = buttons.find((btn) => btn.querySelector('svg'));
    if (closeButton) fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should update name input', () => {
    render(<ProjectSettingsModal {...defaultProps} />);

    const nameInput = screen.getByDisplayValue('Test Project') as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Updated Project' } });

    expect(nameInput.value).toBe('Updated Project');
  });

  it('should update description input', () => {
    render(<ProjectSettingsModal {...defaultProps} />);

    const descInput = screen.getByDisplayValue('Test Description') as HTMLTextAreaElement;
    fireEvent.change(descInput, { target: { value: 'Updated Description' } });

    expect(descInput.value).toBe('Updated Description');
  });

  it('should call onUpdate when form is submitted with name change', async () => {
    render(<ProjectSettingsModal {...defaultProps} />);

    const nameInput = screen.getByDisplayValue('Test Project');
    const descInput = screen.getByDisplayValue('Test Description');

    fireEvent.change(nameInput, { target: { value: 'New Name' } });
    fireEvent.change(descInput, { target: { value: 'New Desc' } });

    const saveButton = screen.getByText(/Save Changes/i);
    fireEvent.click(saveButton);

    // Should show rename confirmation dialog since name changed
    await waitFor(() => {
      expect(
        screen.getByText(/Renaming the project will create an automatic commit/i)
      ).toBeInTheDocument();
    });

    // Click Confirm Rename button
    const confirmButton = screen.getByText(/Confirm Rename/i);
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith('PROJ-001', 'New Name', 'New Desc');
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('should show delete confirmation when delete button clicked', () => {
    render(<ProjectSettingsModal {...defaultProps} />);

    const deleteButton = screen.getByText(/Delete Project/i);
    fireEvent.click(deleteButton);

    expect(screen.getByText(/Are you sure/i)).toBeInTheDocument();
  });

  it('should call onDelete when confirmed', () => {
    render(<ProjectSettingsModal {...defaultProps} />);

    // Click delete button
    const deleteButton = screen.getByText(/Delete Project/i);
    fireEvent.click(deleteButton);

    // Confirm deletion
    const confirmButton = screen.getByText(/Confirm Delete/i);
    fireEvent.click(confirmButton);

    expect(mockOnDelete).toHaveBeenCalledWith('PROJ-001');
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should cancel delete confirmation', () => {
    render(<ProjectSettingsModal {...defaultProps} />);

    // Click delete button
    const deleteButton = screen.getByText(/Delete Project/i);
    fireEvent.click(deleteButton);

    // Verify confirmation is shown
    expect(screen.getByText(/Are you sure/i)).toBeInTheDocument();

    // Cancel deletion - get all Cancel buttons and click the second one (in confirmation)
    const cancelButtons = screen.getAllByText(/Cancel/i);
    fireEvent.click(cancelButtons[1]);

    expect(mockOnDelete).not.toHaveBeenCalled();
    expect(screen.queryByText(/Are you sure/i)).not.toBeInTheDocument();
  });

  it('should reset form when reopened', () => {
    const { rerender } = render(<ProjectSettingsModal {...defaultProps} />);

    // Modify inputs
    const nameInput = screen.getByDisplayValue('Test Project') as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Modified' } });

    // Close and reopen
    rerender(<ProjectSettingsModal {...defaultProps} isOpen={false} />);
    rerender(<ProjectSettingsModal {...defaultProps} isOpen={true} />);

    // Should be reset to original values
    expect(screen.getByDisplayValue('Test Project')).toBeInTheDocument();
  });
});
