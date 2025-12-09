import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NewRequirementModal } from '../NewRequirementModal';

// Mock MarkdownEditor
vi.mock('../MarkdownEditor', () => ({
  MarkdownEditor: ({ label, value, onChange }: any) => (
    <div data-testid={`markdown-editor-${label}`}>
      <label>{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={label} />
    </div>
  ),
}));

// Mock UserProvider
vi.mock('../../app/providers', () => ({
  useUser: () => ({
    currentUser: { id: 'USER-001', name: 'Test User' },
    users: [{ id: 'USER-001', name: 'Test User' }],
  }),
}));

describe('NewRequirementModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
  };

  it('should render when isOpen is true', () => {
    render(<NewRequirementModal {...defaultProps} />);
    expect(screen.getByText('New Requirement')).toBeInTheDocument();
  });

  it('should not render when isOpen is false', () => {
    render(<NewRequirementModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('New Requirement')).not.toBeInTheDocument();
  });

  it('should display all tabs', () => {
    render(<NewRequirementModal {...defaultProps} />);
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Details')).toBeInTheDocument();
    expect(screen.getByText('Comments')).toBeInTheDocument();
  });

  it('should switch tabs when clicked', () => {
    render(<NewRequirementModal {...defaultProps} />);

    const detailsTab = screen.getByText('Details');
    fireEvent.click(detailsTab);

    expect(screen.getByTestId('markdown-editor-Description')).toBeInTheDocument();
    expect(screen.getByTestId('markdown-editor-Rationale')).toBeInTheDocument();
  });

  it('should validate required title field', () => {
    render(<NewRequirementModal {...defaultProps} />);

    const titleInput = screen.getByLabelText(/Title/i);
    expect(titleInput).toHaveAttribute('required');
  });

  it('should have correct default values', () => {
    render(<NewRequirementModal {...defaultProps} />);

    const prioritySelect = screen.getByLabelText(/Priority/i) as HTMLSelectElement;
    expect(prioritySelect.value).toBe('medium');
  });

  it('should update form fields', () => {
    render(<NewRequirementModal {...defaultProps} />);

    const titleInput = screen.getByLabelText(/Title/i);
    const prioritySelect = screen.getByLabelText(/Priority/i);

    fireEvent.change(titleInput, { target: { value: 'New Test Requirement' } });
    fireEvent.change(prioritySelect, { target: { value: 'high' } });

    expect(screen.getByDisplayValue('New Test Requirement')).toBeInTheDocument();
    expect((prioritySelect as HTMLSelectElement).value).toBe('high');
    // Author is now read-only and shows current user
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('should call onSubmit with correct data when creating requirement', () => {
    render(<NewRequirementModal {...defaultProps} />);

    const titleInput = screen.getByLabelText(/Title/i);

    fireEvent.change(titleInput, { target: { value: 'Test Requirement' } });

    // Get the markdown editor for requirement text
    const reqTextEditor = screen
      .getByTestId('markdown-editor-Requirement Text')
      .querySelector('textarea');
    if (reqTextEditor) {
      fireEvent.change(reqTextEditor, { target: { value: 'Detailed requirement text' } });
    }

    const submitButton = screen.getByText('Create Requirement');
    fireEvent.click(submitButton);

    expect(defaultProps.onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Test Requirement',
        author: 'Test User', // Now auto-populated from current user
        text: 'Detailed requirement text',
        status: 'draft',
        priority: 'medium',
        parentIds: [],
        revision: '01',
        dateCreated: expect.any(Number),
      })
    );
  });

  it('should call onClose when cancel is clicked', () => {
    render(<NewRequirementModal {...defaultProps} />);

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should show markdown editors on Details tab', () => {
    render(<NewRequirementModal {...defaultProps} />);

    const detailsTab = screen.getByText('Details');
    fireEvent.click(detailsTab);

    expect(screen.getByTestId('markdown-editor-Description')).toBeInTheDocument();
    expect(screen.getByTestId('markdown-editor-Rationale')).toBeInTheDocument();
    expect(screen.getByLabelText(/Verification Method/i)).toBeInTheDocument();
  });

  it('should show markdown editor on Comments tab', () => {
    render(<NewRequirementModal {...defaultProps} />);

    const commentsTab = screen.getByText('Comments');
    fireEvent.click(commentsTab);

    expect(screen.getByTestId('markdown-editor-Comments')).toBeInTheDocument();
  });

  it('should handle all priority options', () => {
    render(<NewRequirementModal {...defaultProps} />);

    const prioritySelect = screen.getByLabelText(/Priority/i) as HTMLSelectElement;

    fireEvent.change(prioritySelect, { target: { value: 'low' } });
    expect(prioritySelect.value).toBe('low');

    fireEvent.change(prioritySelect, { target: { value: 'medium' } });
    expect(prioritySelect.value).toBe('medium');

    fireEvent.change(prioritySelect, { target: { value: 'high' } });
    expect(prioritySelect.value).toBe('high');
  });

  it('should handle optional fields correctly', () => {
    render(<NewRequirementModal {...defaultProps} />);

    const titleInput = screen.getByLabelText(/Title/i);
    fireEvent.change(titleInput, { target: { value: 'Minimal Requirement' } });

    // Get requirement text editor
    const reqTextEditor = screen
      .getByTestId('markdown-editor-Requirement Text')
      .querySelector('textarea');
    if (reqTextEditor) {
      fireEvent.change(reqTextEditor, { target: { value: 'Some text' } });
    }

    const submitButton = screen.getByText('Create Requirement');
    fireEvent.click(submitButton);

    // Should be called with author from current user, undefined for other optional fields
    expect(defaultProps.onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Minimal Requirement',
        text: 'Some text',
        author: 'Test User', // Now auto-populated from current user
        verificationMethod: undefined,
        comments: undefined,
      })
    );
  });

  it('should reset form after successful submission', () => {
    render(<NewRequirementModal {...defaultProps} />);

    const titleInput = screen.getByLabelText(/Title/i);
    fireEvent.change(titleInput, { target: { value: 'Test' } });

    const reqTextEditor = screen
      .getByTestId('markdown-editor-Requirement Text')
      .querySelector('textarea');
    if (reqTextEditor) {
      fireEvent.change(reqTextEditor, { target: { value: 'Text' } });
    }

    const submitButton = screen.getByText('Create Requirement');
    fireEvent.click(submitButton);

    // Check that onClose was called (which happens after reset)
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should start with empty parentIds array', () => {
    render(<NewRequirementModal {...defaultProps} />);

    const titleInput = screen.getByLabelText(/Title/i);
    fireEvent.change(titleInput, { target: { value: 'New Req' } });

    const reqTextEditor = screen
      .getByTestId('markdown-editor-Requirement Text')
      .querySelector('textarea');
    if (reqTextEditor) {
      fireEvent.change(reqTextEditor, { target: { value: 'Text' } });
    }

    const submitButton = screen.getByText('Create Requirement');
    fireEvent.click(submitButton);

    expect(defaultProps.onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        parentIds: [],
      })
    );
  });
});
