import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
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
    riskIds: [],
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

  it('should cancel rename confirmation', async () => {
    render(<ProjectSettingsModal {...defaultProps} />);

    const nameInput = screen.getByDisplayValue('Test Project');
    fireEvent.change(nameInput, { target: { value: 'New Name' } });

    const saveButton = screen.getByText(/Save Changes/i);
    fireEvent.click(saveButton);

    // Should show rename confirmation
    await waitFor(() => {
      expect(
        screen.getByText(/Renaming the project will create an automatic commit/i)
      ).toBeInTheDocument();
    });

    // Click Cancel in confirmation dialog
    // Find the confirmation dialog container by its text content
    const confirmationText = screen.getByText(
      /Renaming the project will create an automatic commit/i
    );
    const confirmationContainer = confirmationText.parentElement;

    // Find the Cancel button within that container
    const cancelButton = within(confirmationContainer!).getByText(/Cancel/i);
    fireEvent.click(cancelButton);

    // Confirmation should be gone, modal still open
    await waitFor(() => {
      expect(
        screen.queryByText(/Renaming the project will create an automatic commit/i)
      ).not.toBeInTheDocument();
    });
    expect(screen.getByText('Project Settings')).toBeInTheDocument();
    expect(mockOnUpdate).not.toHaveBeenCalled();
  });

  it('should show delete confirmation when delete button clicked', () => {
    render(<ProjectSettingsModal {...defaultProps} />);

    const deleteButton = screen.getByText(/Delete Project/i);
    fireEvent.click(deleteButton);

    // Use specific content to avoid ambiguity
    // The trigger button is replaced by the confirmation UI, so there should be exactly one button "Delete Project" now (the confirm button)
    // But we also want to be sure it's the confirmation one.
    // The confirmation text is also present.
    expect(screen.getByRole('button', { name: /Delete Project/i })).toBeInTheDocument();
    expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument();
  });

  it('should call onDelete when confirmed', () => {
    render(<ProjectSettingsModal {...defaultProps} />);

    // Click delete button
    const deleteButton = screen.getByText(/Delete Project/i);
    fireEvent.click(deleteButton);

    // Confirm deletion - get the Delete Project button in the confirmation dialog
    const confirmButtons = screen.getAllByText(/Delete Project/i);
    const confirmButton = confirmButtons[confirmButtons.length - 1]; // The confirmation button
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
    expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument();

    // Cancel deletion - get all Cancel buttons and click the second one (in confirmation)
    const cancelButtons = screen.getAllByText(/Cancel/i);
    fireEvent.click(cancelButtons[1]);

    expect(mockOnDelete).not.toHaveBeenCalled();
    expect(screen.queryByText(/cannot be undone/i)).not.toBeInTheDocument();
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

  describe('Copy Project', () => {
    const mockOnCopy = vi.fn().mockResolvedValue(undefined);

    it('should show Copy Project button when onCopy is provided', () => {
      render(<ProjectSettingsModal {...defaultProps} onCopy={mockOnCopy} />);

      expect(screen.getByText(/Copy Project/i)).toBeInTheDocument();
    });

    it('should not show Copy Project button when onCopy is not provided', () => {
      render(<ProjectSettingsModal {...defaultProps} />);

      expect(screen.queryByText('Copy Project')).not.toBeInTheDocument();
    });

    it('should open copy dialog when Copy Project button is clicked', () => {
      render(<ProjectSettingsModal {...defaultProps} onCopy={mockOnCopy} />);

      const copyButton = screen.getByText(/Copy Project/i);
      fireEvent.click(copyButton);

      expect(screen.getByText(/Create a Copy/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Project (Copy)')).toBeInTheDocument();
    });

    it('should call onCopy with correct parameters when confirmed', async () => {
      render(<ProjectSettingsModal {...defaultProps} onCopy={mockOnCopy} />);

      // Open copy dialog
      fireEvent.click(screen.getByText(/Copy Project/i));

      // Modify copy name
      const nameInput = screen.getByDisplayValue('Test Project (Copy)');
      fireEvent.change(nameInput, { target: { value: 'My New Project' } });

      // Click Create Copy button
      const createButton = screen.getByText(/Create Copy/i);
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(mockOnCopy).toHaveBeenCalledWith(mockProject, 'My New Project', 'Test Description');
      });
    });

    it('should show error when copy name is empty', async () => {
      render(<ProjectSettingsModal {...defaultProps} onCopy={mockOnCopy} />);

      // Open copy dialog
      fireEvent.click(screen.getByText(/Copy Project/i));

      // Clear name
      const nameInput = screen.getByDisplayValue('Test Project (Copy)');
      fireEvent.change(nameInput, { target: { value: '' } });

      // Try to create
      const createButton = screen.getByText(/Create Copy/i);
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText(/Please enter a name/i)).toBeInTheDocument();
      });
      expect(mockOnCopy).not.toHaveBeenCalled();
    });

    it('should close copy dialog when cancelled', () => {
      render(<ProjectSettingsModal {...defaultProps} onCopy={mockOnCopy} />);

      // Open copy dialog
      fireEvent.click(screen.getByText(/Copy Project/i));
      expect(screen.getByText(/Create a Copy/i)).toBeInTheDocument();

      // Click Cancel in copy dialog (get all Cancel buttons, the last one is in copy dialog)
      const cancelButtons = screen.getAllByText(/Cancel/i);
      fireEvent.click(cancelButtons[cancelButtons.length - 1]);

      // Copy dialog should be closed but modal still open
      expect(screen.queryByText(/Create a Copy/i)).not.toBeInTheDocument();
      expect(screen.getByText('Project Settings')).toBeInTheDocument();
    });
  });
});
